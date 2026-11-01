import { LEGACY_BUSINESSES } from "./legacy-data";
import type { ResolvedTag } from "./types";

/**
 * Plan B si Postgres no responde: los enlaces antiguos (los que ya estaban
 * grabados antes del sistema nuevo) siguen redirigiendo con su destino original.
 * Los códigos nuevos /t/{code} dependen de la BD (o de Redis, si está en caché).
 * tagId vacío = no se registra el escaneo.
 */
const FALLBACK = new Map<string, ResolvedTag>();
for (const b of LEGACY_BUSINESSES) {
  for (const a of b.aliases) {
    const alias = typeof a === "string" ? a : a.alias;
    const url = typeof a === "string" ? null : a.customUrl;
    FALLBACK.set(alias, {
      tagId: "",
      code: "",
      businessId: null,
      status: "active",
      destinationType: url ? "custom_url" : "google_review",
      placeId: url ? null : b.placeId,
      destinationUrl: url,
    });
  }
}

export function legacyFallback(alias: string): ResolvedTag | null {
  return FALLBACK.get(alias) ?? null;
}

export const LEGACY_ALIASES = [...FALLBACK.keys()];
