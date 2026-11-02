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
