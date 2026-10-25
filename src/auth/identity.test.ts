import { describe, expect, it } from "vitest";
import { assertSessionClaims, readIdentityConfig } from "./identity.js";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";
import type { FastifyRequest } from "fastify";
import type { JWTPayload } from "jose";
import { Script } from "node:vm";
import { clientScript } from "../web/client.js";

const config = {
  issuer: "https://example.clerk.accounts.dev",
  origins: ["https://hiredflex.example"],
};
const claims = {
  iss: config.issuer,
  sub: "user_test",
  sid: "sess_test",
  exp: 9999999999,
  nbf: 1,
  azp: config.origins[0],
};
describe("managed identity boundary", () => {
  it("requires configuration before enabling sign-in", () => {
    expect(readIdentityConfig({})).toBeUndefined();
  });
  it("derives the issuer from the trusted publishable key", () => {
    const result = readIdentityConfig({
      CLERK_PUBLISHABLE_KEY:
        "pk_test_" +
        Buffer.from("example.clerk.accounts.dev$").toString("base64"),
      CLERK_SECRET_KEY: "test",
      AUTH_ALLOWED_ORIGINS: "https://hiredflex.example",
    });
    expect(result?.issuer).toBe(config.issuer);
  });
  it("rejects wildcard origins and non-HTTPS remote origins", () => {
    const env = {
      CLERK_PUBLISHABLE_KEY:
        "pk_test_" +
        Buffer.from("example.clerk.accounts.dev$").toString("base64"),
      CLERK_SECRET_KEY: "test",
    };
    expect(() =>
      readIdentityConfig({
        ...env,
        AUTH_ALLOWED_ORIGINS: "https://*.example.com",
      }),
    ).toThrow();
    expect(() =>
      readIdentityConfig({
        ...env,
        AUTH_ALLOWED_ORIGINS: "http://example.com",
      }),
    ).toThrow();
  });
  it("accepts a complete session from the trusted instance and origin", () => {
    expect(assertSessionClaims(claims, config)).toBe("user_test");
  });
  it.each([
    { iss: "https://attacker.example" },
    { azp: "https://attacker.example" },
    { sub: "candidate_uuid" },
    { sid: undefined },
    { exp: undefined },
    { nbf: undefined },
    { sts: "pending" },
  ])("rejects untrusted or incomplete claims %s", (patch) => {
    expect(() =>
      assertSessionClaims(
        { ...claims, ...patch } as unknown as JWTPayload,
        config,
      ),
    ).toThrow();
  });
  it("does not interpret token roles as database permissions", () => {
    expect(
      assertSessionClaims(
        { ...claims, role: "Platform Administrator" },
        config,
      ),
    ).toBe("user_test");
  });
  it("keeps protected endpoints closed with no identity provider", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => undefined,
      logger: false,
    });
    try {
      expect(
        (
          await app.inject({
            url: "/candidate/skills",
            headers: { authorization: "Bearer forged" },
          })
        ).statusCode,
      ).toBe(401);
    } finally {
      await app.close();
    }
  });
});
describe("website delivery", () => {
  it("serves the interface while sign-in remains unavailable", async () => {
    const app = buildApp({
      db: {} as Database,
      checkDatabase: async () => undefined,
      logger: false,
    });
    try {
      const page = await app.inject({ url: "/" });
      expect(page.statusCode).toBe(200);
      expect(page.headers["content-type"]).toContain("text/html");
      expect(page.body).toContain('id="content"');
      expect(page.body).not.toContain("clerk.browser.js");
      expect((await app.inject({ url: "/site-config" })).json()).toEqual({
        authenticationEnabled: false,
      });
      expect(() => new Script(clientScript)).not.toThrow();
    } finally {
      await app.close();
    }
  });
});

describe("session signature verification", () => {
  it("accepts a signed session and rejects tampered and expired sessions", async () => {
    const { generateKeyPair, SignJWT } = await import("jose");
    const { createTokenVerifier } = await import("./identity.js");
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const verifier = createTokenVerifier(
      { ...config, publishableKey: "unused", secretKey: "unused" },
      publicKey,
    );
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ ...claims, nbf: now - 1, exp: now + 60 })
      .setProtectedHeader({ alg: "RS256" })
      .sign(privateKey);
    const request = (value: string) =>
      ({
        headers: { authorization: `Bearer ${value}` },
      }) as FastifyRequest;
    expect(await verifier(request(token))).toBe("user_test");
    const [header, , signature] = token.split(".");
    const changed = Buffer.from(
      JSON.stringify({ ...claims, sub: "user_attacker" }),
    ).toString("base64url");
    await expect(
      verifier(request(`${header}.${changed}.${signature}`)),
    ).rejects.toThrow();
    const expired = await new SignJWT({
      ...claims,
      nbf: now - 120,
      exp: now - 60,
    })
      .setProtectedHeader({ alg: "RS256" })
      .sign(privateKey);
    await expect(verifier(request(expired))).rejects.toThrow();
  });
});
