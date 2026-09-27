import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const platformRole = pgEnum("platform_role", [
  "Candidate",
  "Employer",
  "Recruiter",
  "Operations/Admin",
  "Platform Administrator",
]);

export const applicationStatus = pgEnum("application_status", [
  "Applied",
  "Reviewing",
  "Shortlisted",
  "Rejected",
  "Withdrawn",
]);

export const vacancyStatus = pgEnum("vacancy_status", [
  "DRAFT",
  "OPEN",
  "CLOSED",
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry"),
  location: text("location"),
  status: text("status"),
  ...timestamps(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  accountStatus: text("account_status").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: platformRole("role").notNull(),
    // Company-scoped role assignments also establish explicit company membership.
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_roles_global_unique")
      .on(table.userId, table.role)
      .where(sql`${table.companyId} is null`),
    uniqueIndex("user_roles_company_unique")
      .on(table.userId, table.role, table.companyId)
      .where(sql`${table.companyId} is not null`),
    index("user_roles_company_idx").on(table.companyId),
  ],
);

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps(),
});

export const employers = pgTable("employers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps(),
});

export const recruiters = pgTable("recruiters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "restrict" }),
  availabilityStatus: text("availability_status"),
  ...timestamps(),
});

export const vacancies = pgTable(
  "vacancies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedRecruiterId: uuid("assigned_recruiter_id").references(
      () => recruiters.id,
      {
        onDelete: "restrict",
      },
    ),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    status: vacancyStatus("status").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("vacancies_company_idx").on(table.companyId),
    index("vacancies_assigned_recruiter_idx").on(table.assignedRecruiterId),
  ],
);

export const vacancyRequirements = pgTable(
  "vacancy_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancies.id, { onDelete: "restrict" }),
    category: text("category").notNull(),
    description: text("description").notNull(),
    requirementType: text("requirement_type").notNull(),
    required: boolean("required").notNull(),
    ...timestamps(),
  },
  (table) => [index("vacancy_requirements_vacancy_idx").on(table.vacancyId)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "restrict" }),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancies.id, { onDelete: "restrict" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentStatus: applicationStatus("current_status")
      .notNull()
      .default("Applied"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("applications_one_active_candidate_vacancy")
      .on(table.candidateId, table.vacancyId)
      .where(
        sql`${table.currentStatus} in ('Applied', 'Reviewing', 'Shortlisted')`,
      ),
    index("applications_candidate_idx").on(table.candidateId),
    index("applications_vacancy_idx").on(table.vacancyId),
  ],
);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    fromStatus: applicationStatus("from_status"),
    toStatus: applicationStatus("to_status").notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "application_status_history_transition_allowed",
      sql`(${table.fromStatus} is null and ${table.toStatus} = 'Applied') or (${table.fromStatus} = 'Applied' and ${table.toStatus} in ('Reviewing', 'Shortlisted', 'Rejected', 'Withdrawn')) or (${table.fromStatus} = 'Reviewing' and ${table.toStatus} in ('Shortlisted', 'Rejected', 'Withdrawn')) or (${table.fromStatus} = 'Shortlisted' and ${table.toStatus} = 'Withdrawn')`,
    ),
    index("application_status_history_application_idx").on(
      table.applicationId,
      table.occurredAt,
    ),
  ],
);
