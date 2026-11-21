# Phase 5 — Runtime verification and deployment preparation

Historical phase purpose: Phase 5 established disposable PostgreSQL evidence before the Phase 6 web/identity increment. Current main already includes those web workspaces and managed identity; production acceptance is still a separate gate. Do not interpret the original deployment sequence below as missing implementation to rebuild.

## Delivered in this increment

GitHub Actions runs the existing quality checks and a PostgreSQL 18 verification script. `npm run db:verify` requires `TEST_DATABASE_ADMIN_URL` pointing to a dedicated test server account with CREATEDB privilege. It deliberately does not fall back to `DATABASE_URL`.

The script creates a randomly named disposable database, applies the checked-in migrations twice, checks their journal count, exercises PostgreSQL normalization and normalized uniqueness, rejects blank skills, preserves legacy requirements, verifies transaction rollback, active application uniqueness and reapplication after withdrawal, and proves a held vacancy row lock blocks opening on a second connection. It closes connections and drops only the database it created.

The Phase 6 increment extends this gate with the HTTP publish/apply/review/shortlist/withdraw/reapply workflow. CI run [37466715604](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/37466715604) passed on 6 October 2026 for PR head `9135397` against base `ad8aab6` (GitHub test merge `7ecc453`). Job `112279480297` records the PostgreSQL 18 PASS line. The verifier now also sends two overlapping HTTP application submissions and checks one application and one initial history event; see RELEASE-GATES.md for scope and current evidence. The 26–28 October verifier increments add forced initial-history, recruiter-review and candidate-withdrawal history failures through HTTP, rollback assertions and clean retries (details below). Shortlist/reject failure injection, withdrawal from other starting states and both requirement/open race orderings remain distinct coverage limits. A green unit suite alone is not evidence that the database gate passed. See the [current release gate review](RELEASE-GATES.md).

## Historical deployment sequence (superseded by Phase 6)

The numbered sequence below records the original Phase 5 handoff and is retained for historical context. Its screen-building steps were delivered in Phase 6; remaining live identity, browser and Production acceptance is tracked in [RELEASE-GATES.md](RELEASE-GATES.md). Do not treat this historical sequence as unimplemented work to rebuild.

1. Run the new PostgreSQL gate in CI and inspect its result.
2. Establish a Vercel project and a separate preview PostgreSQL database. Keep preview and production credentials separate.
3. Configure a verified identity provider and server-side user mapping. Resolve roles from persisted user-role assignments. Never accept roles or candidate IDs from browser headers as trusted identity.
4. Deploy a protected backend preview; verify readiness, unauthenticated denial, company isolation and complete candidate/employer/recruiter workflows.
5. Build candidate sign-in, skill management, vacancy discovery, match explanations and application tracking screens against that API.
6. Add employer and recruiter screens, then run acceptance testing before launch.

Vercel supports native Fastify entrypoints and Node.js 24. See https://vercel.com/docs/frameworks/backend/fastify. The existing entrypoint is `src/server.ts`; confirm framework detection in an actual preview build. Migrations are a release step, never a per-request operation or a production build side effect. Hosting region, database location, connection limits and backup ownership must be established with the chosen resources.

## Knowledge and business tools

GitHub holds code, CI and versioned technical documents. GitBook can publish the reviewed technical handbook when a destination organisation and space exist. Notion holds business milestones and owners; Drive holds member documents; Gmail handles approved correspondence; Calendar holds agreed meetings; Canva holds marketing designs. Connecting these personal tools does not integrate them into the public recruitment application.

## Current access observations

On 3 October 2026, the connected GitBook account returned no organisations, and the connected Vercel account returned no teams. No GitBook space, Vercel project, database resource or deployment was created by this increment. These observations do not prove that a personal Vercel project does not exist.

## HTTP initial-history failure rollback — 26 October 2026

