import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { eq, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Database } from "../db/client.js";
import {
  authIdentities,
  candidates,
  users,
  userRoles,
} from "../db/schema/index.js";
import { ApiError } from "../api/errors.js";
import {
  UnauthorizedError,
  type AuthenticatedPrincipal,
} from "./authorization.js";

export interface IdentityConfig {
  issuer: string;
  publishableKey: string;
  secretKey: string;
  origins: string[];
}

export function readIdentityConfig(
  env: NodeJS.ProcessEnv = process.env,
): IdentityConfig | undefined {
  const publishableKey =
    env.CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || !env.CLERK_SECRET_KEY || !env.AUTH_ALLOWED_ORIGINS)
    return undefined;
  if (!/^pk_(test|live)_[A-Za-z0-9+/=]+$/.test(publishableKey))
    throw new Error("Invalid Clerk publishable key");
  const domain = Buffer.from(publishableKey.split("_")[2]!, "base64")
    .toString()
    .replace(/\$$/, "");
  if (!/^[a-z0-9.-]+$/.test(domain) || !domain.includes("."))
    throw new Error("Invalid Clerk domain");
  const origins = env.AUTH_ALLOWED_ORIGINS.split(",").map((item) =>
    item.trim(),
  );
  for (const origin of origins) {
    const url = new URL(origin);
    if (
      url.hostname.includes("*") ||
      url.origin !== origin ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.hostname === "localhost"))
    )
      throw new Error(
        "AUTH_ALLOWED_ORIGINS must contain exact trusted origins",
      );
  }
  return {
    issuer: `https://${domain}`,
    publishableKey,
    secretKey: env.CLERK_SECRET_KEY,
    origins,
  };
}

export function assertSessionClaims(
  payload: JWTPayload,
  config: Pick<IdentityConfig, "issuer" | "origins">,
): string {
  if (
    payload.iss !== config.issuer ||
    typeof payload.sub !== "string" ||
    !payload.sub.startsWith("user_") ||
    typeof payload.sid !== "string" ||
    !payload.sid.startsWith("sess_") ||
    typeof payload.exp !== "number" ||
    typeof payload.nbf !== "number" ||
    payload.sts === "pending" ||
    typeof payload.azp !== "string" ||
    !config.origins.includes(payload.azp)
  )
    throw new UnauthorizedError();
  return payload.sub;
}

export function createTokenVerifier(
  config: IdentityConfig,
  verificationKey?: Parameters<typeof jwtVerify>[1],
) {
  const jwks =
    verificationKey ??
    createRemoteJWKSet(new URL(`${config.issuer}/.well-known/jwks.json`));
  return async (request: FastifyRequest): Promise<string | null> => {
    const authorization = request.headers.authorization;
    if (!authorization) return null;
    if (!/^Bearer [^\s]+$/.test(authorization)) throw new UnauthorizedError();
    try {
      const { payload } = await jwtVerify(authorization.slice(7), jwks, {
        issuer: config.issuer,
        algorithms: ["RS256"],
        requiredClaims: ["exp", "nbf", "sub", "sid", "azp"],
        clockTolerance: 5,
      });
      return assertSessionClaims(payload, config);
    } catch {
      throw new UnauthorizedError();
    }
  };
}

export async function principalForSubject(
  db: Database,
  subject: string,
): Promise<AuthenticatedPrincipal | null> {
  const [user] = await db
    .select({ userId: users.id, status: users.accountStatus })
    .from(authIdentities)
    .innerJoin(users, eq(users.id, authIdentities.userId))
    .where(eq(authIdentities.subject, subject))
    .limit(1);
  if (!user || user.status !== "Active") return null;
  const roleAssignments = await db
    .select({ role: userRoles.role, companyId: userRoles.companyId })
    .from(userRoles)
    .where(eq(userRoles.userId, user.userId));
  return { userId: user.userId, roleAssignments };
}

type ClerkUser = {
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email_addresses: {
    id: string;
    email_address: string;
    verification: { status: string };
  }[];
};
export function registerIdentityRoutes(
  app: FastifyInstance,
  db: Database,
  config: IdentityConfig,
) {
  const verify = createTokenVerifier(config);
  app.addHook("onRequest", async (request) => {
    const subject = await verify(request);
    if (subject) request.principal = await principalForSubject(db, subject);
  });
  app.get("/auth/session", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!request.principal) throw new UnauthorizedError();
    const [user] = await db
      .select({ displayName: users.displayName, email: users.email })
      .from(users)
      .where(eq(users.id, request.principal.userId))
      .limit(1);
    return { ...request.principal, ...user };
  });
  app.post("/auth/onboard", async (request, reply) => {
    const subject = await verify(request);
    if (!subject) throw new UnauthorizedError();
    if (
      request.body !== undefined &&
      (request.body === null ||
        typeof request.body !== "object" ||
        Array.isArray(request.body) ||
        Object.keys(request.body).length)
    )
      throw new ApiError(400, "INVALID_REQUEST");
    if (request.principal) return reply.code(200).send(request.principal);
    const response = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`,
      {
        headers: { Authorization: `Bearer ${config.secretKey}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new ApiError(503, "IDENTITY_UNAVAILABLE");
    const profile = (await response.json()) as ClerkUser;
    const email = profile.email_addresses
      .find(
        (item) =>
          item.id === profile.primary_email_address_id &&
          item.verification.status === "verified",
      )
      ?.email_address.toLowerCase();
    if (!email) throw new ApiError(403, "VERIFIED_EMAIL_REQUIRED");
    const displayName =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      "HiredFlex candidate";
    try {
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${subject}, 0))`,
        );
        const [existing] = await tx
          .select()
          .from(authIdentities)
          .where(eq(authIdentities.subject, subject))
          .limit(1);
        if (existing) return;
        // Never attach a new identity to an existing account solely by email.
        const [user] = await tx
          .insert(users)
          .values({ email, displayName, accountStatus: "Active" })
          .returning({ id: users.id });
        if (!user) throw new Error("Account insert failed");
        await tx.insert(authIdentities).values({ subject, userId: user.id });
        await tx.insert(candidates).values({ userId: user.id });
        await tx
          .insert(userRoles)
          .values({ userId: user.id, role: "Candidate" });
      });
    } catch (error) {
      let current: unknown = error;
      while (current instanceof Error) {
        if ((current as Error & { code?: string }).code === "23505")
          throw new ApiError(409, "ACCOUNT_REQUIRES_SUPPORT");
        current = current.cause;
      }
      throw error;
    }
    const principal = await principalForSubject(db, subject);
    if (!principal) throw new UnauthorizedError();
    return reply.code(201).send(principal);
  });
}
