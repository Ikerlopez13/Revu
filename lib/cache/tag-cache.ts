import type { LookupKey, ResolvedTag } from "@/lib/redirect/types";

export const NOT_FOUND = "nf" as const;
type Cached = ResolvedTag | typeof NOT_FOUND;

export interface TagCache {
  get(key: LookupKey): Promise<Cached | null>;
  set(key: LookupKey, value: Cached): Promise<void>;
}

// Red de seguridad: las ediciones escriben la clave al momento. Si Redis falla
// justo en una edición, el valor viejo caduca como mucho en un día.
const TTL_SECONDS = 60 * 60 * 24;
const NOT_FOUND_TTL_SECONDS = 60;
const TIMEOUT_MS = 150;

export const cacheKey = (k: LookupKey) => `revu:tag:${k.kind}:${k.value}`;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("redis timeout")), ms))]);
}

type RedisLike = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts: { ex: number }): Promise<unknown>;
};

export function redisTagCache(redis: RedisLike): TagCache {
  return {
    get: (key) => withTimeout(redis.get<Cached>(cacheKey(key)), TIMEOUT_MS),
    set: async (key, value) => {
      await withTimeout(redis.set(cacheKey(key), value, { ex: value === NOT_FOUND ? NOT_FOUND_TTL_SECONDS : TTL_SECONDS }), TIMEOUT_MS);
    },
  };
}

/**
 * Lookup con caché: Redis primero, Postgres si falla o no está, y se puebla la
 * caché. Un fallo de Redis nunca rompe una redirección.
 */
export function createCachedLookup(
  cache: TagCache | null,
  load: (key: LookupKey) => Promise<ResolvedTag | null>,
  onBackground: (p: Promise<unknown>) => void = (p) => void p,
) {
  return async (key: LookupKey): Promise<ResolvedTag | null> => {
    if (cache) {
      try {
        const hit = await cache.get(key);
        if (hit === NOT_FOUND) return null;
        if (hit) return hit;
      } catch (err) {
        console.warn("tag cache get failed", err);
      }
    }
    const tag = await load(key);
    if (cache) {
      onBackground(cache.set(key, tag ?? NOT_FOUND).catch((err: unknown) => console.warn("tag cache set failed", err)));
    }
    return tag;
  };
}
