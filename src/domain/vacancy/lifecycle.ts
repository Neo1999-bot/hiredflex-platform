import type { vacancyStatus } from "../../db/schema/index.js";

export type VacancyStatus = (typeof vacancyStatus.enumValues)[number];

const transitions: Readonly<Record<VacancyStatus, readonly VacancyStatus[]>> = {
  DRAFT: ["OPEN"],
  OPEN: ["CLOSED"],
  CLOSED: [],
};

export class InvalidVacancyTransitionError extends Error {
  constructor(from: VacancyStatus, to: VacancyStatus) {
    super(`Vacancy cannot transition from ${from} to ${to}`);
    this.name = "InvalidVacancyTransitionError";
  }
}

export function isAllowedVacancyTransition(
  from: VacancyStatus,
  to: VacancyStatus,
): boolean {
  return transitions[from].includes(to);
}

export function transitionVacancy(
  from: VacancyStatus,
  to: VacancyStatus,
): VacancyStatus {
  if (!isAllowedVacancyTransition(from, to)) {
    throw new InvalidVacancyTransitionError(from, to);
  }
  return to;
}

export function vacancyAcceptsApplications(status: VacancyStatus): boolean {
  return status === "OPEN";
}
