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

## Application-submission evidence increment — 26 October 2026

The mapped candidate flow remains `/#job/:id` → POST `/candidate/applications` → `/#applications` / `/#application/:id`. No UI, route, permission, matching or lifecycle change is introduced. The PostgreSQL verifier now forces failure of the initial history write through that existing route, requires no persisted application/history, removes the temporary fault and requires a clean one-record/one-Applied-event retry. See PHASE-5.md for scope; current feature CI supplies execution evidence. The failure response must not disclose the injected database error.

Figma check today used the exact Make file xNiwwAOZfsOz5tjWHEDmeK. get_design_context returned source-file resource links, not a rendered screenshot; create_session and get_screenshot rejected the Make file type. The returned source-file contents were not read in this run. **Zero rendered Figma screens inspected and zero designs changed.** Existing user-export mappings remain dated evidence, not a fresh live-visual comparison or automatic sync. No design discrepancy is newly asserted; this increment concerns persisted application/history behavior, which prototype screens cannot prove.

Read the opening architecture/verification sections of saved HiredFlex_Development_Status_and_Handover_18_October_2026.pdf. Its old main/PR #1 state is explicitly historical and superseded by current GitHub main cc97337 and PR #14's open recovery record. The current runtime read-only check and any unavailable evidence must not be silently replaced by that older handover.

## Recruiter review evidence increment — 27 October 2026

The existing recruiter screen `/#review/:vacancyId` loads GET `/recruiter/vacancies/:vacancyId/applications`; its Review action calls POST `/recruiter/applications/:applicationId/review`. Candidate `/#application/:applicationId` reads GET `/candidate/applications/:applicationId`. The verifier now checks that a forced review-history failure changes neither persisted status/timestamp nor the candidate-visible record/history, and that retry adds exactly one Reviewing event with correct attribution. PHASE-5.md records the disposable-database scope and retained limits. No screen, component, token, API contract or approved interaction changes.

Fresh exact-file Figma Make context again returned source links without a rendered screenshot; session and screenshot tools reject Make files. Zero rendered Figma screens inspected or changed, and no new visual discrepancy asserted. Existing export mappings remain the visual evidence; this database test does not verify prototype fidelity or production persistence. Saved 18 October handover pages 6–8 were read: their Phase 5/6 contradiction and requested history-rollback coverage are historical evidence, not current release status. Main remains cc97337; existing PR #15 is extended rather than duplicated, and production recovery remains separate in PR #14.

## Withdrawal evidence increment — 28 October 2026

Candidate `/#application/:applicationId` reads GET `/candidate/applications/:applicationId`; its existing Withdraw action calls POST `/candidate/applications/:applicationId/withdraw`. The verifier now forces this route's history write to fail and requires unchanged status/timestamp, unchanged visible application/history and continued active-duplicate refusal. Retry must add exactly one attributed Withdrawn event; a new application must retain the old application's terminal history. See PHASE-5.md for the disposable-data scope, exact starting state and execution limits.

The exact linked Figma Make file was rechecked: design context returned source links without a rendered screenshot, while session creation rejects Make files. No source-link contents or rendered Figma screens were inspected in this increment; no prototype, UI, tokens or interactions were changed. Previously inspected user exports remain dated visual references. No new design discrepancy or visual-fidelity claim is made. Completed prototype Stages 1–2, independent search/informational matching and accepted lifecycle boundaries remain preserved; this change tests existing persisted behavior only.
