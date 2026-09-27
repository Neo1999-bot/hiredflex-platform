import { afterEach, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "./auth/authorization.js";
import { buildApp } from "./app.js";
import type { Database } from "./db/client.js";
import {
  applicationStatusHistory,
  applications,
  candidates,
  vacancies,
} from "./db/schema/index.js";

type Row = Record<string, unknown>;

class FakeQuery implements PromiseLike<unknown> {
  table: unknown;
  projection: Row | undefined;

  constructor(
    private readonly database: FakeDatabase,
    projection?: Row,
  ) {
    this.projection = projection;
  }

  from(table: unknown): this {
    this.table = table;
    return this;
  }

  where(): this {
    return this;
  }

  innerJoin(): this {
    return this;
  }

  leftJoin(): this {
    return this;
  }

  orderBy(): this {
    return this;
  }

  limit(): Promise<unknown> {
    return Promise.resolve(this.rows());
  }

  for(): Promise<unknown> {
    return Promise.resolve(this.rows());
  }

  private rows(): unknown {
    const rows = this.database.rowsFor(this.table);
    if (
      this.table === vacancies &&
      this.projection?.status === vacancies.status &&
      this.projection?.title === vacancies.title
    ) {
      return rows.filter((row) => row.status === "OPEN");
    }
    if (
      this.table === applications &&
      Object.keys(this.projection ?? {}).length === 1 &&
      this.projection?.currentStatus === applications.currentStatus
    ) {
      return rows.filter((row) =>
        ["Applied", "Reviewing", "Shortlisted"].includes(
          row.currentStatus as string,
        ),
      );
    }
    return rows;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }
}

class FakeInsert implements PromiseLike<void> {
  constructor(private readonly row: Row) {}

  returning(): Promise<Row[]> {
    return Promise.resolve([this.row]);
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(undefined).then(onfulfilled, onrejected);
  }
}

class FakeUpdateResult implements PromiseLike<void> {
  constructor(private readonly row?: Row) {}

  returning(): Promise<Row[]> {
    return Promise.resolve(this.row ? [this.row] : []);
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(undefined).then(onfulfilled, onrejected);
  }
}

class FakeDatabase {
  candidateRows: Row[] = [
    { id: "candidate-record-1", userId: "candidate-user-1" },
  ];
  vacancyRows: Row[] = [
    { id: "10000000-0000-4000-8000-000000000001", status: "OPEN" },
  ];
  applicationRows: Row[] = [];
  historyRows: Row[] = [];
  transactionCount = 0;
  failApplicationInsertWithUniqueViolation = false;
  failHistoryInsert = false;
  private nextId = 1;

  rowsFor(table: unknown): Row[] {
    if (table === candidates) return this.candidateRows;
    if (table === vacancies) return this.vacancyRows;
    if (table === applications) return this.applicationRows;
    if (table === applicationStatusHistory) return this.historyRows;
    return [];
  }

  select(projection?: Row): FakeQuery {
    return new FakeQuery(this, projection);
  }

  insert(table: unknown) {
    return {
      values: (values: Row) => {
        if (table === applicationStatusHistory && this.failHistoryInsert) {
          throw new Error("simulated status history failure");
        }
        if (
          table === applications &&
          this.failApplicationInsertWithUniqueViolation
        ) {
          const error = new Error("duplicate active application") as Error & {
            code: string;
            constraint_name: string;
          };
          error.code = "23505";
          error.constraint_name = "applications_one_active_candidate_vacancy";
          throw error;
        }
        const row: Row = {
          id: `generated-${this.nextId++}`,
          currentStatus: "Applied",
          submittedAt: new Date("2026-09-27T00:00:00.000Z"),
          ...values,
        };
        this.rowsFor(table).push(row);
        return new FakeInsert(row);
      },
    };
  }

  update(table: unknown) {
    const values: Row = {};
    const row = this.rowsFor(table)[0];
    return {
      set: (updates: Row) => {
        Object.assign(values, updates);
        return {
          where: () => {
            if (row) Object.assign(row, values);
            return new FakeUpdateResult(row);
          },
          returning: () => {
            if (row) Object.assign(row, values);
            return Promise.resolve(row ? [row] : []);
          },
        };
      },
    };
  }

  async transaction<T>(
    callback: (transaction: this) => Promise<T>,
  ): Promise<T> {
    this.transactionCount += 1;
    const applicationsBefore = structuredClone(this.applicationRows);
    const historyBefore = structuredClone(this.historyRows);
    try {
      return await callback(this);
    } catch (error) {
      this.applicationRows = applicationsBefore;
      this.historyRows = historyBefore;
      throw error;
    }
  }
}

const candidate: AuthenticatedPrincipal = {
  userId: "candidate-user-1",
  roleAssignments: [{ role: "Candidate", companyId: null }],
};

describe("candidate application API", () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeApp?.();
    await closeApp?.();
    closeApp = undefined;
  });

  function createApp(
    database: FakeDatabase,
    principal: AuthenticatedPrincipal | null = candidate,
  ) {
    const app = buildApp({
      db: database as unknown as Database,
      checkDatabase: async () => undefined,
      resolvePrincipal: () => principal,
      logger: false,
    });
    closeApp = () => app.close();
    return app;
  }

  it("creates an Applied application and its initial history atomically", async () => {
    const database = new FakeDatabase();
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().currentStatus).toBe("Applied");
    expect(database.transactionCount).toBe(1);
    expect(database.applicationRows).toHaveLength(1);
    expect(database.historyRows).toMatchObject([
      {
        applicationId: "generated-1",
        fromStatus: null,
        toStatus: "Applied",
        actorUserId: candidate.userId,
      },
    ]);
  });

  it("exposes OPEN vacancy discovery and hides non-open vacancy details", async () => {
    const database = new FakeDatabase();
    database.vacancyRows.push({
      id: "10000000-0000-4000-8000-000000000002",
      status: "CLOSED",
    });
    const app = createApp(database);
    const list = await app.inject({ method: "GET", url: "/vacancies" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
    expect(list.json()[0].status).toBe("OPEN");
    database.vacancyRows = [database.vacancyRows[1]!];
    const closed = await app.inject({
      method: "GET",
      url: "/vacancies/10000000-0000-4000-8000-000000000002",
    });
    expect(closed.statusCode).toBe(404);
  });

  it("lists and returns application details only after resolving the candidate record", async () => {
    const database = new FakeDatabase();
    database.applicationRows.push({
      id: "20000000-0000-4000-8000-000000000001",
      candidateId: "candidate-record-1",
      vacancyId: "10000000-0000-4000-8000-000000000001",
      currentStatus: "Applied",
      submittedAt: new Date("2026-09-27T00:00:00.000Z"),
    });
    const app = createApp(database);
    const list = await app.inject({
      method: "GET",
      url: "/candidate/applications",
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()[0]).toMatchObject({
      id: "20000000-0000-4000-8000-000000000001",
      currentStatus: "Applied",
    });
    const detail = await app.inject({
      method: "GET",
      url: "/candidate/applications/20000000-0000-4000-8000-000000000001",
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().id).toBe("20000000-0000-4000-8000-000000000001");
  });

  it.each(["DRAFT", "CLOSED"] as const)(
    "rejects submission when a vacancy is %s",
    async (status) => {
      const database = new FakeDatabase();
      database.vacancyRows[0]!.status = status;
      const response = await createApp(database).inject({
        method: "POST",
        url: "/candidate/applications",
        payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
      });
      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe("VACANCY_NOT_OPEN");
      expect(database.applicationRows).toHaveLength(0);
    },
  );

  it("rejects reapplication while a terminal old application targets a closed vacancy", async () => {
    const database = new FakeDatabase();
    database.vacancyRows[0]!.status = "CLOSED";
    database.applicationRows.push({
      id: "old-application",
      candidateId: "candidate-record-1",
      vacancyId: "10000000-0000-4000-8000-000000000001",
      currentStatus: "Withdrawn",
    });
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });
    expect(response.statusCode).toBe(409);
    expect(database.applicationRows).toHaveLength(1);
  });

  it.each(["Applied", "Reviewing", "Shortlisted"] as const)(
    "rejects another application while the existing application is %s",
    async (status) => {
      const database = new FakeDatabase();
      database.applicationRows.push({
        id: "existing-application",
        candidateId: "candidate-record-1",
        vacancyId: "10000000-0000-4000-8000-000000000001",
        currentStatus: status,
      });
      const response = await createApp(database).inject({
        method: "POST",
        url: "/candidate/applications",
        payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
      });
      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe("ACTIVE_APPLICATION_EXISTS");
      expect(database.applicationRows).toHaveLength(1);
    },
  );

  it.each(["Rejected", "Withdrawn"] as const)(
    "creates a new record after terminal status %s and preserves the old record",
    async (status) => {
      const database = new FakeDatabase();
      const oldApplication = {
        id: "old-application",
        candidateId: "candidate-record-1",
        vacancyId: "10000000-0000-4000-8000-000000000001",
        currentStatus: status,
      };
      database.applicationRows.push(oldApplication);
      const response = await createApp(database).inject({
        method: "POST",
        url: "/candidate/applications",
        payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
      });
      expect(response.statusCode).toBe(201);
      expect(database.applicationRows).toHaveLength(2);
      expect(database.applicationRows[0]).toEqual(oldApplication);
      expect(database.applicationRows[1]).toMatchObject({
        id: "generated-1",
        currentStatus: "Applied",
      });
    },
  );

  it("ignores client-supplied candidate identity and application status", async () => {
    const database = new FakeDatabase();
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: {
        vacancyId: "10000000-0000-4000-8000-000000000001",
        candidateId: "candidate-record-2",
        currentStatus: "Shortlisted",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().candidateId).toBe("candidate-record-1");
    expect(response.json().currentStatus).toBe("Applied");
  });

  it("maps a concurrent active-application index conflict to HTTP 409", async () => {
    const database = new FakeDatabase();
    database.failApplicationInsertWithUniqueViolation = true;
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("ACTIVE_APPLICATION_EXISTS");
    expect(database.applicationRows).toHaveLength(0);
  });

  it("rolls back application insertion if initial history insertion fails", async () => {
    const database = new FakeDatabase();
    database.failHistoryInsert = true;
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });
    expect(response.statusCode).toBe(500);
    expect(database.applicationRows).toHaveLength(0);
    expect(database.historyRows).toHaveLength(0);
  });

  it("fails closed for a request without an authenticated principal", async () => {
    const response = await createApp(new FakeDatabase(), null).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("denies candidate access to recruiter application routes", async () => {
    const response = await createApp(new FakeDatabase()).inject({
      method: "GET",
      url: "/recruiter/vacancies/10000000-0000-4000-8000-000000000001/applications",
    });
    expect(response.statusCode).toBe(403);
  });

  it("does not find a candidate record for another authenticated user", async () => {
    const otherCandidate: AuthenticatedPrincipal = {
      userId: "candidate-user-2",
      roleAssignments: [{ role: "Candidate", companyId: null }],
    };
    const database = new FakeDatabase();
    database.candidateRows = [];
    const response = await createApp(database, otherCandidate).inject({
      method: "POST",
      url: "/candidate/applications",
      payload: { vacancyId: "10000000-0000-4000-8000-000000000001" },
    });
    expect(response.statusCode).toBe(404);
  });

  it("rejects withdrawal from a terminal application without changing it", async () => {
    const database = new FakeDatabase();
    database.applicationRows.push({
      id: "20000000-0000-4000-8000-000000000001",
      candidateId: "candidate-record-1",
      vacancyId: "10000000-0000-4000-8000-000000000001",
      currentStatus: "Rejected",
    });
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications/20000000-0000-4000-8000-000000000001/withdraw",
    });
    expect(response.statusCode).toBe(409);
    expect(database.applicationRows[0]?.currentStatus).toBe("Rejected");
    expect(database.historyRows).toHaveLength(0);
  });

  it("withdraws without deleting the application and records the transition", async () => {
    const database = new FakeDatabase();
    database.applicationRows.push({
      id: "20000000-0000-4000-8000-000000000001",
      candidateId: "candidate-record-1",
      vacancyId: "10000000-0000-4000-8000-000000000001",
      currentStatus: "Reviewing",
    });
    const response = await createApp(database).inject({
      method: "POST",
      url: "/candidate/applications/20000000-0000-4000-8000-000000000001/withdraw",
    });
    expect(response.statusCode).toBe(200);
    expect(database.applicationRows).toHaveLength(1);
    expect(database.applicationRows[0]?.currentStatus).toBe("Withdrawn");
    expect(database.historyRows).toMatchObject([
      {
        applicationId: "20000000-0000-4000-8000-000000000001",
        fromStatus: "Reviewing",
        toStatus: "Withdrawn",
        actorUserId: candidate.userId,
      },
    ]);
  });
});

