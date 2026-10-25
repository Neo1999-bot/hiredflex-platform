# HiredFlex release gates — 25 October 2026

Release remains blocked. This review preserves the approved Phase 3/4 lifecycle and Phase 5/6 scope. Interviews, offers, uploads, messaging, billing and automated screening remain outside this release.

## Owner acceptance and menu follow-up — 25 October 2026

Neo reported that the guided new-candidate-account test succeeded and added skills were still present after signing back in. No email address, token, screenshot or candidate record was requested or inspected for that report. Do not infer that unmentioned isolation/duplicate-email checks passed.

Neo also reported that the open header Menu remained expanded when navigating to My workspace. This was reproduced in local Chromium against development head `2066e08`. The targeted fix closes the native disclosure on internal-link activation (including the current route) and at the start of route rendering, preserving native summary keyboard operation and route focus behavior. Completed prototype Stages 1–2 and all API/lifecycle behavior are unchanged.

Local Chromium verification of the fix covers mobile/desktop navigation outside the menu, menu links, same-route links, keyboard activation, browser Back and native toggling. This is public local UI evidence, not new live-provider or database verification. The owner-reported preview result predates this menu fix; fresh deployment evidence belongs to the fix PR.

## Expanded delivery mandate

The owner added six workstreams on 25 October 2026: application completion, domain/publishing, business-registration preparation, ThothFlex, partner development and gated TVET adoption. They are tracked in [THOTHOS-OPERATING-MANDATE.md](THOTHOS-OPERATING-MANDATE.md); domain tool results are in [DOMAIN-SHORTLIST.md](DOMAIN-SHORTLIST.md). This is additive scope for planned increments and preserves the current release boundaries and unchecked gates below. It does not mean Airtable, WhatsApp integration, CV tracking, ThothFlex, registration, outreach or the college pilot is complete.

## Current release checklist

This is the authoritative checklist after the live preview acceptance run on 25 October 2026. The dated sections below preserve earlier evidence and are historical snapshots.

- [x] CI quality gates: 205 tests, TypeScript, build, lint, format, packaged startup and disposable PostgreSQL 18 verification. [Run 40152052945](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40152052945) passed for code/documentation head `00485d5`.
- [x] Live preview readiness and configured exact preview origin.
- [x] Actual preview database PostgreSQL 18.6, four migration-journal entries; server max_connections reports 112. This is not a capacity/load-test guarantee.
- [x] Existing-account Clerk sign-in, reload persistence and sign-out.
- [x] Candidate, company-scoped Employer and company-scoped Recruiter navigation and API access.
- [x] Employer creates a DRAFT and saves REQUIRED/PREFERRED structured requirements.
- [x] Recruiter assignment persists; DRAFT → OPEN publication locks the requirement-editing UI.
- [x] Published vacancy appears in candidate discovery.
- [x] Candidate skill addition and removal; the test-added skill was removed afterwards, restoring the original empty skill profile.
- [x] Live match display: one of two structured requirements gives 50%, with the matched Technical Support skill and deliberately missing Preview Missing Skill listed separately; informational wording remains visible.
- [x] Application submission creates Applied and initial history.
- [x] Active duplicate submission is rejected with the explanatory UI message.
- [x] Assigned recruiter transitions Applied → Reviewing → Shortlisted; candidate sees all history events.
- [x] Candidate withdrawal yields terminal Withdrawn and preserves history.
- [x] Reapplication creates a new application while preserving the withdrawn record.
- [x] Recruiter rejection yields terminal Rejected on the second test application.
- [x] OPEN → CLOSED removes the test vacancy from discovery. No test vacancy remains open.
- [x] Foreign-company vacancy access is hidden with HTTP 404, confirmed from Vercel request-completion logs.
- [x] Recruiter access to an unassigned vacancy is hidden with HTTP 404, confirmed from Vercel request-completion logs.
- [x] Owner-reported new candidate account test passed on 25 October: skills persisted after signing out and signing back in. This is owner-reported browser evidence, not an independently observed provider/database trace.
- [ ] Remaining identity checks: duplicate-email support behavior, explicit verified-primary-email evidence and cross-account visibility/independent Employer/Recruiter isolation.
- [ ] Complete browser edge cases: direct closed-vacancy submission, direct requirement-mutation rejection, and live empty/all-legacy match rendering. Automated CI covers relevant domain/API/database rules; UI-only locking is not proof of direct API rejection.
- [ ] Mobile viewport acceptance and full browser network/error audit.
- [ ] Rendered Figma comparison; the Make reference is not renderable by the available connector and was unavailable in the cloud browser.
- [ ] Production database, live Clerk setup/branding, exact production origin, migration verification and production acceptance. Production still runs older main; this PR is unmerged.
- [ ] Backup/restore ownership, tested restoration, capacity/connection-budget validation and chosen deployment/database regions.
- [x] Owner-approved interim support/privacy contact: neomarothi.nfm@gmail.com; published in the preview footer and privacy page.
- [ ] Owner approval and implementation of [candidate-data retention draft](RETENTION-POLICY-DRAFT.md), including legal scope, request handling and provider/backup deletion.
- [ ] Final review, merge and production release after the gates above pass.

