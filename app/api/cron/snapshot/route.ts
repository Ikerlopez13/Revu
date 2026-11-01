import { timingSafeEqual } from "node:crypto";
import { insertReviewSnapshots, listBusinessesForSnapshot } from "@/lib/db/queries/analytics";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Snapshot diario de nota y nº de reseñas (cron en vercel.json).
// Vercel manda "Authorization: Bearer $CRON_SECRET". Antes se aceptaba la cabecera
// x-vercel-cron, que cualquiera puede enviar.
function authorized(request: Request): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const apiKey = env().GOOGLE_PLACES_KEY;
  if (!apiKey) return Response.json({ error: "GOOGLE_PLACES_KEY not configured" }, { status: 500 });

  const list = await listBusinessesForSnapshot();
  const results = await Promise.all(
    list.map(async (b) => {
      try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(b.placeId!)}?languageCode=es`, {
          headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "rating,userRatingCount" },
        });
        if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 120)}`);
        const data = (await res.json()) as { rating?: number; userRatingCount?: number };
        return { ok: true as const, slug: b.slug, row: { businessId: b.id, rating: data.rating ?? null, reviewCount: data.userRatingCount ?? null } };
      } catch (err) {
        return { ok: false as const, slug: b.slug, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );

  const rows = results.flatMap((r) => (r.ok ? [r.row] : []));
  await insertReviewSnapshots(rows);
  return Response.json({
    saved: rows.length,
    failed: results.filter((r) => !r.ok).map((r) => ({ slug: r.slug, error: "error" in r ? r.error : "" })),
  });
}
