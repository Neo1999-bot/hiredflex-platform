# Production authentication configuration incident — 2 November 2026

Known: public Production requests fail with HTTP 500. Launch verdict: **NO-GO**. This dated evidence supersedes the earlier readiness-200/development-key snapshot; it does not authorise a provider change or release.

## Current source and deployment

GitHub reports PRs #17, #19, #23 and #24 merged outside this run on 1 November; main is `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9` (merge of #24). The earlier draft release-candidate warning is historical evidence of the configuration dependency, not evidence that the live keys were subsequently saved. No merge/deployment authorisation is inferred from repository metadata.

The canonical alias `https://hiredflex-platform.vercel.app` resolves to `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm`, main `aa8026e`, provider state READY. READY is a build/deployment state, not successful function startup. Metadata lists `iad1`; observed request logs show execution in `cle1`. Actual placement/region guarantees remain unverified; no region was changed.

## Actual checks today

| Evidence                                                                            | Result / limit                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `/`                                                                            | HTTP 500, FUNCTION_INVOCATION_FAILED; no live-key/development-mode HTML can be inspected                                                                                        |
| `/auth/session`, `/candidate/skills`, `/employer/vacancies`, `/recruiter/vacancies` | Each HTTP 500 FUNCTION_INVOCATION_FAILED, replacing the earlier unauthenticated 401 snapshot                                                                                    |
| `/health/ready`                                                                     | Initial request failed with URLError; retry returned HTTP 500 FUNCTION_INVOCATION_FAILED. Do not reuse prior readiness 200                                                      |
| Deployment-scoped runtime logs, recent 30-minute query                              | Root and protected requests report `Error: Incomplete Clerk proxy configuration`, at readIdentityConfig and the lazy Vercel handler initializer                                 |
| Production environment names/types/targets, no decryption                           | CLERK_PROXY_URL, AUTH_ALLOWED_ORIGINS and sensitive DATABASE_URL present; CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY absent at Production scope                                 |
| Preview bindings                                                                    | Managed NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY remain Preview-only under the original Clerk resource; separate Preview Neon DATABASE_URL remains scoped Preview |

Names/targets do not establish matching credentials, unchanged secret values or a working Preview session. No secret, token, candidate record or provider user was read. No configuration, migration, role, deployment, rollback or integration change occurred during this investigation. Prior approved migrations remain completed evidence; this startup failure is not permission to repeat them or proof of a new database outage.

## Causal reproduction and bounded code change

The current handler and packaged server call `readIdentityConfig()` with a configured proxy but missing Production keys. Its existing fail-closed exception explains the live logs. A successful synthetic CI configuration does not supply missing live credentials.

Four new synthetic handler tests first failed on unmodified main: the database-client factory was called before rejecting incomplete/invalid identity settings. Both entrypoints now validate identity once **before constructing the database client**, then pass that immutable local result to buildApp. Missing credentials still throw the same fixed safe error; no fallback, development key, identity bypass or relaxed JWT validation is introduced. Because the PostgreSQL client is lazy, the failed factory-call observation is not a claim that real database connections were opened or leaked.

Regression checks cover missing both keys, missing either key, malformed origin, repeat calls after failed lazy initialization, and no credential-marker leakage from the error. Packaged startup verification now exercises three incomplete-proxy-key cases and clears inherited proxy/alias variables from its synthetic environments. Existing no-identity public-shell/protected-denial checks remain. This corrects initialization ordering and strengthens regression evidence; **it does not restore the live site** without credentials and a separately approved release.

No API/schema/migration, user privilege, matching/search, application/vacancy lifecycle, fee or UI change. No workflow/protection alteration. Test principals and credentials are fictional. Full quality and disposable PostgreSQL results belong to the exact feature PR SHA; no local PostgreSQL or live mutation test is claimed.

## Recovery choices — prepared only