## Welcome/employer follow-up (separate development branch)

The owner supplied 21 additional welcome/employer/footer screenshots on 25 October 2026. Their static visual references were inspected and mapped in [EMPLOYER-SCREEN-REVIEW.md](EMPLOYER-SCREEN-REVIEW.md). This increment adds public welcome/services/how-it-works/employer-access/support destinations, grouped footer/menu links and employer overview/vacancies/applicants/read-only pipeline/company/access views using existing APIs. No interview/offer/placement state or public company-role signup was added.

Local checks passed: 215 tests, typecheck, lint, build, startup and formatting. A local Chromium rendering check passed public routes/source filtering at 393px, the six employer tabs with explicit synthetic identity/API fixtures, and the welcome page at 1280px; it observed no page JavaScript errors or horizontal overflow. Skip-link keyboard focus/navigation was checked. This supersedes missing local screenshot-reference evidence for those visible states, not the remaining real-provider, independent-user, full accessibility, production or complete Figma fidelity gates. Fresh CI evidence must be attached to the reviewable PR before acceptance. No main merge, live migration or production release occurred.

## Live preview acceptance evidence

The labelled test vacancy followed DRAFT → OPEN → CLOSED. Its two test applications finished Withdrawn and Rejected; a read-only database query confirmed two applications and six status-history events. A second closed vacancy in the test company had no assigned recruiter, and a closed vacancy in a separate isolation-fixture company had no company membership granted to the test user. Both isolation requests returned 404. The SQL console was restored to read-only mode. All fixtures are explicitly marked PREVIEW TEST; no external recruitment communication or real hiring decision occurred.

The tests exercised the real Clerk session and persisted database through browser controls, not injected test principals. They used one identity holding the three approved roles, so independent-user/session isolation and fresh-account onboarding remain separate gates. Production settings/data were not changed.

## Source evidence