describe("employer vacancy API", () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeApp?.();
    closeApp = undefined;
  });

  const companyOne = "30000000-0000-4000-8000-000000000001";
  const companyTwo = "30000000-0000-4000-8000-000000000002";

  function createEmployerApp(database: FakeDatabase, companyId = companyOne) {
    const principal: AuthenticatedPrincipal = {
      userId: "employer-user-1",
      roleAssignments: [{ role: "Employer", companyId }],
    };
    const app = buildApp({
      db: database as unknown as Database,
      checkDatabase: async () => undefined,
      resolvePrincipal: () => principal,
      logger: false,
    });
    closeApp = () => app.close();
    return app;
  }

  it("creates vacancies in DRAFT and ignores client-provided status", async () => {
    const database = new FakeDatabase();
    const response = await createEmployerApp(database).inject({
      method: "POST",
      url: "/employer/vacancies",
      payload: {
        companyId: companyOne,
        title: "Engineer",
        status: "OPEN",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe("DRAFT");
    expect(response.json().createdByUserId).toBe("employer-user-1");
  });

  it("enforces DRAFT → OPEN → CLOSED and rejects reopening", async () => {
    const database = new FakeDatabase();
    database.vacancyRows[0] = {
      id: "10000000-0000-4000-8000-000000000001",
      companyId: companyOne,
      createdByUserId: "employer-user-1",
      title: "Engineer",
      status: "DRAFT",
      closedAt: null,
    };
    const app = createEmployerApp(database);
    const opened = await app.inject({
      method: "POST",
      url: "/employer/vacancies/10000000-0000-4000-8000-000000000001/open",
    });
    expect(opened.statusCode).toBe(200);
    expect(database.vacancyRows[0]?.status).toBe("OPEN");
    const closed = await app.inject({
      method: "POST",
      url: "/employer/vacancies/10000000-0000-4000-8000-000000000001/close",
    });
    expect(closed.statusCode).toBe(200);
    expect(database.vacancyRows[0]?.status).toBe("CLOSED");
    const reopened = await app.inject({
      method: "POST",
      url: "/employer/vacancies/10000000-0000-4000-8000-000000000001/open",
    });
    expect(reopened.statusCode).toBe(409);
    expect(database.vacancyRows[0]?.status).toBe("CLOSED");
  });

  it("denies access outside the employer's company assignment", async () => {
    const response = await createEmployerApp(
      new FakeDatabase(),
      companyTwo,
    ).inject({
      method: "POST",
      url: "/employer/vacancies",
      payload: { companyId: companyOne, title: "Engineer" },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe("recruiter application API", () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeApp?.();
    closeApp = undefined;
  });

  const companyId = "30000000-0000-4000-8000-000000000001";
  const recruiterPrincipal: AuthenticatedPrincipal = {
    userId: "recruiter-user-1",
    roleAssignments: [{ role: "Recruiter", companyId }],
  };

  function createRecruiterApp(
    database: FakeDatabase,
    principal = recruiterPrincipal,
  ) {
    const app = buildApp({
      db: database as unknown as Database,
      checkDatabase: async () => undefined,
      resolvePrincipal: () => principal,
      logger: false,
    });
    closeApp = () => app.close();
    return app;
  }

  function addAssignedApplication(database: FakeDatabase, status = "Applied") {
    database.applicationRows.push({
      id: "20000000-0000-4000-8000-000000000001",
      candidateId: "candidate-record-1",
      vacancyId: "10000000-0000-4000-8000-000000000001",
      currentStatus: status,
      assignedRecruiterUserId: "recruiter-user-1",
      vacancyCompanyId: companyId,
    });
  }

  it("lets the assigned recruiter review an application and records the actor", async () => {
    const database = new FakeDatabase();
    addAssignedApplication(database);
    const response = await createRecruiterApp(database).inject({
      method: "POST",
      url: "/recruiter/applications/20000000-0000-4000-8000-000000000001/review",
    });
    expect(response.statusCode).toBe(200);
    expect(database.applicationRows[0]?.currentStatus).toBe("Reviewing");
    expect(database.historyRows).toMatchObject([
      {
        fromStatus: "Applied",
        toStatus: "Reviewing",
        actorUserId: recruiterPrincipal.userId,
      },
    ]);
  });

  it("denies an unassigned recruiter and rejects invalid transitions", async () => {
    const database = new FakeDatabase();
    addAssignedApplication(database);
    const unauthorized: AuthenticatedPrincipal = {
      userId: "recruiter-user-2",
      roleAssignments: [{ role: "Recruiter", companyId }],
    };
    const denied = await createRecruiterApp(database, unauthorized).inject({
      method: "POST",
      url: "/recruiter/applications/20000000-0000-4000-8000-000000000001/review",
    });
    expect(denied.statusCode).toBe(404);
    expect(database.applicationRows[0]?.currentStatus).toBe("Applied");

    closeApp = undefined;
    const invalidDatabase = new FakeDatabase();
    addAssignedApplication(invalidDatabase, "Shortlisted");
    const invalid = await createRecruiterApp(invalidDatabase).inject({
      method: "POST",
      url: "/recruiter/applications/20000000-0000-4000-8000-000000000001/reject",
    });
    expect(invalid.statusCode, JSON.stringify(invalid.json())).toBe(409);
    expect(invalidDatabase.applicationRows[0]?.currentStatus).toBe(
      "Shortlisted",
    );
    expect(invalidDatabase.historyRows).toHaveLength(0);
  });
});
