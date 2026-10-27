import { readConfig } from "./config.js";
import { readIdentityConfig } from "./auth/identity.js";

type Gate = {
  gate:
    "runtime_configuration" | "identity_configuration" | "production_identity";
  status: "PASS" | "BLOCKED" | "NOT TESTED";
  code: string;
};

// Operator-only, offline preflight. Return fixed codes, never values, errors,
// URLs, subjects or connection details. Do not connect or change configuration.
export function diagnoseConfiguration(env: NodeJS.ProcessEnv) {
  const gates: Gate[] = [];
  if (!env.DATABASE_URL) {
    gates.push({
      gate: "runtime_configuration",
      status: "BLOCKED",
      code: env.HIREDFLEX_PROD_DATABASE_URL
        ? "DATABASE_URL_MISSING_PREFIXED_INTEGRATION_PRESENT"
        : "DATABASE_URL_MISSING",
    });
  } else {
    try {
      readConfig(env);
      gates.push({
        gate: "runtime_configuration",
        status: "PASS",
        code: "RUNTIME_CONFIG_VALID",
      });
    } catch {
      gates.push({
        gate: "runtime_configuration",
        status: "BLOCKED",
        code: "RUNTIME_CONFIG_INVALID",
      });
    }
  }

  let identity;
  try {
    identity = readIdentityConfig(env);
    gates.push({
      gate: "identity_configuration",
      status: identity ? "PASS" : "BLOCKED",
      code: identity ? "IDENTITY_CONFIG_VALID" : "IDENTITY_CONFIG_INCOMPLETE",
    });
  } catch {
    gates.push({
      gate: "identity_configuration",
      status: "BLOCKED",
      code: "IDENTITY_CONFIG_INVALID",
    });
  }
  if (env.VERCEL_ENV !== "production") {
    gates.push({
      gate: "production_identity",
      status: "NOT TESTED",
      code: "PRODUCTION_TARGET_NOT_ASSERTED",
    });
  } else {
    const liveKeys =
      identity?.publishableKey.startsWith("pk_live_") &&
      identity.secretKey.startsWith("sk_live_");
    gates.push({
      gate: "production_identity",
      status: liveKeys ? "PASS" : "BLOCKED",
      code: liveKeys
        ? "LIVE_KEY_PREFIXES_PRESENT"
        : "LIVE_IDENTITY_CONFIG_REQUIRED",
    });
  }
  return {
    scope: "offline_configuration_only",
    status: gates.some((gate) => gate.status === "BLOCKED")
      ? "BLOCKED"
      : "PASS",
    gates,
    databaseConnectivity: "NOT TESTED",
    migrations: "NOT TESTED",
    providerSessionsAndRoles: "NOT TESTED",
    productionAcceptance: "NOT TESTED",
  };
}
