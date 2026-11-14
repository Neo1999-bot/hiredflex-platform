import { afterEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";

vi.mock("./db/client.js", () => ({
  connectDatabase: vi.fn(() => ({ db: {}, ping: vi.fn(), close: vi.fn() })),
}));

const marker = "SYNTHETIC_STARTUP_CREDENTIAL_MUST_NOT_APPEAR";
const origin = "https://hiredflex.example.invalid";
const configured = {
  NODE_ENV: "test",
  VERCEL_ENV: "production",
  DATABASE_URL: `postgres://synthetic:${marker}@127.0.0.1:1/disposable`,
  CLERK_PUBLISHABLE_KEY:
    "pk_live_" +
    Buffer.from("clerk.hiredflex.example.invalid$").toString("base64"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
  CLERK_SECRET_KEY: `sk_live_${marker}`,
  AUTH_ALLOWED_ORIGINS: origin,
  CLERK_PROXY_URL: origin + "/__clerk",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("deployment handler configuration before resource allocation", () => {
  it.each([
    { CLERK_PUBLISHABLE_KEY: "", CLERK_SECRET_KEY: "" },
    { CLERK_PUBLISHABLE_KEY: "" },
    { CLERK_SECRET_KEY: "" },
    { AUTH_ALLOWED_ORIGINS: marker },
  ])(
    "rejects incomplete/invalid identity before creating a database client: %j",
    async (patch) => {
      vi.resetModules();
      for (const [key, value] of Object.entries({ ...configured, ...patch }))
        vi.stubEnv(key, value);
      const { default: handler } = await import("./app.js");
      const { connectDatabase } = await import("./db/client.js");
      const request = {} as IncomingMessage;
      const response = {} as ServerResponse;
      const failed = handler(request, response);
      await expect(failed).rejects.toThrow(
        /Incomplete Clerk proxy configuration|exact trusted origins/,
      );
      expect(connectDatabase).not.toHaveBeenCalled();
      // A failed lazy initialization must not allocate on each subsequent request.
      await expect(handler(request, response)).rejects.toThrow();
      expect(connectDatabase).not.toHaveBeenCalled();
      await failed.catch((error: unknown) =>
        expect(String(error)).not.toContain(marker),
      );
    },
  );
});
