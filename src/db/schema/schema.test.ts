import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  applicationStatus,
  applicationStatusHistory,
  applications,
  candidates,
  companies,
  recruiters,
  userRoles,
  users,
  vacancies,
  vacancyStatus,
} from "./index.js";

const migration = readFileSync(
  new URL("../migrations/0000_phase3_core_foundation.sql", import.meta.url),
  "utf8",
);
const migrationJournal = JSON.parse(
  readFileSync(
    new URL("../migrations/meta/_journal.json", import.meta.url),
    "utf8",
  ),
) as { entries: { idx: number; tag: string }[] };
const lifecycleMigration = readFileSync(
  new URL(
    "../migrations/0001_canonical_vacancy_and_application_lifecycle.sql",
    import.meta.url,
  ),
  "utf8",
);

function hasForeignKeyTo(
  table: Parameters<typeof getTableConfig>[0],
  columnName: string,
  target: Parameters<typeof getTableConfig>[0],
): boolean {
  return getTableConfig(table).foreignKeys.some((foreignKey) => {
    const reference = foreignKey.reference();
    return (
      reference.columns.some((column) => column.name === columnName) &&
      reference.foreignTable === target
    );
  });
}

describe("PostgreSQL persistence schema", () => {
  it("keeps applications as rows linked to one candidate and one vacancy", () => {
    const config = getTableConfig(applications);
    expect(
      config.columns.find((column) => column.name === "candidate_id")?.notNull,
    ).toBe(true);
    expect(
      config.columns.find((column) => column.name === "vacancy_id")?.notNull,
    ).toBe(true);
    expect(hasForeignKeyTo(applications, "candidate_id", candidates)).toBe(
      true,
    );
    expect(hasForeignKeyTo(applications, "vacancy_id", vacancies)).toBe(true);
    expect(config.columns.filter((column) => column.primary)).toHaveLength(1);
  });

  it("declares a partial unique index covering all active application states", () => {
    const activeIndex = getTableConfig(applications).indexes.find(
      (index) =>
        index.config.name === "applications_one_active_candidate_vacancy",
    );
    expect(activeIndex?.config.unique).toBe(true);
    expect(
      activeIndex?.config.columns.map((column) =>
        "name" in column ? column.name : undefined,
      ),
    ).toEqual(["candidate_id", "vacancy_id"]);
    expect(activeIndex?.config.where).toBeDefined();
    expect(lifecycleMigration).toContain(
      'CREATE UNIQUE INDEX "applications_one_active_candidate_vacancy"',
    );
    expect(lifecycleMigration).toContain(
      "WHERE \"applications\".\"current_status\" IN ('Applied', 'Reviewing', 'Shortlisted')",
    );
  });

  it("persists allowed application status history with actor and application references", () => {
    expect(applicationStatus.enumValues).toEqual([
      "Applied",
      "Reviewing",
      "Shortlisted",
      "Rejected",
      "Withdrawn",
    ]);
    const config = getTableConfig(applicationStatusHistory);
    expect(config.checks.map((check) => check.name)).toContain(
      "application_status_history_transition_allowed",
    );
    expect(
      hasForeignKeyTo(applicationStatusHistory, "application_id", applications),
    ).toBe(true);
    expect(
      hasForeignKeyTo(applicationStatusHistory, "actor_user_id", users),
    ).toBe(true);
    expect(migration).toContain('CREATE TABLE "application_status_history"');
    expect(migration).toContain(
      '"application_status_history_transition_allowed" CHECK',
    );
    expect(migration).toContain(
      "'Applied' and \"application_status_history\".\"to_status\" in ('Reviewing', 'Shortlisted', 'Rejected')",
    );
    expect(migration).toContain(
      "'Reviewing' and \"application_status_history\".\"to_status\" in ('Shortlisted', 'Rejected')",
    );
    expect(lifecycleMigration).toContain(
      "'Applied', 'Reviewing', 'Shortlisted', 'Rejected', 'Withdrawn'",
    );
    expect(lifecycleMigration).toContain(
      "'Shortlisted' AND \"application_status_history\".\"to_status\" = 'Withdrawn'",
    );
    expect(lifecycleMigration).toContain(
      "'Reviewing', 'Shortlisted', 'Rejected', 'Withdrawn'",
    );
  });

  it("limits persisted vacancy states to DRAFT, OPEN, and CLOSED", () => {
    expect(vacancyStatus.enumValues).toEqual(["DRAFT", "OPEN", "CLOSED"]);
    expect(lifecycleMigration).toContain(
      "CREATE TYPE \"public\".\"vacancy_status\" AS ENUM('DRAFT', 'OPEN', 'CLOSED')",
    );
    expect(lifecycleMigration).toContain(
      'ALTER COLUMN "status" TYPE "public"."vacancy_status"',
    );
  });

  it("keeps recruiter ownership at vacancy level and employer membership company-scoped", () => {
    expect(
      hasForeignKeyTo(vacancies, "assigned_recruiter_id", recruiters),
    ).toBe(true);
    expect(hasForeignKeyTo(vacancies, "company_id", companies)).toBe(true);
    expect(userRoles.companyId.notNull).toBe(false);
    expect(
      getTableConfig(userRoles).indexes.some(
        (index) =>
          index.config.name === "user_roles_company_unique" &&
          index.config.unique,
      ),
    ).toBe(true);
    expect(hasForeignKeyTo(userRoles, "company_id", companies)).toBe(true);
  });

  it("orders the checked-in lifecycle migration after the original foundation", () => {
    expect(migrationJournal.entries.slice(0, 2)).toMatchObject([
      { idx: 0, tag: "0000_phase3_core_foundation" },
      {
        idx: 1,
        tag: "0001_canonical_vacancy_and_application_lifecycle",
      },
    ]);
    expect(migration.indexOf('CREATE TABLE "candidates"')).toBeLessThan(
      migration.indexOf('CREATE TABLE "applications"'),
    );
    expect(migration.indexOf('CREATE TABLE "vacancies"')).toBeLessThan(
      migration.indexOf('CREATE TABLE "applications"'),
    );
    expect(migration.indexOf('CREATE TABLE "applications"')).toBeLessThan(
      migration.indexOf('CREATE TABLE "application_status_history"'),
    );
  });
});