- [PR #1](https://github.com/Neo1999-bot/hiredflex-platform/pull/1) was open and unmerged at review; head `9135397dc56d7b9e922eabe98ade288cdffe561d`, base `ad8aab68918cca783c3ed4245930019c520d7b4c`.
- Its only discussion entry was the Vercel bot preview comment, last updated 6 October 2026. It reports Ready, not acceptance or production readiness. No human review approval or acceptance evidence was returned.
- [CI run 37466715604](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/37466715604), job `112279480297`, passed on 6 October. It checked GitHub's test merge `7ecc45334f6f53343e8287639ca2726561af7eed`. The logs record 205 tests and passing typecheck/build/lint/format, followed by PostgreSQL 18 migrations, rerun, normalization, constraints, rollback, active uniqueness, reapplication, vacancy locking and HTTP workflow verification.

That closes the previously unconfirmed PostgreSQL CI gate for that revision. New commits require fresh CI; old results do not certify changed dependencies or deployment configuration.

## Changes from this review

- Fixed `npm start`: TypeScript emits `dist/src/server.js`, but the script referenced nonexistent `dist/server.js`. Reproduced MODULE_NOT_FOUND before the fix.
- Added `npm run verify:startup` and made CI run it after build. It launches the actual packaged Node start arguments, checks liveness, the public HTML/CSS/JS and disabled-auth configuration, and checks forged credentials receive 401 on candidate/employer/recruiter endpoints. It uses a deliberately unreachable local database and empty identity configuration; it cannot contact production. It terminates its child server.
- Updated the lockfile with compatible dependency fixes using `npm audit fix`; the resulting audit reported zero known vulnerabilities. No dependency ranges or domain behavior changed.
- Added private Clerk/origin configuration pointers to `.env.example` and corrected the stale Phase 5 coverage statement.

Local checks: 205 tests, typecheck, build, lint, formatting and startup verification pass. The startup check is HTTP/process evidence, not browser or live identity evidence.

## Runtime follow-up after team consent

On 25 October 2026, Vercel team access succeeded. The latest Ready preview was deployment `dpl_BM72WsMSecG9sQRUTjBcJxMfsN1S`, built from code commit `5e3e183f1b47f0a9cf918c2202aae58f6bb6647d`, Fastify on Node.js 24, function region `iad1`.

- [CI run 40150157809](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40150157809) completed successfully for that code revision, including 205 tests, all quality checks, packaged startup and PostgreSQL 18 db:verify. This closes the updated-code CI gate.
- The stable preview alias returned HTTP 200 for `/health/ready` with `status: ready`, `/site-config` with `authenticationEnabled: true`, and the root HTML.
- Environment metadata confirms DATABASE_URL and AUTH_ALLOWED_ORIGINS are Preview-only. AUTH_ALLOWED_ORIGINS equals the exact stable preview origin. Clerk publishable and secret variables target Preview and Production. Secret values were not retrieved.
- The served publishable key is a Clerk test key; the live sign-in dialog identifies the app as `clerk-canary-magnet` and Development mode. These observations do not establish a production identity setup.
- A normal browser session accessed the protected preview without a public share link. The homepage, vacancy search empty state, Clerk dialog, existing candidate workspace, skills empty state and applications empty state rendered. Successful sign-in was verified from the signed-in workspace, then verified again after a page reload. This confirms access to an existing mapped candidate; new-account registration/onboarding was not exercised.
- A direct browser request to `/employer/vacancies` without a bearer token returned the UNAUTHENTICATED error payload. This is not evidence of signed-in cross-company or wrong-role denial.
- Browser logs showed Clerk's development-key warning and browser-extension metadata errors. No application JavaScript failure was observed during the pages checked; this is not a complete network/error audit.
- Figma Make source links remain accessible through the connector, but its screenshot tool rejects Make files. The cloud browser returned Site Unavailable for the supplied Figma reference; visual comparison remains blocked in this browser.
- A share-link request was rejected by automatic approval review because such a link can expose the protected deployment to anyone holding it. Browser checks proceeded through normal authenticated access instead; no protection setting was weakened. No share link is included in project documentation.

## Earlier release-gate snapshot (superseded by current checklist)

| Gate                              | Current evidence/status                                                                                        | Next action                                                                                                                                                                          | Access needed                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Preview configuration             | Access verified; preview DB/origin keys exist; readiness passes                                                | Confirm the migration journal, DB version, connection limits and backup ownership with database read access                                                                          | Database/operator access; Vercel team consent is complete                                                |
| Clerk identity                    | Existing candidate sign-in and reload persistence passed in development mode                                   | Test new verified-email registration/onboarding, duplicate-account handling and sign-out; confirm intended Clerk application branding and separate production instance configuration | User completes account/email/MFA challenges; operator handles provider configuration                     |
| Company permissions and lifecycle | CI HTTP workflow passed with script-only test principals; live preview has no open vacancies                   | Use approved preview employer/recruiter accounts to test publishing, assignment, application/review transitions and company isolation                                                | Approved company-role test accounts; do not self-promote the candidate account                           |
| Browser acceptance                | Desktop homepage, search empty state, sign-in, candidate workspace, skills and application empty states passed | Complete populated workflows, mutation/error cases, sign-out and mobile viewport acceptance                                                                                          | Usable browser is now available; real account challenges still need the user                             |
| Figma comparison                  | Connector cannot render Make; browser reference returns Site Unavailable                                       | Obtain a rendered reference/export or accessible prototype and compare existing screens                                                                                              | Accessible rendered Figma reference; no redesign authorized                                              |
| Production configuration          | DATABASE_URL and AUTH_ALLOWED_ORIGINS have no Production target; deployed preview uses test Clerk identity     | Provision/identify separate production DB and live identity; set exact production origin; verify migrations, region, connection limits and backups                                   | Owner/provider choices and production resource access; never copy preview DB credentials into Production |
| Privacy/support details           | Existing page has no confirmed retention period or dedicated support contact                                   | Owner supplies retention and support contact; implement approved wording before real candidate invitations                                                                           | User/business owner decision                                                                             |
| Merge/release                     | PR remains open; production acceptance incomplete                                                              | Review diff and current CI, then complete remaining release gates before launch                                                                                                      | Maintainer/release decision                                                                              |

## Acceptance sequence after access

1. Use a separate preview database. Confirm readiness and expected migration journal without running destructive verification against the application database. `db:verify` requires its own dedicated test server account.
2. Sign up with a verified primary email; explicitly onboard; reload and confirm the same identity/profile persists. Sign out; protected endpoints must deny access. A candidate cannot grant themselves Employer/Recruiter through payloads or token metadata.
3. An approved employer creates a DRAFT, adds structured REQUIRED/PREFERRED requirements, assigns an approved recruiter, then opens it. Requirements must lock after opening; foreign-company access must fail.
4. A candidate adds skills, inspects matched/missing/not-evaluated explanations, applies and sees initial history. An active duplicate must return conflict. Check empty and all-legacy comparisons retain null percentage.
5. The assigned recruiter reviews and shortlists/rejects; an unassigned recruiter must be denied. The candidate tracks history, withdraws and reapplies where permitted. Closing the vacancy prevents new submissions.
6. Repeat the existing screens on desktop/mobile; check navigation, validation, error/empty states, sign-in transitions and console/network failures. Compare those screens with Figma. Record URL, commit, date, account roles and outcomes without credentials or personal candidate data.

Additional integration coverage can be added within existing boundaries for history-write failure rollback and both requirement/open race orderings. Existing smoke coverage must not be described as proving those cases.

## Concurrent HTTP submission check — 25 October 2026

`scripts/verify-postgres.ts` now starts two candidate application requests together against the disposable PostgreSQL 18 database. It requires exactly one HTTP 201 and one HTTP 409 with `ACTIVE_APPLICATION_EXISTS`, then queries persisted records to require one application in Applied and one initial history event attributed to the candidate user. The existing sequential duplicate rejection and subsequent review/shortlist/withdraw/reapply workflow remain covered.

This checks overlapping injected HTTP requests and their database outcome, not browser double-click behavior, live Clerk sessions or production load. Scheduling is not forced at a particular SQL statement, so it does not guarantee both requests passed the pre-insert check before either insert. It uses synthetic data and the script-only principal resolver in a randomly named database; it does not touch preview or production records. Fresh CI evidence is required for this change before treating the new check as passed.

## Preview company-role provisioning — 25 October 2026

A direct read-only audit of hiredflex-preview found one active mapped candidate user and no company, employer, recruiter or company-role records. After the owner explicitly approved using the existing account for both roles, an isolated HiredFlex Preview Test Company was created and company-scoped Employer and Recruiter roles were provisioned atomically, with employer/recruiter records. The existing Candidate assignment was preserved; no global company role or administrator permission was granted. The SQL console was restored to read-only mode.

A post-write query returned exactly Candidate (global), Employer (test company), and Recruiter (test company). Live sign-in then displayed both workspace tabs. Employer opened successfully with the test company selected in the vacancy form; Recruiter opened successfully with the expected no-assigned-vacancies state. Candidate sign-out was also verified before switching sessions.

This supersedes the missing-company-role prerequisite above for single-account preview testing. Populated lifecycle acceptance, new-account onboarding, mobile/Figma comparison and production gates remain open. Because both company roles share one test identity, these checks do not prove separation between independent employer/recruiter users or cross-company isolation. Production data and configuration were not modified.

## Interim contact and retention draft — 25 October 2026

The owner confirmed there is no owned HiredFlex domain yet and approved neomarothi.nfm@gmail.com as the interim public support/privacy contact. It is defined once in src/web/contact.ts and used by the footer and privacy page. A domain mailbox can replace it after delivery and access are verified; a domain purchase alone does not provide email hosting.

[RETENTION-POLICY-DRAFT.md](RETENTION-POLICY-DRAFT.md) proposes an owner-review schedule with distinct operational, test, register, log and backup categories. It accounts for the Employment Services Act section 16 minimum three-year retention for covered private-employment-agency register records, subject to confirming applicability and trigger. It is not an effective policy, does not activate purges, and does not close the retention implementation gate. No existing record is deleted by this change. All proposed operational periods require owner approval and legal-scope validation.

## Intake/privacy scope update — 25 October 2026

Owner confirms formal WhatsApp and Google Forms intake has not started. Existing WhatsApp vacancy group of 300+ is owner-reported community context, not a consented intake database. Airtable schema evidence does not establish populated candidate records. Google Forms is deferred; a manual private WhatsApp pilot is prepared in WHATSAPP-INTAKE-PLAN.md, with no activation or external messages.

RETENTION-POLICY-DRAFT.md v0.2 adds conditional operational rows and provider, minimisation, access, consent-version, Information Officer registration and incident-response requirements. The schedule is not effective and no deletion runs. Before real intake, approve the actual notice/scope, register the appropriate officer, confirm operators/providers, complete the synthetic QA/delivery and privacy checks, and resolve applicable candidate-fee/service boundaries as recorded in REGISTRATION-PREPARATION.md. These documentation additions do not tick implementation or production gates and do not expand the platform's accepted stages.
