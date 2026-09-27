import { describe, expect, it } from "vitest";
import {
  assertNoActiveApplication,
  assertVacancyOpenForApplications,
  ApplicationSubmissionConflictError,
  VacancyNotOpenError,
} from "./submission.js";

describe("candidate application submission rules", () => {
  it("allows submission only while the persisted vacancy status is OPEN", () => {
    expect(() => assertVacancyOpenForApplications("OPEN")).not.toThrow();
    expect(() => assertVacancyOpenForApplications("DRAFT")).toThrow(
      VacancyNotOpenError,
    );
    expect(() => assertVacancyOpenForApplications("CLOSED")).toThrow(
      VacancyNotOpenError,
    );
  });

  it.each(["Applied", "Reviewing", "Shortlisted"] as const)(
    "%s blocks a duplicate application",
    (status) => {
      expect(() => assertNoActiveApplication(status)).toThrow(
        ApplicationSubmissionConflictError,
      );
    },
  );

  it.each(["Rejected", "Withdrawn", null, undefined] as const)(
    "%s permits a new application record",
    (status) => {
      expect(() => assertNoActiveApplication(status)).not.toThrow();
    },
  );
});
