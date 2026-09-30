import { and, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { ApiError } from "./api/errors.js";
import {
  assertCandidateOwnsProfile,
  requirePrincipal,
} from "./auth/authorization.js";
import { requireAuthenticatedPrincipal } from "./auth/fastify.js";
import type { Database } from "./db/client.js";
import {
  candidates,
  candidateSkills,
  vacancies,
  vacancyRequirements,
} from "./db/schema/index.js";
import { compareRequirements } from "./domain/matching/requirements.js";

export function registerMatchingRoutes(
  app: FastifyInstance,
  db: Database,
): void {
  app.get<{ Params: { vacancyId: string } }>(
    "/candidate/vacancies/:vacancyId/match",
    {
      preHandler: requireAuthenticatedPrincipal,
      schema: {
        params: {
          type: "object",
          required: ["vacancyId"],
          additionalProperties: false,
          properties: { vacancyId: { type: "string", format: "uuid" } },
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {},
        },
      },
    },
    async (request) => {
      const principal = requirePrincipal(request.principal);
      assertCandidateOwnsProfile(principal, principal.userId);
      // A repeatable read snapshot keeps all comparison inputs consistent.
      // The transaction is read-only and contains no application operations.
      return db.transaction(
        async (transaction) => {
          const [candidate] = await transaction
            .select({ id: candidates.id })
            .from(candidates)
            .where(eq(candidates.userId, principal.userId))
            .limit(1);
          if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND");
          const [vacancy] = await transaction
            .select({ id: vacancies.id })
            .from(vacancies)
            .where(
              and(
                eq(vacancies.id, request.params.vacancyId),
                eq(vacancies.status, "OPEN"),
              ),
            )
            .limit(1);
          if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");
          const requirements = await transaction
            .select({
              id: vacancyRequirements.id,
              skillName: vacancyRequirements.skillName,
              description: vacancyRequirements.description,
              category: vacancyRequirements.category,
              required: vacancyRequirements.required,
              comparisonKey: sql<
                string | null
              >`public.matching_skill_name_key(${vacancyRequirements.skillName})`,
            })
            .from(vacancyRequirements)
            .where(eq(vacancyRequirements.vacancyId, vacancy.id));
          const skills = await transaction
            .select({
              id: candidateSkills.id,
              skillName: candidateSkills.skillName,
              comparisonKey: sql<string>`public.matching_skill_name_key(${candidateSkills.skillName})`,
            })
            .from(candidateSkills)
            .where(eq(candidateSkills.candidateId, candidate.id));
          return {
            vacancyId: vacancy.id,
            ...compareRequirements(requirements, skills),
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  );
}
