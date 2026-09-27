import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readConfig } from "../src/config.js";
import { connectDatabase } from "../src/db/client.js";

async function main(): Promise<void> {
  const config = readConfig();
  const database = connectDatabase(config.databaseUrl);
  try {
    await migrate(database.db, { migrationsFolder: "src/db/migrations" });
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
});
