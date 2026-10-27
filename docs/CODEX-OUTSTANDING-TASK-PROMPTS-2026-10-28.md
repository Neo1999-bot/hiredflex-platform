# HiredFlex — Codex engineering execution briefs

Prepared: 28 October 2026. Owner: Neo Marothi. Coordinator: ThothOS.
Status: **Ready for Codex assignment; not evidence of implementation**.

## Global instructions for every Codex task

Repository: `Neo1999-bot/hiredflex-platform`; start from current `main`. Read `docs/RETENTION-GOVERNANCE-APPROVAL-2026-10-28.md`, `docs/RETENTION-IMPLEMENTATION-PLAN.md`, `docs/RETENTION-POLICY-DRAFT.md`, `docs/PHASE-5.md`, integration contracts and ADRs first. Preserve accepted stages, vacancy DRAFT→OPEN→CLOSED, DRAFT-only requirement edits, application state history and unique-active-application semantics, company/assignment isolation, matching rules, free candidate services and existing UX. No live candidate intake, deletion, purge, marketing, payments, paid providers, production secret changes or policy-effective-date publication. Use synthetic data only. Never paste credentials or PII into commits, PRs or logs. Each task: own branch/PR, scoped changes, passing lint/typecheck/build/test/PostgreSQL CI, risk assessment, migration notes, evidence and honest blockers. Do not merge without review.

### CODEX-01 — R1 read-only retention eligibility report (priority P1)
**Prompt:** Inspect the existing schema and policy draft. Implement a versioned, inactive retention-rule configuration and a deterministic read-only eligibility calculator/report for candidate profiles, applications/history, CV operational metadata only where actually modeled, consent and holds only where modeled. Use synthetic fixtures. Return record class, applicable purpose, trigger, computed review date, source of rule, blocking exceptions/unknowns and reasons. Unknown dates or legal scope MUST produce 'needs review', not eligible. Do not create purge endpoints, schedulers, production jobs or destructive migrations. Ensure historic applications' clocks are not reset by unrelated account activity. Cover 30-day notice, 90-day document review, 12/24-month review and statutory 3-year minimum as **proposals**, not active rules. Tests: boundaries/timezones, idempotence, holds, missing timestamps, scope isolation, access control and no mutation. Deliver PR with evidence and explicit disabled-by-default status.

### CODEX-02 — Privacy request tracking, no deletion (priority P2)
**Prompt:** Implement a restricted administrative request register for access, correction, objection, restriction and deletion requests using minimum metadata and proportionate verification flags, due-date tracking and per-provider dry-run impact plans. Do not collect ID documents or implement erasure. Add audit trail and role/tenant tests; do not expose cross-company data. Handle withdrawal-of-application separately from erasure requests. Include synthetic end-to-end test and operator checklist. PR separate from CODEX-01.

### CODEX-03 — Production acceptance and configuration diagnostics (priority P0)
**Prompt:** Audit Vercel/Clerk/PostgreSQL deployment readiness, focusing on historical production DATABASE_URL and allowed-origin problems and SSO-protected readiness endpoint. Implement safe, non-secret-leaking startup/readiness diagnostics and smoke tests only where code is deficient. Do not bypass auth, expose credentials, create a paid DB or change production env vars without approval. Provide precise manual owner-authentication actions when needed. Verify candidate, employer and recruiter sign-in, permissions and scoped database access using disposable identities only. Report PASS/BLOCKED/NOT TESTED per gate; do not claim production accepted from Preview CI.

### CODEX-04 — Race-condition tests (priority P1)
**Prompt:** Add forced concurrency/interleaving PostgreSQL tests for requirement edits racing vacancy publication, ensuring requirements are editable only in DRAFT and no partial commit or stale publication bypass. Verify transaction rollback, isolation and history consistency. Preserve existing lifecycle contracts. Fix only demonstrable defects in scoped PR; no speculative redesign. Include reproduction and repeatable CI evidence.

### CODEX-05 — Backup and restore safety (priority P0 before intake)
**Prompt:** Document actual provider backup capabilities and implement a disposable PostgreSQL backup/restore rehearsal with synthetic data, integrity checks and recovery evidence. Design (do not activate) a deletion suppression ledger so restored data cannot silently resurrect future erased records. Do not copy real candidate data or assume provider backup deletion guarantees. Report retention limitations and owner decisions.

### CODEX-06 — Figma and responsive acceptance (priority P2)
**Prompt:** Compare the approved HiredFlex Figma candidate/employer/recruiter flows against current live preview screens, with reproducible screenshots, viewport widths, accessibility and auth boundary checks. Where Figma frames are inaccessible, mark NOT VERIFIED and request specific access rather than inventing a visual comparison. Fix only discrepancies within accepted MVP stage boundaries; separate optional redesign proposals. Verify free candidate-services messaging.

### CODEX-07 — Production identity and role matrix (priority P0)
**Prompt:** Test candidate, employer and recruiter accounts, including owner account with explicitly approved multiple roles. Ensure no role escalation, company-scope leakage or unauthorized status changes; use disposable accounts. Write matrix of expected versus actual access and negative tests. Never assign privileged roles in production without separate approval.

## Coordination and gates

ThothOS owns PR review, governance documents, release evidence, provider/configuration coordination, legal readiness checklist and daily reporting. Neo owns legal/business registration decisions, Information Officer evidence, paid costs, identity verification and separate approval for real candidate intake or any live deletion. No task's passing CI grants those approvals. Order: CODEX-03 and CODEX-07 production diagnosis; CODEX-04 and CODEX-01 scoped tests/implementation; CODEX-05; CODEX-02; CODEX-06, adjusting for dependencies. Each task must state actual files changed, tests executed, unresolved gates and next smallest step.
