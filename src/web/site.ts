import type { FastifyInstance } from "fastify";
import type { IdentityConfig } from "../auth/identity.js";
import { clientScript } from "./client.js";
import { styles } from "./styles.js";

const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export function registerWebsite(
  app: FastifyInstance,
  identity?: IdentityConfig,
) {
  app.get("/assets/site.css", (_request, reply) =>
    reply.type("text/css").send(styles),
  );
  app.get("/assets/site.js", (_request, reply) =>
    reply.type("application/javascript").send(clientScript),
  );
  app.get("/site-config", (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return { authenticationEnabled: Boolean(identity) };
  });
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="HiredFlex connects job seekers with opportunities through clear skill matching and application tracking."><meta name="theme-color" content="#1054e8"><title>HiredFlex — Your next chapter</title><link rel="stylesheet" href="/assets/site.css">${identity ? `<script defer crossorigin="anonymous" src="${escape(identity.issuer)}/npm/@clerk/ui@1/dist/ui.browser.js"></script><script defer crossorigin="anonymous" data-clerk-publishable-key="${escape(identity.publishableKey)}" src="${escape(identity.issuer)}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script>` : ""}<script defer src="/assets/site.js"></script></head><body><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="#home"><span class="brand-mark">H</span>Hired<span>Flex</span></a><nav aria-label="Main navigation"><a href="#jobs">Find opportunities</a><a href="#workspace">My workspace</a><button id="sign-in" class="button small">Sign in</button><button id="sign-out" class="button quiet small" hidden>Sign out</button></nav></header><main id="main" tabindex="-1"><div id="content"><p class="loading">Loading HiredFlex…</p></div></main><div id="notice" role="status" aria-live="polite" hidden></div><footer><a class="brand" href="#home">HiredFlex</a><p>People. Possibility. Progress.</p><a href="#privacy">Privacy &amp; data</a></footer><noscript>Please enable JavaScript to browse opportunities and use your workspace.</noscript></body></html>`;
  app.get("/", (_request, reply) => {
    reply
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "strict-origin-when-cross-origin")
      .header("X-Frame-Options", "DENY");
    return reply.type("text/html; charset=utf-8").send(document);
  });
}
