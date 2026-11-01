import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // El proyecto de Supabase es compartido: RevuTags solo toca el schema "revu".
  schemaFilter: ["revu"],
  migrations: { schema: "revu", table: "__drizzle_migrations" },
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