1. Intended recovery: complete the existing secure owner credential-creation/entry handoff for the exact intended Clerk Production instance. Save matching live publishable/secret entries Production-only, preserve Preview, then re-read metadata without decryption. Any key creation or entry must remain in trusted provider UI; never chat, logs or commits. Current inability to access a laptop does not authorise secret extraction or automatic credential creation.
2. After configuration is complete, obtain explicit approval for the exact Production deployment. Reverify runtime/readiness, proxy/domain, live-key mode and real signup/signin/signout/session persistence. Test independent Candidate/Employer/Recruiter identities and scoped permissions with separately approved disposable account provisioning; do not infer it from JWT tests or grant roles via public signup.
3. If urgent service restoration is preferred, the prior deployment `dpl_FLMagkJ1A5yLG3EJjeuLH8JbLbaf` is a **rollback candidate only**, requiring explicit approval. Its 31 October/1 November behavior was readiness 200 and development identity; it is not accepted Production authentication. A rollback's current availability/settings and impact must be checked before execution; no rollback was attempted.

Do not redeploy merely because another commit or CI passed. Do not merge any pending PR into the Production-linked main branch while the key configuration remains incomplete. Final release still needs privacy/legal/provider recovery, capacity, browser and design gates. Candidate intake remains paused.

## Figma and flow traceability

