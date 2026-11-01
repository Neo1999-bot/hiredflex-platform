import assert from "node:assert/strict";
import type postgres from "postgres";
import { buildSyntheticApplicationReview } from "../src/retention/application-review.js";

// Called only by the existing disposable-db verifier, never an app route.
export async function verifyRetentionReview(
  client: postgres.Sql,
  companyId: string,
  ids: string[],
) {
  const [database] = await client`select current_database() as name`;
  assert.match(
    String(database?.name),
    /^hiredflex_verify_[0-9a-f]{32}$/,
    "Disposable verification database required",
  );
  const snapshot = async () => client`
    select a.id, a.current_status, a.updated_at, v.closed_at,
      (select jsonb_agg(to_jsonb(h) order by h.occurred_at, h.id)
       from application_status_history h where h.application_id = a.id) as history
    from applications a join vacancies v on v.id = a.vacancy_id
    where a.id in ${client(ids)} order by a.id`;
  const before = [...(await snapshot())];
  const rows = await client`
    select a.id, a.current_status, v.company_id,
      extract(epoch from v.closed_at) * 1000 as closed_ms,
      (select extract(epoch from max(h.occurred_at)) * 1000 from application_status_history h
       where h.application_id = a.id and h.to_status = a.current_status
       and h.to_status in ('Rejected', 'Withdrawn')) as terminal_ms
    from applications a join vacancies v on v.id = a.vacancy_id
    where a.id in ${client(ids)} order by a.id`;
  assert.equal(rows.length, 2);
  // Drizzle configures the shared client's timestamp parsers to return strings.
  // Epoch projection preserves the instant without local-time string parsing;
  // preserve missing values as null, never new Date(null) / the Unix epoch.
  const records = rows.map((row) => ({
    id: row.id as string,
    companyId: row.company_id as string,
    currentStatus: row.current_status as "Withdrawn" | "Applied",
    vacancyClosedAt:
      row.closed_ms == null ? null : new Date(Number(row.closed_ms)),
    terminalAt:
      row.terminal_ms == null ? null : new Date(Number(row.terminal_ms)),
    legalScopeReview: "unknown" as const,
    holdReview: "unknown" as const,
    dependencyReview: "unknown" as const,
  }));
  const withdrawn = records.find((row) => row.currentStatus === "Withdrawn")!;
  assert.ok(
    withdrawn.vacancyClosedAt &&
      Number.isFinite(withdrawn.vacancyClosedAt.getTime()),
  );
  assert.ok(
    withdrawn.terminalAt && Number.isFinite(withdrawn.terminalAt.getTime()),
  );
  const asOf = new Date(
    Math.max(
      withdrawn.vacancyClosedAt.getTime(),
      withdrawn.terminalAt.getTime(),
    ),
  );
  asOf.setUTCFullYear(asOf.getUTCFullYear() + 2);
  const principal = {
    userId: "synthetic-retention-operator",
    roleAssignments: [{ role: "Operations/Admin" as const, companyId }],
  };
  const input = { dataset: "synthetic" as const, companyId, asOf, records };
  const result = buildSyntheticApplicationReview(principal, input);
  assert.ok(
    result.rows.every(
      (row) => row.status === "needs-review" && !row.deletionAllowed,
    ),
  );
  assert.ok(
    result.rows.every(
      (row) =>
        row.reasons.includes("LEGAL_SCOPE_REVIEW_REQUIRED") &&
        row.reasons.includes("HOLD_REVIEW_REQUIRED"),
    ),
  );
  assert.deepEqual(result, buildSyntheticApplicationReview(principal, input));
  // Fictional clearances exercise calculation only, not a real legal decision.
  const cleared = buildSyntheticApplicationReview(principal, {
    ...input,
    records: records.map((row) => ({
      ...row,
      legalScopeReview: "cleared-for-review",
      holdReview: "clear",
      dependencyReview: "reviewed",
    })),
  });
  assert.equal(
    cleared.rows.find((row) => row.recordId === withdrawn.id)!.status,
    "review-due",
  );
  assert.equal(
    cleared.rows.find((row) => row.recordId !== withdrawn.id)!.status,
    "needs-review",
  );
  assert.ok(cleared.rows.every((row) => row.deletionAllowed === false));
  assert.deepEqual(
    [...(await snapshot())],
    before,
    "Review must not alter applications/history/closure",
  );
  console.log(
    "PASS: inactive synthetic retention review, real disposable application/history triggers, unresolved scope/holds blocked, active reapplication preserved, read-only snapshots unchanged",
  );
}
