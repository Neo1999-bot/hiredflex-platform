import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export function connectDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 10, connect_timeout: 5 });
  const db = drizzle(client, { schema });

  return {
    db,
    ping: async () => {
      await client`select 1`;
    },
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}
