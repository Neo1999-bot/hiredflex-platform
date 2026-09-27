import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { ForbiddenError, UnauthorizedError } from "./auth/authorization.js";
import { installAuthenticationBoundary } from "./auth/fastify.js";

export interface AppDependencies {
  checkDatabase: () => Promise<void>;
  logger?: boolean;
}

export function buildApp({
  checkDatabase,
  logger = true,
}: AppDependencies): FastifyInstance {
  const app = Fastify({ logger });
  installAuthenticationBoundary(app);

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

    const clientError =
      typeof error.statusCode === "number" && error.statusCode < 500;
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
