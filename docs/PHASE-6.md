# Phase 6 — Web interface and managed identity

The root URL now serves a responsive HiredFlex website rather than a route-not-found response. It uses the existing Fastify API on the same origin, with candidate, employer and recruiter workspaces.

## Delivered code

- Public vacancy search and detail; truthful empty states.
- Candidate onboarding, skills, explainable matches, application submission, history and withdrawal.
- Employer company listings, vacancy drafts, structured requirements, publishing/closing, assigned recruiters and applicant lists.
- Recruiter assigned vacancy lists and review/shortlist/reject actions.
- Managed Clerk sign-in UI, signed session verification through `jose`, trusted issuer/origin restrictions, database identity mapping and verified-email candidate onboarding.
- Identity records are separate from email. Existing users are never linked automatically by matching email. Account status and role assignments are loaded from PostgreSQL; token roles and client input cannot grant company access.
- Secrets remain server-side. Requests use bearer session tokens, not locally persisted tokens; authentication headers are redacted from logs.

## Deployment configuration

Apply migration `0003_managed_identity.sql` with the existing migrator. Its Drizzle journal entry follows the original three migrations.

Configure through the Clerk Vercel Marketplace integration:

- `CLERK_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- `CLERK_SECRET_KEY`
- `AUTH_ALLOWED_ORIGINS`: comma-separated exact trusted site origins; no wildcard domains. Add the stable preview alias when testing. Add the production origin before production launch.

Clerk's issuer is derived from the publishable key. Configure verified primary email sign-up in Clerk. When configuration is absent, public browsing works and protected APIs remain inaccessible. This is a configuration state, not a working sign-in deployment.

## Company access

Candidate registration grants only Candidate. An operator with database access must approve company roles. Provisioning is a deliberate administrative action, outside public sign-up. A recruiter needs both a recruiters record and a Recruiter assignment; an employer needs an Employer assignment scoped to its company. Never accept role assignments from browser forms or token metadata.

## Validation and release gate

Local unit tests, typecheck, lint, format and build are required. CI `db:verify` creates a disposable PostgreSQL 18 database, migrates twice and checks constraints/locking plus the actual HTTP publish/apply/review/shortlist/withdraw/reapply workflow. Its test principal resolver exists only inside the verification script, never the deployed server.

Live provider sign-in and browser end-to-end checks remain required after Clerk installation. Production needs its own database/configuration and migration verification. Do not label an unconfigured preview as the completed production platform.

## Figma-to-application flow map

Reference: [HiredFlex prototype](https://www.figma.com/make/xNiwwAOZfsOz5tjWHEDmeK/HiredFlex-%E2%80%94-Stage-1-COMPLETE-%E2%80%94-26-Sep-2026).

This map records application routes and API wiring inspected at commit `623bb092743075075ee63f8e0e78a6b8e49d848a` on 25 October 2026. Flow names identify comparison targets; they are not verified Figma frame names or node mappings. Figma returned source references for `src/App.tsx`, `src/operations.tsx`, `src/recruiter-workspace.tsx` and `src/index.css`, but each resource read failed with `Unknown resource`; the screenshot endpoint also reported that Make files are unsupported. No Figma screen interactions, visual fidelity, design tokens or components were verified, and no Figma content was changed. This is a traceability map, not automatic synchronization.

| Flow to compare                  | Application route                                  | API wiring in `src/web/client.ts`                                                                                                                                          | Remaining acceptance                                                                  |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sign-in and candidate onboarding | `/#workspace`                                      | Clerk sign-in; `GET /auth/session`; `POST /auth/onboard`                                                                                                                   | Verified-email sign-up, returning sign-in, refresh and sign-out in a browser          |
| Candidate skills                 | `/#skills`                                         | `GET/POST /candidate/skills`; `DELETE /candidate/skills/:skillId`                                                                                                          | Persisted add/remove and distinct-candidate isolation                                 |
| Vacancy discovery and details    | `/#jobs`, `/#job/:id`                              | `GET /vacancies`; `GET /vacancies/:id`; `GET /candidate/vacancies/:id/match`                                                                                               | Search behavior, explanations and OPEN-only visibility                                |
| Candidate match overview         | `/#workspace`                                      | `GET /candidate/vacancy-matches?limit=6`                                                                                                                                   | Informational wording; zero and unavailable percentages; no application-state changes |
| Apply, track and withdraw        | `/#job/:id`, `/#applications`, `/#application/:id` | `POST /candidate/applications`; `GET /candidate/applications`; `GET /candidate/applications/:id`; `POST /candidate/applications/:id/withdraw`                              | Complete browser journey, duplicate rejection, retained history and ownership denial  |
| Employer vacancy management      | `/#employer`, `/#manage/:id`                       | `GET /employer/companies`; `GET/POST /employer/vacancies`; vacancy detail, requirements, recruiter assignment, open/close and applications under `/employer/vacancies/:id` | Company isolation, draft-only requirement changes and lifecycle actions in a browser  |
| Recruiter review                 | `/#recruiter`, `/#review/:id`                      | `GET /recruiter/vacancies`; `GET /recruiter/vacancies/:id/applications`; `POST /recruiter/applications/:id/{review,shortlist,reject}`                                      | Assigned-vacancy isolation and recorded decisions in a browser                        |

Exact endpoint definitions remain authoritative in `src/routes.ts` and `src/structured-data-routes.ts`. All rows still need comparison with the actual Figma flow. Existing accepted prototype Stages 1–2 remain preserved; engineering Phase 6 does not authorize their rebuild or expansion into interviews, offers or communications.

### Design comparison status

- **Design discrepancies:** unknown until the referenced Make prototype can be rendered or its returned source resources can be read. Do not infer a visual mismatch or approval from the filename or source-link list.
- **Functional release gaps:** fresh-account onboarding and independent-identity isolation, direct API edge cases, mobile/error/accessibility acceptance and production configuration remain tracked in [RELEASE-GATES.md](RELEASE-GATES.md). These are engineering gates, not inferred Figma defects.

### Next bounded browser acceptance check

Use an authorized disposable preview and synthetic test accounts. Sign in with a verified primary email, onboard, refresh the workspace, and sign out. Pass only when the same candidate account persists across refresh, protected access ends after sign-out and a second candidate cannot retrieve the first candidate's application details. Record the tested commit, preview origin, date, expected/actual results and evidence without tokens, passwords or personal candidate data. A simple successful login does not close the ownership check; if any prerequisite is unavailable, record it as blocked rather than passed.

## Scope

This release covers the approved application lifecycle. Interviews, offers, CV/document upload, WhatsApp/email notifications, billing and automated screening are not part of this release. The privacy page explains the actual stored fields and matching limitations; organisation-specific retention and support details need confirmation before inviting real candidates.
