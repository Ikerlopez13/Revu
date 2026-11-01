import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/cache/redis";

// Solo cuentan los intentos FALLIDOS: 5 por email y por IP cada 15 minutos.
// Una contraseña correcta nunca queda bloqueada por intentos buenos anteriores.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Sin Upstash: en memoria, por instancia.
export class MemoryFailures {
  private store = new Map<string, number[]>();
  private recent(key: string, now: number) {
    const hits = (this.store.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    this.store.set(key, hits);
    return hits;
  }
  blocked(key: string, now = Date.now()) {
    return this.recent(key, now).length >= MAX_FAILURES;
  }
  fail(key: string, now = Date.now()) {
    this.recent(key, now).push(now);
  }
}

const memory = new MemoryFailures();
let limiter: Ratelimit | null | undefined;

function getLimiter() {
  if (limiter === undefined) {
    const r = redis();
    limiter = r
      ? new Ratelimit({ redis: r, prefix: "revu:rl:loginfail", limiter: Ratelimit.slidingWindow(MAX_FAILURES, "15 m"), timeout: 500 })
      : null;
  }
  return limiter;
}

const hash = (s: string) => createHash("sha256").update(s).digest("base64url").slice(0, 22);
const keysFor = (email: string, ip: string) => [`e:${hash(email.toLowerCase())}`, `i:${hash(ip)}`];

/** ¿Demasiados fallos recientes para este email o esta IP? */
export async function isLoginBlocked(email: string, ip: string): Promise<boolean> {
  const keys = keysFor(email, ip);
  const l = getLimiter();
  if (l) {
    try {
      const rem = await Promise.all(keys.map((k) => l.getRemaining(k)));
      return rem.some((r) => (typeof r === "number" ? r : r.remaining) <= 0);
    } catch {
      /* cae a memoria */
    }
  }
  return keys.some((k) => memory.blocked(k));
}

export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  const keys = keysFor(email, ip);
  keys.forEach((k) => memory.fail(k));
  const l = getLimiter();
  if (l) await Promise.all(keys.map((k) => l.limit(k))).catch(() => {});
}
