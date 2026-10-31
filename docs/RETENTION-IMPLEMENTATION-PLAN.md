# HiredFlex candidate-data retention implementation plan — proposed

**Prepared:** 28 October 2026  
**Status:** Planning only; no purge, live intake, policy activation, or production data mutation authorised.  
**Governing decision:** [Owner approval record](RETENTION-GOVERNANCE-APPROVAL-2026-10-28.md).

**Rule source for future R1 work:** use the [preserved Draft 0.3 source](retention/DRAFT-0.3-SOURCE.txt) and [reconciliation record](RETENTION-POLICY-RECONCILIATION.md), not Draft 0.2's historical owner-review status. These remain inactive proposals subject to legal verification; no exact historical text approval or policy activation is inferred. Missing application closure/terminal dates must produce needs-review; a calculated review point never means authorised deletion.

## Phase R0 — Legal and data inventory (blocking, no real data export)

1. Confirm the responsible party's legal identity and whether HiredFlex qualifies as a private employment agency; obtain advice on Employment Services Act section 16 register fields, three-year minimum and correct start trigger.
2. Confirm Information Officer appointment/registration evidence, POPIA lawful bases, cross-border transfers under section 72, provider contracts and data geography.
3. Inventory field-level storage and deletion ownership for PostgreSQL, Clerk, Vercel logs, Airtable, WhatsApp devices/backups and any later-approved Google Forms/Sheets/Drive. Distinguish actually collected data from planned integrations.
4. Record proposed periods, exceptions and responsible reviewers; secure separate owner/legal sign-off before declaring an effective policy.

**Exit evidence:** signed scope matrix and data inventory; unresolved items explicitly blocked.

## Phase R1 — Read-only engineering foundation (safe to develop before R0 finishes)

1. Add a versioned **retention schedule schema/config** with proposed values clearly marked inactive; do not start background jobs.
2. Implement a deterministic **dry-run eligibility report** using synthetic fixtures: record type, purpose, trigger, proposed review date, relevant exception/hold, provider, dependency, and reason. Treat missing dates or unclear legal basis as **not eligible**, never as automatic deletion.
3. Preserve application status history and referential integrity. Withdrawal is not an erasure request. Avoid altering Stage 1–2 screens, accepted lifecycle rules, company scoping, matching, and candidate service pricing.
4. Add tests for inactivity not resetting historical application clocks, holds overriding eligibility, partial dates, statutory-register subsets, idempotent reporting, access control and cross-company isolation.
5. Keep the report restricted to authorised administrative users; never expose candidate PII in CI logs.

**Exit evidence:** PR, passing PostgreSQL tests and review; report is read-only and disabled in production unless separately authorised.

## Phase R2 — Reviewed manual request workflow (no deletion execution)

1. Record access/correction/objection/deletion requests with minimal identity verification, timestamps, owner, response tracking and consent/notice versions.
2. Prepare a per-provider impact plan with dependencies, lawful exceptions, explicit approver and evidence log. Mark unresolved provider/backup behavior as blocked.
3. Provide preview of affected records and restoration safeguards using synthetic data only. No destructive endpoint or scheduler.

**Exit evidence:** approval workflow tests, synthetic end-to-end request and audit review.

## Phase R3 — Destructive controls and launch readiness (requires separate authorisation)

1. After legal approval and provider verification, implement reversible restriction, reviewed deletion/de-identification and a backup-restoration suppression ledger.
2. Test on disposable databases and provider test identities; prove restored copies cannot reactivate erased records.
3. Verify production authentication, DATABASE_URL, allowed origins, access roles, provider retention, incident response, security and backups.
4. Obtain separate owner approval for any live data deletion and separate approval for real candidate intake. Neither is implied by policy governance approval.

**Exit evidence:** signed acceptance checklist and independent production verification; no release before all blockers pass.

## Immediate next code task

Open a focused PR for **R1 read-only retention eligibility report + synthetic tests**, with no schema migration that alters existing records, no purge job, no candidate-facing policy claim, and no new intake flow. Keep the production configuration recovery tracked separately.
