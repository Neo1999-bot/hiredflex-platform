import { buildApp } from "../src/app.js";
import * as schema from "../src/db/schema/index.js";
import type { PlatformRole } from "../src/auth/authorization.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// Use a dedicated test server account with CREATEDB. Never use DATABASE_URL.
const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("TEST_DATABASE_ADMIN_URL is required");
const databaseName = `hiredflex_verify_${randomUUID().replaceAll("-", "")}`;
const admin = postgres(adminUrl, { max: 1, connect_timeout: 5 });
let client: ReturnType<typeof postgres> | undefined;
let created = false;
try {
  const [version] =
    await admin`select current_setting('server_version_num')::int as version`;
  assert.equal(
    Math.floor(Number(version!.version) / 10000),
    18,
    "PostgreSQL 18 required",
  );
  await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
  created = true;
  const testUrl = new URL(adminUrl);
  testUrl.pathname = `/${databaseName}`;
  client = postgres(testUrl.toString(), { max: 3, connect_timeout: 5 });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  const [count] =
    await client`select count(*)::int as count from drizzle.__drizzle_migrations`;
  assert.equal(
    count!.count,
    4,
    "All four migrations apply and reruns are idempotent",
  );
  const [key] =
    await client`select public.matching_skill_name_key(${"\t JavaScript \u00a0"}) as key`;
  assert.equal(key!.key, "javascript");
  const [user] =
    await client`insert into users(email,display_name,account_status) values ('verify@example.invalid','Verifier','Active') returning id`;
  const [candidate] =
    await client`insert into candidates(user_id) values (${user!.id}) returning id`;
  await client`insert into candidate_skills(candidate_id,skill_name) values (${candidate!.id},' JavaScript ')`;
  await assert.rejects(
    client`insert into candidate_skills(candidate_id,skill_name) values (${candidate!.id},'javascript')`,
    { code: "23505" },
  );
  await assert.rejects(
    client`insert into candidate_skills(candidate_id,skill_name) values (${candidate!.id},'\t ')`,
    { code: "23514" },
  );
  const [company] =
    await client`insert into companies(name) values ('Verification') returning id`;
  const [vacancy] =
    await client`insert into vacancies(company_id,created_by_user_id,title,status) values (${company!.id},${user!.id},'Verifier','DRAFT') returning id`;
  await client`insert into vacancy_requirements(vacancy_id,category,description,requirement_type,required,skill_name) values (${vacancy!.id},'Skill','JS','Skill',true,'JavaScript')`;
  await assert.rejects(
    client`insert into vacancy_requirements(vacancy_id,category,description,requirement_type,required,skill_name) values (${vacancy!.id},'Skill','JS','Skill',false,' javascript ')`,
    { code: "23505" },
  );
  await client`insert into vacancy_requirements(vacancy_id,category,description,requirement_type,required) values (${vacancy!.id},'Legacy','Legacy','Skill',true)`;
  await assert.rejects(
    client.begin(async (tx) => {
      await tx`insert into applications(candidate_id,vacancy_id) values (${candidate!.id},${vacancy!.id})`;
      throw new Error("intentional rollback");
    }),
    /intentional rollback/,
  );
  const [rolledBack] =
    await client`select count(*)::int as count from applications`;
  assert.equal(rolledBack!.count, 0);
  await client`insert into applications(candidate_id,vacancy_id) values (${candidate!.id},${vacancy!.id})`;
  await assert.rejects(
    client`insert into applications(candidate_id,vacancy_id) values (${candidate!.id},${vacancy!.id})`,
    { code: "23505" },
  );
  await client`update applications set current_status = 'Withdrawn'`;
  await client`insert into applications(candidate_id,vacancy_id) values (${candidate!.id},${vacancy!.id})`;
  // Deterministically hold the same lock used by requirement mutation. A second
  // connection cannot open this vacancy until that transaction releases it.
  const connection = client;
  await connection.begin(async (tx) => {
    await tx`select id from vacancies where id = ${vacancy!.id} for update`;
    await assert.rejects(
      connection.begin(async (other) => {
        await other`set local lock_timeout = '250ms'`;
        await other`update vacancies set status = 'OPEN' where id = ${vacancy!.id}`;
      }),
      { code: "55P03" },
    );
  });
  await connection`update vacancies set status = 'OPEN' where id = ${vacancy!.id}`;
  const [opened] =
    await connection`select status from vacancies where id = ${vacancy!.id}`;
  assert.equal(opened!.status, "OPEN");
  // Exercise the actual HTTP routes against the disposable PostgreSQL database.
  const [recruiter] =
    await client`insert into recruiters(user_id) values (${user!.id}) returning id`;
  await client`insert into user_roles(user_id,role,company_id) values (${user!.id},'Recruiter',${company!.id})`;
  const [otherUser] =
    await client`insert into users(email,display_name,account_status) values ('other-verify@example.invalid','Other verifier','Active') returning id`;
  await client`insert into candidates(user_id) values (${otherUser!.id})`;
  const [otherCompany] =
    await client`insert into companies(name) values ('Other verification company') returning id`;
  const app = buildApp({
    db,
    checkDatabase: async () => undefined,
    logger: false,
    resolvePrincipal: (request) => {
      const role = request.headers["x-verification-role"] as
        PlatformRole | undefined;
      return role
        ? {
            userId: String(
              request.headers["x-verification-identity"] === "other"
                ? otherUser!.id
                : user!.id,
            ),
            roleAssignments: [
              {
                role,
                companyId:
                  role === "Candidate"
                    ? null
                    : String(
                        request.headers["x-verification-identity"] === "other"
                          ? otherCompany!.id
                          : company!.id,
                      ),
              },
            ],
          }
        : null;
    },
  });
  try {
    const call = async (
      role: PlatformRole | undefined,
      method: "GET" | "POST" | "DELETE",
      url: string,
      body?: object,
      expected = 200,
    ) => {
      const response = await app.inject({
        method,
        url,
        headers: role ? { "x-verification-role": role } : {},
        ...(body ? { payload: body } : {}),
      });
      assert.equal(
        response.statusCode,
        expected,
        `${method} ${url}: ${response.body}`,
      );
      return response.body ? response.json() : null;
    };
    await call(undefined, "GET", "/candidate/skills", undefined, 401);
    await call("Candidate", "GET", "/employer/companies", undefined, 403);
    const draft = await call(
      "Employer",
      "POST",
      "/employer/vacancies",
      {
        companyId: company!.id,
        title: "HTTP workflow verification",
        location: "Johannesburg",
      },
      201,
    );
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${draft.id}/requirements`,
      {
        skillName: "JavaScript",
        description: "JavaScript skill",
        category: "Skill",
        requirementType: "REQUIRED",
        required: true,
      },
      201,
    );
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${draft.id}/recruiter`,
      { recruiterId: recruiter!.id },
    );
    await call("Employer", "POST", `/employer/vacancies/${draft.id}/open`);
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${draft.id}/requirements`,
      {
        skillName: "TypeScript",
        description: "TS",
        category: "Skill",
        requirementType: "PREFERRED",
        required: false,
      },
      409,
    );
    // Force the real route's initial history insert to fail after its application
    // insert. The trigger exists only in this disposable verification database.
    const rollbackDraft = await call(
      "Employer",
      "POST",
      "/employer/vacancies",
      { companyId: company!.id, title: "History rollback verification" },
      201,
    );
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${rollbackDraft.id}/open`,
    );
    await client.unsafe(`
      CREATE FUNCTION verify_reject_history_insert() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION USING ERRCODE = 'P0001',
          MESSAGE = 'synthetic_history_write_failure';
      END;
      $$
    `);
    try {
      await client.unsafe(`
        CREATE TRIGGER verify_history_failure BEFORE INSERT
        ON application_status_history FOR EACH ROW
        EXECUTE FUNCTION verify_reject_history_insert()
      `);
      const failed = await call(
        "Candidate",
        "POST",
        "/candidate/applications",
        { vacancyId: rollbackDraft.id },
        500,
      );
      assert.deepEqual(failed, { error: { code: "INTERNAL_SERVER_ERROR" } });
      const [afterFailure] = await client`
        select
          (select count(*)::int from applications
           where candidate_id = ${candidate!.id}
             and vacancy_id = ${rollbackDraft.id}) as applications,
          (select count(*)::int from application_status_history h
           join applications a on a.id = h.application_id
           where a.candidate_id = ${candidate!.id}
             and a.vacancy_id = ${rollbackDraft.id}) as history`;
      assert.equal(
        afterFailure!.applications,
        0,
        "Failed history must roll back application",
      );
      assert.equal(
        afterFailure!.history,
        0,
        "Failed submission must leave no history",
      );
    } finally {
      await client.unsafe(
        "DROP TRIGGER IF EXISTS verify_history_failure ON application_status_history",
      );
      await client.unsafe("DROP FUNCTION verify_reject_history_insert()");
    }
    const retry = await call(
      "Candidate",
      "POST",
      "/candidate/applications",
      { vacancyId: rollbackDraft.id },
      201,
    );
    const retryDetail = await call(
      "Candidate",
      "GET",
      `/candidate/applications/${retry.id}`,
    );
    assert.equal(retryDetail.currentStatus, "Applied");
    assert.deepEqual(
      retryDetail.history.map((event: { toStatus: string }) => event.toStatus),
      ["Applied"],
    );
    const [afterRetry] = await client`
      select count(*)::int as count from applications
      where candidate_id = ${candidate!.id} and vacancy_id = ${rollbackDraft.id}`;
    assert.equal(
      afterRetry!.count,
      1,
      "Retry must create exactly one application",
    );
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${rollbackDraft.id}/close`,
    );
    const match = await call(
      "Candidate",
      "GET",
      `/candidate/vacancies/${draft.id}/match`,
    );
    assert.equal(match.percentage, 100);
    // Start both HTTP submissions before awaiting either response. PostgreSQL's
    // partial unique index must protect the persisted outcome under contention.
    const submissions = await Promise.all(
      [0, 1].map(() =>
        app.inject({
          method: "POST",
          url: "/candidate/applications",
          headers: { "x-verification-role": "Candidate" },
          payload: { vacancyId: draft.id },
        }),
      ),
    );
    assert.deepEqual(
      submissions.map((response) => response.statusCode).sort(),
      [201, 409],
      `Concurrent submissions: ${submissions.map((response) => response.body).join("; ")}`,
    );
    const applied = submissions
      .find((response) => response.statusCode === 201)!
      .json();
    const conflict = submissions
      .find((response) => response.statusCode === 409)!
      .json();
    assert.equal(conflict.error.code, "ACTIVE_APPLICATION_EXISTS");
    const persisted = await client`
      select id, current_status from applications
      where candidate_id = ${candidate!.id} and vacancy_id = ${draft.id}`;
    assert.equal(persisted.length, 1, "Only one application was persisted");
    assert.equal(persisted[0]!.id, applied.id);
    assert.equal(persisted[0]!.current_status, "Applied");
    const initialHistory = await client`
      select h.from_status, h.to_status, h.actor_user_id
      from application_status_history h
      join applications a on a.id = h.application_id
      where a.candidate_id = ${candidate!.id} and a.vacancy_id = ${draft.id}`;
    assert.equal(
      initialHistory.length,
      1,
      "Only one initial event was persisted",
    );
    assert.equal(initialHistory[0]!.from_status, null);
    assert.equal(initialHistory[0]!.to_status, "Applied");
    assert.equal(initialHistory[0]!.actor_user_id, user!.id);
    // Independent synthetic principals must not see another candidate/company's
    // records. These headers exist only in this disposable verifier's resolver.
    const otherCandidateHeaders = {
      "x-verification-role": "Candidate",
      "x-verification-identity": "other",
    };
    const hiddenApplication = await app.inject({
      method: "GET",
      url: `/candidate/applications/${applied.id}`,
      headers: otherCandidateHeaders,
    });
    assert.equal(hiddenApplication.statusCode, 404);
    const otherApplications = await app.inject({
      method: "GET",
      url: "/candidate/applications",
      headers: otherCandidateHeaders,
    });
    assert.equal(otherApplications.statusCode, 200);
    assert.deepEqual(otherApplications.json(), []);
    const otherMatch = await app.inject({
      method: "GET",
      url: `/candidate/vacancies/${draft.id}/match`,
      headers: otherCandidateHeaders,
    });
    assert.equal(otherMatch.statusCode, 200);
    assert.equal(otherMatch.json().percentage, 0);
    for (const path of [
      `/employer/vacancies/${draft.id}`,
      `/employer/vacancies/${draft.id}/applications`,
    ]) {
      const hidden = await app.inject({
        method: "GET",
        url: path,
        headers: {
          "x-verification-role": "Employer",
          "x-verification-identity": "other",
        },
      });
      assert.equal(hidden.statusCode, 404, `Foreign company: ${path}`);
    }
    const duplicateSubmission = await call(
      "Candidate",
      "POST",
      "/candidate/applications",
      { vacancyId: draft.id },
      409,
    );
    assert.equal(duplicateSubmission.error.code, "ACTIVE_APPLICATION_EXISTS");
    // A failed recruiter history insert must also undo the preceding status and
    // updated_at write. Compare persisted rows and the candidate-visible history.
    const beforeReview = await client`
      select current_status, updated_at from applications where id = ${applied.id}`;
    const beforeReviewDetail = await call(
      "Candidate",
      "GET",
      `/candidate/applications/${applied.id}`,
    );
    await client.unsafe(`
      CREATE FUNCTION verify_reject_history_insert() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION USING ERRCODE = 'P0001',
          MESSAGE = 'synthetic_history_write_failure';
      END;
      $$
    `);
    try {
      await client.unsafe(`
        CREATE TRIGGER verify_history_failure BEFORE INSERT
        ON application_status_history FOR EACH ROW
        EXECUTE FUNCTION verify_reject_history_insert()
      `);
      const failedReview = await call(
        "Recruiter",
        "POST",
        `/recruiter/applications/${applied.id}/review`,
        undefined,
        500,
      );
      assert.deepEqual(failedReview, {
        error: { code: "INTERNAL_SERVER_ERROR" },
      });
      const afterFailedReview = await client`
        select current_status, updated_at from applications where id = ${applied.id}`;
      assert.deepEqual(
        [...afterFailedReview],
        [...beforeReview],
        "Failed review must roll back status and updated_at",
      );
      assert.deepEqual(
        await call("Candidate", "GET", `/candidate/applications/${applied.id}`),
        beforeReviewDetail,
        "Failed review must preserve candidate-visible application and history",
      );
    } finally {
      await client.unsafe(
        "DROP TRIGGER IF EXISTS verify_history_failure ON application_status_history",
      );
      await client.unsafe("DROP FUNCTION verify_reject_history_insert()");
    }
    await call(
      "Recruiter",
      "POST",
      `/recruiter/applications/${applied.id}/review`,
    );
    const reviewed = await call(
      "Candidate",
      "GET",
      `/candidate/applications/${applied.id}`,
    );
    assert.equal(reviewed.currentStatus, "Reviewing");
    assert.deepEqual(
      reviewed.history.map((event: { toStatus: string }) => event.toStatus),
      ["Applied", "Reviewing"],
      "Review retry must add exactly one history event",
    );
    assert.equal(reviewed.history[1].fromStatus, "Applied");
    const reviewEvents = await client`
      select actor_user_id from application_status_history
      where application_id = ${applied.id} and to_status = 'Reviewing'`;
    assert.equal(reviewEvents.length, 1);
    assert.equal(reviewEvents[0]!.actor_user_id, user!.id);
    await call(
      "Recruiter",
      "POST",
      `/recruiter/applications/${applied.id}/shortlist`,
    );
    const detail = await call(
      "Candidate",
      "GET",
      `/candidate/applications/${applied.id}`,
    );
    assert.deepEqual(
      detail.history.map((item: { toStatus: string }) => item.toStatus),
      ["Applied", "Reviewing", "Shortlisted"],
    );
    await call(
      "Candidate",
      "POST",
      `/candidate/applications/${applied.id}/withdraw`,
    );
    await call(
      "Candidate",
      "POST",
      "/candidate/applications",
      { vacancyId: draft.id },
      201,
    );
    await call("Employer", "POST", `/employer/vacancies/${draft.id}/close`);
    await call("Candidate", "GET", `/vacancies/${draft.id}`, undefined, 404);
    const closedSubmission = await call(
      "Candidate",
      "POST",
      "/candidate/applications",
      { vacancyId: draft.id },
      409,
    );
    assert.equal(closedSubmission.error.code, "VACANCY_NOT_OPEN");
    const legacyDraft = await call(
      "Employer",
      "POST",
      "/employer/vacancies",
      { companyId: company!.id, title: "Legacy-only matching contract" },
      201,
    );
    await client`insert into vacancy_requirements(vacancy_id,category,description,requirement_type,required) values (${legacyDraft.id},'Legacy','Unstructured requirement','Skill',true)`;
    await call(
      "Employer",
      "POST",
      `/employer/vacancies/${legacyDraft.id}/open`,
    );
    const legacyMatch = await call(
      "Candidate",
      "GET",
      `/candidate/vacancies/${legacyDraft.id}/match`,
    );
    assert.equal(legacyMatch.percentage, null);
    assert.equal(legacyMatch.totalEvaluable, 0);
    assert.equal(legacyMatch.notEvaluated, 1);
    assert.equal(legacyMatch.informational, true);
  } finally {
    await app.close();
  }
  console.log(
    "PASS: PostgreSQL 18, fresh migrations, rerun, normalization, constraints, rollback, forced HTTP submission/recruiter-review history-write failure rollback and clean retries, active uniqueness, reapplication, vacancy row locking, concurrent HTTP submissions with single application/history, independent candidate/company HTTP isolation, closed-vacancy refusal, null legacy match, HTTP apply/review/shortlist/withdraw/reapply workflow",
  );
} finally {
  if (client) await client.end({ timeout: 5 });
  if (created) await admin.unsafe(`DROP DATABASE "${databaseName}"`);
  await admin.end({ timeout: 5 });
}
