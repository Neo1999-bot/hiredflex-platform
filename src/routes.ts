import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type {
  FastifyInstance,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import {
  assertCandidateOwnsProfile,
  assertEmployerBelongsToCompany,
  assertRecruiterOwnsVacancy,
  ForbiddenError,
  requirePrincipal,
  type PlatformRole,
} from "./auth/authorization.js";
import { requireAuthenticatedPrincipal } from "./auth/fastify.js";
import type { Database } from "./db/client.js";
import {
  applicationStatusHistory,
  applications,
  candidates,
  recruiters,
  vacancies,
  companies,
  users,
  userRoles,
} from "./db/schema/index.js";
import {
  activeApplicationStatuses,
  initialApplicationStatusEvent,
  InvalidApplicationTransitionError,
  transitionApplication,
} from "./domain/application/lifecycle.js";
import {
  transitionApplicationStatus,
  ApplicationNotFoundError,
} from "./domain/application/service.js";
import { transitionVacancy } from "./domain/vacancy/lifecycle.js";
import {
  assertNoActiveApplication,
  assertVacancyOpenForApplications,
} from "./domain/application/submission.js";
import { ApiError } from "./api/errors.js";

const idParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
  },
} as const;

const vacancyParamsSchema = {
  type: "object",
  required: ["vacancyId"],
  additionalProperties: false,
  properties: {
    vacancyId: { type: "string", format: "uuid" },
  },
} as const;

const applicationParamsSchema = {
  type: "object",
  required: ["applicationId"],
  additionalProperties: false,
  properties: {
    applicationId: { type: "string", format: "uuid" },
  },
} as const;

const candidateSubmissionBodySchema = {
  type: "object",
  required: ["vacancyId"],
  additionalProperties: false,
  properties: { vacancyId: { type: "string", format: "uuid" } },
} as const;

const vacancyCreateBodySchema = {
  type: "object",
  required: ["companyId", "title"],
  additionalProperties: false,
  properties: {
    companyId: { type: "string", format: "uuid" },
    title: { type: "string", minLength: 1, maxLength: 240 },
    description: { type: ["string", "null"], maxLength: 20000 },
    location: { type: ["string", "null"], maxLength: 500 },
  },
} as const;

const vacancySearchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", minLength: 1, maxLength: 200 },
    location: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

type IdParams = { id: string };
type VacancyParams = { vacancyId: string };
type ApplicationParams = { applicationId: string };
type SubmissionBody = { vacancyId: string };
type VacancyCreateBody = {
  companyId: string;
  title: string;
  description?: string | null;
  location?: string | null;
};
type VacancySearch = { q?: string; location?: string };

function principalFrom(request: FastifyRequest) {
  return requirePrincipal(request.principal);
}

function requireRole(
  request: FastifyRequest,
  role: PlatformRole,
): ReturnType<typeof principalFrom> {
  const principal = principalFrom(request);
  if (
    !principal.roleAssignments.some((assignment) => assignment.role === role)
  ) {
    throw new ForbiddenError();
  }
  return principal;
}

function candidatePrincipal(request: FastifyRequest) {
  const principal = requireRole(request, "Candidate");
  assertCandidateOwnsProfile(principal, principal.userId);
  return principal;
}

function employerCompanyIds(request: FastifyRequest): string[] {
  const principal = requireRole(request, "Employer");
  const companyIds = principal.roleAssignments
    .filter(
      (assignment) =>
        assignment.role === "Employer" && assignment.companyId !== null,
    )
    .map((assignment) => assignment.companyId as string);
  if (companyIds.length === 0) throw new ForbiddenError();
  return [...new Set(companyIds)];
}

function isActiveApplicationUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    const databaseError = current as Error & {
      code?: string;
      constraint_name?: string;
      constraint?: string;
    };
    const constraint =
      databaseError.constraint_name ?? databaseError.constraint;
    if (
      databaseError.code === "23505" &&
      (constraint === undefined ||
        constraint === "applications_one_active_candidate_vacancy")
    ) {
      return true;
    }
    current = databaseError.cause;
  }
  return false;
}

