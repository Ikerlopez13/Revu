import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let client: Redis | null | undefined;

/** null si Upstash no está configurado: todo sigue funcionando contra Postgres. */
export function redis(): Redis | null {
  if (client === undefined) {
    const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = env();
    client = url && token ? new Redis({ url, token, retry: { retries: 0 } }) : null;
  }
  return client;
}
