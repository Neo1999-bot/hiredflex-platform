import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertRecruiterOwnsVacancy,
  type AuthenticatedPrincipal,
} from "../../auth/authorization.js";
import type * as schema from "../../db/schema/index.js";
import {
  applicationStatusHistory,
  applications,
  recruiters,
  vacancies,
} from "../../db/schema/index.js";
import { transitionApplication, type ApplicationStatus } from "./lifecycle.js";

export class ApplicationNotFoundError extends Error {
  constructor() {
    super("Application was not found");
    this.name = "ApplicationNotFoundError";
  }
}

export async function transitionApplicationStatus(
  db: PostgresJsDatabase<typeof schema>,
  principal: AuthenticatedPrincipal,
  applicationId: string,
  toStatus: ApplicationStatus,
) {
  return db.transaction(async (transaction) => {
    const [application] = await transaction
      .select({
        currentStatus: applications.currentStatus,
        assignedRecruiterUserId: recruiters.userId,
        vacancyCompanyId: vacancies.companyId,
      })
      .from(applications)
      .innerJoin(vacancies, eq(applications.vacancyId, vacancies.id))
      .leftJoin(recruiters, eq(vacancies.assignedRecruiterId, recruiters.id))
      .where(eq(applications.id, applicationId))
      .for("update", { of: applications });

    if (!application) throw new ApplicationNotFoundError();
    assertRecruiterOwnsVacancy(
      principal,
      application.assignedRecruiterUserId,
      application.vacancyCompanyId,
    );

    const occurredAt = new Date();
    const event = transitionApplication(
      application.currentStatus,
      toStatus,
      principal.userId,
      occurredAt,
    );

    await transaction
      .update(applications)
      .set({ currentStatus: event.toStatus, updatedAt: occurredAt })
      .where(eq(applications.id, applicationId));
    await transaction.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorUserId: event.actorUserId,
      occurredAt: event.occurredAt,
    });

    return event;
  });
}
