-- Trim the ECMAScript whitespace set used by String.trim(), then lowercase.
-- No aliases, synonyms, inference, or legacy requirement conversion.
CREATE FUNCTION "public"."matching_skill_name_key"(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT lower(btrim($1, E' \t\n\r\f' || U&'\000B\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'));
$$;
--> statement-breakpoint
ALTER TABLE "vacancy_requirements" ADD COLUMN "skill_name" text;
--> statement-breakpoint
ALTER TABLE "vacancy_requirements" ADD CONSTRAINT "vacancy_requirements_skill_name_nonempty"
CHECK ("skill_name" IS NULL OR length(public.matching_skill_name_key("skill_name")) > 0);
--> statement-breakpoint
CREATE UNIQUE INDEX "vacancy_requirements_skill_unique"
ON "vacancy_requirements" ("vacancy_id", public.matching_skill_name_key("skill_name"))
WHERE "skill_name" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE "candidate_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "candidate_id" uuid NOT NULL,
  "skill_name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "candidate_skills_skill_name_nonempty"
    CHECK (length(public.matching_skill_name_key("skill_name")) > 0),
  CONSTRAINT "candidate_skills_candidate_id_candidates_id_fk"
    FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_skills_candidate_skill_unique"
ON "candidate_skills" ("candidate_id", public.matching_skill_name_key("skill_name"));
