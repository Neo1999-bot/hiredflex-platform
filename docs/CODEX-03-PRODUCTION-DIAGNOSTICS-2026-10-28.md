# CODEX-03 — production configuration and acceptance diagnostics

Date: 28 October 2026, Africa/Johannesburg. Engineering increment prepared for review; **production acceptance BLOCKED**. Baseline main: `cda87732c0dac470ee2ee0856df0815ab63cfff0`.

## Current evidence

Known: Vercel project `prj_kZwS13HgD8tAXU7citzCrthoc5T0`, team `team_K4IUE7hquq2RICHJfIditXPS`, production deployment `dpl_5xTdc3YRFXBLbzJascMvE5eVY3JU` reports READY at baseline main, with the canonical alias `https://hiredflex-platform.vercel.app`. Deployment metadata reports region iad1; this does not establish database/backup geography or capacity. Project metadata reports Vercel Authentication enabled with `all_except_custom_domains`.

Known: a read-only request through the authenticated Vercel fetch connector to `/health/ready` returned HTTP 500 `FUNCTION_INVOCATION_FAILED` at 23:39 UTC on 27 October (01:39 SAST on 28 October). No share link, bypass secret, protection change or fabricated app principal was used. This request advanced beyond the older unauthenticated 302 observation. Runtime logs scoped to that deployment show `DATABASE_URL is required` in `readConfig`. This confirms the historical PR #14 startup issue remains present on the current deployment, rather than treating a protection redirect as application failure evidence.

Known: environment metadata was requested with `decrypt=false`; values were neither retrieved nor copied. `DATABASE_URL` and `AUTH_ALLOWED_ORIGINS` target Preview only; `hiddenProductionEnvCount` is zero. Prefixed Neon integration keys, including `HIREDFLEX_PROD_DATABASE_URL`, target both Preview and Production. The runtime deliberately reads `DATABASE_URL` only. A prefixed key's presence does not prove its database identity, migrations, free-tier budget, region, privileges or backup behavior. The prefixed integration's Preview exposure also needs operator review; do not switch Preview to the production database.

Known: Clerk publishable/secret variable names target both environments. Their live/test mode and intended production instance were not established by metadata. Neon Auth integration variables do not replace the accepted Clerk identity contract.

| Gate                                                                         | Result     | Evidence or missing prerequisite                                                                |
| ---------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Exact deployment/source and protection metadata                              | PASS       | Current main/deployment/alias inspected; no settings changed                                    |
| Production runtime configuration                                             | BLOCKED    | Expected DATABASE_URL absent from Production; prefixed integration alone is insufficient        |
| Production exact-origin configuration                                        | BLOCKED    | AUTH_ALLOWED_ORIGINS targets Preview only                                                       |
| Production readiness                                                         | BLOCKED    | Current authenticated check returns platform 500 before app startup                             |
| Production database connectivity and four-entry migration journal            | NOT TESTED | No production credential retrieval, database connection or migration performed                  |
| Production Clerk live instance and verified-primary-email sign-in            | NOT TESTED | Startup blocked; configured key names are not provider-session evidence                         |
| Candidate/Employer/Recruiter sessions, refresh/sign-out and scoped DB access | NOT TESTED | Requires working runtime and approved disposable provider accounts; CODEX-07 tracks role matrix |
| Independent accounts, owner multiple roles, wrong-company/assignment denials | NOT TESTED | No production role grants or account-record reads performed                                     |
| Backups/restore, connection budget, legal/retention readiness                | NOT TESTED | Separate CODEX-05/governance gates; no intake authorised                                        |

## Engineering changes and verification

