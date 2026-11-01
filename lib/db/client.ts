import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { revuDb?: Db };

/**
 * Conexión a Supabase por el pooler en modo transacción (puerto 6543), que
 * no admite prepared statements. Una sola instancia por proceso: Vercel Fluid
 * reutiliza la función entre peticiones.
 */
export function db(): Db {
  if (!globalForDb.revuDb) {
    const client = postgres(env().DATABASE_URL, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 5 });
    globalForDb.revuDb = drizzle(client, { schema });
  }
  return globalForDb.revuDb;
}
