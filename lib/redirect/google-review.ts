import type { ScanOs } from "@/lib/db/schema";

/**
 * Destino de reseña de Google. Es la lógica que ya estaba en producción
 * (api/r/[slug].js): una única URL para todos los sistemas, que iOS y Android
 * abren en la app de Google/Maps si está instalada.
 * `_os` queda como punto de extensión por si algún día se vuelve a separar por SO
 * (la versión antigua con intent:// y comgooglemaps:// está en el commit a7f07d9).
 */
export function buildGoogleReviewUrl(placeId: string, _os: ScanOs): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
