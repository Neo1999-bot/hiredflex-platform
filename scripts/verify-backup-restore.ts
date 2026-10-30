import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";

async function snapshot(sql: Sql) {
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name`;
  assert.equal(tables.length, 12, "Expected twelve application tables");
  const records: Record<string, unknown> = {};
  for (const { table_name: table } of tables) {
    assert.match(String(table), /^[a-z_]+$/);
    const [record] = await sql.unsafe(
      `select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), '[]'::jsonb) as rows from public."${table}" t`,
    );
    records[String(table)] = record!.rows;
  }
  const constraints = await sql`
    select c.conname, c.contype, t.relname,
      pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname in ('public', 'drizzle')
    order by n.nspname, t.relname, c.conname`;
  const indexes = await sql`
    select schemaname, tablename, indexname, indexdef from pg_indexes
    where schemaname in ('public', 'drizzle') order by schemaname, indexname`;
  const enums = await sql`
    select t.typname, e.enumlabel, e.enumsortorder
    from pg_type t join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' order by t.typname, e.enumsortorder`;
  const journal =
    await sql`select * from drizzle.__drizzle_migrations order by id`;
  const sequences = await sql`
    select schemaname, sequencename, data_type::text, start_value,
      min_value, max_value, increment_by, cycle, cache_size, last_value
    from pg_sequences where schemaname in ('public', 'drizzle')
    order by schemaname, sequencename`;
  assert.equal(journal.length, 4);
  return {
    records,
    constraints: [...constraints],
    indexes: [...indexes],
    enums: [...enums],
    journal: [...journal],
    sequences: [...sequences],
  };
}

// Not a general backup tool. Only the parent verifier's newly created random
// source is accepted; no DATABASE_URL fallback, provider call or artifact export.
export async function verifyDisposableBackupRestore(options: {
  containerId: string;
  sourceName: string;
  sourceUrl: string;
  source: Sql;
  admin: Sql;
}) {
  const { containerId, sourceName, sourceUrl, source, admin } = options;
  assert.match(sourceName, /^hiredflex_verify_[a-f0-9]{32}$/);
  assert.match(containerId, /^[a-f0-9]{12,64}$/);
  const parsed = new URL(sourceUrl);
  assert.equal(parsed.pathname, `/${sourceName}`);
  const [current] = await source`select current_database() as name`;
  assert.equal(current!.name, sourceName);
  const username = decodeURIComponent(parsed.username);
  assert.ok(username, "Dedicated test database user required");
  const restoreName = `hiredflex_restore_${randomUUID().replaceAll("-", "")}`;
  let restored: Sql | undefined;
  let created = false;
  const run = (args: string[], input?: Buffer): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      const child = execFile(
        "docker",
        ["exec", ...(input ? ["-i"] : []), containerId, ...args],
        { encoding: "buffer", maxBuffer: 16 * 1024 * 1024, timeout: 30_000 },
        (error, output) => {
          if (error)
            reject(
              new Error("Disposable PostgreSQL dump/restore command failed"),
            );
          else resolve(output);
        },
      );
      // An early pg_restore exit can close stdin; callback owns the result.
      child.stdin?.on("error", () => undefined);
      child.stdin?.end(input);
    });
  try {
    const before = await snapshot(source);
    const archive = await run([
      "pg_dump",
      `--username=${username}`,
      `--dbname=${sourceName}`,
      "--format=custom",
      "--no-owner",
      "--no-privileges",
    ]);
    assert.ok(archive.length > 0, "Synthetic dump must not be empty");
    await admin.unsafe(`CREATE DATABASE "${restoreName}"`);
    created = true;
    await run(
      [
        "pg_restore",
        `--username=${username}`,
        `--dbname=${restoreName}`,
        "--exit-on-error",
        "--no-owner",
        "--no-privileges",
      ],
      archive,
    );
    parsed.pathname = `/${restoreName}`;
    restored = postgres(parsed.toString(), { max: 1, connect_timeout: 5 });
    assert.deepEqual(
      await snapshot(restored),
      before,
      "Restored rows/history/schema/journal must match source",
    );
    const [normalization] = await restored`
      select public.matching_skill_name_key(${" JavaScript "}) as key`;
    assert.equal(normalization!.key, "javascript");
    await assert.rejects(
      restored`insert into applications(candidate_id,vacancy_id) values (${randomUUID()},${randomUUID()})`,
      { code: "23503" },
    );
    const [active] = await restored`
      select candidate_id, vacancy_id from applications
      where current_status in ('Applied','Reviewing','Shortlisted') limit 1`;
    assert.ok(active, "Restored fixture must contain an active application");
    await assert.rejects(
      restored`insert into applications(candidate_id,vacancy_id) values (${active.candidate_id},${active.vacancy_id})`,
      { code: "23505" },
    );
    assert.deepEqual(
      await snapshot(restored),
      before,
      "Rejected writes must leave restored records intact",
    );
    assert.deepEqual(
      await snapshot(source),
      before,
      "Rehearsal must leave source fixtures unchanged",
    );
    console.log(
      "PASS: synthetic PostgreSQL 18 pg_dump/pg_restore, twelve table contents, history, four migration rows, constraints/indexes/enums, normalization, restored FK/active uniqueness and unchanged source",
    );
  } finally {
    if (restored) await restored.end({ timeout: 5 });
    if (created) await admin.unsafe(`DROP DATABASE "${restoreName}"`);
  }
}