The existing general transaction rollback check did not force a real application route's history insert to fail. The verifier now creates a dedicated synthetic vacancy in its random disposable database, installs a temporary BEFORE INSERT history trigger that raises a deliberate exception and submits through POST `/candidate/applications`. It requires HTTP 500 with only INTERNAL_SERVER_ERROR, zero persisted applications for that candidate/vacancy and zero associated history. A finally block removes the trigger/function; retry must return 201, exactly one Applied history event and exactly one application. The probe vacancy is then closed.

This is test-only SQL inside the existing TEST_DATABASE_ADMIN_URL verifier; no checked-in migration, production principal or application behavior is changed. The verifier still creates/drops only its randomly named database and never falls back to DATABASE_URL. CI run [40283039445](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40283039445) passed for initial-history revision fdea5e1, including PostgreSQL 18. Later revisions require fresh CI. This does not prove live Clerk sessions, production acceptance, history-failure rollback on every transition/withdrawal or all SQL interleavings.

## Recruiter-review history failure rollback — 27 October 2026

The same disposable PostgreSQL HTTP workflow now forces the assigned recruiter's POST `/recruiter/applications/:id/review` history insert to fail. It requires a sanitised HTTP 500, unchanged persisted current_status and updated_at, and an unchanged candidate-visible application/history response. The temporary trigger/function is removed in finally. Retrying must reach Reviewing with exactly the Applied and Reviewing events, with the new event attributed to the recruiter user and fromStatus Applied; the existing shortlist/withdraw/reapply checks then continue.

This closes only the Applied → Reviewing failure-path check when this revision's PostgreSQL CI passes. Shortlist/reject/withdraw failure injection, forced race orderings, independent live identities and production acceptance remain separate evidence gaps. No live database, migration, auth resolver, UI, permission or application lifecycle was changed.

## Candidate-withdrawal history failure rollback — 28 October 2026

The separate candidate withdrawal transaction now has a forced-history-failure check in the same disposable PostgreSQL verifier. From Shortlisted, POST `/candidate/applications/:id/withdraw` must return only the sanitised INTERNAL_SERVER_ERROR response with HTTP 500. Persisted current_status/updated_at and the candidate-visible application/history must remain unchanged. A duplicate submission must still return ACTIVE_APPLICATION_EXISTS (409), proving the failed withdrawal did not free the active application slot.

After finally removes the temporary trigger/function, retry must reach Withdrawn with exactly one new history event from Shortlisted, attributed to the candidate user. Reapplication must create a different application ID and preserve the old withdrawn record and full history. This extends, rather than replaces, the prior submission/review rollback checks. PR #15 is merged; CI run [40593789017](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40593789017), job `122504413284`, passed for head `156f0f8` and explicitly recorded the PostgreSQL 18 withdrawal-history failure rollback PASS. This is retained Phase 5 evidence on main, not a live Clerk or Production acceptance result.

The previous paragraph's withdrawal coverage limit is superseded only for this Shortlisted → Withdrawn path. Other starting states, shortlist/reject failure injection and forced concurrency orderings remain distinct checks. This is synthetic HTTP/database evidence, not live Clerk, browser/Figma or production acceptance. No application behavior, schema/migration, real records or provider settings were changed.

## Phase 5 / Phase 6 evidence boundary — 8 November 2026

The 18 October handover PDF is a historical snapshot. Its statement that the full HTTP lifecycle workflow was unverified predates the later Phase 5/6 PostgreSQL CI evidence recorded above; current repository phase documents and exact CI runs take precedence. Phase 5 owns disposable database, lifecycle, rollback and race verification. Phase 6 owns the web interface and managed identity.

The newer signed-onboarding, persisted account/role denial and Employer/Recruiter company-and-assignment isolation checks are recorded on open PR #26 at head `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`, with CI run [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357). They remain open-PR evidence, not merged main behavior, and synthetic signed-token/PostgreSQL checks do not prove live Clerk browser sessions. Open PRs #18 and #20 are separate verification increments; GitHub currently reports both as non-mergeable against older base `cda8773`, so their passing historical CI does not add their changes to current main.

## Phase 5 / Phase 6 verification refresh — 12 November 2026

