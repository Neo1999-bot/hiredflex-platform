import { buildApp } from "./app.js";
import { readConfig } from "./config.js";
import { connectDatabase } from "./db/client.js";

async function main(): Promise<void> {
  const config = readConfig();
  const database = connectDatabase(config.databaseUrl);
  const app = buildApp({
    checkDatabase: database.ping,
    logger: config.nodeEnv !== "test",
  });

  app.addHook("onClose", async () => database.close());
  process.once("SIGINT", () => void app.close());
  process.once("SIGTERM", () => void app.close());

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error: unknown) => {
  console.error("Failed to start HiredFlex API", error);
  process.exitCode = 1;
});
