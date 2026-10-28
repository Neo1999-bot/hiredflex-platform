import assert from "node:assert/strict";
import postgres, { type Sql } from "postgres";

type Response = { statusCode: number; body: string };
type Request = (
  method: "GET" | "POST" | "DELETE",
  url: string,
  payload?: object,
) => Promise<Response>;

// This helper is called only after verify-postgres creates its random database.
// It adds no migration, production hook, auth bypass or application behavior.
export async function verifyRequirementPublicationRaces(options: {
  databaseUrl: string;
  databaseName: string;
  sql: Sql;
  observer: Sql;
  companyId: string;
  request: Request;
}) {
  const { sql, observer, databaseName, request, companyId } = options;
  const control = postgres(options.databaseUrl, { max: 1, connect_timeout: 5 });
  const requirement = {
    skillName: "Race verification skill",
    description: "Synthetic concurrency requirement",
    category: "Skill",
    requirementType: "REQUIRED",
    required: true,
  };
  const expect = (response: Response, status: number) => {
    assert.equal(response.statusCode, status, response.body);
    return response.body ? JSON.parse(response.body) : null;
  };
  // Observe actual blocking edges, rather than treating a sleep or unresolved
  // JS promise as evidence that an HTTP transaction reached its SQL statement.
  const waitForBlockedBy = async (blocker: number) => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const rows = await observer`
        select pid from pg_stat_activity
        where datname = ${databaseName} and wait_event_type = 'Lock'
          and ${blocker}::int = any(pg_blocking_pids(pid))`;
      if (rows.length === 1) return Number(rows[0]!.pid);
      assert.ok(rows.length <= 1, "Unexpected additional race waiter");
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.fail("HTTP race did not reach the expected database blocking edge");
  };
  try {
    await sql.unsafe(`
      CREATE FUNCTION verify_pause_requirement_race() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM pg_advisory_xact_lock(741902, 1);
        RETURN NULL;
      END;
      $$
    `);
    // INSERT and DELETE have separate route operations. Exercise both with
    // each transaction winning the vacancy lock, on fresh synthetic vacancies.
    for (const operation of ["insert", "delete"] as const) {
      for (const first of ["edit", "open"] as const) {
        const draft = expect(
          await request("POST", "/employer/vacancies", {
            companyId,
            title: `Race ${operation} ${first} first`,
          }),
          201,
        );
        const base = `/employer/vacancies/${draft.id}`;
        let requirementId: string | undefined;
        if (operation === "delete") {
          requirementId = expect(
            await request("POST", `${base}/requirements`, requirement),
            201,
          ).id;
        }
        const before = await sql`
          select * from vacancy_requirements where vacancy_id = ${draft.id}`;
        const beforeApplications = await sql`
          select count(*)::int as count from applications where vacancy_id = ${draft.id}`;
        await sql.unsafe(
          first === "edit"
            ? `CREATE TRIGGER verify_race_pause AFTER INSERT OR DELETE
               ON vacancy_requirements FOR EACH ROW
               EXECUTE FUNCTION verify_pause_requirement_race()`
            : `CREATE TRIGGER verify_race_pause AFTER UPDATE OF status
               ON vacancies FOR EACH ROW WHEN (NEW.status = 'OPEN')
               EXECUTE FUNCTION verify_pause_requirement_race()`,
        );
        const pending: Promise<{ response: Response } | { error: unknown }>[] =
          [];
        const start = (action: "edit" | "open") => {
          const result = (
            action === "open"
              ? request("POST", `${base}/open`)
              : operation === "insert"
                ? request("POST", `${base}/requirements`, requirement)
                : request("DELETE", `${base}/requirements/${requirementId}`)
          ).then(
            (response) => ({ response }),
            (error: unknown) => ({ error }),
          );
          pending.push(result);
        };
        try {
          await control.begin(async (gate) => {
            await gate`select pg_advisory_xact_lock(741902, 1)`;
            const [controller] = await gate`select pg_backend_pid() as pid`;
            start(first);
            const firstPid = await waitForBlockedBy(Number(controller!.pid));
            start(first === "edit" ? "open" : "edit");
            await waitForBlockedBy(firstPid);
            // Both routes reached PostgreSQL; first is paused after its write
            // and second waits on its vacancy lock. No partial write is visible.
            const [visible] = await sql`
              select status from vacancies where id = ${draft.id}`;
            assert.equal(visible!.status, "DRAFT");
            const visibleRequirements = await sql`
              select * from vacancy_requirements where vacancy_id = ${draft.id}`;
            assert.deepEqual([...visibleRequirements], [...before]);
          }); // Committing the controller releases the advisory gate.
          const results = await Promise.all(pending);
          const responses = results.map((result) => {
            if ("error" in result) throw result.error;
            return result.response;
          });
          const openResult = responses[first === "open" ? 0 : 1]!;
          const editResult = responses[first === "edit" ? 0 : 1]!;
          assert.equal(expect(openResult, 200).status, "OPEN");
          if (first === "edit") {
            expect(editResult, operation === "insert" ? 201 : 204);
          } else {
            assert.equal(
              expect(editResult, 409).error.code,
              "INVALID_VACANCY_REQUIREMENT_STATE",
            );
          }
          const after = await sql`
            select * from vacancy_requirements where vacancy_id = ${draft.id}`;
          if (first === "open") {
            assert.deepEqual([...after], [...before]);
          } else {
            assert.equal(after.length, operation === "insert" ? 1 : 0);
            if (operation === "insert")
              assert.equal(after[0]!.skill_name, requirement.skillName);
          }
          const [opened] = await sql`
            select status from vacancies where id = ${draft.id}`;
          assert.equal(opened!.status, "OPEN");
          const afterApplications = await sql`
            select count(*)::int as count from applications where vacancy_id = ${draft.id}`;
          assert.deepEqual([...afterApplications], [...beforeApplications]);
        } finally {
          // control.begin has already committed or rolled back, so neither
          // HTTP request can remain held by our advisory gate during cleanup.
          await Promise.all(pending);
          await sql.unsafe(
            `DROP TRIGGER IF EXISTS verify_race_pause ON ${first === "edit" ? "vacancy_requirements" : "vacancies"}`,
          );
        }
        expect(await request("POST", `${base}/close`), 200);
      }
    }
    console.log(
      "PASS: forced HTTP requirement INSERT/DELETE versus publication, both lock orderings, observed blocking edges, no partial writes and OPEN-state refusal",
    );
  } finally {
    await control.end({ timeout: 5 });
    await sql.unsafe("DROP FUNCTION IF EXISTS verify_pause_requirement_race()");
  }
}
