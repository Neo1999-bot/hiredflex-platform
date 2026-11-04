import assert from "node:assert/strict";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import type postgres from "postgres";
import { buildApp } from "../src/app.js";
import type { Database } from "../src/db/client.js";

// Called only by the disposable-database harness; never use an application DB.
export async function verifySignedOnboarding(
  client: postgres.Sql,
  db: Database,
) {
  const [database] = await client`select current_database() as name`;
  assert.match(String(database!.name), /^hiredflex_verify_[0-9a-f]{32}$/);
  const origin = "https://hiredflex.example.invalid";
  const identity = {
    issuer: "https://clerk.hiredflex.example.invalid",
    origins: [origin],
    proxyUrl: origin + "/__clerk",
    publishableKey: "synthetic-unused",
    secretKey: "sk_live_SYNTHETIC_UNUSED",
  };
  const keys = await generateKeyPair("RS256");
  const jwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: "disposable-onboarding",
  };
  async function token(subject: string) {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({
      iss: identity.issuer,
      azp: origin,
      sub: subject,
      sid: "sess_fixture",
      exp: now + 600,
      nbf: now - 1,
      // Client claims must not replace persisted Candidate-only assignments.
      public_metadata: { role: "Employer" },
    })
      .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
      .sign(keys.privateKey);
  }
  const profiles = new Map([
    [
      "user_fixture_a",
      { email: "onboarding-a@example.invalid", verified: true },
    ],
    [
      "user_fixture_b",
      { email: "onboarding-b@example.invalid", verified: true },
    ],
    [
      "user_fixture_duplicate",
      { email: "ONBOARDING-A@example.invalid", verified: true },
    ],
    [
      "user_fixture_unverified",
      { email: "unverified@example.invalid", verified: false },
    ],
    [
      "user_fixture_rollback",
      { email: "rollback@example.invalid", verified: true },
    ],
  ]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url === "https://api.clerk.com/v1/jwks")
      return Response.json({ keys: [jwk] });
    const subject = url.startsWith("https://api.clerk.com/v1/users/")
      ? url.slice("https://api.clerk.com/v1/users/".length)
      : "";
    const profile = profiles.get(subject);
    if (!profile) throw new Error("Unexpected synthetic provider destination");
    return Response.json({
      first_name: null,
      last_name: null,
      primary_email_address_id: "primary",
      email_addresses: [
        {
          id: "primary",
          email_address: profile.email,
          verification: profile.verified ? { status: "verified" } : null,
        },
      ],
    });
  };
  const app = buildApp({
    db,
    identity,
    checkDatabase: async () => undefined,
    logger: false,
  });
  async function call(
    subject: string | undefined,
    method: "GET" | "POST" | "DELETE",
    url: string,
    status: number,
    payload?: object,
  ) {
    const response = await app.inject({
      method,
      url,
      headers: subject
        ? { authorization: `Bearer ${await token(subject)}` }
        : {},
      ...(payload ? { payload } : {}),
    });
    assert.equal(
      response.statusCode,
      status,
      `${method} ${url} expected ${status}`,
    );
    return response.json();
  }
  async function snapshot() {
    const [row] = await client`select jsonb_build_object(
      'users', (select jsonb_agg(to_jsonb(t) order by id) from users t),
      'identities', (select jsonb_agg(to_jsonb(t) order by subject) from auth_identities t),
      'candidates', (select jsonb_agg(to_jsonb(t) order by id) from candidates t),
      'roles', (select jsonb_agg(to_jsonb(t) order by id) from user_roles t)
    ) as state`;
    return JSON.stringify(row!.state);
  }
  try {
    const before = await snapshot();
    await call(undefined, "GET", "/auth/session", 401);
    await call("user_fixture_a", "GET", "/auth/session", 401);
    await call("user_fixture_a", "POST", "/auth/onboard", 400, {
      role: "Employer",
    });
    const refused = await call(
      "user_fixture_unverified",
      "POST",
      "/auth/onboard",
      403,
      {},
    );
    assert.equal(refused.error.code, "VERIFIED_EMAIL_REQUIRED");
    assert.equal(
      await snapshot(),
      before,
      "Refused onboarding must write nothing",
    );

    const a = await call("user_fixture_a", "POST", "/auth/onboard", 201, {});
    assert.deepEqual(a.roleAssignments, [
      { role: "Candidate", companyId: null },
    ]);
    const afterA = await snapshot();
    const repeated = await call(
      "user_fixture_a",
      "POST",
      "/auth/onboard",
      200,
      {},
    );
    assert.equal(repeated.userId, a.userId);
    assert.equal(
      await snapshot(),
      afterA,
      "Repeat onboarding must not duplicate or mutate accounts",
    );
    const [counts] = await client`select
      (select count(*)::int from users where id=${a.userId}) as users,
      (select count(*)::int from candidates where user_id=${a.userId}) as candidates,
      (select count(*)::int from auth_identities where user_id=${a.userId}) as identities,
      (select count(*)::int from user_roles where user_id=${a.userId}) as roles`;
    assert.deepEqual(counts, {
      users: 1,
      candidates: 1,
      identities: 1,
      roles: 1,
    });

    const b = await call("user_fixture_b", "POST", "/auth/onboard", 201, {});
    assert.notEqual(a.userId, b.userId);
    const profileA = await call(
      "user_fixture_a",
      "GET",
      "/candidate/profile",
      200,
    );
    const profileB = await call(
      "user_fixture_b",
      "GET",
      "/candidate/profile",
      200,
    );
    assert.equal(profileA.userId, a.userId);
    assert.equal(profileB.userId, b.userId);
    assert.notEqual(profileA.id, profileB.id);
    const skill = await call(
      "user_fixture_a",
      "POST",
      "/candidate/skills",
      201,
      { skillName: "Synthetic persistence" },
    );
    assert.deepEqual(
      await call("user_fixture_b", "GET", "/candidate/skills", 200),
      [],
    );
    await call(
      "user_fixture_b",
      "DELETE",
      `/candidate/skills/${skill.id}`,
      404,
    );
    const retained = await call(
      "user_fixture_a",
      "GET",
      "/candidate/skills",
      200,
    );
    assert.equal(retained.length, 1);
    assert.equal(retained[0].id, skill.id);
    const session = await call("user_fixture_a", "GET", "/auth/session", 200);
    assert.equal(session.userId, a.userId);
    assert.equal(session.email, "onboarding-a@example.invalid");
    await call("user_fixture_a", "GET", "/employer/vacancies", 403);
    await call("user_fixture_a", "GET", "/recruiter/vacancies", 403);

    const beforeDuplicate = await snapshot();
    const duplicate = await call(
      "user_fixture_duplicate",
      "POST",
      "/auth/onboard",
      409,
      {},
    );
    assert.equal(duplicate.error.code, "ACCOUNT_REQUIRES_SUPPORT");
    assert.equal(
      await snapshot(),
      beforeDuplicate,
      "Email conflict must not link identities or leave partial accounts",
    );
    await call("user_fixture_duplicate", "GET", "/auth/session", 401);

    // Fail the last insert in the existing onboarding transaction. All earlier
    // inserts must roll back; the trigger exists only in this random test DB.
    await client`create function verify_onboarding_failure() returns trigger language plpgsql as $$ begin raise exception 'synthetic onboarding rollback'; end $$`;
    try {
      await client`create trigger verify_onboarding_failure before insert on user_roles for each row execute function verify_onboarding_failure()`;
      const beforeFailure = await snapshot();
      await call("user_fixture_rollback", "POST", "/auth/onboard", 500, {});
      assert.equal(
        await snapshot(),
        beforeFailure,
        "Failed role insert must roll back user, identity and candidate",
      );
      await call("user_fixture_rollback", "GET", "/auth/session", 401);
    } finally {
      await client`drop trigger if exists verify_onboarding_failure on user_roles`;
      await client`drop function verify_onboarding_failure()`;
    }
    await call("user_fixture_rollback", "POST", "/auth/onboard", 201, {});
    await call(undefined, "GET", "/auth/session", 401);
    console.log(
      "PASS: signed synthetic onboarding with real disposable PostgreSQL: Candidate-only creation, idempotency, refusal/no writes, persisted session/profile/skills separation, duplicate-email 409/no linking, last-insert atomic rollback/retry, candidate role denial; not live Clerk/browser authentication",
    );
  } finally {
    try {
      await app.close();
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
}
