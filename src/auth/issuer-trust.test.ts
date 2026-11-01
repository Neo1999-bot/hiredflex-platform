import { afterEach, describe, expect, it, vi } from "vitest";
import {
  base64url,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
  type JWK,
} from "jose";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";
import {
  acceptedIssuers,
  createTokenVerifier,
  readIdentityConfig,
} from "./identity.js";

// Synthetic Production (proxied, live) and Preview (direct, test) instances.
const prodOrigin = "https://hiredflex.example.invalid";
const previewOrigin = "https://hiredflex-preview.example.invalid";
const prod = readIdentityConfig({
  CLERK_PUBLISHABLE_KEY:
    "pk_live_" +
    Buffer.from("clerk.hiredflex.example.invalid$").toString("base64"),
  CLERK_SECRET_KEY: "sk_live_synthetic_issuer_test",
  AUTH_ALLOWED_ORIGINS: prodOrigin,
  CLERK_PROXY_URL: prodOrigin + "/__clerk",
})!;
const preview = readIdentityConfig({
  CLERK_PUBLISHABLE_KEY:
    "pk_test_" +
    Buffer.from("synthetic-preview-1.clerk.accounts.dev$").toString("base64"),
  CLERK_SECRET_KEY: "sk_test_synthetic_issuer_test",
  AUTH_ALLOWED_ORIGINS: previewOrigin,
})!;

type Keys = { privateKey: CryptoKey; jwk: JWK };
async function keys(kid: string): Promise<Keys> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  return { privateKey, jwk: { ...(await exportJWK(publicKey)), kid } };
}
const now = () => Math.floor(Date.now() / 1000);
function sign(k: Keys, claims: Record<string, unknown>, kid = k.jwk.kid!) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid })
    .sign(k.privateKey);
}
const req = (token: string) =>
  ({ headers: { authorization: `Bearer ${token}` } }) as never;

afterEach(() => vi.unstubAllGlobals());

describe("JWT issuer trust boundary", () => {
  it("trusts exactly the configured instance issuer, plus the proxy URL only in proxy mode", () => {
    expect(acceptedIssuers(prod)).toEqual([
      "https://clerk.hiredflex.example.invalid",
      "https://hiredflex.example.invalid/__clerk",
    ]);
    expect(acceptedIssuers(preview)).toEqual([
      "https://synthetic-preview-1.clerk.accounts.dev",
    ]);
  });

  it("rejects forged, cross-environment and malformed tokens", async () => {
    const prodKeys = await keys("prod");
    const previewKeys = await keys("preview");
    const attacker = await keys("prod"); // same kid, different key
    // Production JWKS publishes only the Production instance key.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ keys: [prodKeys.jwk] })),
    );
    const verify = createTokenVerifier(prod);
    const base = {
      iss: prod.issuer,
      sub: "user_synthetic",
      sid: "sess_synthetic",
      azp: prodOrigin,
      exp: now() + 60,
      nbf: now() - 1,
    };
    // Positive controls: both trusted issuer forms verify.
    expect(await verify(req(await sign(prodKeys, base)))).toBe(
      "user_synthetic",
    );
    expect(
      await verify(req(await sign(prodKeys, { ...base, iss: prod.proxyUrl }))),
    ).toBe("user_synthetic");

    const header = (h: object) =>
      base64url.encode(JSON.stringify(h)) +
      "." +
      base64url.encode(JSON.stringify(base));
    const rejected: [string, string][] = [
      // Forged: valid claims signed by an attacker key reusing the kid.
      ["forged signature", await sign(attacker, base)],
      // Unsigned / symmetric algorithm confusion.
      ["alg none", header({ alg: "none", kid: "prod" }) + "."],
      ["alg HS256", header({ alg: "HS256", kid: "prod" }) + ".c2ln"],
      // Cross-environment: a Preview-instance token presented to Production.
      [
        "preview token (preview key, issuer, origin)",
        await sign(previewKeys, {
          ...base,
          iss: preview.issuer,
          azp: previewOrigin,
        }),
      ],
      [
        "preview issuer under prod key",
        await sign(prodKeys, { ...base, iss: preview.issuer }),
      ],
      [
        "preview authorized party",
        await sign(prodKeys, { ...base, azp: previewOrigin }),
      ],
      // Issuer look-alikes that must not match the trusted list.
      [
        "bare origin issuer",
        await sign(prodKeys, { ...base, iss: prodOrigin }),
      ],
      [
        "trailing-slash proxy issuer",
        await sign(prodKeys, { ...base, iss: prod.proxyUrl + "/" }),
      ],
      [
        "proxy on foreign host",
        await sign(prodKeys, {
          ...base,
          iss: "https://attacker.invalid/__clerk",
        }),
      ],
      [
        "http downgrade issuer",
        await sign(prodKeys, {
          ...base,
          iss: "http://clerk.hiredflex.example.invalid",
        }),
      ],
      // Required claim and lifetime checks are preserved.
      ["expired", await sign(prodKeys, { ...base, exp: now() - 60 })],
      ["not yet valid", await sign(prodKeys, { ...base, nbf: now() + 600 })],
      ["missing azp", await sign(prodKeys, { ...base, azp: undefined })],
      ["missing sid", await sign(prodKeys, { ...base, sid: undefined })],
      ["non-user subject", await sign(prodKeys, { ...base, sub: "org_x" })],
      ["pending session", await sign(prodKeys, { ...base, sts: "pending" })],
    ];
    for (const [name, token] of rejected)
      await expect(verify(req(token)), name).rejects.toThrow();
  });

  it("never accepts the Production proxy issuer on the Preview (direct) verifier", async () => {
    const previewKeys = await keys("preview");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ keys: [previewKeys.jwk] })),
    );
    const verify = createTokenVerifier(preview);
    const base = {
      iss: preview.issuer,
      sub: "user_synthetic",
      sid: "sess_synthetic",
      azp: previewOrigin,
      exp: now() + 60,
      nbf: now() - 1,
    };
    expect(await verify(req(await sign(previewKeys, base)))).toBe(
      "user_synthetic",
    );
    for (const iss of [prod.issuer, prod.proxyUrl, previewOrigin + "/__clerk"])
      await expect(
        verify(req(await sign(previewKeys, { ...base, iss }))),
      ).rejects.toThrow();
  });

  it("does not grant roles from a valid token without a persisted principal", async () => {
    const prodKeys = await keys("prod");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ keys: [prodKeys.jwk] })),
    );
    // Database knows no identity for this subject: valid token, no roles.
    const db = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => ({ limit: async () => [] }),
          }),
        }),
      }),
    } as unknown as Database;
    const app = buildApp({
      db,
      checkDatabase: async () => undefined,
      logger: false,
      identity: prod,
    });
    try {
      const token = await sign(prodKeys, {
        iss: prod.proxyUrl,
        sub: "user_unprovisioned",
        sid: "sess_synthetic",
        azp: prodOrigin,
        exp: now() + 60,
        nbf: now() - 1,
        // Token-supplied role metadata must never become a permission.
        role: "Employer",
        metadata: { roles: ["Employer", "Recruiter"] },
      });
      for (const url of [
        "/auth/session",
        "/employer/vacancies",
        "/recruiter/vacancies",
        "/candidate/skills",
      ]) {
        const res = await app.inject({
          url,
          headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode, url).toBe(401);
      }
    } finally {
      await app.close();
    }
  });
});
