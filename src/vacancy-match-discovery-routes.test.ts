import { afterEach, describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { buildApp } from "./app.js";
import type { Database } from "./db/client.js";
import type { AuthenticatedPrincipal } from "./auth/authorization.js";
import {
  candidates,
  candidateSkills,
  vacancies,
  vacancyRequirements,
} from "./db/schema/index.js";

type Row = Record<string, unknown>;
const principal: AuthenticatedPrincipal = {
  userId: "user1",
  roleAssignments: [{ role: "Candidate", companyId: null }],
};
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function vacancy(n: number, date = "2026-10-01", status = "OPEN"): Row {
  return {
    id: id(n),
    title: "Developer",
    description: "Web development",
    location: "Johannesburg",
    status,
    createdAt: new Date(date),
  };
}
function requirement(
  vacancyNumber: number,
  skillName: string | null,
  required = true,
): Row {
  return {
    id: `${vacancyNumber}-${skillName ?? "legacy"}`,
    vacancyId: id(vacancyNumber),
    skillName,
    description: "Legacy description",
    category: "SKILL",
    required,
  };
}
// Generates and evaluates the relevant SQL predicates against shared fixture rows.
// No live PostgreSQL execution or universal normalization equivalence is claimed.
class ReadDatabase {
  candidateRows: Row[] = [
    { id: "c1", userId: "user1" },
    { id: "c2", userId: "user2" },
  ];
  vacancyRows: Row[] = [];
  requirementRows: Row[] = [];
  skillRows: Row[] = [
    { id: "s1", candidateId: "c1", skillName: " html " },
    { id: "s2", candidateId: "c2", skillName: "React" },
  ];
  applicationRows: Row[] = [];
  historyRows: Row[] = [];
  calls: { table: unknown; sql: string; params: unknown[] }[] = [];
  projections: Row[] = [];
  insert = vi.fn(() => {
    throw new Error("Read-only discovery must not insert");
  });
  update = vi.fn(() => {
    throw new Error("Read-only discovery must not update");
  });
  delete = vi.fn(() => {
    throw new Error("Read-only discovery must not delete");
  });
  rowsFor(table: unknown): Row[] {
    if (table === candidates) return this.candidateRows;
    if (table === candidateSkills) return this.skillRows;
    if (table === vacancies) return this.vacancyRows;
    if (table === vacancyRequirements) return this.requirementRows;
    throw new Error(
      "Unexpected discovery table, including application/score records",
    );
  }
  select(projection: Row) {
    this.projections.push(projection);
    return new ReadQuery(this);
  }
  transaction = vi.fn(
    async (callback: (db: this) => Promise<unknown>, config: unknown) => {
      expect(config).toEqual({
        isolationLevel: "repeatable read",
        accessMode: "read only",
      });
      return callback(this);
    },
  );
}
class ReadQuery implements PromiseLike<Row[]> {
  private table: unknown;
  private condition?: SQL;
  constructor(private db: ReadDatabase) {}
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
    return Promise.resolve(this.rows());
  }
  rows() {
    if (!this.condition) throw new Error("Unscoped read");
    const query = new PgDialect().sqlToQuery(this.condition);
    this.db.calls.push({ table: this.table, ...query });
    const equalities = [...query.sql.matchAll(/"[^"]+"\."([^"]+)" = \$(\d+)/g)];
    const inclusions = [
      ...query.sql.matchAll(/"[^"]+"\."([^"]+)" in \(([^)]+)\)/g),
    ];
    const likes = [...query.sql.matchAll(/"[^"]+"\."([^"]+)" ilike \$(\d+)/g)];
    const property = (name: string) =>
      name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    return this.db.rowsFor(this.table).filter((row) => {
      if (
        !equalities.every(
          ([, name, p]) => row[property(name!)] === query.params[Number(p) - 1],
        )
      )
        return false;
      if (
        !inclusions.every(([, name, list]) =>
          [...list!.matchAll(/\$(\d+)/g)].some(
            ([, p]) => row[property(name!)] === query.params[Number(p) - 1],
          ),
        )
      )
        return false;
      const matches = (name: string, p: string) => {
        const pattern = String(query.params[Number(p) - 1])
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replaceAll("%", ".*")
          .replaceAll("_", ".");
        return (
          typeof row[property(name)] === "string" &&
          new RegExp(`^${pattern}$`, "i").test(row[property(name)] as string)
        );
      };
      const text = likes.filter(
        ([, name]) => name === "title" || name === "description",
      );
      const location = likes.filter(([, name]) => name === "location");
      return (
        (!text.length || text.some(([, name, p]) => matches(name!, p!))) &&
        location.every(([, name, p]) => matches(name!, p!))
      );
    });
  }
  then<A = Row[], B = never>(
    resolve?: ((rows: Row[]) => A | PromiseLike<A>) | null,
    reject?: ((error: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.rows())
      .then(resolve, reject);
  }
}
describe("candidate vacancy match discovery", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });
  function app(
    db: ReadDatabase,
    identity: AuthenticatedPrincipal | null = principal,
  ) {
    const instance = buildApp({
      db: db as unknown as Database,
      checkDatabase: async () => {},
      resolvePrincipal: () => identity,
      logger: false,
    });
    apps.push(instance);
    return instance;
  }
  const url = "/candidate/vacancy-matches";
  it("returns only OPEN vacancies, principal-owned skill evidence and compact fields", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = [
      vacancy(1),
      vacancy(2, undefined, "DRAFT"),
      vacancy(3, undefined, "CLOSED"),
    ];
    db.requirementRows = [
      requirement(1, "HTML"),
      requirement(1, "React", false),
      requirement(2, "HTML"),
      requirement(3, "HTML"),
    ];
    const response = await app(db).inject({
      method: "GET",
      url,
      headers: { "x-candidate-id": "c2", "x-user-id": "user2" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [
        {
          vacancyId: id(1),
          title: "Developer",
          location: "Johannesburg",
          matched: 1,
          totalEvaluable: 2,
          totalListed: 2,
          notEvaluated: 0,
          percentage: 50,
          summary: "50% of listed requirements matched",
        },
      ],
      pagination: { limit: 20, offset: 0, returned: 1 },
    });
    expect(db.calls[0]?.params).toEqual(["user1"]);
    expect(
      db.calls.find((call) => call.table === candidateSkills)?.params,
    ).toEqual(["c1"]);
    expect(
      db.calls.find((call) => call.table === vacancyRequirements)?.params,
    ).toEqual([id(1)]);
    for (const projection of db.projections.filter(
      (item) => item.comparisonKey,
    ))
      expect(
        new PgDialect().sqlToQuery(projection.comparisonKey as SQL).sql,
      ).toContain("public.matching_skill_name_key");
  });
  it.each([null, "Employer", "Recruiter"] as const)(
    "denies %s discovery",
    async (role) => {
      const db = new ReadDatabase();
      const identity =
        role === null
          ? null
          : { userId: "user1", roleAssignments: [{ role, companyId: null }] };
      expect(
        (await app(db, identity).inject({ method: "GET", url })).statusCode,
      ).toBe(role === null ? 401 : 403);
      expect(db.transaction).not.toHaveBeenCalled();
    },
  );
  it.each([
    "candidateId=c2",
    "userId=user2",
    "companyId=other",
    "percentage=100",
    "matched=5",
    "rankingScore=100",
    "skills=React",
    "minMatch=80",
    "unknown=value",
    "toString=value",
  ])("rejects forbidden query %s before stripping", async (query) => {
    const db = new ReadDatabase();
    const response = await app(db).inject({
      method: "GET",
      url: `${url}?${query}`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_REQUEST");
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it("reports missing candidate profile without falling back to another candidate", async () => {
    const db = new ReadDatabase();
    db.candidateRows = [db.candidateRows[1]!];
    expect((await app(db).inject({ method: "GET", url })).json()).toEqual({
      error: { code: "CANDIDATE_NOT_FOUND" },
    });
  });
  it("preserves full, partial, zero, mixed, all-legacy and empty matching semantics", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = [1, 2, 3, 4, 5, 6].map((n) => vacancy(n));
    db.requirementRows = [
      requirement(1, "HTML"),
      requirement(2, "HTML"),
      requirement(2, "React", false),
      requirement(3, "React"),
      requirement(4, "HTML", false),
      requirement(4, null),
      requirement(5, null),
    ];
    const server = app(db);
    const response = await server.inject({ method: "GET", url });
    const items = response.json().items;
    expect(items.find((item: Row) => item.vacancyId === id(1))).toMatchObject({
      matched: 1,
      percentage: 100,
    });
    expect(items.find((item: Row) => item.vacancyId === id(2))).toMatchObject({
      matched: 1,
      totalEvaluable: 2,
      percentage: 50,
    });
    expect(items.find((item: Row) => item.vacancyId === id(3))).toMatchObject({
      matched: 0,
      percentage: 0,
    });
    expect(items.find((item: Row) => item.vacancyId === id(4))).toMatchObject({
      matched: 1,
      totalEvaluable: 1,
      totalListed: 2,
      notEvaluated: 1,
      percentage: 100,
      summary: "100% of evaluable listed requirements matched",
    });
    expect(items.find((item: Row) => item.vacancyId === id(5))).toMatchObject({
      totalEvaluable: 0,
      totalListed: 1,
      notEvaluated: 1,
      percentage: null,
      summary: "No structured requirements available to compare",
    });
    expect(items.find((item: Row) => item.vacancyId === id(6))).toMatchObject({
      totalEvaluable: 0,
      totalListed: 0,
      notEvaluated: 0,
      percentage: null,
    });
    for (const item of items) {
      const detailed = (
        await server.inject({
          method: "GET",
          url: `/candidate/vacancies/${item.vacancyId}/match`,
        })
      ).json();
      for (const key of [
        "matched",
        "totalEvaluable",
        "totalListed",
        "notEvaluated",
        "percentage",
        "summary",
      ])
        expect(item[key]).toEqual(detailed[key]);
    }
    const detailed = (
      await server.inject({
        method: "GET",
        url: `/candidate/vacancies/${id(2)}/match`,
      })
    ).json();
    expect(detailed.missingRequirements[0].priority).toBe("PREFERRED");
    expect(detailed.matchedRequirements[0].priority).toBe("REQUIRED");
  });
  it.each([20, 40, 60, 80])(
    "keeps a %i percent vacancy discoverable without thresholds",
    async (percentage) => {
      const db = new ReadDatabase();
      db.vacancyRows = [vacancy(1)];
      db.requirementRows = ["HTML", "CSS", "JavaScript", "Git", "React"].map(
        (name) => requirement(1, name),
      );
      db.skillRows = ["HTML", "CSS", "JavaScript", "Git"]
        .slice(0, percentage / 20)
        .map((skillName, index) => ({
          id: `s${index}`,
          candidateId: "c1",
          skillName,
        }));
      expect(
        (await app(db).inject({ method: "GET", url })).json().items[0]
          .percentage,
      ).toBe(percentage);
    },
  );

  it("orders all eligible matches before slicing, including null date and ID tie-breaks", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = [
      vacancy(9, "2026-10-03"),
      vacancy(8, "2026-10-03"),
      vacancy(7, "2026-10-02"),
      vacancy(6, "2026-10-01"),
      vacancy(5, "2026-10-04"),
      vacancy(4, "2026-10-03"),
      vacancy(3, "2026-10-03"),
      vacancy(2, "2026-10-02"),
      vacancy(1, "2026-10-01"),
    ];
    db.requirementRows = [
      requirement(1, "HTML"),
      requirement(2, "HTML"),
      requirement(3, "HTML"),
      requirement(4, "HTML"),
      requirement(5, "HTML"),
      requirement(5, "React"),
      requirement(6, "React"),
    ];
    const server = app(db);
    const first = (await server.inject({ method: "GET", url })).json();
    expect(first.items.map((item: Row) => item.vacancyId)).toEqual(
      [3, 4, 2, 1, 5, 6, 8, 9, 7].map(id),
    );
    expect((await server.inject({ method: "GET", url })).json()).toEqual(first);
    expect(
      (
        await server.inject({ method: "GET", url: `${url}?limit=2&offset=1` })
      ).json(),
    ).toMatchObject({
      items: [first.items[1], first.items[2]],
      pagination: { limit: 2, offset: 1, returned: 2 },
    });
  });
  it("defaults to 20, supports limit 100 and offset beyond the last page", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = Array.from({ length: 105 }, (_, n) => vacancy(n + 1));
    const server = app(db);
    expect(
      (await server.inject({ method: "GET", url })).json().pagination,
    ).toEqual({ limit: 20, offset: 0, returned: 20 });
    expect(
      (await server.inject({ method: "GET", url: `${url}?limit=100` })).json()
        .pagination,
    ).toEqual({ limit: 100, offset: 0, returned: 100 });
    expect(
      (await server.inject({ method: "GET", url: `${url}?offset=200` })).json(),
    ).toEqual({
      items: [],
      pagination: { limit: 20, offset: 200, returned: 0 },
    });
  });
  it.each([
    "limit=0",
    "limit=-1",
    "limit=101",
    "limit=1.5",
    "limit=text",
    "limit=",
    "limit=1&limit=2",
    "offset=-1",
    "offset=0.5",
    "offset=text",
    "offset=",
    "offset=9007199254740992",
  ])("rejects invalid pagination %s", async (query) => {
    const response = await app(new ReadDatabase()).inject({
      method: "GET",
      url: `${url}?${query}`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_REQUEST");
  });
  it("applies public discovery text/location semantics before ordering and pagination", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = [
      vacancy(1),
      {
        ...vacancy(2),
        title: "Designer",
        description: "Developer tools",
        location: "Cape Town",
      },
      { ...vacancy(3), title: "Other", description: null },
    ];
    db.requirementRows = [requirement(1, "React"), requirement(2, "HTML")];
    const server = app(db);
    const publicResponse = await server.inject({
      method: "GET",
      url: "/vacancies?q=DEVELOPER&location=joh",
    });
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json().map((row: Row) => row.id)).toEqual([id(1)]);
    const filtered = (
      await server.inject({
        method: "GET",
        url: `${url}?q=DEVELOPER&location=joh&limit=1`,
      })
    ).json();
    expect(filtered.items.map((item: Row) => item.vacancyId)).toEqual([id(1)]);
    expect(
      (await server.inject({ method: "GET", url: `${url}?q=tools` }))
        .json()
        .items.map((item: Row) => item.vacancyId),
    ).toEqual([id(2)]);
    expect(
      (await server.inject({ method: "GET", url: `${url}?q=no-result` })).json()
        .items,
    ).toEqual([]);
    const query = db.calls.find(
      (call) => call.table === vacancies && call.params.includes("%DEVELOPER%"),
    )!;
    expect(query.sql).toContain('"vacancies"."title" ilike');
    expect(query.sql).toContain('"vacancies"."description" ilike');
    expect(query.sql).toContain('"vacancies"."location" ilike');
    expect(query.params).toEqual([
      "OPEN",
      "%DEVELOPER%",
      "%DEVELOPER%",
      "%joh%",
    ]);
  });
  it("reflects current skills and requirements when a DRAFT vacancy later opens", async () => {
    const db = new ReadDatabase();
    db.vacancyRows = [vacancy(1, undefined, "DRAFT")];
    db.requirementRows = [requirement(1, "HTML")];
    const server = app(db);
    expect((await server.inject({ method: "GET", url })).json().items).toEqual(
      [],
    );
    db.requirementRows.push(requirement(1, "CSS", false));
    db.vacancyRows[0]!.status = "OPEN";
    expect(
      (await server.inject({ method: "GET", url })).json().items[0].percentage,
    ).toBe(50);
    db.skillRows.push({ id: "s3", candidateId: "c1", skillName: " CSS " });
    expect(
      (await server.inject({ method: "GET", url })).json().items[0].percentage,
    ).toBe(100);
    db.skillRows = db.skillRows.filter((row) => row.id !== "s1");
    expect(
      (await server.inject({ method: "GET", url })).json().items[0].percentage,
    ).toBe(50);
  });
  it.each(["Applied", "Reviewing", "Shortlisted", "Rejected", "Withdrawn"])(
    "keeps vacancy visible regardless of %s application and makes no writes",
    async (status) => {
      const db = new ReadDatabase();
      db.vacancyRows = [vacancy(1)];
      db.applicationRows = [
        {
          id: "app1",
          vacancyId: id(1),
          candidateId: "c1",
          currentStatus: status,
        },
      ];
      const before = structuredClone({
        applications: db.applicationRows,
        history: db.historyRows,
        skills: db.skillRows,
        vacancies: db.vacancyRows,
        requirements: db.requirementRows,
      });
      const response = await app(db).inject({ method: "GET", url });
      expect(response.json().items).toHaveLength(1);
      expect({
        applications: db.applicationRows,
        history: db.historyRows,
        skills: db.skillRows,
        vacancies: db.vacancyRows,
        requirements: db.requirementRows,
      }).toEqual(before);
      expect(db.insert).not.toHaveBeenCalled();
      expect(db.update).not.toHaveBeenCalled();
      expect(db.delete).not.toHaveBeenCalled();
      expect(db.calls).toHaveLength(4);
      expect(db.transaction).toHaveBeenCalledOnce();
    },
  );
});
