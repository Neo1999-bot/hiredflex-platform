import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { diagnoseConfiguration } from "./deployment-diagnostics.js";
import { readIdentityConfig } from "./auth/identity.js";
import { buildApp } from "./app.js";
import type { Database } from "./db/client.js";

const marker = "SYNTHETIC_SECRET_MUST_NOT_APPEAR";
const valid = {
  DATABASE_URL: `postgres://synthetic:${marker}@localhost:1/disposable`,
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  CLERK_PUBLISHABLE_KEY:
    "pk_live_" + Buffer.from("identity.example.invalid$").toString("base64"),
  CLERK_SECRET_KEY: `sk_live_${marker}`,
  AUTH_ALLOWED_ORIGINS: "https://hiredflex.example.invalid",
};

describe("offline deployment configuration diagnostics", () => {
  it("identifies the prefixed-integration mismatch without adopting credentials", () => {
    const env = { HIREDFLEX_PROD_DATABASE_URL: valid.DATABASE_URL };
    const before = { ...env };
    const result = diagnoseConfiguration(env);
    expect(result.status).toBe("BLOCKED");
    expect(result.gates[0]?.code).toBe(
      "DATABASE_URL_MISSING_PREFIXED_INTEGRATION_PRESENT",
    );
    expect(env).toEqual(before);
    expect(JSON.stringify(result)).not.toContain(marker);
  });

  it.each([
    { DATABASE_URL: undefined },
    { DATABASE_URL: marker },
    { DATABASE_URL: `https://${marker}.invalid` },
    { PORT: marker },
    { CLERK_SECRET_KEY: undefined },
    { AUTH_ALLOWED_ORIGINS: undefined },
    { AUTH_ALLOWED_ORIGINS: marker },
    { AUTH_ALLOWED_ORIGINS: "https://*.example.invalid" },
    { AUTH_ALLOWED_ORIGINS: "https://example.invalid/path" },
    { AUTH_ALLOWED_ORIGINS: "http://remote.example.invalid" },
    { CLERK_PUBLISHABLE_KEY: marker },
    {
      CLERK_PUBLISHABLE_KEY: valid.CLERK_PUBLISHABLE_KEY.replace(
        "pk_live_",
        "pk_test_",
      ),
    },
    { CLERK_SECRET_KEY: `sk_test_${marker}` },
  ])(
    "blocks invalid or incomplete configuration without leaking supplied values %s",
    (patch) => {
      const result = diagnoseConfiguration({ ...valid, ...patch });
      expect(result.status).toBe("BLOCKED");
      expect(JSON.stringify(result)).not.toContain(marker);
      expect(result.productionAcceptance).toBe("NOT TESTED");
    },
  );

  it("keeps a complete preflight separate from connectivity, migrations and acceptance", () => {
    const result = diagnoseConfiguration(valid);
    expect(result.status).toBe("PASS");
    expect(result.databaseConnectivity).toBe("NOT TESTED");
    expect(result.migrations).toBe("NOT TESTED");
    expect(result.providerSessionsAndRoles).toBe("NOT TESTED");
    expect(result.productionAcceptance).toBe("NOT TESTED");
    expect(diagnoseConfiguration(valid)).toEqual(result);
    expect(JSON.stringify(result)).not.toContain(marker);
  });

  it("does not label a preview or an unasserted target as production identity evidence", () => {
    const result = diagnoseConfiguration({ ...valid, VERCEL_ENV: "preview" });
    expect(result.gates[2]?.status).toBe("NOT TESTED");
  });

  it("keeps malformed-origin errors safe for startup logs", () => {
    let error: unknown;
    try {
      readIdentityConfig({ ...valid, AUTH_ALLOWED_ORIGINS: marker });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain(marker);
    expect(error).not.toHaveProperty("input");
  });

  it("returns a failing CLI exit code and only fixed diagnostics for blocked configuration", () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx/esm", "scripts/diagnose-config.ts"],
      {
        encoding: "utf8",
        timeout: 10_000,
        env: {
          ...process.env,
          ...valid,
          DATABASE_URL: "",
          HIREDFLEX_PROD_DATABASE_URL: valid.DATABASE_URL,
        },
      },
    );
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).status).toBe("BLOCKED");
    expect(result.stdout + result.stderr).not.toContain(marker);
  });

  it("logs a fixed readiness failure code and preserves the sanitised HTTP contract", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => {
        throw new Error(valid.DATABASE_URL);
      },
      logger: false,
    });
    const warn = vi.spyOn(app.log, "warn");
    try {
      const response = await app.inject({ url: "/health/ready" });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ status: "unavailable" });
      expect(warn).toHaveBeenCalledExactlyOnceWith({
        event: "database_readiness_failed",
        code: "DATABASE_UNAVAILABLE",
      });
      expect(JSON.stringify(warn.mock.calls) + response.body).not.toContain(
        marker,
      );
      expect((await app.inject({ url: "/health/live" })).json()).toEqual({
        status: "ok",
      });
      expect((await app.inject({ url: "/candidate/skills" })).statusCode).toBe(
        401,
      );
    } finally {
      await app.close();
    }
  });
});
