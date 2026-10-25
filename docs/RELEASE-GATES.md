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

## Remaining gates and ownership

| Gate                          | Current evidence/status                                                                                  | Next action                                                                                                                                                                 | Access needed                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PostgreSQL CI for revised PR  | Earlier head passed; updated revision needs a fresh run                                                  | Inspect updated PR CI, including db:verify and verify:startup                                                                                                               | Agent can inspect through GitHub                                               |
| Preview configuration         | Not inspected: Vercel returned 403 for team `hired-flex1`                                                | Approve the connection's team-access link; inspect the existing project and environment scopes                                                                              | User must complete Vercel team consent; no secrets need to be pasted into chat |
| Clerk live sign-in            | Code and signature tests exist; provider configuration and real sign-in unverified                       | Confirm publishable/secret keys belong to the same instance; exact AUTH_ALLOWED_ORIGINS includes stable preview; test verified-email sign-up, sign-in, refresh and sign-out | Agent can inspect after access; user completes email/MFA challenges            |
| Identity and role persistence | DB workflow CI uses a script-only principal resolver, not live Clerk                                     | Confirm migration 0003 is applied; verify onboarding creates Candidate only; arrange approved company/recruiter test accounts and check company isolation                   | Database/operator access plus approved test roles                              |
| Browser acceptance            | Not completed in this environment: no browser executable; browser download returned invalid ZIP archives | Run mobile/desktop checks with real browser and configured preview; capture console/network evidence                                                                        | Agent can run with usable browser; user handles account challenges             |
| Figma comparison              | Make source links returned; session and screenshot tools reject Make files                               | Compare rendered preview with the Make prototype in a browser or an exported Design reference; document differences in existing screens                                     | Browser/reference rendering required; no redesign authorized                   |
| Production configuration      | Not inspected; Ready preview is insufficient evidence                                                    | Verify separate production database/credentials, migrations, exact production origin, live Clerk instance, region, connection limits, backups and restore ownership         | Vercel/database access; owner supplies business/operational decisions          |
| Privacy/support details       | Existing page describes stored fields but has no confirmed retention period or dedicated support contact | Owner supplies retention and support contact; implement approved wording before real candidate invitations                                                                  | User/business owner decision                                                   |
| Merge/release                 | PR still open; no production acceptance evidence                                                         | Review updated diff and CI, complete the gates above before launch                                                                                                          | Maintainer/release decision                                                    |

## Acceptance sequence after access

1. Use a separate preview database. Confirm readiness and expected migration journal without running destructive verification against the application database. `db:verify` requires its own dedicated test server account.
2. Sign up with a verified primary email; explicitly onboard; reload and confirm the same identity/profile persists. Sign out; protected endpoints must deny access. A candidate cannot grant themselves Employer/Recruiter through payloads or token metadata.
3. An approved employer creates a DRAFT, adds structured REQUIRED/PREFERRED requirements, assigns an approved recruiter, then opens it. Requirements must lock after opening; foreign-company access must fail.
4. A candidate adds skills, inspects matched/missing/not-evaluated explanations, applies and sees initial history. An active duplicate must return conflict. Check empty and all-legacy comparisons retain null percentage.
5. The assigned recruiter reviews and shortlists/rejects; an unassigned recruiter must be denied. The candidate tracks history, withdraws and reapplies where permitted. Closing the vacancy prevents new submissions.
6. Repeat the existing screens on desktop/mobile; check navigation, validation, error/empty states, sign-in transitions and console/network failures. Compare those screens with Figma. Record URL, commit, date, account roles and outcomes without credentials or personal candidate data.

Additional integration coverage can be added within existing boundaries for history-write failure rollback, both requirement/open race orderings and concurrent HTTP submissions. Existing smoke coverage must not be described as proving those cases.
