import { describe, expect, it, vi } from "vitest";
import type postgres from "postgres";
import { verifyRetentionReview } from "../../scripts/verify-retention-review.js";
import {
  ForbiddenError,
  UnauthorizedError,
  type AuthenticatedPrincipal,
} from "../auth/authorization.js";
import {
  applicationReviewProposal,
  buildSyntheticApplicationReview,
  type SyntheticApplicationReviewRecord,
} from "./application-review.js";

const date = (value: string) => new Date(value);
const actor: AuthenticatedPrincipal = {
  userId: "synthetic-operator",
  roleAssignments: [{ role: "Operations/Admin", companyId: "company-a" }],
};
const record: SyntheticApplicationReviewRecord = {
  id: "application-a",
  companyId: "company-a",
  currentStatus: "Withdrawn",
  vacancyClosedAt: date("2024-02-29T12:30:15.123Z"),
  terminalAt: date("2024-02-28T12:30:15.123Z"),
  legalScopeReview: "cleared-for-review",
  holdReview: "clear",
  dependencyReview: "reviewed",
};
const input = {
  dataset: "synthetic" as const,
  companyId: "company-a",
  asOf: date("2025-03-01T00:00:00Z"),
  records: [record],
};
const run = (
  patch: Partial<SyntheticApplicationReviewRecord> = {},
  asOf = input.asOf,
) =>
  buildSyntheticApplicationReview(actor, {
    ...input,
    asOf,
    records: [{ ...record, ...patch }],
  }).rows[0]!;

