import { describe, expect, it } from "vitest";
import {
  initialApplicationStatusEvent,
  isAllowedApplicationTransition,
  InvalidApplicationTransitionError,
  transitionApplication,
} from "./lifecycle.js";

describe("Phase 3 application lifecycle", () => {
  it.each([
    ["Applied", "Reviewing"],
    ["Applied", "Shortlisted"],
    ["Applied", "Rejected"],
    ["Reviewing", "Shortlisted"],
    ["Reviewing", "Rejected"],
  ] as const)("allows %s → %s", (from, to) => {
    expect(isAllowedApplicationTransition(from, to)).toBe(true);
  });

  it.each([
    ["Applied", "Applied"],
    ["Reviewing", "Applied"],
    ["Shortlisted", "Rejected"],
    ["Rejected", "Reviewing"],
  ] as const)("rejects %s → %s", (from, to) => {
    expect(() => transitionApplication(from, to, "actor-1")).toThrow(
      InvalidApplicationTransitionError,
    );
  });

  it("records actor and timestamp with a valid transition", () => {
    const occurredAt = new Date("2026-01-01T00:00:00.000Z");
    expect(
      transitionApplication("Applied", "Reviewing", "recruiter-1", occurredAt),
    ).toEqual({
      fromStatus: "Applied",
      toStatus: "Reviewing",
      actorUserId: "recruiter-1",
      occurredAt,
    });
  });

  it("represents initial submission as an auditable Applied event", () => {
    const event = initialApplicationStatusEvent("candidate-1");
    expect(event).toMatchObject({
      fromStatus: null,
      toStatus: "Applied",
      actorUserId: "candidate-1",
    });
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
