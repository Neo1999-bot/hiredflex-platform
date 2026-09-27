import {
  activeApplicationStatuses,
  type ApplicationStatus,
} from "./lifecycle.js";
import type { VacancyStatus } from "../vacancy/lifecycle.js";

export class ApplicationSubmissionConflictError extends Error {
  constructor() {
    super("An active application already exists for this vacancy");
    this.name = "ApplicationSubmissionConflictError";
  }
}

export class VacancyNotOpenError extends Error {
  constructor() {
    super("Vacancy is not open for applications");
    this.name = "VacancyNotOpenError";
  }
}

export function assertVacancyOpenForApplications(status: VacancyStatus): void {
  if (status !== "OPEN") throw new VacancyNotOpenError();
}

export function assertNoActiveApplication(
  currentStatus: ApplicationStatus | null | undefined,
): void {
  if (
    currentStatus !== null &&
    currentStatus !== undefined &&
    (activeApplicationStatuses as readonly ApplicationStatus[]).includes(
      currentStatus,
    )
  ) {
    throw new ApplicationSubmissionConflictError();
  }
}
