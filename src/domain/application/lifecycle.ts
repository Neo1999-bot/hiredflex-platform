import type { applicationStatus } from "../../db/schema/index.js";

export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];

const transitions: Readonly<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  Applied: ["Reviewing", "Shortlisted", "Rejected", "Withdrawn"],
  Reviewing: ["Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Withdrawn"],
  Rejected: [],
  Withdrawn: [],
};

export interface ApplicationStatusEvent {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorUserId: string;
  occurredAt: Date;
}

export class InvalidApplicationTransitionError extends Error {
  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`Application cannot transition from ${from} to ${to}`);
    this.name = "InvalidApplicationTransitionError";
  }
}

export function isAllowedApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return (transitions[from] ?? []).includes(to);
}

export function transitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
  actorUserId: string,
  occurredAt = new Date(),
): ApplicationStatusEvent {
  if (!isAllowedApplicationTransition(from, to)) {
    throw new InvalidApplicationTransitionError(from, to);
  }
  return { fromStatus: from, toStatus: to, actorUserId, occurredAt };
}

export function initialApplicationStatusEvent(
  actorUserId: string,
  occurredAt = new Date(),
): ApplicationStatusEvent {
  return { fromStatus: null, toStatus: "Applied", actorUserId, occurredAt };
}
