import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
import {
  compareRequirements,
  type ListedRequirement,
} from "./domain/matching/requirements.js";

type DiscoveryQuery = {
  limit?: number;
  offset?: number;
  q?: string;
  location?: string;
};
const queryProperties = {
  limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  offset: {
    type: "integer",
    minimum: 0,
    maximum: Number.MAX_SAFE_INTEGER,
    default: 0,
  },
  q: { type: "string", minLength: 1, maxLength: 200 },
  location: { type: "string", minLength: 1, maxLength: 200 },
};
export function registerVacancyMatchDiscoveryRoutes(
  app: FastifyInstance,
  db: Database,
): void {
  app.get<{ Querystring: DiscoveryQuery }>(
    "/candidate/vacancy-matches",
    {
      preHandler: requireAuthenticatedPrincipal,
      // Reject unknown keys before Fastify's default validator can remove them.
      preValidation: async (request) => {
        if (
          Object.keys(request.query).some(
            (key) => !Object.hasOwn(queryProperties, key),
          )
        )
          throw new ApiError(400, "INVALID_REQUEST");
        for (const key of ["limit", "offset"] as const) {
          const value: unknown = request.query[key];
          if (
            value !== undefined &&
            (typeof value !== "string" || !/^\d+$/.test(value))
          )
            throw new ApiError(400, "INVALID_REQUEST");
        }
      },
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: queryProperties,
        },
      },
    },
    async (request) => {
      const principal = requirePrincipal(request.principal);
      assertCandidateOwnsProfile(principal, principal.userId);
      const { limit = 20, offset = 0, q, location } = request.query;
      return db.transaction(
        async (transaction) => {
          const [candidate] = await transaction
            .select({ id: candidates.id })
            .from(candidates)
            .where(eq(candidates.userId, principal.userId))
            .limit(1);
          if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND");
          const filters = [eq(vacancies.status, "OPEN")];
          if (q)
            filters.push(
              or(
                ilike(vacancies.title, `%${q}%`),
                ilike(vacancies.description, `%${q}%`),
              )!,
            );
          if (location)
            filters.push(ilike(vacancies.location, `%${location}%`));
          // No SQL pagination here: candidate-specific ordering needs every eligible input.
          const eligible = await transaction
            .select({
              id: vacancies.id,
              title: vacancies.title,
              location: vacancies.location,
              createdAt: vacancies.createdAt,
            })
            .from(vacancies)
            .where(and(...filters));
          if (!eligible.length)
            return { items: [], pagination: { limit, offset, returned: 0 } };
          const skills = await transaction
            .select({
              id: candidateSkills.id,
              skillName: candidateSkills.skillName,
              comparisonKey: sql<string>`public.matching_skill_name_key(${candidateSkills.skillName})`,
            })
            .from(candidateSkills)
            .where(eq(candidateSkills.candidateId, candidate.id));
          const requirements = await transaction
            .select({
              id: vacancyRequirements.id,
              vacancyId: vacancyRequirements.vacancyId,
              skillName: vacancyRequirements.skillName,
              description: vacancyRequirements.description,
              category: vacancyRequirements.category,
              required: vacancyRequirements.required,
              comparisonKey: sql<
                string | null
              >`public.matching_skill_name_key(${vacancyRequirements.skillName})`,
            })
            .from(vacancyRequirements)
            .where(
              inArray(
                vacancyRequirements.vacancyId,
                eligible.map((vacancy) => vacancy.id),
              ),
            );
          const byVacancy = new Map<string, ListedRequirement[]>();
          for (const requirement of requirements) {
            const group = byVacancy.get(requirement.vacancyId) ?? [];
            group.push(requirement);
            byVacancy.set(requirement.vacancyId, group);
          }
          const ordered = eligible
            .map((vacancy) => {
              const {
                matched,
                totalEvaluable,
                totalListed,
                notEvaluated,
                percentage,
                summary,
              } = compareRequirements(byVacancy.get(vacancy.id) ?? [], skills);
              return {
                vacancyId: vacancy.id,
                title: vacancy.title,
                location: vacancy.location,
                createdAt: vacancy.createdAt,
                matched,
                totalEvaluable,
                totalListed,
                notEvaluated,
                percentage,
                summary,
              };
            })
            .sort((a, b) => {
              if (a.percentage === null && b.percentage !== null) return 1;
              if (a.percentage !== null && b.percentage === null) return -1;
              const metric = (b.percentage ?? 0) - (a.percentage ?? 0);
              if (metric) return metric;
              const date = b.createdAt.getTime() - a.createdAt.getTime();
              if (date) return date;
              return a.vacancyId < b.vacancyId
                ? -1
                : a.vacancyId > b.vacancyId
                  ? 1
                  : 0;
            });
          const items = ordered
            .slice(offset, offset + limit)
            .map(({ createdAt: _createdAt, ...item }) => item);
          return {
            items,
            pagination: { limit, offset, returned: items.length },
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  );
}
