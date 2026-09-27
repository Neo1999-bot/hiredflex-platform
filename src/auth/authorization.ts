import type { platformRole } from "../db/schema/index.js";

export type PlatformRole = (typeof platformRole.enumValues)[number];

export interface AuthenticatedPrincipal {
  userId: string;
  roleAssignments: readonly {
    role: PlatformRole;
    companyId: string | null;
  }[];
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("The authenticated user is not authorized for this resource");
    this.name = "ForbiddenError";
  }
}

export function requirePrincipal(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  if (!principal) throw new UnauthorizedError();
  return principal;
}

export function assertCandidateOwnsProfile(
  principal: AuthenticatedPrincipal,
  candidateUserId: string,
): void {
  if (
    !principal.roleAssignments.some(({ role }) => role === "Candidate") ||
    principal.userId !== candidateUserId
  ) {
    throw new ForbiddenError();
  }
}

export function assertCandidateOwnsApplication(
  principal: AuthenticatedPrincipal,
  candidateUserId: string,
): void {
  if (
    !principal.roleAssignments.some(({ role }) => role === "Candidate") ||
    principal.userId !== candidateUserId
  ) {
    throw new ForbiddenError();
  }
}

export function assertRecruiterOwnsVacancy(
  principal: AuthenticatedPrincipal,
  assignedRecruiterUserId: string | null,
  vacancyCompanyId: string,
): void {
  if (
    !principal.roleAssignments.some(
      ({ role, companyId }) =>
        role === "Recruiter" &&
        (companyId === null || companyId === vacancyCompanyId),
    ) ||
    assignedRecruiterUserId === null ||
    principal.userId !== assignedRecruiterUserId
  ) {
    throw new ForbiddenError();
  }
}

export function assertEmployerBelongsToCompany(
  principal: AuthenticatedPrincipal,
  companyId: string,
): void {
  if (
    !principal.roleAssignments.some(
      (assignment) =>
        assignment.role === "Employer" && assignment.companyId === companyId,
    )
  ) {
    throw new ForbiddenError();
  }
}
