import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";

const origin = "https://hiredflex.example.invalid";
const config = {
  issuer: "https://clerk.hiredflex.example.invalid",
  origins: [origin],
  proxyUrl: origin + "/__clerk",
  publishableKey: "synthetic-unused",
  secretKey: "sk_live_SYNTHETIC_PRIVATE_MARKER",
};
let token: string;
let jwk: Awaited<ReturnType<typeof exportJWK>>;
beforeAll(async () => {
  const keys = await generateKeyPair("RS256");
  jwk = { ...(await exportJWK(keys.publicKey)), kid: "synthetic-onboarding" };
  const now = Math.floor(Date.now() / 1000);
  token = await new SignJWT({
    iss: config.issuer,
    azp: origin,
    sub: "user_fixture",
    sid: "sess_fixture",
    exp: now + 600,
    nbf: now - 1,
  })
    .setProtectedHeader({ alg: "RS256", kid: "synthetic-onboarding" })
    .sign(keys.privateKey);
});
afterEach(() => vi.unstubAllGlobals());

const unverified = {
  primary_email_address_id: "primary",
  first_name: null,
  last_name: null,
  email_addresses: [
    {
      id: "primary",
      email_address: "primary@example.invalid",
      verification: { status: "unverified" },
    },
    {
      id: "secondary",
      email_address: "secondary@example.invalid",
      verification: { status: "verified" },
    },
  ],
};

async function check(
  factory: () => Response,
  status: number,
  code: string,
  payload: object = {},
  authenticated = true,
  transactionFailure?: Error,
) {
  const query = {
    from: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => []),
  };
  const db = {
    select: vi.fn(() => query),
    transaction: vi.fn(async () => {
      if (transactionFailure) throw transactionFailure;
      throw new Error("Unexpected synthetic transaction");
    }),
  };
  const profile = vi.fn(factory);
  const profileRequests: RequestInit[] = [];
  const fetcher = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      const value = String(url);
      if (value === "https://api.clerk.com/v1/jwks")
        return Response.json({ keys: [jwk] });
      if (value === "https://api.clerk.com/v1/users/user_fixture") {
        profileRequests.push(init ?? {});
        return profile();
      }
      throw new Error("Unexpected synthetic provider destination");
    },
  );
  vi.stubGlobal("fetch", fetcher);
  const app = buildApp({
    db: db as unknown as Database,
    checkDatabase: async () => undefined,
    identity: config,
    logger: false,
  });
  const errors = vi.spyOn(app.log, "error");
  try {
    const result = await app.inject({
      method: "POST",
      url: "/auth/onboard",
      headers: authenticated ? { authorization: "Bearer " + token } : {},
      payload,
    });
    expect(result.statusCode).toBe(status);
    expect(result.json()).toEqual({ error: { code } });
    expect(result.body).not.toContain("SYNTHETIC_PRIVATE_MARKER");
    if (transactionFailure) expect(db.transaction).toHaveBeenCalledTimes(1);
    else expect(db.transaction).not.toHaveBeenCalled();
    expect(JSON.stringify(errors.mock.calls)).not.toContain(
      "SYNTHETIC_PRIVATE_MARKER",
    );
    for (const request of profileRequests)
      expect(request.redirect).toBe("error");
    return {
      profileCalls: profile.mock.calls.length,
      fetchCalls: fetcher.mock.calls.length,
    };
  } finally {
    await app.close();
  }
}

describe("signed onboarding refusal and provider failure boundary", () => {
  it("preserves duplicate-account 409 after a verified primary passes provider checks", async () => {
    const duplicate = Object.assign(new Error("SYNTHETIC_PRIVATE_MARKER"), {
      code: "23505",
    });
    await check(
      () =>
        Response.json({
          ...unverified,
          email_addresses: [
            {
              ...unverified.email_addresses[0],
              verification: { status: "verified" },
            },
          ],
        }),
      409,
      "ACCOUNT_REQUIRES_SUPPORT",
      {},
      true,
      duplicate,
    );
  });
  it("refuses a null verification record as unverified, without writes", async () => {
    await check(
      () =>
        Response.json({
          ...unverified,
          email_addresses: [
            {
              id: "primary",
              email_address: "primary@example.invalid",
              verification: null,
            },
          ],
        }),
      403,
      "VERIFIED_EMAIL_REQUIRED",
    );
  });
  it("does not use a verified secondary email instead of an unverified primary", async () => {
    await check(
      () => Response.json(unverified),
      403,
      "VERIFIED_EMAIL_REQUIRED",
    );
  });
  it("refuses a missing primary identity without writes", async () => {
    await check(
      () => Response.json({ ...unverified, primary_email_address_id: null }),
      403,
      "VERIFIED_EMAIL_REQUIRED",
    );
  });
  it.each([
    [
      "redirect",
      () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://foreign.example.invalid" },
        }),
    ],
    [
      "HTTP failure",
      () => new Response("SYNTHETIC_PRIVATE_MARKER", { status: 503 }),
    ],
    [
      "network failure",
      () => {
        throw new Error("SYNTHETIC_PRIVATE_MARKER");
      },
    ],
    [
      "invalid JSON",
      () => new Response("SYNTHETIC_PRIVATE_MARKER", { status: 200 }),
    ],
    [
      "invalid address collection",
      () =>
        Response.json({
          ...unverified,
          email_addresses: "SYNTHETIC_PRIVATE_MARKER",
        }),
    ],
    [
      "invalid verified primary email",
      () =>
        Response.json({
          ...unverified,
          email_addresses: [
            {
              id: "primary",
              email_address: 42,
              verification: { status: "verified" },
            },
          ],
        }),
    ],
  ] as const)(
    "returns sanitised retryable 503 on %s without database writes",
    async (_label, factory) => {
      await check(factory, 503, "IDENTITY_UNAVAILABLE");
    },
  );
  it("rejects role-injection payload before reading provider profile or writing", async () => {
    const result = await check(
      () => Response.json(unverified),
      400,
      "INVALID_REQUEST",
      { role: "Employer", companyId: "foreign" },
    );
    expect(result.profileCalls).toBe(0);
  });
  it("refuses unsigned onboarding without calling the provider", async () => {
    const result = await check(
      () => Response.json(unverified),
      401,
      "UNAUTHENTICATED",
      {},
      false,
    );
    expect(result.fetchCalls).toBe(0);
  });
});
