import { clerkFrontendApiProxy } from "@clerk/backend/proxy";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import type { FastifyInstance } from "fastify";
import type { IdentityConfig } from "./identity.js";

// Opt-in only. Preview retains direct Clerk loading and its existing verifier.
export function registerClerkProxy(
  app: FastifyInstance,
  config: IdentityConfig,
) {
  if (!config.proxyUrl) return;
  const proxyUrl = new URL(config.proxyUrl);
  app.register(async (scope) => {
    // Preserve the original bytes for JSON, forms and other FAPI payloads.
    scope.removeAllContentTypeParsers();
    scope.addContentTypeParser("*", { parseAs: "buffer" }, (_req, body, done) =>
      done(null, body),
    );
    scope.route({
      method: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      url: "/__clerk/*",
      logLevel: "silent", // No auth payloads or query tokens in request logs.
      bodyLimit: 1024 * 1024,
      handler: async (request, reply) => {
        reply.header("Cache-Control", "no-store");
        try {
          const rawUrl = request.raw.url ?? "";
          const path = rawUrl.split("?")[0]!;
          // Reject normalization tricks before attaching the server credential.
          const decoded = decodeURIComponent(path);
          if (
            !path.startsWith("/__clerk/") ||
            decoded.includes("\\") ||
            decoded.includes("//") ||
            decoded.split("/").some((p) => p === "." || p === "..") ||
            /%2f|%5c|%25/i.test(path)
          ) {
            return reply.code(400).send({ error: { code: "INVALID_REQUEST" } });
          }
          const url = new URL(proxyUrl.origin + rawUrl);
          if (
            url.origin !== proxyUrl.origin ||
            !url.pathname.startsWith("/__clerk/")
          ) {
            return reply.code(400).send({ error: { code: "INVALID_REQUEST" } });
          }
          const headers = new Headers();
          for (const [key, value] of Object.entries(request.headers)) {
            if (
              value !== undefined &&
              !/^(host|content-length|connection|cf-connecting-ip|x-real-ip|forwarded|x-forwarded-.*|x-vercel-.*|clerk-.*)$/i.test(
                key,
              )
            ) {
              headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
          }
          const vercelIp = request.headers["x-vercel-forwarded-for"];
          const ip =
            config.trustVercelProxy && typeof vercelIp === "string"
              ? vercelIp.trim()
              : request.ip;
          if (!ip || !isIP(ip))
            return reply
              .code(503)
              .send({ error: { code: "IDENTITY_UNAVAILABLE" } });
          headers.set("X-Forwarded-For", ip);
          headers.set("X-Forwarded-Host", proxyUrl.host);
          headers.set("X-Forwarded-Proto", "https");
          const body = request.body as Buffer | undefined;
          const upstream = await clerkFrontendApiProxy(
            new Request(url, {
              method: request.method,
              headers,
              ...(body?.length ? { body: new Uint8Array(body) } : {}),
            }),
            {
              proxyPath: "/__clerk",
              publishableKey: config.publishableKey,
              secretKey: config.secretKey,
              fapiUrl: "https://frontend-api.clerk.dev", // Never derived from user input/env overrides.
            },
          );
          if (upstream.status >= 500) {
            await upstream.body?.cancel();
            return reply
              .code(503)
              .send({ error: { code: "IDENTITY_UNAVAILABLE" } });
          }
          upstream.headers.forEach((value, key) => {
            if (
              !/^(set-cookie|clerk-secret-key|authorization|cache-control)$/i.test(
                key,
              )
            )
              reply.header(key, value);
          });
          const cookies = upstream.headers.getSetCookie();
          if (cookies.length) reply.header("set-cookie", cookies);
          reply.code(upstream.status);
          return reply.send(
            upstream.body
              ? Readable.fromWeb(
                  // Node and DOM stream declarations differ; the runtime is Node 24.
                  upstream.body as unknown as Parameters<
                    typeof Readable.fromWeb
                  >[0],
                )
              : undefined,
          );
        } catch {
          return reply
            .code(503)
            .send({ error: { code: "IDENTITY_UNAVAILABLE" } });
        }
      },
    });
  });
}
