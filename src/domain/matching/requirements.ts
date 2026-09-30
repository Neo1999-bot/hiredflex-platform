export interface ListedRequirement {
  id: string;
  skillName: string | null;
  description: string;
  category: string;
  required: boolean;
  comparisonKey?: string | null;
}

export interface CandidateSkillEvidence {
  id: string;
  skillName: string;
  comparisonKey?: string;
}

// Domain/test fallback; PostgreSQL matching_skill_name_key is canonical for
// persisted/API comparisons. Unicode/locale equivalence is not guaranteed.
export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

export class InvalidMatchingDataError extends Error {
  constructor() {
    super(
      "Matching data contains an empty skill name or duplicate structured requirement",
    );
    this.name = "InvalidMatchingDataError";
  }
}

export function compareRequirements(
  requirements: readonly ListedRequirement[],
  skills: readonly CandidateSkillEvidence[],
) {
  // Stable IDs order explanations and select repeatable evidence if supplied
  // duplicate candidate skill evidence predates database validation.
  const skillByName = new Map<string, CandidateSkillEvidence>();
  for (const skill of [...skills].sort((a, b) => compareIds(a.id, b.id))) {
    const key = skill.comparisonKey ?? normalizeSkillName(skill.skillName);
    if (!key) throw new InvalidMatchingDataError();
    if (!skillByName.has(key)) skillByName.set(key, skill);
  }
  const seen = new Set<string>();
  const explanations = [...requirements]
    .sort((a, b) => compareIds(a.id, b.id))
    .map((requirement) => {
      const key =
        requirement.skillName === null
          ? null
          : (requirement.comparisonKey ??
            normalizeSkillName(requirement.skillName));
      if (key !== null) {
        if (!key || seen.has(key)) throw new InvalidMatchingDataError();
        seen.add(key);
      }
      const evidence = key === null ? undefined : skillByName.get(key);
      return {
        requirementId: requirement.id,
        name: requirement.skillName?.trim() ?? requirement.description,
        category: requirement.category,
        priority: requirement.required
          ? ("REQUIRED" as const)
          : ("PREFERRED" as const),
        matched: key === null ? null : evidence !== undefined,
        determination:
          key === null
            ? ("NO_STRUCTURED_SKILL" as const)
            : evidence
              ? ("EXACT_NORMALIZED_SKILL" as const)
              : ("NO_EXACT_SKILL_EVIDENCE" as const),
        evidence: evidence
          ? {
              category: "CANDIDATE_SKILL" as const,
              skillId: evidence.id,
              skillName: evidence.skillName.trim(),
            }
          : null,
      };
    });
  const matchedRequirements = explanations.filter(
    (item) => item.matched === true,
  );
  const missingRequirements = explanations.filter(
    (item) => item.matched === false,
  );
  const notEvaluatedRequirements = explanations.filter(
    (item) => item.matched === null,
  );
  const matched = matchedRequirements.length;
  const totalEvaluable = matched + missingRequirements.length;
  const totalListed = explanations.length;
  const notEvaluated = notEvaluatedRequirements.length;
  const percentage =
    totalEvaluable === 0 ? null : Math.round((matched / totalEvaluable) * 100);
  return {
    informational: true,
    matched,
    totalEvaluable,
    totalListed,
    notEvaluated,
    percentage,
    summary:
      percentage === null
        ? "No structured requirements available to compare"
        : notEvaluated > 0
          ? `${percentage}% of evaluable listed requirements matched`
          : `${percentage}% of listed requirements matched`,
    matchedRequirements,
    missingRequirements,
    notEvaluatedRequirements,
  };
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