- Add `npm run diagnose:config`: offline operator preflight with PASS/BLOCKED/NOT TESTED gates and fixed codes only. It detects missing DATABASE_URL including the observed prefixed-integration mismatch, runtime validation failures, incomplete/invalid identity configuration and live-key-prefix prerequisites when VERCEL_ENV=production. It never adopts a prefixed credential or enables auth. Prefix checks do not authenticate keys or prove a matching Clerk instance.
- The command reads only its existing process environment. It does not fetch secrets, read env files automatically, contact providers/databases, run migrations, write files or expose an HTTP diagnostics endpoint. Exit 1 means blocked configuration; exit 0 means configuration-only checks passed. Connectivity, migrations, sessions/roles and production acceptance always remain NOT TESTED.
- Sanitise malformed allowed-origin errors: Node's raw URL parsing error can include supplied input; throw the existing generic configuration message instead. Accepted origin rules and disabled-auth behavior are unchanged.
- Keep `/health/ready` responses unchanged: ready 200 or unavailable 503. Log a fixed `database_readiness_failed` / `DATABASE_UNAVAILABLE` event on check failure without logging the database exception or URL. A ready result still means database ping only, not migrations, identity, permissions or release acceptance.
- Regression tests cover blocked/valid preflight, prefix mismatch without fallback/mutation, malformed values, no secret marker disclosure, preview versus production targeting, CLI failure status, sanitised readiness logging and preserved protected-route denial. Packaged startup smoke tests check missing DB/malformed-origin failures using synthetic configuration without querying a provider.

Local evidence: Node 24; 251 tests pass, typecheck/build/lint and packaged startup pass. Formatting-only corrections to the existing engineering prompt and governance approval Markdown were needed for the inherited formatting gate; no instruction or approval wording changed. Full formatting/diff and fresh PostgreSQL 18 CI evidence must be attached to this PR before the engineering increment is considered CI-verified. No local PostgreSQL executable was available; do not claim local database execution.

## Manual owner/operator recovery sequence — not executed

1. Sign into the existing HiredFlex Vercel team and approved Neon project through normal account authentication/MFA. Keep credentials in provider consoles; never paste them into chat, PRs or logs. Inspect the actual free-tier production database, branch, region, ownership and separation from Preview. Confirm no charge or upgrade is required.
2. With **separate explicit approval for the exact production environment change**, configure Production `DATABASE_URL` from the confirmed separate Neon database through the secure provider integration/console. Do not copy Preview credentials, rename all integration variables or add a runtime fallback. Review why the prefixed production integration also targets Preview, separately from this code change.
3. With scoped approval, configure Production `AUTH_ALLOWED_ORIGINS` to the exact intended origin `https://hiredflex-platform.vercel.app`. Any additional alias must be explicitly intended and tested; no wildcard or authentication bypass. Confirm the correct live Clerk instance, verified primary email policy and matching live credentials privately; changes to production secrets require separate approval.
4. An authorised operator verifies the existing four-migration journal and schema using a reviewed read-only query. If migrations are needed, prepare a separate reviewed migration/recovery step; never run `db:verify` on Preview or Production. It is a disposable-test-server command, not application-database acceptance.
5. After configuration/migration approvals, obtain the applicable redeploy/release approval. Record the new deployment ID/SHA and recheck readiness through normal authenticated access. If SSO/MFA blocks access, the owner signs in normally; do not disable protection, create share links or add Trusted Sources rules for convenience.
6. Execute CODEX-07 with approved disposable accounts: verified primary email, onboarding, session reload/sign-out, Candidate ownership, company-scoped Employer and assigned Recruiter access, and negative cases. Preserve the owner's Candidate assignment when testing explicitly approved multiple roles; no production grants are authorised by this document.

## Scope, risks and governance

No migration, lifecycle, pricing, matching, UI, role grant, real candidate intake, deletion, provider resource, environment mutation or charge. Test principals remain confined to existing tests/disposable verification. Public readiness response detail is not expanded. Additional readiness warnings may increase log volume during repeated failures; messages contain only fixed event/code values.

Read the governance approval and implementation plan, policy draft, Phase 5/6, integration contract, release gates, build/operating mandates and current schema/auth code. No standalone ADR/architecture files are present on this main revision; the README, phase/contract documents and checked-in lifecycle/migrations carry the current boundaries. Repository RETENTION-POLICY-DRAFT.md is still labelled 0.2, while the approval record concerns 0.3 and explicitly requires exact-text verification. Do not silently label repository 0.2 approved, publish an effective date or activate retention. ThothOS coordinates that separate governance reconciliation.

Next smallest action: review this PR and approve only the concrete Production configuration remediation if appropriate. Until recovery and independent acceptance pass, keep production release/intake and live deletion blocked. CODEX-07 remains a separate task/branch/PR after this diagnostic handoff.
