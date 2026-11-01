# Inactive synthetic application-retention review

Prepared: 1 November 2026. CODEX-01 / R1 **partial increment**, not a completed retention system or launch gate.

## Bounded implementation

`src/retention/application-review.ts` is an unwired pure function. It accepts synthetic application metadata and an explicit clock, returning a versioned **inactive proposal**, purpose/provider, application/history dependency group, trigger, proposed review date, reasons and status. Every row has `deletionAllowed: false`; there is no eligible-for-deletion state, API, scheduler, production job, database adapter or disposal command. No application server module imports it. A caller marking data synthetic is a guardrail, not proof of data provenance; no real records are authorised for this function.

Rule source: [preserved Draft 0.3, section 4](retention/DRAFT-0.3-SOURCE.txt), under the existing [conditional governance approval](RETENTION-GOVERNANCE-APPROVAL-2026-10-28.md) and [source reconciliation](RETENTION-POLICY-RECONCILIATION.md). No new legal finding, owner approval, effective date, public policy, record field or provider capability is asserted.

| Input / rule                                  | Behaviour                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current status                                | Only Rejected/Withdrawn start a terminal review clock; active or unknown status is needs-review                                                                                                                                                                  |
| Trigger                                       | Later of vacancy `closed_at` and terminal status-history `occurred_at`; either missing/invalid or future produces needs-review                                                                                                                                   |
| Proposal                                      | 12 calendar months, UTC, same time with last-day clamping (29 February → 28 February next year); exact anniversary is review-due                                                                                                                                 |
| Legal/register scope, hold, dependency review | Any unknown blocks a due result. Held records remain on-hold. A statutory minimum is never guessed from a blanket three-year period                                                                                                                              |
| Historical applications                       | Login/account activity is not a clock input; original application/history remain together                                                                                                                                                                        |
| Access                                        | Existing persisted-principal shape required: Operations/Admin for the requested company or global Platform Administrator. All inputs must match that one company; mixed-company input is rejected before any report. This grants no role and exposes no endpoint |
| Output                                        | Opaque application/company IDs and review metadata only; extra names/emails/source contents are not copied or logged. Output sorts deterministically by ID                                                                                                       |

UTC/calendar clamping is a provisional engineering convention for this synthetic exercise, not an approved legal timezone/retention interpretation. These choices and meaningful-activity semantics need explicit review before operational adoption. Calling `cleared-for-review` in a synthetic fixture models a hypothetical decision; it does not constitute legal approval or erasure authority.

## Actual schema versus synthetic input

The current schema has vacancy closure and application status-history timestamps. It does **not** have the legal-scope, hold-review or dependency-review fields used by these fixtures. No columns/migration were added. There is no implemented real-record inventory or verified hold ledger. A future adapter must source and verify those facts, derive the terminal event from history, and block ambiguous/inconsistent histories. It must not substitute application `updated_at`, a login, group membership or inferred consent.

Profile inactivity/30-day notice, 90-day CV working-file review, 24-month privacy evidence, statutory register subsets, other providers, approval tracking, real-record adapters and administrative UI/API remain **unimplemented**. Deferred uploads/intake are not introduced by these input types. This increment does not finish CODEX-01, R0 legal/provider inventory or R2/R3 controls.

## Verification and safety

33 unit cases cover later-event order, both terminal states, exact boundary, leap-year clamping, equivalent timezone offsets, missing/invalid/future dates, active states, holds, unknown legal/dependency scope, unrelated login, deterministic non-mutating output, extra-PII omission, empty input, invalid clocks/duplicates, missing authentication, wrong roles and company isolation. Three cases also reject non-verifier database names after metadata lookup and before any application query. These are synthetic function checks, not signed-in browser/provider acceptance.

`scripts/verify-retention-review.ts` runs only inside the existing random disposable PostgreSQL verifier. It first requires current_database() to match hiredflex_verify_ plus 32 hexadecimal characters. It reads its two synthetic application fixtures after withdrawal/reapplication and vacancy closure. Terminal time comes from history, not `updated_at`. Unknown legal/hold/dependency inputs block both; fictional clearances allow only the withdrawn record to become review-due, never deletion-eligible. It snapshots application status/updated time, vacancy closure and every history row before/after and requires equality. Only a fixed PASS message is logged. The existing verifier keeps its separate admin URL/random-database safeguards and original lifecycle/isolation checks. No live database is queried or mutated.

Local PostgreSQL execution is unavailable; the focused and full local quality results and fresh disposable PostgreSQL CI belong to the PR's exact SHA. Do not treat prepared SQL as a passing database test before its CI log confirms execution.

## Current live and Figma evidence

1 November read-only metadata still shows no Production live-key pair. PR #19's prior Preview-only managed-key separation and Production-only proxy variable remain; no credential/configuration/deployment changes were made today. Public readiness is 200 ready, protected session/candidate/employer/recruiter requests each return 401, and root still serves development-key mode without a proxy attribute. Intended live sign-in and independent-account acceptance remain blocked. Do not rerun completed migrations or deploy from this branch.

The exact HiredFlex Make context again returned source links without rendered screens; file-session creation rejects Make and screenshot rendering is unsupported for this file type. Zero rendered screens or source-link contents inspected, zero design edits. Existing [Phase 6 flow mapping](PHASE-6.md) remains the comparison target; functional retention logic is not inferred from prototype screens. Completed prototype Stages 1–2, matching/search and application/vacancy behaviour are unchanged. Design discrepancies remain Unknown.

## Acceptance and next step

This increment is accepted for review only when focused/full quality checks and fresh PostgreSQL CI pass, the snapshots remain unchanged, and no production import/endpoint/disposal path exists. Stop there. Next independent R1 slice: specify meaningful activity and required profile timestamps/notice evidence before implementing an inactive profile review rule. Production authentication stays in PR #19's existing secure-entry/deployment workflow; this PR does not bypass it.
