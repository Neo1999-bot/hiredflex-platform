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
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  const [count] =
    await client`select count(*)::int as count from drizzle.__drizzle_migrations`;
  assert.equal(
    count!.count,
    3,
    "All three migrations apply and reruns are idempotent",
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
  console.log(
    "PASS: PostgreSQL 18, fresh migrations, rerun, normalization, constraints, rollback, active uniqueness, reapplication, vacancy row locking",
  );
} finally {
  if (client) await client.end({ timeout: 5 });
  if (created) await admin.unsafe(`DROP DATABASE "${databaseName}"`);
  await admin.end({ timeout: 5 });
}
