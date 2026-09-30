import { afterEach, describe, expect, it, vi } from "vitest";
import { SQL } from "drizzle-orm";
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
const vacancyId = "10000000-0000-4000-8000-000000000001";
const otherVacancyId = "10000000-0000-4000-8000-000000000002";
const candidatePrincipal: AuthenticatedPrincipal = {
  userId: "user-1",
  roleAssignments: [{ role: "Candidate", companyId: null }],
};

class ReadQuery implements PromiseLike<Row[]> {
  private table: unknown;
  private condition?: SQL;
  constructor(private readonly database: ReadDatabase) {}
  from(table: unknown): this {
    this.table = table;
    return this;
  }
  where(condition: SQL): this {
    this.condition = condition;
    return this;
  }
  limit(): Promise<Row[]> {
    return Promise.resolve(this.rows());
  }
  private rows(): Row[] {
    if (!this.condition) throw new Error("Unscoped matching read");
    const query = new PgDialect().sqlToQuery(this.condition);
    this.database.predicates.push(query);
    const clauses = [...query.sql.matchAll(/"[^"]+"\."([^"]+)" = \$(\d+)/g)];
    if (!clauses.length) throw new Error("Unsupported test predicate");
    return this.database.rowsFor(this.table).filter((row) =>
      clauses.every(([, name, position]) => {
        const property = name!.replace(/_([a-z])/g, (_, letter: string) =>
          letter.toUpperCase(),
        );
        return row[property] === query.params[Number(position) - 1];
      }),
    );
  }
  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }
}

class ReadDatabase {
  candidateRows: Row[] = [
    { id: "candidate-1", userId: "user-1" },
    { id: "candidate-2", userId: "user-2" },
  ];
  vacancyRows: Row[] = [
    { id: vacancyId, status: "OPEN" },
    { id: otherVacancyId, status: "OPEN" },
  ];
  requirementRows: Row[] = [
    {
      id: "r1",
      vacancyId,
      skillName: "HTML",
      description: "HTML",
      category: "SKILL",
      required: true,
    },
    {
      id: "r2",
      vacancyId,
      skillName: "React",
      description: "React",
      category: "SKILL",
      required: false,
    },
    {
      id: "r3",
      vacancyId: otherVacancyId,
      skillName: "Git",
      description: "Git",
      category: "SKILL",
      required: true,
    },
    {
      id: "legacy",
      vacancyId,
      skillName: null,
      description: "Legacy requirement",
      category: "EXPERIENCE",
      required: false,
    },
  ];
  skillRows: Row[] = [
    { id: "s1", candidateId: "candidate-1", skillName: " html " },
    { id: "s2", candidateId: "candidate-2", skillName: "React" },
  ];
  applicationRows = [
    { id: "a1", currentStatus: "Applied", candidateId: "candidate-1" },
  ];
  historyRows = [{ applicationId: "a1", toStatus: "Applied" }];
  predicates: { sql: string; params: unknown[] }[] = [];
  projections: Row[] = [];
  insert = vi.fn(() => {
    throw new Error("Matching must not insert");
  });
  update = vi.fn(() => {
    throw new Error("Matching must not update");
  });
  delete = vi.fn(() => {
    throw new Error("Matching must not delete");
  });
  rowsFor(table: unknown): Row[] {
    if (table === candidates) return this.candidateRows;
    if (table === vacancies) return this.vacancyRows;
    if (table === vacancyRequirements) return this.requirementRows;
    if (table === candidateSkills) return this.skillRows;
    throw new Error("Unexpected matching table");
  }
  select(projection: Row): ReadQuery {
    this.projections.push(projection);
    return new ReadQuery(this);
  }
  transaction = vi.fn(
    async (
      callback: (transaction: this) => Promise<unknown>,
      config: { isolationLevel: string; accessMode: string },
    ) => {
      expect(config).toEqual({
        isolationLevel: "repeatable read",
        accessMode: "read only",
      });
      return callback(this);
    },
  );
}

