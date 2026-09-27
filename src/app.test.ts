import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { Database } from "./db/client.js";

describe("API foundation", () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeApp?.();
    closeApp = undefined;
  });

  it("exposes a liveness endpoint without claiming database readiness", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => {
        throw new Error("database unavailable");
      },
      logger: false,
    });
    closeApp = () => app.close();

    const response = await app.inject({ method: "GET", url: "/health/live" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("reports readiness only when the database check succeeds", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => undefined,
      logger: false,
    });
    closeApp = () => app.close();

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ready" });
  });

  it("returns unavailable when the database check fails", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => {
        throw new Error("database unavailable");
      },
      logger: false,
    });
    closeApp = () => app.close();

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "unavailable" });
  });
});
