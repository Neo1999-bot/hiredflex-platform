import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";
import {
  currentExternalOpportunities,
  externalOpportunities,
} from "./external-opportunities.js";

afterEach(() => vi.useRealTimers());

describe("source-linked external opportunities", () => {
  it("hides future, expired and invalid check dates", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    const base = externalOpportunities[0]!;
    const items = [
      base,
      { ...base, checkedOn: "2026-10-26" },
      { ...base, reviewBy: "2026-10-25" },
      { ...base, checkedOn: "invalid" },
    ];
    expect(currentExternalOpportunities(now, items)).toEqual([base]);
    expect(currentExternalOpportunities(new Date("2026-11-01"))).toEqual([]);
    expect(currentExternalOpportunities(new Date("invalid"))).toEqual([]);
  });

  it("serves reviewed source records without requiring a database or identity", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
    const app = buildApp({
      db: {} as Database,
      logger: false,
      checkDatabase: async () => {
        throw new Error("No database in this test");
      },
    });
    try {
      const response = await app.inject({
        method: "GET",
        url: "/external-opportunities",
      });
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.json().items).toEqual(externalOpportunities);
      for (const item of response.json().items) {
        expect(new URL(item.sourceUrl).protocol).toBe("https:");
        expect(item).not.toHaveProperty("percentage");
        expect(item).not.toHaveProperty("candidateId");
      }
      vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
      const expired = await app.inject({
        method: "GET",
        url: "/external-opportunities",
      });
      expect(expired.json()).toEqual({ items: [] });
    } finally {
      await app.close();
    }
  });
});
