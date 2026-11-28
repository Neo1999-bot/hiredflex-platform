# HiredFlex release evidence — 24 November 2026

This dated snapshot records fresh repository, CI, Vercel and project-document
observations for the approved MVP. It does not authorize a merge, Production
change, credential/configuration change, migration, live-data test, charge, or
business/legal commitment.

## Repository and review state

- Repository: `Neo1999-bot/hiredflex-platform` ; default branch `main` .
- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9` . No main-branch
  change was made in this run.
- PR #1 is closed and merged (25 October 2026); its former head was
  `phase-5-postgres-verification` at `41ef602` . The branch still exists as
  historical evidence; it was not reopened.
- PR #25 remains open, unmerged, based on main and mergeable at
  `211f1f9797654f4df82c4dfb9b7da53268d0f0b3` .
- PR #26 remains open, unmerged, based on main and mergeable at
  `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0` .
- Other existing open work remains in PRs #14, #18, #20, #21 and #22. PR #22
  remains stacked on #21. No duplicate implementation branch was created.
- Vercel-generated PRs #27 (Speed Insights) and #28 (Web Analytics) appeared as
  new draft PRs from `vercel[bot]` . They are not part of the approved MVP work
  in this task and were not changed or merged.

## Exact-head CI evidence

### PR #25 — startup identity validation

- Exact head: `211f1f9797654f4df82c4dfb9b7da53268d0f0b3` .
- GitHub Actions run
  [45123341150](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45123341150)
  completed successfully; job `137521948201` was inspected.
- Node 24 install, typecheck, build, packaged startup verification, ESLint,
  Prettier, tests and `db:verify` all passed.
- Test result: 276 tests across 21 files.
- PostgreSQL 18.7 disposable verifier printed PASS for fresh migrations/rerun,
  constraints, rollback, forced HTTP submission/recruiter-review/withdrawal
  history-write failure rollback and retries, active uniqueness, reapplication
  history, vacancy locking, concurrent submissions, candidate/company isolation,
  closed-vacancy refusal and the HTTP application lifecycle.
- PR #25's code change reads and validates identity configuration once before
  allocating the database client in both `src/app.ts` and `src/server.ts` .
  Startup regression tests assert incomplete/malformed identity fails before
  database allocation and that synthetic secret markers are not emitted. This is
  CI-tested code on the PR branch, not on main.

### PR #26 — signed onboarding/provider boundary

- Exact head: `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0` ; associated GitHub
  Actions run
  [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357)
  is completed successfully.
- The branch fixes Clerk's nullable email-verification shape and bounds provider
  transport/response failures as retryable `IDENTITY_UNAVAILABLE` responses.
- Existing tests explicitly refuse a null verification record, refuse a verified
  secondary address when the primary is unverified, refuse a missing primary
  address, and check provider failures without database writes. The test suite
  is synthetic; this is not live Clerk sign-in or browser acceptance.
- The corresponding defect remains present on main until the PR is reviewed and
  merged by an authorized owner. It was not duplicated.

### Concurrent Vercel-generated PRs

- PR #27 Speed Insights: draft; exact-head CI run
  [45303225756](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45303225756)
  passed.
- PR #28 Web Analytics: draft; exact-head CI run
  [45304542401](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45304542401)
  failed at `npm run format:check` . The job log identifies
  `src/web/analytics.ts` as the formatting failure; tests and PostgreSQL
  verification were skipped. This is outside the current bounded task and was
  left untouched.

## Phase 5 / Phase 6 documentation reconciliation

- On the PR #25 branch, `docs/PHASE-5.md` now explicitly labels the old
  deployment sequence historical and superseded by Phase 6. Its original
  screen-building steps must not be treated as work to rebuild.
- The PR #25 branch's `docs/PHASE-6.md` keeps the application route/API mapping
  separate from Figma frame names and records that Make screens, interactions,
  tokens and visual parity remain unverified.
- These reconciliation changes are on PR #25, not main. Main's release documents
  remain unchanged until an authorized merge.
- The old `phase-5-postgres-verification` branch and merged PR #1 are
  historical, not active implementation tasks.

## Vercel and Production observations

- Current Production deployment: `dpl_FNynyLhkrr6QAVNtK3X7Y8MDdkj3` , READY,
  target Production, redeployed from main `aa8026e` at 2026-11-24 01:22:55 UTC.
  This redeploy was not initiated by this run and contains no new application
  commit.
- PR #25 Preview: `dpl_6dLKJj72XmKH2E2dmP7MMWNmSHom` , READY, commit `211f1f9` .
  The project's latest deployment record instead points to the Vercel-generated
  PR #28 preview; that is not the approved application release.
- Project SSO protection is enabled for deployments. No temporary share link was
  created and no protection was bypassed.
- A decryption-disabled environment inventory shows Production
  `CLERK_PUBLISHABLE_KEY` metadata last updated 2026-11-24 00:43:57 UTC.
  Production `CLERK_SECRET_KEY` metadata was last updated 2026-11-15 07:30:04
  UTC; `CLERK_PROXY_URL` was last updated 2026-10-31. No secret values were
  retrieved, decrypted or validated. The inventory is metadata only.
- Runtime error aggregation: the 24-hour window contained 8
  `Invalid Clerk publishable key` occurrences affecting 7 users, last seen
  2026-11-24 00:42:56 UTC on the prior Production deployment
  `dpl_8DDz71DEgb6qzvF2xV9XCSUzMtWp` . The seven-day window contained 50
  occurrences affecting 22 users.
- Fresh 1-hour and 4-hour runtime-error queries returned no error groups. A
  30-minute error/fatal runtime-log query returned no logs. A 4-hour runtime-log
  query failed because the Hobby plan does not retain logs for that range; that
  failed query is not evidence of no logs.
- The Production publishable-key metadata update and subsequent redeploy are
  promising operational changes, but no successful live
  sign-in/session/refresh/sign-out or browser journey was established. Public
  fetches of `/health/ready` , `/health/live` and `/auth/session` were
  inaccessible through the web fetch path. No authenticated browser test or live
  data mutation was performed.

## Figma

- The supplied Make file key was opened in the embedded Figma view; the
  connected Figma account is present and has a View seat on the Starter plan.
- The installed skill registry returned no available skills. The primary
  design-context tool requires figma-design-to-code guidance before use; no such
  skill URI was available. Make-file metadata/screenshot endpoints do not
  support `/make/` files.
- Therefore zero frames/screens, interactions, design tokens or component
  properties were inspected, and no Figma content was changed. Visual parity
  remains **Unknown** . The Phase 6 route/API table is not a verified frame
  mapping and does not imply synchronization.

## Approved scope and release gates

The saved Master Product Specification and development handover were reviewed.
Preserve prototype Stages 1–2 separately from engineering Phases 5–6. Matching
remains informational, search remains independent, and the application lifecycle
remains intact. Interviews, offers, CV/document uploads, notifications, billing
and automated screening remain deferred.

Must-fix acceptance remains: live Clerk sign-in/session persistence and
sign-out; independent Candidate, Employer and Recruiter browser journeys;
company and recruiter-assignment isolation; authorized Preview/browser
acceptance; Production health/auth acceptance; and completion of the documented
privacy/retention, accessibility/mobile, network-error and operational recovery
gates. No live acceptance is inferred from a READY deployment or green synthetic
CI.

## Actions in this run

- Refreshed repository, branches, all open PRs, relevant source/diffs, CI
  runs/job logs, Phase 5/6/release documents, Vercel deployments/runtime-error
  windows/environment metadata, saved product documents and Figma access.
- No application code, database schema, migration, Production configuration,
  credential, role or candidate record was changed.
- No PR was merged, no Production deployment was triggered, no charge or paid
  resource was incurred, and no external communication was sent.

## Repository access posture

- GitHub repository metadata currently reports visibility **public** . No
  visibility change was made. Confirm this is intentional before storing or
  handling any real candidate information; this run did not perform a
  secret-history scan or inspect credential values.
- The branch listing reports `main` as `protected:false` . The explicit
  branch-protection endpoint returned HTTP 403 to the connected integration, and
  the repository rulesets query returned an empty list. Therefore enforcement
  cannot be conclusively certified from this connection. No write to main was
  attempted; all changes remained on the existing PR #25 branch.
