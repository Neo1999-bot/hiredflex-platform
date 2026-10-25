# Candidate / Employer API-to-UI contract — issue #2

Reviewed 25 October 2026. The issue's original backend-only/auth-unwired description is historical: the current development branch contains the same-origin Fastify website, managed Clerk verification and persisted company roles. This contract does not change accepted prototype Stages 1–2, the application/vacancy lifecycle or matching semantics. The issue's “Stage 5A” label is an integration work item, not a renamed prototype stage.

## Runtime and transport

Frontend source: `src/web/client.ts`, `public-pages.ts`, `site.ts`, `styles.ts`. The public script includes the compiled, typed `createApiClient` implementation from `src/web/api-client.ts`; it is not a second independently maintained fetch implementation. Its generic response type is a TypeScript caller contract, not runtime validation of an arbitrary JSON shape.

Every request retrieves the current Clerk session token and sends it only to a validated same-origin API path. Tokens are not persisted in local storage or replaced with fake role/candidate headers. Test principal resolvers exist only in tests/disposable verification. API responses do not make the browser an authority for ownership, status, company roles or recruiter assignment.

| State                  | Client behavior / evidence                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                | Existing render displays Loading; render-version check prevents an older navigation response overwriting a newer page                                            |
| Empty                  | Native vacancy, skill, application, employer and recruiter views have explicit empty states; external records expire rather than claiming perpetual availability |
| 401                    | UNAUTHENTICATED with a sign-in explanation, including non-JSON gateway responses                                                                                 |
| 403                    | FORBIDDEN with a workspace-access explanation; no record data is rendered                                                                                        |
| 409                    | Known server codes preserve duplicate/lifecycle explanations. Unknown bodies use a generic message                                                               |
| Invalid JSON / network | Sanitised INVALID_RESPONSE / NETWORK_UNAVAILABLE rather than raw HTML, endpoint details or parse exceptions                                                      |
| Token refresh failure  | SESSION_UNAVAILABLE; no API request is sent with invented identity                                                                                               |
| 204                    | Successful empty mutations return null; subsequent rendering reloads authoritative state                                                                         |

Clerk verification uses RS256, trusted issuer/JWKS, required exp/nbf/sub/sid/azp and an exact allowed-origin check, and rejects pending sessions. Company roles come from PostgreSQL. The current session configuration does not define a separate custom `aud` claim; do not describe audience checking as implemented. Clerk documents audience as optional and authorized parties as the origin allowlist. If a custom audience is introduced, configure and test it explicitly before acceptance. Sources checked 25 October: <https://clerk.com/docs/reference/backend/verify-token> and <https://clerk.com/docs/guides/sessions/manual-jwt-verification>.

## Native flow mapping

| Screen / flow                  | Route                                              | API contract                                                                                                                              |
| ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in / candidate onboarding | `/#workspace`                                      | Clerk session → GET /auth/session; POST /auth/onboard requires verified primary email and persists Candidate only                         |
| Public search / job detail     | `/#jobs`, `/#job/:id`                              | GET /vacancies with q/location; GET /vacancies/:id; OPEN-only discovery                                                                   |
| Match explanations             | `/#job/:id`, `/#workspace`                         | Candidate match/detail and discovery endpoints; informational matched/missing/not-evaluated, percentage null if no evaluable requirements |
| Candidate skills               | `/#skills`                                         | GET/POST /candidate/skills; DELETE /candidate/skills/:id; candidate ownership comes from verified principal                               |
| Apply / track / withdraw       | `/#job/:id`, `/#applications`, `/#application/:id` | POST /candidate/applications accepts vacancyId only; own list/detail; POST withdrawal; status/history persist transactionally             |
| Employer overview / vacancies  | `/#employer`, `?tab=vacancies`                     | GET /employer/vacancies and /employer/companies; POST DRAFT creation scoped to approved company                                           |
| Manage / publish / close       | `/#manage/:id`                                     | Requirement GET/POST/DELETE (writes DRAFT-only), recruiter assignment and POST open/close                                                 |
| Employer applicants / pipeline | `/#employer?tab=applicants` or pipeline            | GET /employer/vacancies/:id/applications; read-only employer view; no recruiter role escalation                                           |
| Assigned recruiter decisions   | `/#recruiter`, `/#review/:id`                      | Assigned vacancy/application list and POST review/shortlist/reject; server checks assignment and transition rules                         |