describe("candidate informational matching API", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });
  function createApp(
    database: ReadDatabase,
    principal: AuthenticatedPrincipal | null = candidatePrincipal,
  ) {
    const app = buildApp({
      db: database as unknown as Database,
      checkDatabase: async () => undefined,
      resolvePrincipal: () => principal,
      logger: false,
    });
    apps.push(app);
    return app;
  }
  const url = `/candidate/vacancies/${vacancyId}/match`;

  it("returns only the principal's skill evidence and the requested vacancy's requirements", async () => {
    const db = new ReadDatabase();
    const response = await createApp(db).inject({ method: "GET", url });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      vacancyId,
      matched: 1,
      totalEvaluable: 2,
      totalListed: 3,
      notEvaluated: 1,
      percentage: 50,
    });
    expect(response.json().matchedRequirements[0].evidence.skillId).toBe("s1");
    expect(response.json().missingRequirements[0].name).toBe("React");
    expect(response.json().notEvaluatedRequirements).toEqual([
      expect.objectContaining({
        requirementId: "legacy",
        matched: null,
        determination: "NO_STRUCTURED_SKILL",
        evidence: null,
      }),
    ]);
    expect(response.json().summary).toBe(
      "50% of evaluable listed requirements matched",
    );
    expect(db.predicates[0]?.params).toEqual(["user-1"]);
    expect(db.predicates[3]?.params).toEqual(["candidate-1"]);
    for (const projection of db.projections.slice(2)) {
      expect(projection.comparisonKey).toBeInstanceOf(SQL);
      expect(
        new PgDialect().sqlToQuery(projection.comparisonKey as SQL).sql,
      ).toContain("public.matching_skill_name_key");
    }
  });

  it("returns null percentage and preserves every all-legacy requirement in the API", async () => {
    const db = new ReadDatabase();
    db.requirementRows = [1, 2, 3].map((i) => ({
      id: `legacy${i}`,
      vacancyId,
      skillName: null,
      description: `Legacy ${i}`,
      category: "SKILL",
      required: i !== 2,
    }));
    const response = await createApp(db).inject({ method: "GET", url });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      vacancyId,
      informational: true,
      matched: 0,
      totalEvaluable: 0,
      totalListed: 3,
      notEvaluated: 3,
      percentage: null,
      summary: "No structured requirements available to compare",
      matchedRequirements: [],
      missingRequirements: [],
    });
    expect(response.json().notEvaluatedRequirements).toHaveLength(3);
    expect(response.json()).not.toHaveProperty("total");
  });

  it("cannot select another candidate through client query or headers", async () => {
    const db = new ReadDatabase();
    const response = await createApp(db).inject({
      method: "GET",
      url: `${url}?candidateId=candidate-2`,
      headers: { "x-candidate-id": "candidate-2", "x-user-id": "user-2" },
    });
    // Fastify strips unknown query fields; they never reach identity resolution.
    expect(response.statusCode).toBe(200);
    expect(response.json().matchedRequirements[0].evidence.skillId).toBe("s1");
  });

  it("fails closed without a principal, including forged identity headers", async () => {
    const db = new ReadDatabase();
    const response = await createApp(db, null).inject({
      method: "GET",
      url,
      headers: { "x-user-id": "user-1" },
    });
    expect(response.statusCode).toBe(401);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it.each(["Employer", "Recruiter"] as const)(
    "does not expand %s access",
    async (role) => {
      const db = new ReadDatabase();
      const response = await createApp(db, {
        userId: "user-1",
        roleAssignments: [{ role, companyId: null }],
      }).inject({ method: "GET", url });
      expect(response.statusCode).toBe(403);
      expect(db.transaction).not.toHaveBeenCalled();
    },
  );

  it("returns vacancy not found", async () => {
    const response = await createApp(new ReadDatabase()).inject({
      method: "GET",
      url: "/candidate/vacancies/10000000-0000-4000-8000-000000000099/match",
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("VACANCY_NOT_FOUND");
  });

  it.each(["DRAFT", "CLOSED"])(
    "preserves candidate discovery visibility for %s vacancies",
    async (status) => {
      const db = new ReadDatabase();
      db.vacancyRows[0]!.status = status;
      expect(
        (await createApp(db).inject({ method: "GET", url })).statusCode,
      ).toBe(404);
    },
  );

  it("returns candidate profile not found without using another profile", async () => {
    const db = new ReadDatabase();
    db.candidateRows = [db.candidateRows[1]!];
    const response = await createApp(db).inject({ method: "GET", url });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("CANDIDATE_NOT_FOUND");
  });

  it("returns deterministic repeated results without creating or mutating applications or lifecycle data", async () => {
    const db = new ReadDatabase();
    const before = structuredClone({
      applications: db.applicationRows,
      history: db.historyRows,
      vacancies: db.vacancyRows,
    });
    const app = createApp(db);
    const first = await app.inject({ method: "GET", url });
    const second = await app.inject({ method: "GET", url });
    expect(first.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect({
      applications: db.applicationRows,
      history: db.historyRows,
      vacancies: db.vacancyRows,
    }).toEqual(before);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("rejects malformed vacancy IDs before querying matching data", async () => {
    const db = new ReadDatabase();
    expect(
      (
        await createApp(db).inject({
          method: "GET",
          url: "/candidate/vacancies/invalid/match",
        })
      ).statusCode,
    ).toBe(400);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
