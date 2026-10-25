# HiredFlex release gates — 25 October 2026

Release remains blocked. This review preserves the approved Phase 3/4 lifecycle and Phase 5/6 scope. Interviews, offers, uploads, messaging, billing and automated screening remain outside this release.

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

## Remaining gates and ownership

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

Additional integration coverage can be added within existing boundaries for history-write failure rollback, both requirement/open race orderings and concurrent HTTP submissions. Existing smoke coverage must not be described as proving those cases.

## Preview company-role provisioning — 25 October 2026

A direct read-only audit of hiredflex-preview found one active mapped candidate user and no company, employer, recruiter or company-role records. After the owner explicitly approved using the existing account for both roles, an isolated HiredFlex Preview Test Company was created and company-scoped Employer and Recruiter roles were provisioned atomically, with employer/recruiter records. The existing Candidate assignment was preserved; no global company role or administrator permission was granted. The SQL console was restored to read-only mode.

A post-write query returned exactly Candidate (global), Employer (test company), and Recruiter (test company). Live sign-in then displayed both workspace tabs. Employer opened successfully with the test company selected in the vacancy form; Recruiter opened successfully with the expected no-assigned-vacancies state. Candidate sign-out was also verified before switching sessions.

This supersedes the missing-company-role prerequisite above for single-account preview testing. Populated lifecycle acceptance, new-account onboarding, mobile/Figma comparison and production gates remain open. Because both company roles share one test identity, these checks do not prove separation between independent employer/recruiter users or cross-company isolation. Production data and configuration were not modified.