Figma identity: <https://www.figma.com/make/xNiwwAOZfsOz5tjWHEDmeK/HiredFlex-%E2%80%94-Stage-1-COMPLETE-%E2%80%94-26-Sep-2026>. Make context uses its root 0:1; stable Design frame/node IDs are unavailable and are not invented. User-supplied screenshot timestamps and visible flows are mapped in FIGMA-SCREEN-REVIEW-2026-10-25.md and EMPLOYER-SCREEN-REVIEW.md. Static samples, CV upload/notes, Interview/Offer and notification screens are not inferred to be delivered API features.

## Verification ledger

- Existing domain/API tests cover duplicate conflict, terminal reapplication, closed-vacancy refusal, role denials, ownership predicates, three-state matching and null percentage. Fakes verify route decisions but do not alone establish SQL isolation.
- Disposable PostgreSQL 18 verifier now uses two independent synthetic user/candidate records and two companies to test hidden foreign application/detail/list access, distinct candidate match data and foreign-company vacancy/applicant access. It also exercises concurrent HTTP submissions, direct closed-vacancy refusal, all-legacy null matching and the retained publish/apply/review/shortlist/withdraw/reapply workflow.
- The test resolver is injected only into that isolated Fastify verifier; no production authentication bypass is added. This verifies HTTP/database ownership predicates, not a new independent Clerk account's onboarding.
- Typed transport tests cover fresh bearer tokens, payloads, same-origin credential confinement, 401/403 with HTML bodies, duplicate errors, 204, network/JSON failures and token refresh failures. Actual generated-client tests exercise error rendering and native/external navigation.
- Earlier 25 October preview evidence records real Clerk sign-in, persisted candidate/employer/recruiter journeys and database results using one approved identity. That evidence is dated and distinct from new-commit tests. Fresh browser/provider checks on the updated preview remain necessary; do not relabel old screenshots as proof of a newly deployed SHA.
- Owner approval in the conversation authorises consolidation of reviewed PRs. PRs #3–6 are merged into development; main/production release remains governed by RELEASE-GATES.md. Vercel's current production target is linked to main at ad8aab6; production DB/origin/live identity are not certified by these merges.

The integration implementation and automated contract gaps can be reviewed separately from public launch. Keep issue #2's remaining live-preview acceptance explicit until the updated deployed SHA, readiness and both dashboards are checked with real sessions. Fresh independent-account onboarding, full accessibility, backups/restore, retention and production setup remain release gates.

## Candidate readiness/profile follow-up — 25 October 2026

`/#profile` is linked from candidate workspace tabs. It loads only the signed-in candidate's existing GET `/candidate/profile` and `/candidate/skills`, alongside current session display name/email. The whole view fails through the standard error renderer on API failure, instead of exposing a partial success or inventing a profile. Wrong-role navigation does not request candidate data; backend ownership remains authoritative. It performs no writes and adds no profile ID inputs, role provisioning, schema, upload or verification API. Saved declarations are explicitly distinct from independently verified qualifications/proficiency, and no readiness percentage or application gate is added.

Local acceptance for this feature: 232 tests pass, plus typecheck, build, lint, formatting and packaged startup. Actual Chromium at 393px and 1280px passed empty/populated profile rendering, keyboard activation, no horizontal overflow and no page JavaScript errors, using clearly synthetic Clerk/API fixtures. Mobile and desktop screenshots were inspected. This is not live-provider/database verification of the new route. Fresh CI/PostgreSQL results must be attached to the feature PR.
