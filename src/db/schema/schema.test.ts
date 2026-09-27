import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  applicationStatusHistory,
  applications,
  candidates,
  companies,
  recruiters,
  userRoles,
  users,
  vacancies,
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

  it("declares a partial unique index for the currently active application states", () => {
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
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "applications_one_active_candidate_vacancy"',
    );
    expect(migration).toContain(
      "WHERE \"applications\".\"current_status\" in ('Applied', 'Reviewing')",
    );
  });

  it("persists allowed application status history with actor and application references", () => {
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

  it("applies the checked-in migration once in the declared order", () => {
    const [entry] = migrationJournal.entries;
    expect(entry).toMatchObject({ idx: 0, tag: "0000_phase3_core_foundation" });
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