function registerVacancyDiscovery(app: FastifyInstance, db: Database): void {
  app.get<{ Querystring: VacancySearch }>(
    "/vacancies",
    { schema: { querystring: vacancySearchSchema } },
    async (request) => {
      const filters = [eq(vacancies.status, "OPEN")];
      if (request.query.q) {
        const term = `%${request.query.q}%`;
        filters.push(
          or(ilike(vacancies.title, term), ilike(vacancies.description, term))!,
        );
      }
      if (request.query.location) {
        filters.push(ilike(vacancies.location, `%${request.query.location}%`));
      }
      return db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          description: vacancies.description,
          location: vacancies.location,
          status: vacancies.status,
          createdAt: vacancies.createdAt,
        })
        .from(vacancies)
        .where(and(...filters))
        .orderBy(desc(vacancies.createdAt))
        .limit(100);
    },
  );

  app.get<{ Params: IdParams }>(
    "/vacancies/:id",
    { schema: { params: idParamsSchema } },
    async (request) => {
      const [vacancy] = await db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          description: vacancies.description,
          location: vacancies.location,
          status: vacancies.status,
          createdAt: vacancies.createdAt,
        })
        .from(vacancies)
        .where(
          and(
            eq(vacancies.id, request.params.id),
            eq(vacancies.status, "OPEN"),
          ),
        )
        .limit(1);
      if (!vacancy) throw new ApiError(404, "NOT_FOUND");
      return vacancy;
    },
  );
}

