import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  WHATSAPP_NUMBER: z.string().regex(/^\d{8,15}$/).default("34675977794"),
  GOOGLE_PLACES_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Se valida al primer uso (no al importar) para que el build no necesite secrets. */
export function env(): Env {
  cached ??= schema.parse({
    ...process.env,
    // Vercel guarda "" cuando una variable existe pero está vacía.
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || undefined,
    GOOGLE_PLACES_KEY: process.env.GOOGLE_PLACES_KEY || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
  });
  return cached;
}
