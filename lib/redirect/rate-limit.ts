import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/cache/redis";

let limiters: { hit: Ratelimit; miss: Ratelimit } | null | undefined;

function getLimiters() {
  if (limiters === undefined) {
    const r = redis();
    limiters = r
      ? {
          // Uso normal: de sobra para una mesa entera escaneando a la vez.
          hit: new Ratelimit({ redis: r, prefix: "revu:rl:hit", limiter: Ratelimit.slidingWindow(60, "1 m"), ephemeralCache: new Map(), timeout: 200 }),
          // Códigos inexistentes: quien enumera falla casi siempre.
          miss: new Ratelimit({ redis: r, prefix: "revu:rl:miss", limiter: Ratelimit.slidingWindow(10, "10 m"), ephemeralCache: new Map(), timeout: 200 }),
        }
      : null;
  }
  return limiters;
}

/** La IP solo se usa en memoria y, hasheada, como clave efímera del limitador. */
export function clientId(request: Request): string {
  const ip =
    request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(ip).digest("base64url").slice(0, 22);
}

export async function rateLimit(request: Request, kind: "hit" | "miss"): Promise<boolean> {
  const l = getLimiters();
  if (!l) return true;
  try {
    const { success } = await l[kind].limit(clientId(request));
    return success;
  } catch (err) {
    console.warn("ratelimit failed, allowing", err);
    return true;
  }
}