function registerCandidateRoutes(
  app: FastifyInstance,
  db: Database,
  auth: preHandlerHookHandler,
): void {
  app.get("/candidate/profile", { preHandler: auth }, async (request) => {
    const principal = candidatePrincipal(request);
    const [candidate] = await db
      .select({
        id: candidates.id,
        userId: candidates.userId,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
      })
      .from(candidates)
      .where(eq(candidates.userId, principal.userId))
      .limit(1);
    if (!candidate) throw new ApiError(404, "NOT_FOUND");
    return candidate;
  });

  app.get("/candidate/applications", { preHandler: auth }, async (request) => {
    const principal = candidatePrincipal(request);
    const [candidate] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.userId, principal.userId))
      .limit(1);
    if (!candidate) throw new ApiError(404, "NOT_FOUND");
    return db
      .select({
        id: applications.id,
        vacancyId: vacancies.id,
        vacancyTitle: vacancies.title,
        vacancyStatus: vacancies.status,
        submittedAt: applications.submittedAt,
        currentStatus: applications.currentStatus,
      })
      .from(applications)
      .innerJoin(vacancies, eq(applications.vacancyId, vacancies.id))
      .where(eq(applications.candidateId, candidate.id))
      .orderBy(desc(applications.submittedAt))
      .limit(100);
  });

  app.get<{ Params: IdParams }>(
    "/candidate/applications/:id",
    { preHandler: auth, schema: { params: idParamsSchema } },
    async (request) => {
      const principal = candidatePrincipal(request);
      const [candidate] = await db
        .select({ id: candidates.id })
        .from(candidates)
        .where(eq(candidates.userId, principal.userId))
        .limit(1);
      if (!candidate) throw new ApiError(404, "NOT_FOUND");
      const [application] = await db
        .select({
          id: applications.id,
          vacancyId: vacancies.id,
          vacancyTitle: vacancies.title,
          vacancyStatus: vacancies.status,
          submittedAt: applications.submittedAt,
          currentStatus: applications.currentStatus,
        })
        .from(applications)
        .innerJoin(vacancies, eq(applications.vacancyId, vacancies.id))
        .where(
          and(
            eq(applications.id, request.params.id),
            eq(applications.candidateId, candidate.id),
          ),
        )
        .limit(1);
      if (!application) throw new ApiError(404, "NOT_FOUND");
      const history = await db
        .select({
          fromStatus: applicationStatusHistory.fromStatus,
          toStatus: applicationStatusHistory.toStatus,
          occurredAt: applicationStatusHistory.occurredAt,
        })
        .from(applicationStatusHistory)
        .where(eq(applicationStatusHistory.applicationId, application.id))
        .orderBy(applicationStatusHistory.occurredAt);
      return { ...application, history };
    },
  );

  app.post<{ Body: SubmissionBody }>(
    "/candidate/applications",
    {
      preHandler: auth,
      schema: { body: candidateSubmissionBodySchema },
    },
    async (request, reply) => {
      const principal = candidatePrincipal(request);
      try {
        const application = await db.transaction(async (transaction) => {
          const [candidate] = await transaction
            .select({ id: candidates.id })
            .from(candidates)
            .where(eq(candidates.userId, principal.userId))
            .limit(1);
          if (!candidate) throw new ApiError(404, "NOT_FOUND");

          const [vacancy] = await transaction
            .select({ id: vacancies.id, status: vacancies.status })
            .from(vacancies)
            .where(eq(vacancies.id, request.body.vacancyId))
            .for("share");
          if (!vacancy) throw new ApiError(404, "NOT_FOUND");
          try {
            assertVacancyOpenForApplications(vacancy.status);
          } catch {
            throw new ApiError(409, "VACANCY_NOT_OPEN");
          }

          const [active] = await transaction
            .select({ currentStatus: applications.currentStatus })
            .from(applications)
            .where(
              and(
                eq(applications.candidateId, candidate.id),
                eq(applications.vacancyId, vacancy.id),
                inArray(applications.currentStatus, activeApplicationStatuses),
              ),
            )
            .limit(1);
          try {
            assertNoActiveApplication(active?.currentStatus);
          } catch {
            throw new ApiError(409, "ACTIVE_APPLICATION_EXISTS");
          }

          const [created] = await transaction
            .insert(applications)
            .values({ candidateId: candidate.id, vacancyId: vacancy.id })
            .returning({
              id: applications.id,
              candidateId: applications.candidateId,
              vacancyId: applications.vacancyId,
              submittedAt: applications.submittedAt,
              currentStatus: applications.currentStatus,
            });
          if (!created) throw new Error("Application insert returned no row");
          const event = initialApplicationStatusEvent(principal.userId);
          await transaction.insert(applicationStatusHistory).values({
            applicationId: created.id,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            actorUserId: event.actorUserId,
            occurredAt: event.occurredAt,
          });
          return created;
        });
        return reply.code(201).send(application);
      } catch (error) {
        if (isActiveApplicationUniqueViolation(error)) {
          throw new ApiError(409, "ACTIVE_APPLICATION_EXISTS");
        }
        throw error;
      }
    },
  );

  app.post<{ Params: IdParams }>(
    "/candidate/applications/:id/withdraw",
    { preHandler: auth, schema: { params: idParamsSchema } },
    async (request) => {
      const principal = candidatePrincipal(request);
      return db.transaction(async (transaction) => {
        const [candidate] = await transaction
          .select({ id: candidates.id })
          .from(candidates)
          .where(eq(candidates.userId, principal.userId))
          .limit(1);
        if (!candidate) throw new ApiError(404, "NOT_FOUND");
        const [application] = await transaction
          .select({
            id: applications.id,
            currentStatus: applications.currentStatus,
          })
          .from(applications)
          .where(
            and(
              eq(applications.id, request.params.id),
              eq(applications.candidateId, candidate.id),
            ),
          )
          .for("update", { of: applications });
        if (!application) throw new ApiError(404, "NOT_FOUND");
        const occurredAt = new Date();
        let event;
        try {
          event = transitionApplication(
            application.currentStatus,
            "Withdrawn",
            principal.userId,
            occurredAt,
          );
        } catch {
          throw new ApiError(409, "INVALID_APPLICATION_TRANSITION");
        }
        await transaction
          .update(applications)
          .set({ currentStatus: event.toStatus, updatedAt: occurredAt })
          .where(eq(applications.id, application.id));
        await transaction.insert(applicationStatusHistory).values({
          applicationId: application.id,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          actorUserId: event.actorUserId,
          occurredAt: event.occurredAt,
        });
        return { id: application.id, currentStatus: event.toStatus };
      });
    },
  );
}

