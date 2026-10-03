# Phase 5 — Runtime verification and deployment preparation

Phase 4C is implemented. Phase 5 starts by establishing live PostgreSQL evidence before adding production identity and candidate screens.

## Delivered in this increment

GitHub Actions runs the existing quality checks and a PostgreSQL 18 verification script. `npm run db:verify` requires `TEST_DATABASE_ADMIN_URL` pointing to a dedicated test server account with CREATEDB privilege. It deliberately does not fall back to `DATABASE_URL`.

The script creates a randomly named disposable database, applies the checked-in migrations twice, checks their journal count, exercises PostgreSQL normalization and normalized uniqueness, rejects blank skills, preserves legacy requirements, verifies transaction rollback, active application uniqueness and reapplication after withdrawal, and proves a held vacancy row lock blocks opening on a second connection. It closes connections and drops only the database it created.

This is a database smoke gate. It does not yet verify full HTTP workflows, history rollback, both requirement/open race orderings, or application concurrency through the API. Those need additional integration coverage. A green unit suite alone is not evidence that this gate passed.

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
