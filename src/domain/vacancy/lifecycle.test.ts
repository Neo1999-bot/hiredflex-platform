import { describe, expect, it } from "vitest";
import {
  isAllowedVacancyTransition,
  transitionVacancy,
  vacancyAcceptsApplications,
} from "./lifecycle.js";

describe("vacancy lifecycle", () => {
  it.each([
    ["DRAFT", "OPEN"],
    ["OPEN", "CLOSED"],
  ] as const)("allows %s → %s", (from, to) => {
    expect(isAllowedVacancyTransition(from, to)).toBe(true);
    expect(transitionVacancy(from, to)).toBe(to);
  });

  it.each([
    ["DRAFT", "CLOSED"],
    ["OPEN", "DRAFT"],
    ["CLOSED", "OPEN"],
  ] as const)("rejects %s → %s", (from, to) => {
    expect(() => transitionVacancy(from, to)).toThrow();
  });

  it.each([
    ["DRAFT", false],
    ["OPEN", true],
    ["CLOSED", false],
  ] as const)("application availability for %s is %s", (status, allowed) => {
    expect(vacancyAcceptsApplications(status)).toBe(allowed);
  });
});
