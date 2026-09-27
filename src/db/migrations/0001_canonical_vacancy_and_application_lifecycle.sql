DROP INDEX "applications_one_active_candidate_vacancy";
--> statement-breakpoint
ALTER TABLE "application_status_history"
  DROP CONSTRAINT "application_status_history_transition_allowed";
--> statement-breakpoint
ALTER TABLE "applications"
  ALTER COLUMN "current_status" DROP DEFAULT;
--> statement-breakpoint
CREATE TYPE "public"."vacancy_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');
--> statement-breakpoint
CREATE TYPE "public"."application_status_v2" AS ENUM('Applied', 'Reviewing', 'Shortlisted', 'Rejected', 'Withdrawn');
--> statement-breakpoint
ALTER TABLE "vacancies"
  ALTER COLUMN "status" TYPE "public"."vacancy_status"
  USING "status"::"public"."vacancy_status";
--> statement-breakpoint
ALTER TABLE "applications"
  ALTER COLUMN "current_status" TYPE "public"."application_status_v2"
  USING "current_status"::text::"public"."application_status_v2";
--> statement-breakpoint
ALTER TABLE "application_status_history"
  ALTER COLUMN "from_status" TYPE "public"."application_status_v2"
  USING "from_status"::text::"public"."application_status_v2";
--> statement-breakpoint
ALTER TABLE "application_status_history"
  ALTER COLUMN "to_status" TYPE "public"."application_status_v2"
  USING "to_status"::text::"public"."application_status_v2";
--> statement-breakpoint
DROP TYPE "public"."application_status";
--> statement-breakpoint
ALTER TYPE "public"."application_status_v2" RENAME TO "application_status";
--> statement-breakpoint
ALTER TABLE "applications"
  ALTER COLUMN "current_status" SET DEFAULT 'Applied';
--> statement-breakpoint
ALTER TABLE "application_status_history"
  ADD CONSTRAINT "application_status_history_transition_allowed"
  CHECK (("application_status_history"."from_status" IS NULL AND "application_status_history"."to_status" = 'Applied') OR ("application_status_history"."from_status" = 'Applied' AND "application_status_history"."to_status" IN ('Reviewing', 'Shortlisted', 'Rejected', 'Withdrawn')) OR ("application_status_history"."from_status" = 'Reviewing' AND "application_status_history"."to_status" IN ('Shortlisted', 'Rejected', 'Withdrawn')) OR ("application_status_history"."from_status" = 'Shortlisted' AND "application_status_history"."to_status" = 'Withdrawn'));
--> statement-breakpoint
CREATE UNIQUE INDEX "applications_one_active_candidate_vacancy"
  ON "applications" USING btree ("candidate_id", "vacancy_id")
  WHERE "applications"."current_status" IN ('Applied', 'Reviewing', 'Shortlisted');
