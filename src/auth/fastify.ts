import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import {
  requirePrincipal,
  type AuthenticatedPrincipal,
} from "./authorization.js";

declare module "fastify" {
  interface FastifyRequest {
    principal: AuthenticatedPrincipal | null;
  }
}

export function installAuthenticationBoundary(app: FastifyInstance): void {
  app.decorateRequest("principal", null);
}

export const requireAuthenticatedPrincipal: preHandlerHookHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  requirePrincipal(request.principal);
};
