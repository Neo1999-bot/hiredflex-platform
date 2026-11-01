/* global process, fetch, console, setTimeout, clearTimeout, AbortSignal */
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

// Exercise the packaged start command, without credentials or a real database.
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const [command, ...args] = pkg.scripts.start.split(" ");
assert.equal(command, "node", "Startup verification expects a Node command");
// These fail before listening or querying any database/provider. Check the real
// packaged entrypoint, including a malformed value that Node must not echo.
const marker = "SYNTHETIC_STARTUP_SECRET_MUST_NOT_APPEAR";
const syntheticEnv = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: "postgres://unused:unused@127.0.0.1:1/unused",
  CLERK_PUBLISHABLE_KEY:
    "pk_test_" + Buffer.from("example.clerk.accounts.dev$").toString("base64"),
  CLERK_SECRET_KEY: marker,
  AUTH_ALLOWED_ORIGINS: marker,
};
for (const [patch, expected] of [
  [{ DATABASE_URL: "" }, "DATABASE_URL is required"],
  [{}, "AUTH_ALLOWED_ORIGINS must contain exact trusted origins"],
]) {
  const failed = spawnSync(process.execPath, args, {
    env: { ...syntheticEnv, ...patch },
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(failed.status, 1, "Invalid configuration must fail startup");
  assert.ok(failed.stderr.includes(expected));
  assert.equal((failed.stdout + failed.stderr).includes(marker), false);
}
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const { port } = reservation.address();
await new Promise((resolve, reject) =>
  reservation.close((error) => (error ? reject(error) : resolve())),
);
const child = spawn(process.execPath, args, {
  stdio: "ignore",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(port),
    DATABASE_URL: "postgres://unused:unused@127.0.0.1:1/unused",
    CLERK_PUBLISHABLE_KEY: "",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    CLERK_SECRET_KEY: "",
    AUTH_ALLOWED_ORIGINS: "",
  },
});
let exited = false;
let spawnError;
const closed = new Promise((resolve) => child.once("close", resolve));
child.once("exit", () => (exited = true));
child.once("error", (error) => (spawnError = error));
const origin = `http://127.0.0.1:${port}`;
const request = (path, options) =>
  fetch(origin + path, { ...options, signal: AbortSignal.timeout(1000) });
try {
  let live;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnError) throw spawnError;
    assert.equal(exited, false, "Packaged server exited before becoming live");
    try {
      live = await request("/health/live");
      break;
    } catch {
      await delay(100);
    }
  }
  assert.equal(live?.status, 200, "Packaged server must become live");
  assert.deepEqual(await live.json(), { status: "ok" });
  const page = await request("/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="content"/);
  assert.equal(page.headers.get("cache-control"), "no-store");
  for (const [path, type] of [
    ["/assets/site.js", "application/javascript"],
    ["/assets/site.css", "text/css"],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), new RegExp(type));
    assert.ok((await response.text()).length > 0);
  }
  const config = await request("/site-config");
  assert.deepEqual(await config.json(), { authenticationEnabled: false });
  for (const path of [
    "/candidate/skills",
    "/employer/vacancies",
    "/recruiter/vacancies",
  ]) {
    const response = await request(path, {
      headers: { authorization: "Bearer forged", "x-user-id": "forged" },
    });
    assert.equal(response.status, 401, path);
    assert.deepEqual(await response.json(), {
      error: { code: "UNAUTHENTICATED" },
    });
  }
  console.log(
    "PASS: packaged startup, sanitised missing-database/malformed-origin startup failures, public shell/assets, disabled identity and protected-route denial (no database/provider verification)",
  );
} finally {
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 2000);
  await closed;
  clearTimeout(timer);
}