describe("inactive synthetic application/history review", () => {
  it.each(["neondb", "postgres", "hiredflex_verify_bad"])(
    "refuses %s before querying application records",
    async (name) => {
      const client = vi.fn(async () => [{ name }]);
      await expect(
        verifyRetentionReview(client as unknown as postgres.Sql, "company-a", [
          "a",
          "b",
        ]),
      ).rejects.toThrow("Disposable verification database required");
      expect(client).toHaveBeenCalledTimes(1);
    },
  );
  it("never authorises disposal, including an overdue cleared review", () => {
    const report = buildSyntheticApplicationReview(actor, input);
    expect(applicationReviewProposal.active).toBe(false);
    expect(Object.isFrozen(applicationReviewProposal)).toBe(true);
    expect(report.policyActive).toBe(false);
    expect(report.ruleSource).toContain("DRAFT-0.3-SOURCE.txt");
    expect(report.rows[0]).toMatchObject({
      status: "review-due",
      deletionAllowed: false,
      dependencyGroup: "application-and-its-status-history",
    });
  });
  it.each(["Rejected", "Withdrawn"] as const)(
    "uses the later event for %s, with a clamped calendar anniversary",
    (currentStatus) => {
      for (const dates of [
        {
          vacancyClosedAt: record.vacancyClosedAt,
          terminalAt: record.terminalAt,
        },
        {
          vacancyClosedAt: record.terminalAt,
          terminalAt: record.vacancyClosedAt,
        },
      ]) {
        expect(run({ ...dates, currentStatus })).toMatchObject({
          triggerAt: "2024-02-29T12:30:15.123Z",
          proposedReviewAt: "2025-02-28T12:30:15.123Z",
        });
      }
    },
  );
  it.each([
    ["2025-02-28T12:30:15.122Z", "not-due"],
    ["2025-02-28T12:30:15.123Z", "review-due"],
    ["2025-02-28T12:30:15.124Z", "review-due"],
  ])("handles the exact review boundary %s", (clock, status) => {
    expect(run({}, date(clock))).toMatchObject({
      status,
      deletionAllowed: false,
    });
  });
  it("normalises timezone offsets to the same instant without consulting the host clock", () => {
    expect(
      run({ vacancyClosedAt: date("2024-02-29T14:30:15.123+02:00") }),
    ).toEqual(run());
  });
  it.each([
    [{ vacancyClosedAt: null }, "MISSING_VACANCY_CLOSURE"],
    [{ terminalAt: null }, "MISSING_TERMINAL_EVENT"],
    [{ terminalAt: new Date(NaN) }, "INVALID_TIMESTAMP"],
    [{ terminalAt: date("2030-01-01T00:00:00Z") }, "FUTURE_TRIGGER"],
    [{ legalScopeReview: "unknown" }, "LEGAL_SCOPE_REVIEW_REQUIRED"],
    [{ holdReview: "unknown" }, "HOLD_REVIEW_REQUIRED"],
    [{ dependencyReview: "unknown" }, "DEPENDENCY_REVIEW_REQUIRED"],
  ] as const)("blocks missing or unresolved evidence: %j", (patch, reason) => {
    const result = run(patch);
    expect(result.status).toBe("needs-review");
    expect(result.reasons).toContain(reason);
    expect(result.deletionAllowed).toBe(false);
  });
  it.each(["Applied", "Reviewing", "Shortlisted"] as const)(
    "does not start a terminal clock for %s",
    (currentStatus) => {
      expect(run({ currentStatus })).toMatchObject({
        status: "needs-review",
        triggerAt: null,
        proposedReviewAt: null,
      });
    },
  );
  it("preserves an active hold even when a review is overdue", () => {
    expect(run({ holdReview: "held" })).toMatchObject({
      status: "on-hold",
      reasons: ["ACTIVE_HOLD"],
      deletionAllowed: false,
    });
  });
  it("does not reset an old application clock from account activity or echo extra PII", () => {
    const changed = {
      ...record,
      accountLastLoginAt: date("2025-02-28T00:00:00Z"),
      email: "synthetic-private-marker",
    };
    const result = buildSyntheticApplicationReview(actor, {
      ...input,
      records: [changed],
    });
    expect(result).toEqual(buildSyntheticApplicationReview(actor, input));
    expect(JSON.stringify(result)).not.toContain(changed.email);
  });
  it("is deterministic, sorted and does not mutate input dates or record arrays", () => {
    const fixtures = [
      { ...record, id: "z" },
      { ...record, id: "a" },
    ];
    const original = structuredClone(fixtures);
    const request = { ...input, records: fixtures };
    const first = buildSyntheticApplicationReview(actor, request);
    expect(first).toEqual(buildSyntheticApplicationReview(actor, request));
    expect(fixtures).toEqual(original);
    expect(first.rows.map((row) => row.recordId)).toEqual(["a", "z"]);
    expect(
      buildSyntheticApplicationReview(actor, { ...request, records: [] }).rows,
    ).toEqual([]);
  });
  it("rejects invalid report clocks and ambiguous duplicate identifiers", () => {
    expect(() =>
      buildSyntheticApplicationReview(actor, { ...input, asOf: new Date(NaN) }),
    ).toThrow("Invalid review clock");
    expect(() =>
      buildSyntheticApplicationReview(actor, {
        ...input,
        records: [record, record],
      }),
    ).toThrow("Invalid synthetic record identifiers");
  });
  it("rejects missing authentication", () => {
    expect(() => buildSyntheticApplicationReview(null, input)).toThrow(
      UnauthorizedError,
    );
  });
  it.each([
    { role: "Candidate", companyId: null },
    { role: "Employer", companyId: "company-a" },
    { role: "Recruiter", companyId: "company-a" },
    { role: "Operations/Admin", companyId: "company-b" },
    { role: "Operations/Admin", companyId: null },
    { role: "Platform Administrator", companyId: "company-a" },
  ] as const)("denies unrelated roles/scopes: %j", (assignment) => {
    expect(() =>
      buildSyntheticApplicationReview(
        { userId: "synthetic-other", roleAssignments: [assignment] },
        input,
      ),
    ).toThrow(ForbiddenError);
  });
  it("allows the existing global administrator shape but rejects mixed-company input", () => {
    const admin: AuthenticatedPrincipal = {
      userId: "synthetic-admin",
      roleAssignments: [{ role: "Platform Administrator", companyId: null }],
    };
    expect(buildSyntheticApplicationReview(admin, input).rows).toHaveLength(1);
    for (const principal of [admin, actor]) {
      expect(() =>
        buildSyntheticApplicationReview(principal, {
          ...input,
          records: [
            record,
            { ...record, id: "foreign", companyId: "company-b" },
          ],
        }),
      ).toThrow(ForbiddenError);
    }
  });
  it("rejects non-synthetic datasets even for an authorised operator", () => {
    expect(() =>
      buildSyntheticApplicationReview(actor, {
        ...input,
        dataset: "production" as "synthetic",
      }),
    ).toThrow(ForbiddenError);
  });
});
