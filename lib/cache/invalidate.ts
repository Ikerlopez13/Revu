import "server-only";
import { findTagForCache, findTagIdsByBusiness } from "@/lib/db/queries/tags";
import { redis } from "./redis";
import { redisTagCache } from "./tag-cache";

/**
 * Write-through tras editar un tag: escribe el valor nuevo en todas sus claves
 * (código y alias) para que el siguiente escaneo no tenga que ir a Postgres.
 */
export async function refreshTagCache(tagId: string): Promise<void> {
  const r = redis();
  if (!r) return;
  const found = await findTagForCache(tagId);
  if (!found) return;
  const cache = redisTagCache(r);
  await Promise.all(found.keys.map((k) => cache.set(k, found.tag)));
}

/** Tras cambiar el place_id de un negocio, refresca todos sus tags. */
export async function refreshBusinessCache(businessId: string): Promise<void> {
  const ids = await findTagIdsByBusiness(businessId);
  await Promise.all(ids.map(refreshTagCache));
}