Exact reference: [HiredFlex Make prototype](https://www.figma.com/make/xNiwwAOZfsOz5tjWHEDmeK/HiredFlex-%E2%80%94-Stage-1-COMPLETE-%E2%80%94-26-Sep-2026). Today's context returned source links without rendered images; session creation rejects Make and screenshot rendering is unsupported. Zero rendered screens/source-link contents inspected; zero designs changed. No two-way integration claimed. Completed prototype Stages 1–2 remain preserved.

| Existing comparison target     | Application route / API                                                    | Current functional evidence                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Sign-in and onboarding         | Root, `/#workspace`; `/auth/session`, `/auth/onboard`                      | Root/session fail initialization; onboarding not attempted; no rendered comparison possible |
| Candidate workspace            | `/#skills`, `/#applications`; `/candidate/skills`                          | Protected request 500 before session evaluation; accepted lifecycle unchanged in code       |
| Employer / Recruiter workspace | `/#employer`, `/#recruiter`; `/employer/vacancies`, `/recruiter/vacancies` | Requests 500 before authorization; independent live isolation not tested                    |

These are known functional availability failures, not inferred Figma discrepancies. Visual discrepancies remain Unknown. Historical exports and [Phase 6 mapping](PHASE-6.md) remain dated targets, not proof of current live parity.

## Evidence refresh — 8 November 2026

This is a read-only refresh of the existing incident record. It does not change the recovery decision, credentials, application behavior or release authority.

### Production deployment and environment metadata

- Vercel still reports canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` as READY from `main` at `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. READY confirms deployment state only.
- Names/types/targets were inspected with decryption disabled. Production has `CLERK_PROXY_URL` set to `https://hiredflex-platform.vercel.app/__clerk` and `AUTH_ALLOWED_ORIGINS` set to `https://hiredflex-platform.vercel.app`. Production has no `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`; Vercel reports `hiddenProductionEnvCount: 0`. Production Neon/database variable names remain present.
- The managed `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` entries remain Preview-only. Preview values and Neon bindings were not decrypted or changed. The project's custom-environment inventory is empty. The available Vercel connector exposes lookup of a known team-shared variable ID but no team-shared-variable listing, so this project-level audit cannot rule out an unattached team-level shared variable; no shared-variable IDs or secret values were guessed or retrieved.
- Vercel project-domain metadata lists only `hiredflex-platform.vercel.app` as verified; no custom domain is attached. This is Vercel domain verification, **not** proof that Clerk's proxy domain has been verified.
- No Production configuration, Preview binding, Neon resource, deployment, rollback, migration, user or role was changed.

### Fresh runtime error evidence and limits

Vercel's seven-day aggregated runtime-error query returned one group:

| Field                        | Observed value                              |
| ---------------------------- | ------------------------------------------- |
| Error                        | `Incomplete Clerk proxy configuration`      |
| Occurrences / affected users | 79 / 39                                     |
| Route                        | `/`                                         |
| First / last seen            | 2026-11-01T22:36:28Z / 2026-11-08T00:13:50Z |
| Last deployment              | `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm`          |

A separate last-30-minute runtime-log query returned no records. The Vercel API notes that Hobby runtime-log retention is limited to one hour; an empty short-window query is not evidence of recovery. Direct public URL reads for `/`, `/health/ready` and `/site-config` were unavailable through the current read-only browser, so this refresh does not claim a fresh HTTP status for those paths. The latest direct HTTP evidence remains the 6 November report of HTTP 500 for the homepage and readiness endpoint. The 7-day aggregate still records the incomplete-proxy error through 8 November, and the missing Production key pair keeps the release at **NO-GO**.

### Review and CI state

- PR #25 remains open and unmerged on `fix/startup-identity-validation-2026-11-02`. Its startup-order code passed [CI run 41399690982](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/41399690982) at head `0dbcc9c`: 276 tests across 21 files, typecheck, build, packaged startup, lint, formatting and disposable PostgreSQL 18 lifecycle/rollback/isolation. The current documentation-only follow-up is being revalidated separately; it does not change runtime code.
- PR #26 remains open and unmerged on `fix/onboarding-provider-failures-2026-11-03`; exact head `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0` passed [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357): 284 tests across 21 files, typecheck, build, packaged startup, lint, formatting and disposable PostgreSQL 18 checks. Logs explicitly record signed synthetic onboarding, persisted account/role denial and separate Employer/Recruiter company-and-assignment isolation. These are synthetic verifier results, not live Clerk/browser acceptance.
- Main remains at `aa8026e`; its combined status reports the Vercel deployment check only. No new Production deployment or main update occurred.

### Phase-document precedence

The current main `docs/PHASE-5.md` correctly labels Phase 5 as historical and records later Phase 6 HTTP and rollback-verification extensions. The separate `phase-5-postgres-verification` branch retains an earlier Phase 5 snapshot and must not supersede main. Main `docs/PHASE-6.md` still contains the 25 October flow-map baseline; PR #26 carries the newer 3–6 November signed-onboarding and role-isolation evidence. Those PR changes remain reviewable but are not yet part of main.

### Figma inspection status

The exact supplied reference is a Figma Make URL. Opening it in the embedded thread succeeded, but the Figma file-session creation rejected Make and the supported screenshot/design-context flow was unavailable. No actual screens, source assets, interactions, variables or design tokens were inspected, and no Figma content was changed. The existing route/API map remains a comparison target, not a verified frame-to-route map. Design discrepancies remain **Unknown**; prototype Stages 1–2 remain preserved.

## Evidence refresh — 9 November 2026

This is a read-only evidence refresh. It does not change Production, Preview, Neon, Clerk, user records, roles, migrations or release authority.

### Current source and deployment records

- GitHub still reports `main` at `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. The canonical Production alias `https://hiredflex-platform.vercel.app` resolves to deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm`, READY from that main SHA. READY is deployment metadata, not runtime or authentication acceptance.
- PR #25 remains open and unmerged at `d7870e0b3592b112db375ebf6444552691255805`. Its latest CI run [42573738602](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42573738602), job `129016706668`, passed 276 tests across 21 files plus typecheck, build, packaged startup, lint, formatting and PostgreSQL 18 verification. The latest READY Preview deployment for this branch is `dpl_Dg4mbTJ6vM2BLbRsAZvBjvFDJiao` from `4d0611ea8e34c3bef258a750d0c31316031496e6`; its [Preview URL](https://hiredflex-platform-6ythqo88t-hired-flex1.vercel.app) is one documentation-only whitespace commit behind the current head. The exact-head comparison shows that `d7870e0` removes one extra blank line from this incident report; no runtime code changed. No Preview deployment for the exact current head was listed at this check. The older `dpl_ALuN5r2utaHyAWJcqLkzkFEk3V4v` Preview from `a7a3785` remains READY but is not the latest branch revision.
- PR #26 remains open and unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. Its Vercel Preview deployment `dpl_EiCG1w4mtwvQHQD9dU6oooMfhX87` is READY from that exact commit; preview URL: [hiredflex-platform-n283jkvkj-hired-flex1.vercel.app](https://hiredflex-platform-n283jkvkj-hired-flex1.vercel.app).
- Direct read-only browser fetches of both Preview roots and readiness paths, plus PR #25 `/site-config`, were not accessible through the available browser. No HTTP 200, readiness, served-key or protected-route result is claimed for these Preview deployments.

### Production environment inventory

Vercel project variables were listed with decryption disabled; only names, types and target scopes were used.

- Production contains `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS`, `DATABASE_URL` and Neon/PostgreSQL integration variables.
- Production contains none of `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`.
- The managed development `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` remain Preview-only.
- Vercel reports `hiddenProductionEnvCount: 0`; the custom-environment inventory is empty. The only verified project domain returned is `hiredflex-platform.vercel.app`. Vercel domain verification is not Clerk proxy-domain verification.
- The available connector cannot enumerate team-level shared variables. An unattached team-level shared variable therefore remains unverified; no IDs or values were guessed or retrieved.

### CI evidence

- PR #25 current head `d7870e0`: [run 42573738602](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42573738602), job `129016706668`, passed. Logs confirm 276 tests across 21 files, typecheck, build, packaged startup, lint, formatting and PostgreSQL 18 verification, including the existing lifecycle, rollback, concurrent-submission and isolation checks. This run follows correction of one extra Markdown blank line found by the preceding format check.
- PR #26 head `3ac6c64`: [run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed. Logs confirm 284 tests across 21 files, the same quality/startup gates, signed synthetic onboarding, persisted account/role denial, Employer/Recruiter company-and-assignment isolation, and the retained PostgreSQL 18 workflow checks.
- These are automated and synthetic database/provider-boundary results. They do not prove live Clerk sign-up, browser sessions, email verification, token renewal/revocation or independent live role journeys.

### Runtime evidence and limits

- The rolling seven-day Vercel runtime-error aggregate returned 59 occurrences affecting 32 users for `Incomplete Clerk proxy configuration` on `/`; first seen 1 November and last seen `2026-11-08T00:13:50Z`, on Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm`.
- The separate 24-hour error aggregate returned no clusters. This is not proof of recovery: the seven-day result still contains the configuration error and the Production Clerk pair remains absent.
- A 24-hour individual runtime-log query was rejected because the Hobby plan does not retain that window (the API recommends a one-hour window). This is an API retention limit, not an empty-log result.

### Figma inspection status

The supplied Figma Make reference opened the embedded thread surface but returned no rendered Make page or frames. The available metadata/screenshot endpoints do not support `/make/` files, and direct web retrieval was inaccessible. Zero actual screens, interactions, variables or design tokens were inspected; zero Figma designs were changed. The existing Phase 6 route/API map remains a comparison target, not a verified frame mapping. Prototype Stages 1–2 remain untouched.

No merge, Production deployment, rollback, credential/configuration change, migration, real-user/role mutation, charge or external communication occurred during this refresh.

## Evidence refresh — 10 November 2026

Read-only evidence refresh; no Production/Preview settings, identity credentials, users, roles, database records, migrations, deployment or release authority were changed.

### Repository and CI

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`.
- PR #25 remains open and unmerged at `dbfafa0eb22434b7a647f5ccbeb4b3846de4c20b`. [CI run 42574037573](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42574037573), job 129017624375, passed on Node 24: 276 tests / 21 files, typecheck, build, packaged startup, lint, formatting and the disposable PostgreSQL 18 verification. The database PASS line includes fresh/rerun migrations, transaction/history rollback and retry, active uniqueness, vacancy locking, concurrent submission, candidate/company isolation and the existing HTTP lifecycle.
- PR #26 remains open and unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job 127745773095, passed on Node 24: 284 tests / 21 files, typecheck, build, packaged startup, lint, formatting and disposable PostgreSQL 18 verification. Its database checks include signed synthetic onboarding, persisted account suspension/role removal, independent Employer and Recruiter identities, company/vacancy-assignment isolation, and the retained lifecycle checks. These are synthetic provider/JWT/database checks, not live Clerk browser acceptance.
- The exact PR #25 head has a READY Preview deployment, `dpl_8h2mEhqWyadBJiGxnkZ7iA2FwLbg`, built from `dbfafa0`. The latest overall Preview deployment listed is a different revision (`dpl_9LXmf2cRDgN7m83TePG9Swp6ZMnC`, commit `d7870e0`); it is not used as exact-head evidence.

### Production configuration and access protection

- Canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` remains READY from main `aa8026e`. READY is deployment metadata, not successful route/authentication acceptance.
- Names/types/targets-only Vercel inventory was repeated with decryption disabled. Production has `CLERK_PROXY_URL` and `AUTH_ALLOWED_ORIGINS`, plus database environment entries, but no Production `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`. The `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` entries remain Preview-only. No values were decrypted. `hiddenProductionEnvCount` is 0. The connector cannot enumerate team-level shared variables, so an unattached shared variable cannot be ruled out.
- Vercel project metadata reports SSO protection enabled with deployment type `all_except_custom_domains`. The attached domains returned are Vercel-managed `.vercel.app` aliases; no custom domain is attached. This is a **potential public-access blocker** for default domains and requires an owner-approved public-access/domain decision. No SSO setting, domain, share link or protection bypass was changed or created.
- Seven-day runtime aggregation currently shows one `Incomplete Clerk proxy configuration` group: 29 occurrences, 21 users, route `/`, last observed 8 November 2026 at 00:13:50 UTC on the Production deployment. The 24-hour aggregation returned no clusters. That absence does not prove recovery; request volume/access may be affected by deployment protection, and live route acceptance was not established.
- A direct read-only browser open of the latest Preview URL was unavailable through the web inspection path. No share link was created to bypass Vercel protection. Do not infer HTTP 200, browser sign-in or public reachability from READY metadata.

### Figma Make inspection

The supplied Make file opened in the embedded Figma thread, but Figma session creation explicitly rejected the file type as unsupported for its file tools. The installed skill list exposed no Figma design-to-code guidance, so the design-context tool was not called without its required guidance. No rendered screens, frames, interactions, source assets or variables were inspected; no Figma content was changed. Visual parity remains **Unknown**. The existing route/API map remains a comparison target, not a verified frame mapping. Completed prototype Stages 1–2 remain preserved.

### Release conclusion

Production remains **NO-GO**. Secure entry of the matching intended-Production Clerk key pair, an owner-approved public-access/domain decision, a separately approved recovery deployment, and real browser sign-in/session plus independent Candidate/Employer/Recruiter acceptance remain outstanding. Privacy/retention, recovery/backup ownership, mobile/accessibility and visual acceptance remain open. Candidate intake remains paused.

## Evidence refresh — 11 November 2026

This is a names/types/targets-only Vercel and repository refresh. Secret values were not requested or decrypted. No Production, provider, database, role, account, or deployment setting was changed.

### Current Production configuration and runtime evidence

- Project-level Production inventory contains `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS`, and `DATABASE_URL`. It contains no Production `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, or `CLERK_SECRET_KEY`. The managed development `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` remain Preview-only. Vercel reports `hiddenProductionEnvCount: 0`; the custom-environment inventory is empty.
- The connector cannot enumerate all team-level shared variables. This project-level result cannot rule out an unattached shared variable; no unknown shared-variable ID was guessed or retrieved.
- The canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` remains READY from main `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. Direct read-only browser requests to the root and `/health/ready` were unavailable in this run, so no fresh HTTP status is claimed.
- Vercel's latest runtime-error aggregation reports one `Incomplete Clerk proxy configuration` occurrence affecting one user in the last 24 hours, and 26 occurrences affecting 18 users over seven days, route `/`; the last observed event was 10 November 2026 at 08:09:58 UTC. A declining count or lack of a newer event is not proof of recovery while the live-key pair remains absent.

### Current code and CI evidence

- Main remains `aa8026e`. Its `src/app.ts` and `src/server.ts` still construct the database client before validating identity configuration.
- PR #25 remains open and unmerged against main. Its bounded code fix validates identity before database-client construction and retains fail-closed behaviour. The latest completed CI before the 11 November documentation-only refresh was run [42970540874](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42970540874) on code/docs head `b435bcc`; it passed 276 tests across 21 files, typecheck, build, packaged startup, lint, formatting, and disposable PostgreSQL 18 verification. The READY Preview at `b435bcc` is historical for this branch, not evidence for later documentation commits. The final documentation-only head requires its own CI and Preview result before being marked green. This does not supply missing Production credentials or prove live sign-in.
- PR #26 remains open, unmerged, at head `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. CI run [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests across 21 files and all quality/startup/PostgreSQL gates, including synthetic signed onboarding and persisted Candidate/Employer/Recruiter isolation. These are synthetic JWT/database checks, not live Clerk browser sessions.

### Public access and hosting constraints

- Vercel project metadata reports SSO protection enabled for `all_except_custom_domains`. The attached domains are Vercel-managed `.vercel.app` aliases; no custom domain is attached. This remains a potential public-access blocker. No SSO setting, bypass, share link, domain, or DNS record was changed.
- The Vercel project metadata does not expose the team's current subscription plan. Vercel's [Terms of Service](https://vercel.com/legal/terms) and [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines) restrict Hobby to personal/non-commercial use. Because HiredFlex's intended model includes employer/partner revenue, confirm the actual plan and permitted hosting arrangement before a commercial pilot. This is a conditional provider-terms gate, not a claim that the account is on Hobby or a legal opinion. No upgrade, purchase, or paid resource was initiated.

### Figma and privacy boundary

- The exact Figma Make reference opened in the embedded thread, but the Make file is unsupported by the available session/screenshot/metadata inspection path. Zero rendered screens, interactions, variables, or design tokens were inspected; zero designs were changed. Visual parity remains Unknown and the existing Phase 6 route/API table remains comparison targets, not frame mappings.
- Saved Candidate Data Retention Policy Draft 0.3 remains not effective, with no effective date and the responsible-party/legal-scope questions unresolved. It does not authorise real candidate intake or automated deletion. No real candidate records were accessed or changed.

**Release verdict: NO-GO.** Secure intended-Production Clerk configuration, owner-approved public-access/domain and hosting-plan decisions, a separately approved recovery deployment, live browser/session/independent-role acceptance, and remaining privacy/recovery/mobile/accessibility/design gates are still outstanding. No merge, Production deployment/rollback, live migration, or business/legal commitment is authorised by this evidence refresh.

## Evidence refresh — 12 November 2026

This is a read-only refresh. No provider setting, secret, user, role, database record, migration, deployment or rollback was changed.

### Production configuration and runtime

- Vercel project-level environment inventory was re-read with decryption disabled. Production has `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`; the live Clerk pair remains absent: no Production `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`. The managed development publishable/secret pair remains Preview-only. `hiddenProductionEnvCount` is zero. Team-level shared variables are not enumerable through the available connector.
- The canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` remains READY from main `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. READY does not prove that a function starts or that Clerk sessions work.
- The latest 24-hour runtime-error aggregate returned no errors. The seven-day aggregate reports 14 `Incomplete Clerk proxy configuration` occurrences affecting 13 users on `/`, last seen 10 November 2026 at 08:09:58 UTC. The lower count is not a recovery signal while the required Production key pair is absent.
- Project SSO protection remains enabled for `all_except_custom_domains`. Only Vercel-managed `.vercel.app` aliases are attached; no custom domain is attached. The team plan is not exposed by the project metadata. No public-access protection, domain or hosting-plan setting was changed.
- Direct read-only requests to the latest Preview `/health/live`, Preview `/health/ready` and Production `/health/ready` were not accessible through the available web inspection path. No HTTP status is claimed from those attempts.

### Exact-head engineering evidence

- PR #25 remains open/unmerged at `db71b91c2a74b2d63ace680eb27347305ad562db` against main `aa8026e`. [CI run 42971413050](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42971413050), job `130360513992`, passed all listed steps: install, typecheck, build, packaged startup, lint, formatting, 276 tests across 21 files and disposable PostgreSQL 18 verification. The exact-head Preview `dpl_HMJsqqTxrvR5rJU5rG7s3vvgBu9B` is READY, but is not live Production acceptance.
- PR #26 remains open/unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed 284 tests across 21 files, signed synthetic onboarding, persisted account/role denial, Employer/Recruiter company-and-assignment isolation, and the existing PostgreSQL 18 lifecycle verification.
- Main `src/app.ts` still constructs the database client before identity validation. PR #25 contains the bounded startup-order fix; it remains branch-only. PR #26 contains the bounded onboarding-provider correction and synthetic persisted-isolation verifier; it remains branch-only. Neither change is in Production.

### Figma and release boundary

The embedded Figma Make view opened, but the required session-creation operation rejected the `/make/` file as unsupported. No frames, rendered screens, interactions or design variables were returned; zero Figma content was changed. The Phase 6 route/API map remains a comparison target, not a verified frame map. Visual parity is Unknown. The saved Draft 0.3 remains not effective and does not authorise real candidate intake or automated deletion.

**Release verdict remains NO-GO.** The owner must securely enter the matching Production Clerk pair and separately approve any exact Production release after scope verification. Public-access/domain and hosting-plan decisions, live browser/session/independent-role acceptance and remaining privacy/recovery/mobile/accessibility/design gates remain open.