async function loadRecruiterVacancy(
  db: Database,
  request: FastifyRequest,
  vacancyId: string,
) {
  const principal = requireRole(request, "Recruiter");
  const [row] = await db
    .select({
      companyId: vacancies.companyId,
      assignedRecruiterUserId: recruiters.userId,
    })
    .from(vacancies)
    .leftJoin(recruiters, eq(vacancies.assignedRecruiterId, recruiters.id))
    .where(eq(vacancies.id, vacancyId))
    .limit(1);
  if (!row) throw new ApiError(404, "NOT_FOUND");
  try {
    assertRecruiterOwnsVacancy(
      principal,
      row.assignedRecruiterUserId,
      row.companyId,
    );
  } catch {
    throw new ApiError(404, "NOT_FOUND");
  }
  return principal;
}

function registerRecruiterRoutes(
  app: FastifyInstance,
  db: Database,
  auth: preHandlerHookHandler,
): void {
  app.get("/recruiter/vacancies", { preHandler: auth }, async (request) => {
    const principal = requireRole(request, "Recruiter");
    const rows = await db
      .select({
        id: vacancies.id,
        title: vacancies.title,
        location: vacancies.location,
        status: vacancies.status,
        companyId: vacancies.companyId,
      })
      .from(vacancies)
      .innerJoin(recruiters, eq(recruiters.id, vacancies.assignedRecruiterId))
      .where(eq(recruiters.userId, principal.userId))
      .orderBy(desc(vacancies.createdAt))
      .limit(100);
    return rows.filter((row) =>
      principal.roleAssignments.some(
        (assignment) =>
          assignment.role === "Recruiter" &&
          (assignment.companyId === null ||
            assignment.companyId === row.companyId),
      ),
    );
  });
  app.get<{ Params: VacancyParams }>(
    "/recruiter/vacancies/:vacancyId/applications",
    { preHandler: auth, schema: { params: vacancyParamsSchema } },
    async (request) => {
      await loadRecruiterVacancy(db, request, request.params.vacancyId);
      return db
        .select({
          id: applications.id,
          candidateId: applications.candidateId,
          vacancyId: applications.vacancyId,
          submittedAt: applications.submittedAt,
          currentStatus: applications.currentStatus,
        })
        .from(applications)
        .where(eq(applications.vacancyId, request.params.vacancyId))
        .orderBy(desc(applications.submittedAt))
        .limit(100);
    },
  );

  app.get<{ Params: ApplicationParams }>(
    "/recruiter/applications/:applicationId",
    { preHandler: auth, schema: { params: applicationParamsSchema } },
    async (request) => {
      requireRole(request, "Recruiter");
      const [application] = await db
        .select({
          id: applications.id,
          candidateId: applications.candidateId,
          vacancyId: applications.vacancyId,
          submittedAt: applications.submittedAt,
          currentStatus: applications.currentStatus,
        })
        .from(applications)
        .where(eq(applications.id, request.params.applicationId))
        .limit(1);
      if (!application) throw new ApiError(404, "NOT_FOUND");
      await loadRecruiterVacancy(db, request, application.vacancyId);
      const history = await db
        .select()
        .from(applicationStatusHistory)
        .where(eq(applicationStatusHistory.applicationId, application.id))
        .orderBy(applicationStatusHistory.occurredAt);
      return { ...application, history };
    },
  );

  const transitions = [
    ["review", "Reviewing"],
    ["shortlist", "Shortlisted"],
    ["reject", "Rejected"],
  ] as const;
  for (const [action, status] of transitions) {
    app.post<{ Params: ApplicationParams }>(
      `/recruiter/applications/:applicationId/${action}`,
      { preHandler: auth, schema: { params: applicationParamsSchema } },
      async (request) => {
        const principal = requireRole(request, "Recruiter");
        try {
          return await transitionApplicationStatus(
            db,
            principal,
            request.params.applicationId,
            status,
          );
        } catch (error) {
          if (error instanceof ApplicationNotFoundError) {
            throw new ApiError(404, "NOT_FOUND");
          }
          if (error instanceof ForbiddenError) {
            throw new ApiError(404, "NOT_FOUND");
          }
          if (error instanceof InvalidApplicationTransitionError) {
            throw new ApiError(409, "INVALID_APPLICATION_TRANSITION");
          }
          throw error;
        }
      },
    );
  }
}

