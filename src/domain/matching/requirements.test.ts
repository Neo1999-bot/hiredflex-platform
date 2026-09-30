import { describe, expect, it } from "vitest";
import {
  compareRequirements,
  InvalidMatchingDataError,
  normalizeSkillName,
  type ListedRequirement,
} from "./requirements.js";

function requirement(
  id: string,
  skillName: string | null,
  required = true,
): ListedRequirement {
  return {
    id,
    skillName,
    description: "Existing requirement",
    category: "SKILL",
    required,
  };
}

describe("explainable requirement comparison", () => {
  it("compares canonical database keys without losing display names", () => {
    const result = compareRequirements(
      [{ ...requirement("r1", "I"), comparisonKey: "ı" }],
      [{ id: "s1", skillName: "ı", comparisonKey: "ı" }],
    );
    expect(result.matchedRequirements[0]).toMatchObject({
      name: "I",
      evidence: { skillName: "ı" },
    });
  });
  it.each([
    ["HTML", "HTML"],
    ["JavaScript", "javascript"],
    [" \tHTML\n", "html"],
    ["\u00a0Git\u3000", " GIT "],
  ])("matches normalized skill %s against %s", (name, evidence) => {
    const result = compareRequirements(
      [requirement("r1", name)],
      [{ id: "s1", skillName: evidence }],
    );
    expect(result.percentage).toBe(100);
    expect(result.matchedRequirements[0]).toMatchObject({
      determination: "EXACT_NORMALIZED_SKILL",
      evidence: { category: "CANDIDATE_SKILL", skillId: "s1" },
    });
  });

  it("reports the approved four of five example without weighting", () => {
    const names = ["HTML", "CSS", "JavaScript", "Git", "React"];
    const result = compareRequirements(
      names.map((name, i) => requirement(`r${i}`, name, i !== 4)),
      names.slice(0, 4).map((skillName, i) => ({ id: `s${i}`, skillName })),
    );
    expect(result).toMatchObject({
      matched: 4,
      totalEvaluable: 5,
      totalListed: 5,
      notEvaluated: 0,
      percentage: 80,
      summary: "80% of listed requirements matched",
      informational: true,
    });
    expect(result.missingRequirements).toEqual([
      expect.objectContaining({
        name: "React",
        priority: "PREFERRED",
        category: "SKILL",
        determination: "NO_EXACT_SKILL_EVIDENCE",
        evidence: null,
      }),
    ]);
    expect(
      result.matchedRequirements.every((item) => item.priority === "REQUIRED"),
    ).toBe(true);
  });

  it("reports zero matches without inferring synonyms or fuzzy matches", () => {
    const result = compareRequirements(
      [requirement("r1", "JS")],
      [{ id: "s1", skillName: "JavaScript" }],
    );
    expect(result).toMatchObject({
      matched: 0,
      totalEvaluable: 1,
      totalListed: 1,
      notEvaluated: 0,
      percentage: 0,
    });
  });

  it("reports complete matches", () => {
    expect(
      compareRequirements(
        [requirement("r1", "Git"), requirement("r2", "CSS")],
        [
          { id: "s1", skillName: "Git" },
          { id: "s2", skillName: "CSS" },
        ],
      ),
    ).toMatchObject({
      matched: 2,
      totalEvaluable: 2,
      totalListed: 2,
      notEvaluated: 0,
      percentage: 100,
    });
  });

  it.each([
    [1, 3, 33],
    [2, 3, 67],
    [1, 8, 13],
  ])("rounds %i of %i to %i percent", (matched, total, percentage) => {
    const requirements = Array.from({ length: total }, (_, i) =>
      requirement(`r${i}`, `skill${i}`),
    );
    const skills = Array.from({ length: matched }, (_, i) => ({
      id: `s${i}`,
      skillName: `skill${i}`,
    }));
    expect(compareRequirements(requirements, skills).percentage).toBe(
      percentage,
    );
  });

  it("returns no percentage when there are no listed requirements", () => {
    expect(compareRequirements([], [])).toMatchObject({
      matched: 0,
      totalEvaluable: 0,
      totalListed: 0,
      notEvaluated: 0,
      percentage: null,
      summary: "No structured requirements available to compare",
    });
  });

  it("excludes legacy requirements from missing evidence and the percentage", () => {
    const names = ["HTML", "CSS", "JavaScript", "Git"];
    const result = compareRequirements(
      [
        ...names.map((name, i) => requirement(`r${i}`, name)),
        requirement("legacy", null, false),
      ],
      names.map((skillName, i) => ({ id: `s${i}`, skillName })),
    );
    expect(result).toMatchObject({
      matched: 4,
      totalEvaluable: 4,
      totalListed: 5,
      notEvaluated: 1,
      percentage: 100,
      summary: "100% of evaluable listed requirements matched",
    });
    expect(result.missingRequirements).toEqual([]);
    expect(result.notEvaluatedRequirements).toEqual([
      expect.objectContaining({
        requirementId: "legacy",
        name: "Existing requirement",
        category: "SKILL",
        priority: "PREFERRED",
        matched: null,
        determination: "NO_STRUCTURED_SKILL",
        evidence: null,
      }),
    ]);
    expect(result).not.toHaveProperty("total");
  });

  it("returns null percentage for three legacy requirements even with matching descriptive skill evidence", () => {
    const result = compareRequirements(
      [
        requirement("r1", null),
        requirement("r2", null, false),
        requirement("r3", null),
      ],
      [{ id: "s1", skillName: "Existing requirement" }],
    );
    expect(result).toMatchObject({
      matched: 0,
      totalEvaluable: 0,
      totalListed: 3,
      notEvaluated: 3,
      percentage: null,
      summary: "No structured requirements available to compare",
      matchedRequirements: [],
      missingRequirements: [],
    });
    expect(result.notEvaluatedRequirements).toHaveLength(3);
    expect(
      result.notEvaluatedRequirements.every(
        (item) =>
          item.matched === null &&
          item.evidence === null &&
          item.determination === "NO_STRUCTURED_SKILL",
      ),
    ).toBe(true);
  });

  it("rounds mixed matched, missing and non-evaluable requirements using only structured requirements", () => {
    const result = compareRequirements(
      [
        requirement("r1", "HTML"),
        requirement("r2", "CSS", false),
        requirement("r3", "Git"),
        { ...requirement("r4", null), category: "EXPERIENCE" },
      ],
      [{ id: "s1", skillName: " html " }],
    );
    expect(result).toMatchObject({
      matched: 1,
      totalEvaluable: 3,
      totalListed: 4,
      notEvaluated: 1,
      percentage: 33,
      summary: "33% of evaluable listed requirements matched",
    });
    expect(
      result.matchedRequirements.map((item) => item.requirementId),
    ).toEqual(["r1"]);
    expect(
      result.missingRequirements.map((item) => item.requirementId),
    ).toEqual(["r2", "r3"]);
    expect(result.missingRequirements[0]).toMatchObject({
      matched: false,
      priority: "PREFERRED",
    });
    expect(result.notEvaluatedRequirements[0]).toMatchObject({
      matched: null,
      category: "EXPERIENCE",
      priority: "REQUIRED",
    });
  });

  it("does not inflate matches with duplicate candidate evidence and chooses a stable ID", () => {
    const result = compareRequirements(
      [requirement("r1", "HTML")],
      [
        { id: "s2", skillName: "html" },
        { id: "s1", skillName: " HTML " },
      ],
    );
    expect(result).toMatchObject({
      matched: 1,
      totalEvaluable: 1,
      totalListed: 1,
      notEvaluated: 0,
    });
    expect(result.matchedRequirements[0]?.evidence?.skillId).toBe("s1");
  });

  it("rejects duplicate normalized requirement names rather than inflating the denominator", () => {
    expect(() =>
      compareRequirements(
        [requirement("r1", "HTML"), requirement("r2", " html ", false)],
        [],
      ),
    ).toThrow(InvalidMatchingDataError);
  });

  it("rejects empty structured names", () => {
    expect(() => compareRequirements([requirement("r1", " \t")], [])).toThrow(
      InvalidMatchingDataError,
    );
    expect(() =>
      compareRequirements([], [{ id: "s1", skillName: "\n" }]),
    ).toThrow(InvalidMatchingDataError);
    expect(normalizeSkillName(" CSS ")).toBe("css");
  });

  it("returns identical results for repeated inputs and reordered rows without modifying inputs", () => {
    const requirements = [
      requirement("r2", "Git"),
      requirement("r1", "CSS"),
      requirement("r3", null),
    ];
    const skills = [
      { id: "s2", skillName: "Git" },
      { id: "s1", skillName: "CSS" },
    ];
    const before = structuredClone({ requirements, skills });
    const result = compareRequirements(requirements, skills);
    expect(compareRequirements(requirements, skills)).toEqual(result);
    expect(
      compareRequirements([...requirements].reverse(), [...skills].reverse()),
    ).toEqual(result);
    expect({ requirements, skills }).toEqual(before);
  });
});
