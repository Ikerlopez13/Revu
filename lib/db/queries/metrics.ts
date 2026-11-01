import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { fillDays, madridDay, type RangeDays } from "@/lib/metrics";
import { db } from "../client";
import { reviewSnapshots, scans, tags, type ScanOs } from "../schema";

const TZ = sql.raw("'Europe/Madrid'");

/** Inicio (UTC) del día local de Madrid que empieza `daysAgo` días antes de hoy. */
function periodStart(daysAgo: number) {
  return sql`((((now() AT TIME ZONE ${TZ})::date - ${sql.raw(String(daysAgo))}))::timestamp AT TIME ZONE ${TZ})`;
}

export async function getBusinessMetrics(businessId: string, days: RangeDays) {
  const start = periodStart(days - 1);
  const prevStart = periodStart(2 * days - 1);
  const inPeriod = and(eq(scans.businessId, businessId), gte(scans.scannedAt, start));
  const localDay = sql<string>`to_char((${scans.scannedAt} AT TIME ZONE ${TZ})::date, 'YYYY-MM-DD')`;

  const [totals, daily, byOs, byTag, reviews] = await Promise.all([
    db()
      .select({
        current: sql<number>`count(*) FILTER (WHERE ${scans.scannedAt} >= ${start})::int`,
        previous: sql<number>`count(*) FILTER (WHERE ${scans.scannedAt} < ${start})::int`,
        redirects: sql<number>`count(*) FILTER (WHERE ${scans.scannedAt} >= ${start} AND ${scans.outcome} = 'redirect')::int`,
      })
      .from(scans)
      .where(and(eq(scans.businessId, businessId), gte(scans.scannedAt, prevStart))),
    db().select({ day: localDay, count: sql<number>`count(*)::int` }).from(scans).where(inPeriod).groupBy(localDay),
    db()
      .select({ os: scans.os, count: sql<number>`count(*)::int` })
      .from(scans)
      .where(inPeriod)
      .groupBy(scans.os)
      .orderBy(desc(sql`count(*)`)),
    db()
      .select({ code: tags.code, label: tags.label, count: sql<number>`count(*)::int` })
      .from(scans)
      .innerJoin(tags, eq(tags.id, scans.tagId))
      .where(inPeriod)
      .groupBy(tags.code, tags.label)
      .orderBy(desc(sql`count(*)`), asc(tags.code)),
    db()
      .select({ rating: reviewSnapshots.rating, reviewCount: reviewSnapshots.reviewCount, capturedAt: reviewSnapshots.capturedAt })
      .from(reviewSnapshots)
      .where(and(eq(reviewSnapshots.businessId, businessId), gte(reviewSnapshots.capturedAt, start)))
      .orderBy(asc(reviewSnapshots.capturedAt)),
  ]);

  const t = totals[0] ?? { current: 0, previous: 0, redirects: 0 };
  return {
    days,
    current: t.current,
    previous: t.previous,
    redirects: t.redirects,
    daily: fillDays(daily, days, madridDay(new Date())),
    byOs: byOs as { os: ScanOs; count: number }[],
    byTag,
    reviews: reviews.map((r) => ({ ...r, capturedAt: r.capturedAt.toISOString() })),
  };
}

export type BusinessMetrics = Awaited<ReturnType<typeof getBusinessMetrics>>;

