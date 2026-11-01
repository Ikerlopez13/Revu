import "server-only";
import { and, asc, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { db } from "../client";
import { businesses, reviewSnapshots, scans, tagAliases, tags } from "../schema";

// Literal y no parámetro: Postgres exige que la expresión del GROUP BY sea idéntica.
const TZ = sql.raw("'Europe/Madrid'");

export type PublicAnalytics = {
  name: string;
  scans: { total: number; today: number; week: number; daily: { day: string; count: number }[] };
  reviews: { rating: number | null; reviewCount: number | null; capturedAt: string }[];
};

/** Negocio por su slug o por cualquiera de los alias de sus tags (como hacía la página antigua). */
async function findBusinessBySlugOrAlias(slug: string) {
  const [bySlug] = await db().select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  if (bySlug) return bySlug;
  const [byAlias] = await db()
    .select({ business: businesses })
    .from(tagAliases)
    .innerJoin(tags, eq(tags.id, tagAliases.tagId))
    .innerJoin(businesses, eq(businesses.id, tags.businessId))
    .where(eq(tagAliases.alias, slug))
    .limit(1);
  return byAlias?.business ?? null;
}

export async function getPublicAnalytics(slug: string): Promise<PublicAnalytics | null> {
  const business = await findBusinessBySlugOrAlias(slug);
  if (!business) return null;

  const localDay = sql<string>`to_char((${scans.scannedAt} AT TIME ZONE ${TZ})::date, 'YYYY-MM-DD')`;
  const today = sql`(now() AT TIME ZONE ${TZ})::date`;

  const [totals, daily, reviews] = await Promise.all([
    db()
      .select({
        total: sql<number>`count(*)::int`,
        today: sql<number>`count(*) FILTER (WHERE (${scans.scannedAt} AT TIME ZONE ${TZ})::date = ${today})::int`,
        week: sql<number>`count(*) FILTER (WHERE ${scans.scannedAt} >= now() - interval '7 days')::int`,
      })
      .from(scans)
      .where(eq(scans.businessId, business.id)),
    db()
      .select({ day: localDay, count: sql<number>`count(*)::int` })
      .from(scans)
      .where(and(eq(scans.businessId, business.id), sql`${scans.scannedAt} >= now() - interval '31 days'`))
      .groupBy(localDay)
      .orderBy(localDay),
    db()
      .select({ rating: reviewSnapshots.rating, reviewCount: reviewSnapshots.reviewCount, capturedAt: reviewSnapshots.capturedAt })
      .from(reviewSnapshots)
      .where(eq(reviewSnapshots.businessId, business.id))
      .orderBy(asc(reviewSnapshots.capturedAt))
      .limit(1000),
  ]);

  return {
    name: business.name,
    scans: { total: totals[0]?.total ?? 0, today: totals[0]?.today ?? 0, week: totals[0]?.week ?? 0, daily },
    reviews: reviews.map((r) => ({ ...r, capturedAt: r.capturedAt.toISOString() })),
  };
}

/** Negocios activos con ficha de Google, un place_id una sola vez. */
export async function listBusinessesForSnapshot() {
  return db()
    .selectDistinctOn([businesses.googlePlaceId], { id: businesses.id, slug: businesses.slug, placeId: businesses.googlePlaceId })
    .from(businesses)
    .where(and(isNotNull(businesses.googlePlaceId), isNull(businesses.archivedAt)));
}

export async function insertReviewSnapshots(rows: { businessId: string; rating: number | null; reviewCount: number | null }[]) {
  if (rows.length) await db().insert(reviewSnapshots).values(rows);
}
