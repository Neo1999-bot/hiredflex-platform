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
- The database's active-application unique index covers `Applied`, `Reviewing`, and `Shortlisted`; terminal applications remain available for audit and do not occupy that active slot. Candidate search and recruitment decision endpoints are not implemented. Matching is limited to the informational requirement comparison described below.

### Current scope limits

Production authentication and deployment are not configured. Candidate profile fields beyond the current identity record and structured skills, and recommendation capabilities, are not implemented.

### Phase 4A: explainable requirement matching

Matching is deterministic and informational. It does not make recruitment decisions, change application status, alter vacancy lifecycle or recruiter ownership, or create applications. The summary uses **“% of listed requirements matched”** when all listed requirements are evaluable, or **“% of evaluable listed requirements matched”** when any are not evaluable; this is not a compatibility or profile score.

The existing `vacancy_requirements` table now has an optional `skill_name`. Its stable ID, vacancy relationship, category, description, required flag, and timestamps remain intact. `required=true` is explained as `REQUIRED`; `false` as `PREFERRED`. New `candidate_skills` records contain a stable ID, candidate relationship, skill name, and timestamps. There is no proficiency weighting or inferred evidence.

Migration `0002_explainable_requirement_matching.sql` is additive and forward-only. It does not backfill skills from old descriptions or change either Phase 3 migration. A legacy requirement with `skill_name = NULL` is NOT EVALUATED. It remains visible only in `notEvaluatedRequirements`, with `matched: null`, `determination: "NO_STRUCTURED_SKILL"`, and `evidence: null`. It counts as neither matched nor missing and enters neither the percentage numerator nor denominator. Missing structured data does not establish missing candidate capability.

Persisted names use the shared PostgreSQL `matching_skill_name_key` function: trim surrounding whitespace and lowercase according to the database collation. Both comparison inputs and uniqueness indexes use that function. PostgreSQL `matching_skill_name_key` remains the canonical persistence/API comparison key. The TypeScript normalization function is a trim/lowercase fallback for domain-level operation and tests; universal Unicode/locale equivalence with PostgreSQL `lower()` is not guaranteed. No fuzzy matching, synonyms, aliases, accent folding, embeddings, CV parsing, external APIs, or AI inference is used. Blank names are rejected. Names are unique after normalization within each candidate or vacancy, including across required/preferred requirements. Different owners may use the same skill name. Defensive duplicate candidate evidence cannot inflate the result; duplicate structured requirements are rejected as invalid data.

The read-only endpoint `GET /candidate/vacancies/:vacancyId/match` resolves the candidate solely from the verified server-side principal. It accepts no candidate identity input and uses the existing candidate visibility rule: only `OPEN` vacancies are visible. Missing candidate profiles or unavailable vacancies return HTTP 404; unauthenticated requests return 401 and non-candidate principals return 403. Matching reads use one repeatable-read, read-only database snapshot.

The three-state model is MATCHED (`matched: true`, exact normalized skill evidence), MISSING (`matched: false`, structured requirement without exact evidence), and NOT EVALUATED (`matched: null`, no structured skill name). Each explanation includes its stable ID, name, category, `REQUIRED`/`PREFERRED` priority, determination, and matching candidate skill ID/name when evidence exists. Exact normalized skill equality produces `EXACT_NORMALIZED_SKILL`; absent evidence produces `NO_EXACT_SKILL_EVIDENCE`. Explanations are sorted by stable requirement ID so repeated reads of unchanged data return identical results.

The response includes `matched`, `totalEvaluable`, `totalListed`, `notEvaluated`, `percentage`, `summary`, `matchedRequirements`, `missingRequirements`, and `notEvaluatedRequirements`, alongside `vacancyId` and `informational: true`. `totalListed` includes every listed requirement; `totalEvaluable` includes only structured requirements; `notEvaluated` counts those without structured skill names.

The canonical formula is `Math.round(matched / totalEvaluable * 100)`. Required and preferred structured requirements count equally. Four matches out of five evaluable requirements produces `80` and `80% of listed requirements matched` when all listed requirements are evaluable. Four matches out of four structured requirements plus one legacy requirement produces `100` and `100% of evaluable listed requirements matched`. Whenever `totalEvaluable === 0`, including empty and all-legacy vacancies, `percentage` is `null` and the summary is `No structured requirements available to compare`. All legacy requirements remain visible in the separate explanation array.

Phase 4A exposes matching reads only. Phase 4B supplies the structured source data through the authorized management routes below; data import and UI are not implemented. Candidate skills are recorded evidence, not an independently verified proficiency assessment. No employer/recruiter matching visibility, ranking, recommendations, or hiring workflow is introduced. PostgreSQL runtime verification remains deferred when no PostgreSQL 18 environment is available; structural tests do not claim database execution.

### Phase 4B: structured skill and requirement management

Candidate routes use the verified server-side principal exclusively:

- `GET /candidate/skills` lists only the candidate's own records, ordered by stable ID.
- `POST /candidate/skills` accepts only `{ "skillName": "JavaScript" }` and returns the created record with HTTP 201.
- `DELETE /candidate/skills/:skillId` removes an owned record and returns HTTP 204. Missing and foreign-owned records both return `CANDIDATE_SKILL_NOT_FOUND` (404).

Employer routes use existing company-scoped Employer role assignments:

