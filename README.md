# hiredflex-platform

HiredFlex recruitment and career development platform — connecting candidates, employers, and recruiters through explainable matching, assessment, development, and placement workflows.

## Phase 3 engineering foundation

This repository contains the production backend foundation. It does not contain the Stage 1 or Stage 2 user interface or prototype data.

### Selected stack

- TypeScript on Node.js 24 LTS
- Fastify REST API in a single modular application
- PostgreSQL 18 with Drizzle ORM and checked-in SQL migrations
- Vitest for automated tests
- ESLint and Prettier for code checks and formatting

Hosting is intentionally not configured until the hosting provider, region, and operational requirements are approved.

### Local setup

Requirements: Node.js 24 and a PostgreSQL 18 instance. Create a local database, copy `.env.example` to `.env`, and replace the placeholder in `DATABASE_URL` with the local connection string. `.env` is ignored by Git.

```sh
npm ci
npm run db:migrate
npm run dev
```

The API listens on `HOST` and `PORT` (defaults: `127.0.0.1:3000`). `GET /health/live` checks that the process responds; `GET /health/ready` also checks the database connection.

### Phase 3 workflow API

The backend exposes deterministic vacancy discovery at `GET /vacancies` and `GET /vacancies/:id`; both return only `OPEN` vacancies. Optional `q` and `location` filters search persisted vacancy title, description, and location fields.

Implemented workflow routes:

- Candidate: `GET /candidate/profile`, `GET /candidate/applications`, `GET /candidate/applications/:id`, `POST /candidate/applications`, `POST /candidate/applications/:id/withdraw`.
- Employer: `GET /employer/vacancies`, `GET /employer/vacancies/:id`, `GET /employer/vacancies/:vacancyId/applications`, `POST /employer/vacancies`, `POST /employer/vacancies/:id/open`, `POST /employer/vacancies/:id/close`.
- Recruiter: `GET /recruiter/vacancies/:vacancyId/applications`, `GET /recruiter/applications/:applicationId`, and `POST /recruiter/applications/:applicationId/{review|shortlist|reject}`.

Candidate routes provide the available profile record, application list/detail, application submission, and withdrawal. Submission accepts only a vacancy ID, starts at `Applied`, records initial history in the same transaction, and relies on the active-application unique index to resolve concurrent duplicates. A prior `Rejected` or `Withdrawn` application remains intact; a permitted reapplication creates a new row. Withdrawal changes an active application to terminal `Withdrawn` and records history atomically.

Employer routes create vacancies in `DRAFT`, list and retrieve vacancies for assigned company memberships, open and close them through `DRAFT → OPEN → CLOSED`, and list their vacancy applications. Recruiter routes list and retrieve applications only for assigned vacancies and transition them through the approved application lifecycle. Application status changes and history writes share a transaction.

Protected routes require a verified server-side principal. This repository still has no login or external identity provider configured; the API defaults to unauthenticated until the hosting integration supplies that principal. Candidate profile data is limited to the candidate fields present in the current schema.

### Development commands

```sh
npm run build
npm run typecheck
npm run lint
npm run format:check
npm test
```

Schema updates require a matching reviewed SQL migration in `src/db/migrations` alongside changes to `src/db/schema/index.ts`. Apply checked-in migrations with `npm run db:migrate`.

### Domain boundaries

- Application states are `Applied`, `Reviewing`, `Shortlisted`, `Rejected`, and `Withdrawn`. `Applied`, `Reviewing`, and `Shortlisted` are active; `Rejected` and `Withdrawn` are terminal. Every withdrawal transition is recorded in status history. The transition graph is implemented in `src/domain/application/lifecycle.ts`.
- Vacancy states are `DRAFT`, `OPEN`, and `CLOSED`. Only `OPEN` permits application submission. Vacancy state changes follow `DRAFT → OPEN → CLOSED`.
- Recruiter assignment is vacancy-level. No application-level assignment, recruiter takeover, or reassignment workflow is implemented.
- Company-scoped user-role assignments represent company membership. Authentication is only an integration boundary: no login mechanism or external identity provider is configured. Protected routes must use a verified principal and default to unauthenticated when none is supplied.
- The database's active-application unique index covers `Applied`, `Reviewing`, and `Shortlisted`; terminal applications remain available for audit and do not occupy that active slot. Matching, candidate search, and recruitment decision endpoints are not implemented.

### Current scope limits

Production authentication and deployment are not configured. Candidate profile fields beyond the current identity record and matching/recommendation capabilities are not implemented.
