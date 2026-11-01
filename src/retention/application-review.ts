import {
  ForbiddenError,
  requirePrincipal,
  type AuthenticatedPrincipal,
} from "../auth/authorization.js";
import type { applicationStatus } from "../db/schema/index.js";

// Inactive proposal, not a disposal schedule. No runtime route imports this module.
export const applicationReviewProposal = Object.freeze({
  version: "RET-DRAFT-0.3/APPLICATION-REVIEW-UTC-v1",
  active: false,
  source: "docs/retention/DRAFT-0.3-SOURCE.txt#section-4",
  calendarMonths: 12,
  calendar: "UTC; clamp anniversary to the last day of its month",
} as const);

type ApplicationStatus = (typeof applicationStatus.enumValues)[number];

export interface SyntheticApplicationReviewRecord {
  readonly id: string;
  readonly companyId: string;
  readonly currentStatus: ApplicationStatus;
  readonly vacancyClosedAt: Date | null;
  // Future adapter must derive this from the terminal status-history event,
  // never applications.updated_at or a candidate's login timestamp.
  readonly terminalAt: Date | null;
  // These are synthetic review inputs, NOT fields claimed to exist in the DB.
  readonly legalScopeReview: "cleared-for-review" | "unknown";
  readonly holdReview: "clear" | "held" | "unknown";
  readonly dependencyReview: "reviewed" | "unknown";
}

type ReviewReason =
  | "ACTIVE_OR_UNKNOWN_APPLICATION_STATUS"
  | "MISSING_VACANCY_CLOSURE"
  | "MISSING_TERMINAL_EVENT"
  | "INVALID_TIMESTAMP"
  | "FUTURE_TRIGGER"
  | "ACTIVE_HOLD"
  | "HOLD_REVIEW_REQUIRED"
  | "LEGAL_SCOPE_REVIEW_REQUIRED"
  | "DEPENDENCY_REVIEW_REQUIRED"
  | "REVIEW_DATE_REACHED"
  | "BEFORE_REVIEW_DATE";

const validDate = (value: Date | null): value is Date =>
  value instanceof Date && Number.isFinite(value.getTime());

function anniversary(trigger: Date): Date {
  const result = new Date(trigger);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(
    result.getUTCMonth() + applicationReviewProposal.calendarMonths,
  );
  const end = new Date(result);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  result.setUTCDate(Math.min(day, end.getUTCDate()));
  return result;
}

function review(record: SyntheticApplicationReviewRecord, asOf: Date) {
  const reasons: ReviewReason[] = [];
  const terminal = ["Rejected", "Withdrawn"].includes(record.currentStatus);
  if (!terminal) reasons.push("ACTIVE_OR_UNKNOWN_APPLICATION_STATUS");
  if (record.vacancyClosedAt == null) reasons.push("MISSING_VACANCY_CLOSURE");
  if (record.terminalAt == null) reasons.push("MISSING_TERMINAL_EVENT");
  const valid =
    validDate(record.vacancyClosedAt) && validDate(record.terminalAt);
  for (const value of [record.vacancyClosedAt, record.terminalAt]) {
    if (value != null && !validDate(value)) reasons.push("INVALID_TIMESTAMP");
    if (validDate(value) && value > asOf) reasons.push("FUTURE_TRIGGER");
  }
  if (record.holdReview === "held") reasons.push("ACTIVE_HOLD");
  else if (record.holdReview !== "clear") reasons.push("HOLD_REVIEW_REQUIRED");
  if (record.legalScopeReview !== "cleared-for-review")
    reasons.push("LEGAL_SCOPE_REVIEW_REQUIRED");
  if (record.dependencyReview !== "reviewed")
    reasons.push("DEPENDENCY_REVIEW_REQUIRED");

  const trigger =
    terminal && valid
      ? new Date(
          Math.max(
            record.vacancyClosedAt!.getTime(),
            record.terminalAt!.getTime(),
          ),
        )
      : null;
  const proposed = trigger ? anniversary(trigger) : null;
  if (proposed && !validDate(proposed)) reasons.push("INVALID_TIMESTAMP");
  const blocked = reasons.length > 0;
  const due = proposed !== null && validDate(proposed) && proposed <= asOf;
  if (!blocked)
    reasons.push(due ? "REVIEW_DATE_REACHED" : "BEFORE_REVIEW_DATE");
  return {
    recordId: record.id,
    companyId: record.companyId,
    provider: "PostgreSQL" as const,
    purpose: "application-and-status-history-review" as const,
    dependencyGroup: "application-and-its-status-history" as const,
    triggerAt: trigger?.toISOString() ?? null,
    proposedReviewAt: validDate(proposed) ? proposed.toISOString() : null,
    status:
      record.holdReview === "held"
        ? ("on-hold" as const)
        : blocked
          ? ("needs-review" as const)
          : due
            ? ("review-due" as const)
            : ("not-due" as const),
    reasons: [...new Set(reasons)],
    deletionAllowed: false as const,
  };
}

/** Pure synthetic exercise: no DB/provider adapter, output log, route or mutation. */
export function buildSyntheticApplicationReview(
  principal: AuthenticatedPrincipal | null | undefined,
  input: {
    readonly dataset: "synthetic";
    readonly companyId: string;
    readonly asOf: Date;
    readonly records: readonly SyntheticApplicationReviewRecord[];
  },
) {
  const actor = requirePrincipal(principal);
  const authorised = actor.roleAssignments.some(
    ({ role, companyId }) =>
      (role === "Platform Administrator" && companyId === null) ||
      (role === "Operations/Admin" && companyId === input.companyId),
  );
  if (!authorised || input.dataset !== "synthetic" || !input.companyId.trim())
    throw new ForbiddenError();
  // Reject the entire mixed-company input before producing any partial report.
  if (input.records.some((record) => record.companyId !== input.companyId))
    throw new ForbiddenError();
  if (!validDate(input.asOf)) throw new Error("Invalid review clock");
  if (
    input.records.some((record) => !record.id.trim()) ||
    new Set(input.records.map((record) => record.id)).size !==
      input.records.length
  )
    throw new Error("Invalid synthetic record identifiers");
  return {
    dataset: "synthetic" as const,
    policyVersion: applicationReviewProposal.version,
    policyActive: applicationReviewProposal.active,
    ruleSource: applicationReviewProposal.source,
    asOf: input.asOf.toISOString(),
    rows: input.records
      .map((record) => review(record, input.asOf))
      .sort((a, b) =>
        a.recordId < b.recordId ? -1 : a.recordId > b.recordId ? 1 : 0,
      ),
  };
}
