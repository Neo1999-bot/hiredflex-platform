import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SQL } from "drizzle-orm";
import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import {
  candidateSkills,
  candidates,
  vacancyRequirements,
  vacancies,
} from "./index.js";

const migration = readFileSync(
  new URL(
    "../migrations/0002_explainable_requirement_matching.sql",
    import.meta.url,
  ),
  "utf8",
);
const journal = JSON.parse(
  readFileSync(
    new URL("../migrations/meta/_journal.json", import.meta.url),
    "utf8",
  ),
) as {
  entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
};

describe("matching persistence foundation", () => {
  it("preserves legacy requirements while adding an explicit optional structured skill name", () => {
    expect(vacancyRequirements.skillName.notNull).toBe(false);
    expect(vacancyRequirements.required.notNull).toBe(true);
    expect(migration).toContain(
      'ALTER TABLE "vacancy_requirements" ADD COLUMN "skill_name" text',
    );
    expect(migration).not.toMatch(/^\s*(?:DROP|DELETE|UPDATE|TRUNCATE)\b/im);
    expect(
      getTableConfig(vacancyRequirements).foreignKeys.some(
        (fk) => fk.reference().foreignTable === vacancies,
      ),
    ).toBe(true);
  });

  it("persists stable candidate skill evidence scoped to one candidate with timestamps", () => {
    const config = getTableConfig(candidateSkills);
    expect(candidateSkills.id.primary).toBe(true);
    expect(candidateSkills.candidateId.notNull).toBe(true);
    expect(candidateSkills.skillName.notNull).toBe(true);
    expect(candidateSkills.createdAt.notNull).toBe(true);
    expect(candidateSkills.updatedAt.notNull).toBe(true);
    const foreignKey = config.foreignKeys.find(
      (fk) => fk.reference().foreignTable === candidates,
    );
    expect(foreignKey?.reference().columns[0]?.name).toBe("candidate_id");
    expect(foreignKey?.onDelete).toBe("restrict");
    expect(migration).toContain(
      'REFERENCES "public"."candidates"("id") ON DELETE restrict',
    );
  });

  it("rejects normalized duplicates per vacancy and candidate, including required/preferred duplicates", () => {
    for (const [table, owner, indexName] of [
      [vacancyRequirements, "vacancy_id", "vacancy_requirements_skill_unique"],
      [
        candidateSkills,
        "candidate_id",
        "candidate_skills_candidate_skill_unique",
      ],
    ] as const) {
      const index = getTableConfig(table).indexes.find(
        (item) => item.config.name === indexName,
      );
      expect(index?.config.unique).toBe(true);
      expect(index?.config.columns[0]).toHaveProperty("name", owner);
      const expression = index?.config.columns[1];
      if (!(expression instanceof SQL))
        throw new Error("Missing normalized index expression");
      expect(new PgDialect().sqlToQuery(expression).sql).toContain(
        "matching_skill_name_key",
      );
      expect(migration).toContain(`CREATE UNIQUE INDEX "${indexName}"`);
    }
    expect(migration).toContain('WHERE "skill_name" IS NOT NULL');
  });

  it("checks empty names and uses the same database normalization key for both indexes", () => {
    expect(
      getTableConfig(candidateSkills).checks.map((check) => check.name),
    ).toContain("candidate_skills_skill_name_nonempty");
    expect(
      getTableConfig(vacancyRequirements).checks.map((check) => check.name),
    ).toContain("vacancy_requirements_skill_name_nonempty");
    expect(migration).toContain(
      'CREATE FUNCTION "public"."matching_skill_name_key"(text)',
    );
    expect(migration).toContain("IMMUTABLE");
    expect(migration).toContain("lower(btrim($1");
    expect(migration).toContain("length(public.matching_skill_name_key");
  });

  it("orders the additive migration after the frozen Phase 3 migrations", () => {
    expect(journal.entries.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_phase3_core_foundation" },
      { idx: 1, tag: "0001_canonical_vacancy_and_application_lifecycle" },
      { idx: 2, tag: "0002_explainable_requirement_matching" },
    ]);
    expect(journal.entries[2]!.when).toBeGreaterThan(journal.entries[1]!.when);
    expect(journal.entries[2]!.breakpoints).toBe(true);
    expect(migration.indexOf("CREATE FUNCTION")).toBeLessThan(
      migration.indexOf("CREATE UNIQUE INDEX"),
    );
    expect(migration).not.toMatch(
      /ALTER TABLE "(?:applications|vacancies|application_status_history)"/,
    );
  });
});
