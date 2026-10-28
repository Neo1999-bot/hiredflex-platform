import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";
import { createTokenVerifier, readIdentityConfig } from "./identity.js";
import { registerClerkProxy } from "./proxy.js";

const origin = "https://hiredflex.example.invalid";
const secret = "sk_live_synthetic_proxy_marker";
const env = {
  CLERK_PUBLISHABLE_KEY:
    "pk_live_" +
    Buffer.from("clerk.hiredflex.example.invalid$").toString("base64"),
  CLERK_SECRET_KEY: secret,
  AUTH_ALLOWED_ORIGINS: origin,
  CLERK_PROXY_URL: origin + "/__clerk",
};
const config = readIdentityConfig(env)!;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("opt-in Production Clerk proxy", () => {
  it("validates the proxy against the trusted origin, key domain and live key modes", () => {
    expect(config.proxyUrl).toBe(origin + "/__clerk");
    expect(
      readIdentityConfig({ ...env, CLERK_PROXY_URL: "" })?.proxyUrl,
    ).toBeUndefined();
    for (const patch of [
      { CLERK_PROXY_URL: "https://attacker.invalid/__clerk" },
      { CLERK_PROXY_URL: origin + "/__clerk?secret=marker" },
      { CLERK_PROXY_URL: origin + "/__clerk/" },
      { CLERK_PROXY_URL: "http://hiredflex.example.invalid/__clerk" },
      { CLERK_SECRET_KEY: "sk_test_marker" },
      {
        CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY.replace(
          "pk_live_",
          "pk_test_",
        ),
      },
      {
        CLERK_PUBLISHABLE_KEY:
          "pk_live_" + Buffer.from("clerk.other.invalid$").toString("base64"),
      },
    ])
      expect(() => readIdentityConfig({ ...env, ...patch })).toThrow(
        "Invalid Clerk proxy configuration",
      );
  });

  it("fails safely on incomplete proxy credentials or conflicting publishable variables", () => {
    expect(() => readIdentityConfig({ ...env, CLERK_SECRET_KEY: "" })).toThrow(
      "Incomplete Clerk proxy configuration",
    );
    expect(() =>
      readIdentityConfig({
        ...env,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_conflict",
      }),
    ).toThrow("Conflicting Clerk publishable keys");
  });

  it("rejects oversized payloads without forwarding anything", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const app = Fastify();
    registerClerkProxy(app, config);
    try {
      const result = await app.inject({
        method: "POST",
        url: "/__clerk/v1/client",
        payload: "x".repeat(1024 * 1024 + 1),
      });
      expect(result.statusCode).toBe(413);
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("forwards bytes only to fixed Clerk FAPI and ignores forged routing/IP headers", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("ok", { headers: { "content-type": "text/plain" } }),
    );
    vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("CLERK_FAPI_URL", "https://attacker.invalid");
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => undefined,
      logger: false,
      identity: config,
    });
    try {
      const result = await app.inject({
        method: "POST",
        url: "/__clerk/v1/client?test=1",
        payload: "a=1&b=%2B",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          host: "attacker.invalid",
          "x-forwarded-host": "attacker.invalid",
          "x-forwarded-proto": "http",
          "cf-connecting-ip": "1.1.1.1",
          "x-real-ip": "2.2.2.2",
          "x-forwarded-for": "3.3.3.3",
          "x-vercel-forwarded-for": "4.4.4.4",
          "clerk-secret-key": "forged",
        },
      });
      expect(result.statusCode).toBe(200);
      const [url, init] = fetcher.mock.calls[0]! as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toBe("https://frontend-api.clerk.dev/v1/client?test=1");
      const headers = new Headers(init.headers);
      expect(headers.get("clerk-secret-key")).toBe(secret);
      expect(headers.get("clerk-proxy-url")).toBe(origin + "/__clerk");
      expect(headers.get("x-forwarded-for")).toBe("127.0.0.1");
      expect(headers.get("x-forwarded-host")).toBe("hiredflex.example.invalid");
      expect(headers.get("cf-connecting-ip")).toBeNull();
      expect(init.redirect).toBe("manual");
      expect(await new Response(init.body).text()).toBe("a=1&b=%2B");
      expect(result.body).not.toContain(secret);
      expect((await app.inject({ url: "/candidate/skills" })).statusCode).toBe(
        401,
      );
      expect(
        (await app.inject({ url: "/employer/vacancies" })).statusCode,
      ).toBe(401);
      expect(
        (await app.inject({ url: "/recruiter/vacancies" })).statusCode,
      ).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("uses the Vercel IP only when explicitly running on Vercel", async () => {
    const fetcher = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetcher);
    const app = Fastify();
    registerClerkProxy(app, { ...config, trustVercelProxy: true });
    try {
      expect(
        (
          await app.inject({
            url: "/__clerk/v1/environment",
            headers: {
              "x-vercel-forwarded-for": "192.0.2.10",
              "cf-connecting-ip": "1.1.1.1",
            },
          })
        ).statusCode,
      ).toBe(200);
      const init = fetcher.mock.calls[0] as unknown as [string, RequestInit];
      expect(new Headers(init[1].headers).get("x-forwarded-for")).toBe(
        "192.0.2.10",
      );
      expect(
        (
          await app.inject({
            url: "/__clerk/v1/environment",
            headers: { "x-vercel-forwarded-for": "192.0.2.10, 1.1.1.1" },
          })
        ).statusCode,
      ).toBe(503);
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it("blocks path normalization and SSRF regressions before any outbound request", async () => {
    const fetcher = vi.fn(async () => new Response("unexpected"));
    vi.stubGlobal("fetch", fetcher);
    const app = Fastify();
    registerClerkProxy(app, config);
    try {
      for (const path of [
        "//attacker.invalid/path",
        "/%2Fattacker.invalid",
        "/../candidate/skills",
        "/%2e%2e/candidate/skills",
        "/%5cattacker.invalid",
        "/%252f%252fattacker.invalid",
      ]) {
        const result = await app.inject({ url: "/__clerk" + path });
        expect(result.statusCode).toBeGreaterThanOrEqual(400);
      }
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("preserves cookies and rewrites only Clerk redirects without following them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 302,
            headers: {
              location: "https://frontend-api.clerk.dev/v1/next",
              "set-cookie":
                "__client=synthetic; Secure; HttpOnly; SameSite=Lax",
            },
          }),
      ),
    );
    const app = Fastify();
    registerClerkProxy(app, config);
    try {
      const result = await app.inject({ url: "/__clerk/v1/client" });
      expect(result.statusCode).toBe(302);
      expect(result.headers.location).toBe(origin + "/__clerk/v1/next");
      expect(result.headers["set-cookie"]).toContain(
        "__client=synthetic; Secure; HttpOnly; SameSite=Lax",
      );
      expect(result.headers["cache-control"]).toBe("no-store");
    } finally {
      await app.close();
    }
  });

  it("sanitizes failures and does not log proxy URLs, tokens or bodies", async () => {
    const logs: string[] = [];
    const app = Fastify({
      logger: { stream: { write: (line: string) => logs.push(line) } },
    });
    registerClerkProxy(app, config);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error(secret);
      }),
    );
    try {
      const result = await app.inject({
        method: "POST",
        url: "/__clerk/v1/client?token=synthetic_token_marker",
        payload: "private_body_marker",
      });
      expect(result.statusCode).toBe(503);
      expect(result.json()).toEqual({
        error: { code: "IDENTITY_UNAVAILABLE" },
      });
      const output = logs.join("") + result.body;
      for (const marker of [
        secret,
        "synthetic_token_marker",
        "private_body_marker",
      ])
        expect(output).not.toContain(marker);
    } finally {
      await app.close();
    }
  });

  it("keeps Preview direct assets and provides opt-in proxy assets without exposing secrets", async () => {
    for (const identity of [config, { ...config, proxyUrl: undefined }]) {
      const { proxyUrl, ...rest } = identity;
      const app = buildApp({
        db: {} as Database,
        checkDatabase: async () => undefined,
        logger: false,
        identity: proxyUrl ? { ...rest, proxyUrl } : rest,
      });
      try {
        const result = await app.inject({ url: "/" });
        expect(result.body).not.toContain(secret);
        expect(result.body.includes("data-clerk-proxy-url=")).toBe(
          Boolean(proxyUrl),
        );
        expect(result.body).toContain(
          (proxyUrl ?? config.issuer) +
            "/npm/@clerk/clerk-js@6/dist/clerk.browser.js",
        );
        if (!proxyUrl)
          expect(
            (await app.inject({ url: "/__clerk/v1/environment" })).statusCode,
          ).toBe(404);
      } finally {
        await app.close();
      }
    }
  });

  it("verifies proxied-instance JWTs with server-side JWKS and preserves issuer/origin/expiry checks", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = { ...(await exportJWK(publicKey)), kid: "synthetic" };
    const fetcher = vi.fn(async () => Response.json({ keys: [jwk] }));
    vi.stubGlobal("fetch", fetcher);
    const verify = createTokenVerifier(config);
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: config.issuer,
      sub: "user_synthetic",
      sid: "sess_synthetic",
      azp: origin,
      exp: now + 60,
      nbf: now - 1,
    };
    const request = async (patch: Record<string, unknown> = {}) => ({
      headers: {
        authorization:
          "Bearer " +
          (await new SignJWT({ ...claims, ...patch })
            .setProtectedHeader({ alg: "RS256", kid: "synthetic" })
            .sign(privateKey)),
      },
    });
    expect(
      await verify((await request()) as Parameters<typeof verify>[0]),
    ).toBe("user_synthetic");
    for (const patch of [
      { iss: "https://attacker.invalid" },
      { azp: "https://attacker.invalid" },
      { exp: now - 60 },
      { sts: "pending" },
    ])
      await expect(
        verify((await request(patch)) as Parameters<typeof verify>[0]),
      ).rejects.toThrow();
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.clerk.com/v1/jwks");
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer " + secret,
    );
    expect(init.redirect).toBe("manual");
  });
});