async function employerVacancy(
  db: Database,
  vacancyId: string,
  companyIds: string[],
) {
  const [vacancy] = await db
    .select()
    .from(vacancies)
    .where(
      and(
        eq(vacancies.id, vacancyId),
        inArray(vacancies.companyId, companyIds),
      ),
    )
    .limit(1);
  if (!vacancy) throw new ApiError(404, "NOT_FOUND");
  return vacancy;
}

function registerEmployerRoutes(
  app: FastifyInstance,
  db: Database,
  auth: preHandlerHookHandler,
): void {
  app.get("/employer/companies", { preHandler: auth }, async (request) =>
    db
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(inArray(companies.id, employerCompanyIds(request))),
  );
  app.get("/employer/recruiters", { preHandler: auth }, async (request) => {
    const ids = employerCompanyIds(request);
    return db
      .select({
        id: recruiters.id,
        displayName: users.displayName,
        companyId: userRoles.companyId,
      })
      .from(recruiters)
      .innerJoin(users, eq(users.id, recruiters.userId))
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .where(
        and(
          eq(users.accountStatus, "Active"),
          eq(userRoles.role, "Recruiter"),
          or(
            inArray(userRoles.companyId, ids),
            sql`${userRoles.companyId} is null`,
          ),
        ),
      );
  });
  app.post<{ Params: IdParams; Body: { recruiterId: string } }>(
    "/employer/vacancies/:id/recruiter",
    {
      preHandler: auth,
      schema: {
        params: idParamsSchema,
        body: {
          type: "object",
          additionalProperties: false,
          required: ["recruiterId"],
          properties: { recruiterId: { type: "string", format: "uuid" } },
        },
      },
    },
    async (request) => {
      const ids = employerCompanyIds(request);
      return db.transaction(async (tx) => {
        const [vacancy] = await tx
          .select()
          .from(vacancies)
          .where(
            and(
              eq(vacancies.id, request.params.id),
              inArray(vacancies.companyId, ids),
            ),
          )
          .for("update");
        if (!vacancy) throw new ApiError(404, "NOT_FOUND");
        const [person] = await tx
          .select({ id: recruiters.id })
          .from(recruiters)
          .innerJoin(users, eq(users.id, recruiters.userId))
          .innerJoin(userRoles, eq(userRoles.userId, users.id))
          .where(
            and(
              eq(recruiters.id, request.body.recruiterId),
              eq(users.accountStatus, "Active"),
              eq(userRoles.role, "Recruiter"),
              or(
                eq(userRoles.companyId, vacancy.companyId),
                sql`${userRoles.companyId} is null`,
              ),
            ),
          )
          .limit(1);
        if (!person) throw new ApiError(404, "NOT_FOUND");
        const [updated] = await tx
          .update(vacancies)
          .set({ assignedRecruiterId: person.id, updatedAt: new Date() })
          .where(eq(vacancies.id, vacancy.id))
          .returning();
        return updated;
      });
    },
  );
  app.get("/employer/vacancies", { preHandler: auth }, async (request) => {
    const companyIds = employerCompanyIds(request);
    return db
      .select()
      .from(vacancies)
      .where(inArray(vacancies.companyId, companyIds))
      .orderBy(desc(vacancies.createdAt))
      .limit(100);
  });

  app.post<{ Body: VacancyCreateBody }>(
    "/employer/vacancies",
    {
      preHandler: auth,
      schema: { body: vacancyCreateBodySchema },
    },
    async (request, reply) => {
      const principal = requireRole(request, "Employer");
      assertEmployerBelongsToCompany(principal, request.body.companyId);
      const title = request.body.title.trim();
      if (!title) throw new ApiError(400, "INVALID_TITLE");
      const [created] = await db
        .insert(vacancies)
        .values({
          companyId: request.body.companyId,
          createdByUserId: principal.userId,
          title,
          description: request.body.description ?? null,
          location: request.body.location ?? null,
          status: "DRAFT",
        })
        .returning();
      if (!created) throw new Error("Vacancy insert returned no row");
      return reply.code(201).send(created);
    },
  );

  app.get<{ Params: IdParams }>(
    "/employer/vacancies/:id",
    { preHandler: auth, schema: { params: idParamsSchema } },
    async (request) =>
      employerVacancy(db, request.params.id, employerCompanyIds(request)),
  );

  app.get<{ Params: VacancyParams }>(
    "/employer/vacancies/:vacancyId/applications",
    { preHandler: auth, schema: { params: vacancyParamsSchema } },
    async (request) => {
      const companyIds = employerCompanyIds(request);
      await employerVacancy(db, request.params.vacancyId, companyIds);
      return db
        .select({
          id: applications.id,
          candidateId: applications.candidateId,
          vacancyId: applications.vacancyId,
          submittedAt: applications.submittedAt,
          currentStatus: applications.currentStatus,
        })
        .from(applications)
        .where(eq(applications.vacancyId, request.params.vacancyId))
        .orderBy(desc(applications.submittedAt))
        .limit(100);
    },
  );

  const transitions = [
    ["open", "OPEN"],
    ["close", "CLOSED"],
  ] as const;
  for (const [action, nextStatus] of transitions) {
    app.post<{ Params: IdParams }>(
      `/employer/vacancies/:id/${action}`,
      { preHandler: auth, schema: { params: idParamsSchema } },
      async (request) => {
        const companyIds = employerCompanyIds(request);
        return db.transaction(async (transaction) => {
          const [current] = await transaction
            .select()
            .from(vacancies)
            .where(
              and(
                eq(vacancies.id, request.params.id),
                inArray(vacancies.companyId, companyIds),
              ),
            )
            .for("update");
          if (!current) throw new ApiError(404, "NOT_FOUND");
          let status;
          try {
            status = transitionVacancy(current.status, nextStatus);
          } catch {
            throw new ApiError(409, "INVALID_VACANCY_TRANSITION");
          }
          const [updated] = await transaction
            .update(vacancies)
            .set({
              status,
              closedAt: status === "CLOSED" ? new Date() : current.closedAt,
              updatedAt: new Date(),
            })
            .where(eq(vacancies.id, current.id))
            .returning();
          if (!updated) throw new Error("Vacancy update returned no row");
          return updated;
        });
      },
    );
  }
}

export function registerWorkflowRoutes(
  app: FastifyInstance,
  db: Database,
): void {
  registerVacancyDiscovery(app, db);
  const auth = requireAuthenticatedPrincipal;
  registerCandidateRoutes(app, db, auth);
  registerRecruiterRoutes(app, db, auth);
  registerEmployerRoutes(app, db, auth);
}
