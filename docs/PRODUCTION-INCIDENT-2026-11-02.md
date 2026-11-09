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
- PR #25 remains open and unmerged at `a7a3785041056ed0223e37337a23ebf3b62a5d2d`. Its Vercel Preview deployment `dpl_ALuN5r2utaHyAWJcqLkzkFEk3V4v` is READY from that exact commit; preview URL: [hiredflex-platform-gcxd5rht3-hired-flex1.vercel.app](https://hiredflex-platform-gcxd5rht3-hired-flex1.vercel.app).
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

- PR #25 head `a7a3785`: [run 42454658781](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42454658781), job `128651000591`, passed. Logs confirm 276 tests across 21 files, typecheck, build, packaged startup, lint, formatting and PostgreSQL 18 verification, including the existing lifecycle, rollback, concurrent-submission and isolation checks.
- PR #26 head `3ac6c64`: [run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed. Logs confirm 284 tests across 21 files, the same quality/startup gates, signed synthetic onboarding, persisted account/role denial, Employer/Recruiter company-and-assignment isolation, and the retained PostgreSQL 18 workflow checks.
- These are automated and synthetic database/provider-boundary results. They do not prove live Clerk sign-up, browser sessions, email verification, token renewal/revocation or independent live role journeys.

### Runtime evidence and limits

- The rolling seven-day Vercel runtime-error aggregate returned 59 occurrences affecting 32 users for `Incomplete Clerk proxy configuration` on `/`; first seen 1 November and last seen `2026-11-08T00:13:50Z`, on Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm`.
- The separate 24-hour error aggregate returned no clusters. This is not proof of recovery: the seven-day result still contains the configuration error and the Production Clerk pair remains absent.
- A 24-hour individual runtime-log query was rejected because the Hobby plan does not retain that window (the API recommends a one-hour window). This is an API retention limit, not an empty-log result.

### Figma inspection status

The supplied Figma Make reference opened the embedded thread surface but returned no rendered Make page or frames. The available metadata/screenshot endpoints do not support `/make/` files, and direct web retrieval was inaccessible. Zero actual screens, interactions, variables or design tokens were inspected; zero Figma designs were changed. The existing Phase 6 route/API map remains a comparison target, not a verified frame mapping. Prototype Stages 1–2 remain untouched.

No merge, Production deployment, rollback, credential/configuration change, migration, real-user/role mutation, charge or external communication occurred during this refresh.
