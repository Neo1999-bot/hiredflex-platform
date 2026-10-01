import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { buildApp } from "./app.js";
import type { AuthenticatedPrincipal } from "./auth/authorization.js";
import type { Database } from "./db/client.js";
import {
  candidates,
  candidateSkills,
  vacancies,
  vacancyRequirements,
} from "./db/schema/index.js";

type Row = Record<string, unknown>;
const vacancyId = randomUUID();
const otherVacancyId = randomUUID();
const companyId = randomUUID();
const otherCompanyId = randomUUID();
const candidate: AuthenticatedPrincipal = {
  userId: "u1",
  roleAssignments: [{ role: "Candidate", companyId: null }],
};
const employer: AuthenticatedPrincipal = {
  userId: "e1",
  roleAssignments: [{ role: "Employer", companyId }],
};
const body = {
  skillName: "JavaScript",
  description: "JavaScript development knowledge",
  category: "SKILL",
  requirementType: "TECHNICAL",
  required: true,
};
const requirementUrl = `/employer/vacancies/${vacancyId}/requirements`;
// This in-memory double evaluates generated owner predicates and simulates
// constraint failures. It is not PostgreSQL runtime verification.
class MemoryDatabase {
  rows = new Map<unknown, Row[]>([
    [
      candidates,
      [
        { id: "c1", userId: "u1" },
        { id: "c2", userId: "u2" },
      ],
    ],
    [candidateSkills, []],
    [
      vacancies,
      [
        { id: vacancyId, companyId, status: "DRAFT" },
        { id: otherVacancyId, companyId: otherCompanyId, status: "DRAFT" },
      ],
    ],
    [vacancyRequirements, []],
  ]);
  locks: string[] = [];
  readOnly = false;
  failConstraint?: { code: string; constraint_name: string; wrapped?: boolean };
  matchingWrites = 0;
  list(table: unknown) {
    const rows = this.rows.get(table);
    if (!rows) throw new Error("Unexpected table");
    return rows;
  }
  select(projection?: Row) {
    return new Query(this, projection);
  }
  insert(table: unknown) {
    return {
      values: (values: Row) => ({
        returning: async () => {
          this.assertWritable();
          if (this.failConstraint) {
            const error = Object.assign(
              new Error("private database details"),
              this.failConstraint,
            );
            if (this.failConstraint.wrapped)
              throw new Error("query failed", { cause: error });
            throw error;
          }
          const owner = table === candidateSkills ? "candidateId" : "vacancyId";
          // Simulation only; production relies on the PostgreSQL expression index.
          const key = (values.skillName as string).trim().toLowerCase();
          if (
            this.list(table).some(
              (row) =>
                row[owner] === values[owner] &&
                typeof row.skillName === "string" &&
                row.skillName.trim().toLowerCase() === key,
            )
          ) {
            throw Object.assign(new Error("private duplicate detail"), {
              code: "23505",
              constraint_name:
                table === candidateSkills
                  ? "candidate_skills_candidate_skill_unique"
                  : "vacancy_requirements_skill_unique",
            });
          }
          const row = {
            id: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...values,
          };
          this.list(table).push(row);
          return [row];
        },
      }),
    };
  }
  delete(table: unknown) {
    return {
      where: (condition: SQL) => ({
        returning: async () => {
          this.assertWritable();
          const query = new Query(this).from(table).where(condition);
          const removed = query.result();
          this.rows.set(
            table,
            this.list(table).filter((row) => !removed.includes(row)),
          );
          return removed;
        },
      }),
    };
  }
  update(table: unknown) {
    return {
      set: (values: Row) => ({
        where: (condition: SQL) => ({
          returning: async () => {
            this.assertWritable();
            const rows = new Query(this).from(table).where(condition).result();
            for (const row of rows) Object.assign(row, values);
            return rows;
          },
        }),
      }),
    };
  }
  assertWritable() {
    if (this.readOnly) {
      this.matchingWrites++;
      throw new Error("read-only violation");
    }
  }
  async transaction<T>(
    callback: (db: this) => Promise<T>,
    config?: { accessMode?: string },
  ) {
    const before = structuredClone([...this.rows.values()]);
    this.readOnly = config?.accessMode === "read only";
    try {
      return await callback(this);
    } catch (error) {
      [...this.rows.keys()].forEach((key, i) => this.rows.set(key, before[i]!));
      throw error;
    } finally {
      this.readOnly = false;
    }
  }
}
class Query implements PromiseLike<Row[]> {
  private table: unknown;
  private condition?: SQL;
  constructor(
    private db: MemoryDatabase,
    private projection?: Row,
  ) {}
  from(table: unknown) {
    this.table = table;
    return this;
  }
  where(condition: SQL) {
    this.condition = condition;
    return this;
  }
  orderBy() {
    return this;
  }
  limit() {
    return Promise.resolve(this.result());
  }
  for(mode: string) {
    this.db.locks.push(mode);
    return Promise.resolve(this.result());
  }
  result(): Row[] {
    if (!this.condition) throw new Error("Unscoped read");
    const { sql, params } = new PgDialect().sqlToQuery(this.condition);
    const clauses = [
      ...sql.matchAll(/"[^"]+"\."([^"]+)" (?:= \$(\d+)|in \(([^)]+)\))/g),
    ];
    if (!clauses.length) throw new Error(`Unsupported predicate: ${sql}`);
    const rows = this.db.list(this.table).filter((row) =>
      clauses.every(([, name, index, list]) => {
        const property = name!.replace(/_([a-z])/g, (_, letter: string) =>
          letter.toUpperCase(),
        );
        if (index) return row[property] === params[Number(index) - 1];
        return [...list!.matchAll(/\$(\d+)/g)].some(
          ([, position]) => row[property] === params[Number(position) - 1],
        );
      }),
    );
    if (!this.projection) return rows;
    // Matching uses SQL canonical keys in production; this test double leaves
    // keys absent so the documented TypeScript fallback handles fixture names.
    return rows.map((row) =>
      Object.fromEntries(
        Object.keys(this.projection!)
          .filter((key) => key !== "comparisonKey")
          .map((key) => [key, row[key]]),
      ),
    );
  }
  then<A = Row[], B = never>(
    resolve?: ((rows: Row[]) => A | PromiseLike<A>) | null,
    reject?: ((error: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.result())
      .then(resolve, reject);
  }
}

describe("structured skill and requirement management", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });
  function app(
    db: MemoryDatabase,
    principal: AuthenticatedPrincipal | null = candidate,
  ) {
    const instance = buildApp({
      db: db as unknown as Database,
      checkDatabase: async () => {},
      resolvePrincipal: () => principal,
      logger: false,
    });
    apps.push(instance);
    return instance;
  }
  it("creates trimmed candidate evidence, lists only own records and deletes only own skill", async () => {
    const db = new MemoryDatabase();
    const server = app(db);
    const foreign = { id: randomUUID(), candidateId: "c2", skillName: "React" };
    db.list(candidateSkills).push(foreign);
    const created = await server.inject({
      method: "POST",
      url: "/candidate/skills",
      payload: { skillName: " \tJavaScript\n " },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      candidateId: "c1",
      skillName: "JavaScript",
    });
    const listed = await server.inject({
      method: "GET",
      url: "/candidate/skills",
    });
    expect(listed.json().map((row: Row) => row.skillName)).toEqual([
      "JavaScript",
    ]);
    expect(
      (
        await server.inject({
          method: "DELETE",
          url: `/candidate/skills/${foreign.id}`,
        })
      ).json(),
    ).toEqual({ error: { code: "CANDIDATE_SKILL_NOT_FOUND" } });
    expect(db.list(candidateSkills)).toContain(foreign);
    expect(
      (
        await server.inject({
          method: "DELETE",
          url: `/candidate/skills/${created.json().id}`,
        })
      ).statusCode,
    ).toBe(204);
    expect(db.list(candidateSkills)).toEqual([foreign]);
  });
  it.each(["javascript", " \tJAVASCRIPT\n "])(
    "rejects normalized candidate duplicate %s",
    async (skillName) => {
      const db = new MemoryDatabase();
      const server = app(db);
      await server.inject({
        method: "POST",
        url: "/candidate/skills",
        payload: { skillName: "JavaScript" },
      });
      const duplicate = await server.inject({
        method: "POST",
        url: "/candidate/skills",
        payload: { skillName },
      });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json()).toEqual({
        error: { code: "CANDIDATE_SKILL_EXISTS" },
      });
    },
  );
  it.each(["", " \t\n", "\u00a0\u3000"])(
    "rejects blank skill names %j",
    async (skillName) => {
      const db = new MemoryDatabase();
      expect(
        (
          await app(db).inject({
            method: "POST",
            url: "/candidate/skills",
            payload: { skillName },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app(db, employer).inject({
            method: "POST",
            url: requirementUrl,
            payload: { ...body, skillName },
          })
        ).statusCode,
      ).toBe(400);
      expect(db.list(candidateSkills)).toEqual([]);
      expect(db.list(vacancyRequirements)).toEqual([]);
    },
  );
  it("rejects supplied candidate identity, company ownership and unknown fields instead of stripping", async () => {
    const db = new MemoryDatabase();
    for (const extra of [{ candidateId: "c2" }, { proficiency: 100 }]) {
      expect(
        (
          await app(db).inject({
            method: "POST",
            url: "/candidate/skills",
            payload: { skillName: "Git", ...extra },
          })
        ).statusCode,
      ).toBe(400);
    }
    expect(
      (
        await app(db).inject({
          method: "GET",
          url: "/candidate/skills?candidateId=c2",
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app(db, employer).inject({
          method: "POST",
          url: requirementUrl,
          payload: { ...body, companyId: otherCompanyId },
        })
      ).statusCode,
    ).toBe(400);
  });
  it("returns candidate not found rather than using another profile", async () => {
    const db = new MemoryDatabase();
    db.rows.set(candidates, [{ id: "c2", userId: "u2" }]);
    expect(
      (
        await app(db).inject({ method: "GET", url: "/candidate/skills" })
      ).json(),
    ).toEqual({ error: { code: "CANDIDATE_NOT_FOUND" } });
  });
  it.each([true, false])(
    "preserves all requirement fields and required=%s during create/list/delete",
    async (required) => {
      const db = new MemoryDatabase();
      const server = app(db, employer);
      const created = await server.inject({
        method: "POST",
        url: requirementUrl,
        payload: { ...body, required },
      });
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({ ...body, required, vacancyId });
      expect(db.locks).toEqual(["update"]);
      expect(
        (await server.inject({ method: "GET", url: requirementUrl })).json(),
      ).toEqual([created.json()]);
      expect(
        (
          await server.inject({
            method: "DELETE",
            url: `${requirementUrl}/${created.json().id}`,
          })
        ).statusCode,
      ).toBe(204);
      expect(db.list(vacancyRequirements)).toEqual([]);
      expect(db.locks).toEqual(["update", "update"]);
    },
  );
  it("rejects normalized requirement duplicates across required/preferred", async () => {
    const db = new MemoryDatabase();
    const server = app(db, employer);
    await server.inject({ method: "POST", url: requirementUrl, payload: body });
    const response = await server.inject({
      method: "POST",
      url: requirementUrl,
      payload: { ...body, skillName: " JAVASCRIPT ", required: false },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: { code: "VACANCY_REQUIREMENT_EXISTS" },
    });
    expect(db.list(vacancyRequirements)).toHaveLength(1);
  });
  it.each(["DRAFT", "OPEN", "CLOSED"])(
    "allows authorized reads for %s including legacy requirements",
    async (status) => {
      const db = new MemoryDatabase();
      db.list(vacancies)[0]!.status = status;
      const legacy = {
        id: randomUUID(),
        vacancyId,
        skillName: null,
        description: "Legacy",
        category: "OTHER",
        requirementType: "LEGACY",
        required: false,
      };
      db.list(vacancyRequirements).push(legacy);
      expect(
        (
          await app(db, employer).inject({ method: "GET", url: requirementUrl })
        ).json(),
      ).toEqual([legacy]);
    },
  );
  it.each(["OPEN", "CLOSED"])(
    "rejects POST and DELETE against %s without writes",
    async (status) => {
      const db = new MemoryDatabase();
      db.list(vacancies)[0]!.status = status;
      const existing = { id: randomUUID(), vacancyId, ...body };
      db.list(vacancyRequirements).push(existing);
      const server = app(db, employer);
      for (const request of [
        { method: "POST" as const, url: requirementUrl, payload: body },
        { method: "DELETE" as const, url: `${requirementUrl}/${existing.id}` },
      ]) {
        const result = await server.inject(request);
        expect(result.statusCode).toBe(409);
        expect(result.json()).toEqual({
          error: { code: "INVALID_VACANCY_REQUIREMENT_STATE" },
        });
      }
      expect(db.list(vacancyRequirements)).toEqual([existing]);
    },
  );
  it("hides foreign-company vacancies and foreign requirements", async () => {
    const db = new MemoryDatabase();
    const foreign = { id: randomUUID(), vacancyId: otherVacancyId, ...body };
    db.list(vacancyRequirements).push(foreign);
    const server = app(db, employer);
    const foreignUrl = `/employer/vacancies/${otherVacancyId}/requirements`;
    for (const request of [
      { method: "GET" as const, url: foreignUrl },
      { method: "POST" as const, url: foreignUrl, payload: body },
      { method: "DELETE" as const, url: `${foreignUrl}/${foreign.id}` },
    ]) {
      const result = await server.inject(request);
      expect(result.statusCode).toBe(404);
      expect(result.json()).toEqual({ error: { code: "VACANCY_NOT_FOUND" } });
    }
    const missing = await server.inject({
      method: "DELETE",
      url: `${requirementUrl}/${foreign.id}`,
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({
      error: { code: "VACANCY_REQUIREMENT_NOT_FOUND" },
    });
    expect(db.list(vacancyRequirements)).toEqual([foreign]);
  });
  it.each([null, "Employer", "Recruiter"] as const)(
    "denies %s on every candidate management operation",
    async (role) => {
      const db = new MemoryDatabase();
      const principal =
        role === null
          ? null
          : { userId: "u1", roleAssignments: [{ role, companyId }] };
      const server = app(db, principal);
      for (const request of [
        { method: "GET" as const, url: "/candidate/skills" },
        {
          method: "POST" as const,
          url: "/candidate/skills",
          payload: { skillName: "Git" },
        },
        { method: "DELETE" as const, url: `/candidate/skills/${randomUUID()}` },
      ]) {
        expect((await server.inject(request)).statusCode).toBe(
          role === null ? 401 : 403,
        );
      }
    },
  );
  it.each([null, "Candidate", "Recruiter"] as const)(
    "denies %s on every employer management operation",
    async (role) => {
      const db = new MemoryDatabase();
      const principal =
        role === null
          ? null
          : { userId: "u1", roleAssignments: [{ role, companyId }] };
      const server = app(db, principal);
      for (const request of [
        { method: "GET" as const, url: requirementUrl },
        { method: "POST" as const, url: requirementUrl, payload: body },
        { method: "DELETE" as const, url: `${requirementUrl}/${randomUUID()}` },
      ]) {
        expect((await server.inject(request)).statusCode).toBe(
          role === null ? 401 : 403,
        );
      }
    },
  );
  it.each([
    "skillName",
    "description",
    "category",
    "requirementType",
    "required",
  ])("requires the existing requirement field %s", async (field) => {
    const payload: Row = { ...body };
    delete payload[field];
    expect(
      (
        await app(new MemoryDatabase(), employer).inject({
          method: "POST",
          url: requirementUrl,
          payload,
        })
      ).statusCode,
    ).toBe(400);
  });
  it("maps wrapped database uniqueness errors and canonical blank checks without exposing details", async () => {
    const db = new MemoryDatabase();
    const server = app(db);
    db.failConstraint = {
      code: "23505",
      constraint_name: "candidate_skills_candidate_skill_unique",
      wrapped: true,
    };
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/candidate/skills",
          payload: { skillName: "Git" },
        })
      ).json(),
    ).toEqual({ error: { code: "CANDIDATE_SKILL_EXISTS" } });
    db.failConstraint = {
      code: "23514",
      constraint_name: "candidate_skills_skill_name_nonempty",
    };
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/candidate/skills",
          payload: { skillName: "Git" },
        })
      ).statusCode,
    ).toBe(400);
  });
  it.each([
    { skillName: true },
    { skillName: null },
    { skillName: 123 },
    { description: "  " },
    { category: "\t" },
    { requirementType: "" },
    { required: "false" },
  ])(
    "rejects malformed requirement fields %j before coercion",
    async (invalid) => {
      const db = new MemoryDatabase();
      const response = await app(db, employer).inject({
        method: "POST",
        url: requirementUrl,
        payload: { ...body, ...invalid },
      });
      expect(response.statusCode).toBe(400);
      expect(db.list(vacancyRequirements)).toEqual([]);
    },
  );
  it("ignores forged identity headers and company headers", async () => {
    const db = new MemoryDatabase();
    db.list(candidateSkills).push({
      id: randomUUID(),
      candidateId: "c2",
      skillName: "Private",
    });
    const response = await app(db).inject({
      method: "POST",
      url: "/candidate/skills",
      payload: { skillName: "Git" },
      headers: { "x-user-id": "u2", "x-candidate-id": "c2" },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().candidateId).toBe("c1");
    const foreign = await app(db, employer).inject({
      method: "POST",
      url: `/employer/vacancies/${otherVacancyId}/requirements`,
      payload: body,
      headers: { "x-company-id": otherCompanyId },
    });
    expect(foreign.statusCode).toBe(404);
  });
  it("supports explicit membership in multiple companies but denies global Employer assignments", async () => {
    const db = new MemoryDatabase();
    const global = app(db, {
      userId: "e1",
      roleAssignments: [{ role: "Employer", companyId: null }],
    });
    expect(
      (await global.inject({ method: "GET", url: requirementUrl })).statusCode,
    ).toBe(403);
    const multiple = app(db, {
      ...employer,
      roleAssignments: [
        ...employer.roleAssignments,
        { role: "Employer", companyId: otherCompanyId },
      ],
    });
    expect(
      (
        await multiple.inject({
          method: "POST",
          url: `/employer/vacancies/${otherVacancyId}/requirements`,
          payload: body,
        })
      ).statusCode,
    ).toBe(201);
  });
  it("translates wrapped requirement constraint failures and hides unrelated database errors", async () => {
    const db = new MemoryDatabase();
    const server = app(db, employer);
    db.failConstraint = {
      code: "23505",
      constraint_name: "vacancy_requirements_skill_unique",
      wrapped: true,
    };
    expect(
      (
        await server.inject({
          method: "POST",
          url: requirementUrl,
          payload: body,
        })
      ).json(),
    ).toEqual({ error: { code: "VACANCY_REQUIREMENT_EXISTS" } });
    db.failConstraint = {
      code: "23514",
      constraint_name: "vacancy_requirements_skill_name_nonempty",
      wrapped: true,
    };
    expect(
      (
        await server.inject({
          method: "POST",
          url: requirementUrl,
          payload: body,
        })
      ).statusCode,
    ).toBe(400);
    db.failConstraint = { code: "23505", constraint_name: "unrelated_unique" };
    expect(
      (
        await server.inject({
          method: "POST",
          url: requirementUrl,
          payload: body,
        })
      ).json(),
    ).toEqual({ error: { code: "INTERNAL_SERVER_ERROR" } });
    expect(db.list(vacancyRequirements)).toEqual([]);
  });
  it("rejects malformed resource IDs and missing requirement records", async () => {
    const db = new MemoryDatabase();
    expect(
      (
        await app(db).inject({
          method: "DELETE",
          url: "/candidate/skills/invalid",
        })
      ).statusCode,
    ).toBe(400);
    const server = app(db, employer);
    expect(
      (
        await server.inject({
          method: "GET",
          url: "/employer/vacancies/invalid/requirements",
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await server.inject({
          method: "DELETE",
          url: `${requirementUrl}/${randomUUID()}`,
        })
      ).json(),
    ).toEqual({ error: { code: "VACANCY_REQUIREMENT_NOT_FOUND" } });
  });

  it("feeds managed data into frozen matching and recomputes after skill deletion", async () => {
    const db = new MemoryDatabase();
    const candidateApp = app(db);
    const employerApp = app(db, employer);
    let gitId = "";
    for (const skillName of ["HTML", "CSS", "JavaScript", "Git"]) {
      const result = await candidateApp.inject({
        method: "POST",
        url: "/candidate/skills",
        payload: { skillName },
      });
      expect(result.statusCode).toBe(201);
      if (skillName === "Git") gitId = result.json().id;
    }
    for (const skillName of ["HTML", "CSS", "JavaScript", "Git", "React"]) {
      expect(
        (
          await employerApp.inject({
            method: "POST",
            url: requirementUrl,
            payload: { ...body, skillName, required: skillName !== "React" },
          })
        ).statusCode,
      ).toBe(201);
    }
    expect(
      (
        await employerApp.inject({
          method: "POST",
          url: `/employer/vacancies/${vacancyId}/open`,
        })
      ).statusCode,
    ).toBe(200);
    const url = `/candidate/vacancies/${vacancyId}/match`;
    const first = await candidateApp.inject({ method: "GET", url });
    expect(first.json()).toMatchObject({
      matched: 4,
      totalEvaluable: 5,
      totalListed: 5,
      notEvaluated: 0,
      percentage: 80,
      summary: "80% of listed requirements matched",
      informational: true,
    });
    expect(first.json().missingRequirements[0].priority).toBe("PREFERRED");
    const before = structuredClone([...db.rows.values()]);
    await candidateApp.inject({ method: "GET", url });
    expect([...db.rows.values()]).toEqual(before);
    expect(db.matchingWrites).toBe(0);
    expect(
      (
        await candidateApp.inject({
          method: "DELETE",
          url: `/candidate/skills/${gitId}`,
        })
      ).statusCode,
    ).toBe(204);
    const second = await candidateApp.inject({ method: "GET", url });
    expect(second.json()).toMatchObject({
      matched: 3,
      totalEvaluable: 5,
      percentage: 60,
      summary: "60% of listed requirements matched",
      informational: true,
    });
  });
});
