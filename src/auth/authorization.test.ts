import { describe, expect, it } from "vitest";
import {
  assertCandidateOwnsApplication,
  assertCandidateOwnsProfile,
  assertEmployerBelongsToCompany,
  assertRecruiterOwnsVacancy,
  ForbiddenError,
  requirePrincipal,
  UnauthorizedError,
} from "./authorization.js";

describe("authorization foundation", () => {
  it("fails closed when there is no authenticated principal", () => {
    expect(() => requirePrincipal(undefined)).toThrow(UnauthorizedError);
  });

  it("allows a candidate to act on their own profile", () => {
    expect(() =>
      assertCandidateOwnsProfile(
        {
          userId: "candidate-1",
          roleAssignments: [{ role: "Candidate", companyId: null }],
        },
        "candidate-1",
      ),
    ).not.toThrow();
  });

  it("denies a candidate access to another candidate profile", () => {
    expect(() =>
      assertCandidateOwnsProfile(
        {
          userId: "candidate-1",
          roleAssignments: [{ role: "Candidate", companyId: null }],
        },
        "candidate-2",
      ),
    ).toThrow(ForbiddenError);
  });

  it("limits candidate application access to applications they own", () => {
    expect(() =>
      assertCandidateOwnsApplication(
        {
          userId: "candidate-1",
          roleAssignments: [{ role: "Candidate", companyId: null }],
        },
        "candidate-1",
      ),
    ).not.toThrow();
    expect(() =>
      assertCandidateOwnsApplication(
        {
          userId: "candidate-1",
          roleAssignments: [{ role: "Candidate", companyId: null }],
        },
        "candidate-2",
      ),
    ).toThrow(ForbiddenError);
  });

  it("allows only the assigned recruiter to manage a vacancy", () => {
    expect(() =>
      assertRecruiterOwnsVacancy(
        {
          userId: "recruiter-1",
          roleAssignments: [{ role: "Recruiter", companyId: null }],
        },
        "recruiter-1",
        "company-1",
      ),
    ).not.toThrow();
    expect(() =>
      assertRecruiterOwnsVacancy(
        {
          userId: "recruiter-2",
          roleAssignments: [{ role: "Recruiter", companyId: null }],
        },
        "recruiter-1",
        "company-1",
      ),
    ).toThrow(ForbiddenError);
    expect(() =>
      assertRecruiterOwnsVacancy(
        {
          userId: "recruiter-1",
          roleAssignments: [{ role: "Recruiter", companyId: null }],
        },
        null,
        "company-1",
      ),
    ).toThrow(ForbiddenError);
  });

  it("requires explicit company-scoped employer membership", () => {
    const principal = {
      userId: "employer-1",
      roleAssignments: [{ role: "Employer" as const, companyId: "company-1" }],
    };
    expect(() =>
      assertEmployerBelongsToCompany(principal, "company-1"),
    ).not.toThrow();
    expect(() =>
      assertEmployerBelongsToCompany(principal, "company-2"),
    ).toThrow(ForbiddenError);
  });
});
