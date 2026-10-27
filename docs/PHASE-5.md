# Phase 5 — Runtime verification and deployment preparation

Historical phase purpose: Phase 5 established disposable PostgreSQL evidence before the Phase 6 web/identity increment. Current main already includes those web workspaces and managed identity; production acceptance is still a separate gate. Do not interpret the original deployment sequence below as missing implementation to rebuild.

## Delivered in this increment

GitHub Actions runs the existing quality checks and a PostgreSQL 18 verification script. `npm run db:verify` requires `TEST_DATABASE_ADMIN_URL` pointing to a dedicated test server account with CREATEDB privilege. It deliberately does not fall back to `DATABASE_URL`.

The script creates a randomly named disposable database, applies the checked-in migrations twice, checks their journal count, exercises PostgreSQL normalization and normalized uniqueness, rejects blank skills, preserves legacy requirements, verifies transaction rollback, active application uniqueness and reapplication after withdrawal, and proves a held vacancy row lock blocks opening on a second connection. It closes connections and drops only the database it created.

The Phase 6 increment extends this gate with the HTTP publish/apply/review/shortlist/withdraw/reapply workflow. CI run [37466715604](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/37466715604) passed on 6 October 2026 for PR head `9135397` against base `ad8aab6` (GitHub test merge `7ecc453`). Job `112279480297` records the PostgreSQL 18 PASS line. The verifier now also sends two overlapping HTTP application submissions and checks one application and one initial history event; see RELEASE-GATES.md for scope and current evidence. The 26–27 October verifier increments add forced initial-history and recruiter-review history failures through HTTP, rollback assertions and clean retries (details below). Other transition/withdraw history-write failures and both requirement/open race orderings remain distinct coverage limits. A green unit suite alone is not evidence that the database gate passed. See the [current release gate review](RELEASE-GATES.md).

## Deployment sequence

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