- `GET /employer/vacancies/:vacancyId/requirements` lists requirements for an authorized vacancy, including legacy rows, in any lifecycle state.
- `POST /employer/vacancies/:vacancyId/requirements` accepts exactly `skillName`, `description`, `category`, `requirementType` (nonblank strings), and `required` (boolean). It preserves all existing requirement fields and returns the created record with HTTP 201.
- `DELETE /employer/vacancies/:vacancyId/requirements/:requirementId` removes a requirement belonging to the authorized vacancy and returns HTTP 204. Missing or foreign-vacancy requirement IDs return `VACANCY_REQUIREMENT_NOT_FOUND` (404).

Requirement POST/DELETE operations are permitted only in `DRAFT`. `OPEN` and `CLOSED` return `INVALID_VACANCY_REQUIREMENT_STATE` (409). The vacancy row is locked in the mutation transaction using the same row lock as the existing open/close operation, preventing concurrent opening from bypassing the editing rule. The vacancy lifecycle remains `DRAFT → OPEN → CLOSED`.

Foreign-company and missing vacancies both return `VACANCY_NOT_FOUND` (404). Unauthenticated access fails with 401; wrong-role access fails with 403. Recruiter assignments grant no management access. Client-supplied candidate/company ownership, unknown body fields, and query parameters are rejected with `INVALID_REQUEST` (400); request schemas use `additionalProperties: false`. Blank and whitespace-only names are rejected. Display skill names have surrounding whitespace trimmed; category and requirementType remain existing text fields, with no new taxonomy or weighting.

The existing PostgreSQL `public.matching_skill_name_key` expression indexes remain the final normalized uniqueness authority, including concurrent requests. Their uniqueness violations become `CANDIDATE_SKILL_EXISTS` or `VACANCY_REQUIREMENT_EXISTS` (409); no pre-insert duplicate lookup is required and no raw database errors are exposed. REQUIRED/PREFERRED remains the existing `required` boolean. Legacy requirements with NULL skill names remain valid and NOT EVALUATED; no automatic conversion is performed.

Managed records feed the unchanged Phase 4A comparison. Four owned skills matching five structured requirements produce 80%; deleting one matching candidate skill makes the next comparison 60%. Match results are computed read models, not persisted. Matching remains informational and read-only, with no application changes or recruitment decisions. Skills are declared/recorded evidence, not verified proficiency. No update/replace API, import, UI, production authentication, ranking, recommendations, inference, or Phase 4C functionality is added. No schema or migration changes are required. Mock integration tests do not establish live PostgreSQL runtime behavior.

### Phase 4C: explainable candidate vacancy discovery

`GET /candidate/vacancy-matches` requires an authenticated Candidate principal. Candidate identity is resolved only from that verified principal; Employer, Recruiter, and unauthenticated access is denied. Unknown query fields, including ownership identifiers, supplied match counts/percentages, and thresholds, return `INVALID_REQUEST` (400).

Only persisted `OPEN` vacancies are eligible. Discovery is independent of applications: active and terminal applications never remove vacancies from the results. No minimum percentage threshold applies, and zero-match vacancies remain discoverable. Vacancies with no structured requirements also remain visible, with `percentage: null` and `No structured requirements available to compare`.

The response is `{ items: [...], pagination: { limit, offset, returned } }`. Each card contains `vacancyId`, `title`, `location`, `matched`, `totalEvaluable`, `totalListed`, `notEvaluated`, `percentage`, and `summary`. It omits detailed explanation arrays; use the unchanged `GET /candidate/vacancies/:vacancyId/match` for those. Both endpoints reuse the same Phase 4A domain comparison, canonical PostgreSQL comparison keys, equal REQUIRED/PREFERRED treatment, three-state model, formula, and summary wording. Matching remains informational and does not establish overall job suitability.

Display order is evaluable percentage first, percentage descending, vacancy creation date descending, then vacancy ID ascending. Null-percentage vacancies follow all evaluable vacancies and use creation date descending, then ID ascending. This computed display ordering is not an AI recommendation or recruitment decision.

Pagination happens after the complete candidate-specific ordering. `limit` defaults to 20 and must be an integer from 1 to 100. `offset` defaults to 0 and must be a nonnegative safe integer. Invalid or repeated pagination parameters return `INVALID_REQUEST` (400). No total vacancy count is reported. Optional `q` and `location` filters retain public vacancy discovery semantics: case-insensitive PostgreSQL ILIKE substring patterns over title OR description, and location respectively, including the existing `%`/`_` wildcard behavior. Filters are applied before match calculation, ordering, and pagination. No other filters are accepted.

Discovery uses one REPEATABLE READ, READ ONLY transaction. It batches candidate resolution, eligible vacancy reads, owned skill reads, and requirements for eligible vacancies into at most four shared queries, avoiding a query per vacancy. Results are computed on demand from that snapshot: later reads reflect changed source data. No application, status-history, match, recommendation, ranking, or analytics records are written; no score or display order is persisted. No schema/migration changes, production authentication, UI, or Phase 4D functionality are introduced.

Scalability limitation: all filtered OPEN vacancies and their requirements are loaded before sorting and slicing. Responses are bounded to 100 items, but database input size, memory use, and comparison work grow with the filtered vacancy set and candidate skills. Offset pages use separate request snapshots, so source changes between requests can shift page boundaries. Database-double tests do not establish live PostgreSQL 18 execution or collation behavior.
