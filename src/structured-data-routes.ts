import { and, asc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { ApiError } from "./api/errors.js";
import {
  assertCandidateOwnsProfile,
  ForbiddenError,
  requirePrincipal,
} from "./auth/authorization.js";
import { requireAuthenticatedPrincipal } from "./auth/fastify.js";
import type { Database } from "./db/client.js";
import {
  candidates,
  candidateSkills,
  vacancies,
  vacancyRequirements,
} from "./db/schema/index.js";

const textField = { type: "string", minLength: 1 } as const;
const skillFields = { skillName: textField };
const requirementFields = {
  ...skillFields,
  description: textField,
  category: textField,
  requirementType: textField,
  required: { type: "boolean" },
};
function params(names: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: names,
    properties: Object.fromEntries(
      names.map((name) => [name, { type: "string", format: "uuid" }]),
    ),
  };
}
// Reject unknown input before Fastify's default validator can strip it.
function strictInput(fields: string[] = []) {
  return async (request: FastifyRequest) => {
    if (
      Object.keys(request.query as object).length ||
      (request.body !== undefined &&
        (request.body === null ||
          typeof request.body !== "object" ||
          Array.isArray(request.body) ||
          Object.keys(request.body).some((key) => !fields.includes(key))))
    ) {
      throw new ApiError(400, "INVALID_REQUEST");
    }
    if (request.body && typeof request.body === "object") {
      for (const [field, value] of Object.entries(request.body)) {
        if (
          field === "required"
            ? typeof value !== "boolean"
            : typeof value !== "string" || !value.trim()
        )
          throw new ApiError(400, "INVALID_REQUEST");
      }
    }
  };
}
function databaseViolation(
  error: unknown,
  code: string,
  constraint: string,
): boolean {
  let current = error;
  while (current instanceof Error) {
    const details = current as Error & {
      code?: string;
      constraint_name?: string;
      constraint?: string;
    };
    if (
      details.code === code &&
      (details.constraint_name ?? details.constraint) === constraint
    )
      return true;
    current = details.cause;
  }
  return false;
}
async function insertWithConflict<T>(
  operation: () => Promise<T>,
  unique: string,
  nonempty: string,
  conflict: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (databaseViolation(error, "23505", unique))
      throw new ApiError(409, conflict);
    if (databaseViolation(error, "23514", nonempty))
      throw new ApiError(400, "INVALID_REQUEST");
    throw error;
  }
}
async function candidateId(db: Database, request: FastifyRequest) {
  const principal = requirePrincipal(request.principal);
  assertCandidateOwnsProfile(principal, principal.userId);
  const [candidate] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, principal.userId))
    .limit(1);
  if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND");
  return candidate.id;
}
function companyIds(request: FastifyRequest) {
  const principal = requirePrincipal(request.principal);
  const ids = principal.roleAssignments
    .filter((item) => item.role === "Employer" && item.companyId !== null)
    .map((item) => item.companyId!);
  if (!ids.length) throw new ForbiddenError();
  return [...new Set(ids)];
}
type RequirementBody = {
  skillName: string;
  description: string;
  category: string;
  requirementType: string;
  required: boolean;
};
type RequirementTransaction = Pick<Database, "insert" | "delete">;
export function registerStructuredDataRoutes(
  app: FastifyInstance,
  db: Database,
): void {
  const protectedOptions = {
    preHandler: requireAuthenticatedPrincipal,
    preValidation: strictInput(),
  };
  app.get("/candidate/skills", protectedOptions, async (request) => {
    const id = await candidateId(db, request);
    return db
      .select()
      .from(candidateSkills)
      .where(eq(candidateSkills.candidateId, id))
      .orderBy(asc(candidateSkills.id));
  });
  app.post<{ Body: { skillName: string } }>(
    "/candidate/skills",
    {
      preHandler: requireAuthenticatedPrincipal,
      preValidation: strictInput(Object.keys(skillFields)),
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: Object.keys(skillFields),
          properties: skillFields,
        },
      },
    },
    async (request, reply) => {
      const id = await candidateId(db, request);
      const [skill] = await insertWithConflict(
        () =>
          db
            .insert(candidateSkills)
            .values({
              candidateId: id,
              skillName: request.body.skillName.trim(),
            })
            .returning(),
        "candidate_skills_candidate_skill_unique",
        "candidate_skills_skill_name_nonempty",
        "CANDIDATE_SKILL_EXISTS",
      );
      return reply.code(201).send(skill);
    },
  );
  app.delete<{ Params: { skillId: string } }>(
    "/candidate/skills/:skillId",
    { ...protectedOptions, schema: { params: params(["skillId"]) } },
    async (request, reply) => {
      const id = await candidateId(db, request);
      const rows = await db
        .delete(candidateSkills)
        .where(
          and(
            eq(candidateSkills.id, request.params.skillId),
            eq(candidateSkills.candidateId, id),
          ),
        )
        .returning({ id: candidateSkills.id });
      if (!rows.length) throw new ApiError(404, "CANDIDATE_SKILL_NOT_FOUND");
      return reply.code(204).send();
    },
  );
  app.get<{ Params: { vacancyId: string } }>(
    "/employer/vacancies/:vacancyId/requirements",
    { ...protectedOptions, schema: { params: params(["vacancyId"]) } },
    async (request) => {
      const ids = companyIds(request);
      const [vacancy] = await db
        .select({ id: vacancies.id })
        .from(vacancies)
        .where(
          and(
            eq(vacancies.id, request.params.vacancyId),
            inArray(vacancies.companyId, ids),
          ),
        )
        .limit(1);
      if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");
      return db
        .select()
        .from(vacancyRequirements)
        .where(eq(vacancyRequirements.vacancyId, vacancy.id))
        .orderBy(asc(vacancyRequirements.id));
    },
  );
  async function mutate<T>(
    request: FastifyRequest<{ Params: { vacancyId: string } }>,
    operation: (transaction: RequirementTransaction) => Promise<T>,
  ) {
    const ids = companyIds(request);
    return db.transaction(async (transaction) => {
      // Serialize requirement changes with the existing vacancy open/close
      // transaction: the persisted state must remain DRAFT through the write.
      const [vacancy] = await transaction
        .select({ id: vacancies.id, status: vacancies.status })
        .from(vacancies)
        .where(
          and(
            eq(vacancies.id, request.params.vacancyId),
            inArray(vacancies.companyId, ids),
          ),
        )
        .for("update");
      if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");
      if (vacancy.status !== "DRAFT")
        throw new ApiError(409, "INVALID_VACANCY_REQUIREMENT_STATE");
      return operation(transaction);
    });
  }
  app.post<{ Params: { vacancyId: string }; Body: RequirementBody }>(
    "/employer/vacancies/:vacancyId/requirements",
    {
      preHandler: requireAuthenticatedPrincipal,
      preValidation: strictInput(Object.keys(requirementFields)),
      schema: {
        params: params(["vacancyId"]),
        body: {
          type: "object",
          additionalProperties: false,
          required: Object.keys(requirementFields),
          properties: requirementFields,
        },
      },
    },
    async (request, reply) => {
      const rows = await insertWithConflict(
        () =>
          mutate(request, (transaction) =>
            transaction
              .insert(vacancyRequirements)
              .values({
                ...request.body,
                skillName: request.body.skillName.trim(),
                vacancyId: request.params.vacancyId,
              })
              .returning(),
          ),
        "vacancy_requirements_skill_unique",
        "vacancy_requirements_skill_name_nonempty",
        "VACANCY_REQUIREMENT_EXISTS",
      );
      return reply.code(201).send(rows[0]);
    },
  );
  app.delete<{ Params: { vacancyId: string; requirementId: string } }>(
    "/employer/vacancies/:vacancyId/requirements/:requirementId",
    {
      ...protectedOptions,
      schema: { params: params(["vacancyId", "requirementId"]) },
    },
    async (request, reply) => {
      await mutate(request, async (transaction) => {
        const rows = await transaction
          .delete(vacancyRequirements)
          .where(
            and(
              eq(vacancyRequirements.id, request.params.requirementId),
              eq(vacancyRequirements.vacancyId, request.params.vacancyId),
            ),
          )
          .returning({ id: vacancyRequirements.id });
        if (!rows.length)
          throw new ApiError(404, "VACANCY_REQUIREMENT_NOT_FOUND");
      });
      return reply.code(204).send();
    },
  );
}
