import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyRequest,
} from "fastify";
import {
  ForbiddenError,
  UnauthorizedError,
  type AuthenticatedPrincipal,
} from "./auth/authorization.js";
import { installAuthenticationBoundary } from "./auth/fastify.js";
import type { Database } from "./db/client.js";
import { registerWorkflowRoutes } from "./routes.js";
import { registerMatchingRoutes } from "./matching-routes.js";
import { registerStructuredDataRoutes } from "./structured-data-routes.js";
import { ApiError } from "./api/errors.js";

export interface AppDependencies {
  db: Database;
  checkDatabase: () => Promise<void>;
  resolvePrincipal?: (
    request: FastifyRequest,
  ) => AuthenticatedPrincipal | null | Promise<AuthenticatedPrincipal | null>;
  logger?: boolean;
}

export function buildApp({
  db,
  checkDatabase,
  resolvePrincipal,
  logger = true,
}: AppDependencies): FastifyInstance {
  const app = Fastify({ logger });
  installAuthenticationBoundary(app);
  if (resolvePrincipal) {
    app.addHook("onRequest", async (request) => {
      request.principal = await resolvePrincipal(request);
    });
  }
  registerWorkflowRoutes(app, db);
  registerMatchingRoutes(app, db);
  registerStructuredDataRoutes(app, db);

  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async (_request, reply) => {
    try {
      await checkDatabase();
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "unavailable" });
    }
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof UnauthorizedError) {
      return reply.code(401).send({ error: { code: "UNAUTHENTICATED" } });
    }
    if (error instanceof ForbiddenError) {
      return reply.code(403).send({ error: { code: "FORBIDDEN" } });
    }
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code },
      });
    }

    const statusCode =
      typeof error.statusCode === "number" ? error.statusCode : undefined;
    if (statusCode === 404 || statusCode === 409) {
      return reply.code(statusCode).send({
        error: { code: statusCode === 404 ? "NOT_FOUND" : "CONFLICT" },
      });
    }

    const clientError = typeof statusCode === "number" && statusCode < 500;
    if (clientError) {
      return reply.code(error.statusCode!).send({
        error: { code: "INVALID_REQUEST", message: error.message },
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: { code: "INTERNAL_SERVER_ERROR" } });
  });

  return app;
}