The phase boundary remains unchanged: Phase 5 owns disposable PostgreSQL, lifecycle, transaction, rollback and concurrency evidence; Phase 6 owns the web interface, managed identity, onboarding and role-scoped workspaces.

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 is still open against main at `db71b91c2a74b2d63ace680eb27347305ad562db`; exact-head CI [42971413050](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42971413050), job `130360513992`, passed 276 tests across 21 files, Node 24 typecheck/build/packaged-startup/lint/format checks and disposable PostgreSQL 18 verification. The database log records fresh/rerun migrations, constraints, rollback, forced submission/recruiter-review/withdrawal history-write failure rollback and retries, active uniqueness, reapplication history, vacancy locking, concurrent submissions, isolation and the approved HTTP lifecycle.
- PR #26 remains open against main at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; CI [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed 284 tests across 21 files and PostgreSQL 18 verification. Its added synthetic signed-token/database checks cover persisted Candidate onboarding, account suspension/role removal, independent Employer/Recruiter company and vacancy-assignment isolation, foreign/unassigned denial and ignored token role metadata.
- These PR checks remain open-branch evidence, not merged main behavior. Synthetic signed requests do not prove live Clerk browser sessions, refresh, sign-out or real independent account provisioning.
- PR #18 and #20 remain open and non-mergeable against their older `cda8773` base; PR #21 is also open/non-mergeable against that base. PR #22 is stacked on PR #21 and is mergeable only against that branch, not directly against current main. Do not treat their historical checks as current-main acceptance.

The 18 October handover remains historical. The 8 November reconciliation above is retained; this 12 November refresh adds exact current PR-head evidence without changing the Phase 5/6 responsibilities or approved lifecycle.

## Exact-head evidence follow-up — 12 November 2026, 09:06 SAST

This follow-up supersedes only the PR #25 head and CI reference in the earlier 12 November entry. The Phase 5/6 responsibility boundary and accepted application lifecycle are unchanged.

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 is open/unmerged at head `b7299194a54da4526f6d7e31891f7654cd7c0604`. Exact-head CI [43172216302](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43172216302), job `131027953012`, passed all steps: Node 24 install, typecheck, build, packaged startup, lint, formatting, 276 tests across 21 files, and disposable PostgreSQL 18 verification. The database log records fresh/rerun migrations, constraints, rollback, forced submission/recruiter-review/withdrawal history-write failure rollback and clean retries, active uniqueness, reapplication history, vacancy locking, concurrent submissions, candidate/company isolation and the HTTP application lifecycle.
- The same CI log confirms the packaged-startup check rejects incomplete proxy-key configurations before resource construction; it does not supply or validate live Production credentials.
- Exact-head Preview `dpl_B4HeHicvVwJxWE6iPSvyGGqrGBp5` is READY for `b729919`. This is branch Preview evidence, not Production acceptance.
- PR #26 remains open/unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; CI [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed 284 tests across 21 files and the signed synthetic onboarding, persisted account/role denial, Employer/Recruiter company-and-assignment isolation and PostgreSQL 18 checks.
- These are open-branch results. Neither synthetic signed-token/PostgreSQL verification nor a READY Preview proves live Clerk browser sessions, refresh, sign-out or independent live-role acceptance.

## Documentation verification follow-up — 12 November 2026

The code-bearing PR #25 revision `b7299194a54da4526f6d7e31891f7654cd7c0604` passed exact-head CI run [43172216302](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43172216302), as recorded above. A subsequent documentation-only evidence commit `2a55c6baaddac4f2f40b43d1b491432eaab64b7e` updated the Phase 5/6 and release evidence. Its first exact-head CI run [43173891200](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43173891200) passed install, typecheck, build, packaged startup and lint, but failed `format:check` on these four Markdown files. Unit and PostgreSQL steps were skipped by the workflow after the formatting failure. Its Vercel Preview `dpl_7n3v6LC484zLxezQmyroKm4AV7FS` is READY; that does not override the failed CI. The formatting correction is a separate documentation-only revision and must receive its own exact-head CI/Preview checks. Do not carry the predecessor's green CI forward.
