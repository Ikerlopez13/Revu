import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, type Db } from "../client";
import {
  batches,
  businesses,
  scans,
  tagAliases,
  tagEvents,
  tags,
  type Business,
  type Tag,
  type TagEventAction,
  type TagStatus,
} from "../schema";

/** La conexión normal o una transacción. */
export type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

// ---------- Tags ----------

export type TagFilters = { status?: TagStatus; businessId?: string; batchId?: string; q?: string };

export async function listTags(filters: TagFilters, limit = 200) {
  const where: SQL[] = [];
  if (filters.status) where.push(eq(tags.status, filters.status));
  if (filters.businessId) where.push(eq(tags.businessId, filters.businessId));
  if (filters.batchId) where.push(eq(tags.batchId, filters.batchId));
  if (filters.q) {
    const q = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(tags.code, q), ilike(tags.label, q), ilike(businesses.name, q))!);
  }
  return db()
    .select({
      code: tags.code,
      status: tags.status,
      label: tags.label,
      destinationType: tags.destinationType,
      businessName: businesses.name,
      batchName: batches.name,
      updatedAt: tags.updatedAt,
    })
    .from(tags)
    .leftJoin(businesses, eq(businesses.id, tags.businessId))
    .leftJoin(batches, eq(batches.id, tags.batchId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(tags.updatedAt))
    .limit(limit);
}

export async function getTagDetail(code: string) {
  const [row] = await db()
    .select({ tag: tags, business: businesses, batch: batches })
    .from(tags)
    .leftJoin(businesses, eq(businesses.id, tags.businessId))
    .leftJoin(batches, eq(batches.id, tags.batchId))
    .where(eq(tags.code, code))
    .limit(1);
  if (!row) return null;
  const aliases = await db().select({ alias: tagAliases.alias }).from(tagAliases).where(eq(tagAliases.tagId, row.tag.id));
  return { ...row, aliases: aliases.map((a) => a.alias) };
}

export async function getTagHistory(tagId: string, limit = 30) {
  return db().select().from(tagEvents).where(eq(tagEvents.tagId, tagId)).orderBy(desc(tagEvents.createdAt)).limit(limit);
}

export async function getTagScanSummary(tagId: string) {
  const [totals] = await db()
    .select({
      total: sql<number>`count(*)::int`,
      week: sql<number>`count(*) FILTER (WHERE ${scans.scannedAt} >= now() - interval '7 days')::int`,
    })
    .from(scans)
    .where(eq(scans.tagId, tagId));
  const recent = await db()
    .select({ scannedAt: scans.scannedAt, os: scans.os, country: scans.country, outcome: scans.outcome, businessName: businesses.name })
    .from(scans)
    .leftJoin(businesses, eq(businesses.id, scans.businessId))
    .where(eq(scans.tagId, tagId))
    .orderBy(desc(scans.scannedAt))
    .limit(20);
  return { total: totals?.total ?? 0, week: totals?.week ?? 0, recent };
}

export async function lockTagByCode(tx: Executor, code: string): Promise<Tag | null> {
  const [tag] = await tx.select().from(tags).where(eq(tags.code, code)).for("update").limit(1);
  return tag ?? null;
}

export type TagPatch = Partial<Pick<Tag, "businessId" | "status" | "destinationType" | "destinationUrl" | "label">>;

export async function updateTag(tx: Executor, id: string, patch: TagPatch): Promise<Tag> {
  const [tag] = await tx.update(tags).set({ ...patch, updatedAt: new Date() }).where(eq(tags.id, id)).returning();
  return tag!;
}

export async function insertTagEvent(
  tx: Executor,
  ev: { tagId: string; actorEmail: string; action: TagEventAction; before: unknown; after: unknown },
) {
  await tx.insert(tagEvents).values(ev);
}

export async function aliasExists(tx: Executor, alias: string): Promise<boolean> {
  const [row] = await tx.select({ alias: tagAliases.alias }).from(tagAliases).where(eq(tagAliases.alias, alias)).limit(1);
  return !!row;
}

export async function listNumericAliases(): Promise<string[]> {
  const rows = await db().select({ alias: tagAliases.alias }).from(tagAliases).where(sql`${tagAliases.alias} ~ '^[0-9]+$'`);
  return rows.map((r) => r.alias);
}

/** Tag suelto (sin lote) con el código dado; null si el código ya existía. */
export async function insertLooseTag(tx: Executor, code: string): Promise<Tag | null> {
  const [tag] = await tx.insert(tags).values({ code }).onConflictDoNothing({ target: tags.code }).returning();
  return tag ?? null;
}

export async function insertAlias(tx: Executor, alias: string, tagId: string) {
  await tx.insert(tagAliases).values({ alias, tagId });
}

/** Inserta los códigos que no existan; devuelve los que entraron. */
export async function insertBatchTags(tx: Executor, batchId: string, codes: string[]): Promise<string[]> {
  if (!codes.length) return [];
  const rows = await tx
    .insert(tags)
    .values(codes.map((code) => ({ code, batchId })))
    .onConflictDoNothing({ target: tags.code })
    .returning({ code: tags.code });
  return rows.map((r) => r.code);
}

export async function countTagsByStatus() {
  const rows = await db().select({ status: tags.status, n: count() }).from(tags).groupBy(tags.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<TagStatus, number>>;
}

// ---------- Lotes ----------

export async function insertBatch(tx: Executor, name: string, quantity: number) {
  const [batch] = await tx.insert(batches).values({ name, quantity }).returning();
  return batch!;
}

export async function listBatches() {
  return db()
    .select({
      id: batches.id,
      name: batches.name,
      quantity: batches.quantity,
      createdAt: batches.createdAt,
      unassigned: sql<number>`count(${tags.id}) FILTER (WHERE ${tags.status} = 'unassigned')::int`,
      total: sql<number>`count(${tags.id})::int`,
    })
    .from(batches)
    .leftJoin(tags, eq(tags.batchId, batches.id))
    .groupBy(batches.id)
    .orderBy(desc(batches.createdAt));
}

export async function getBatchWithTags(id: string) {
  const [batch] = await db().select().from(batches).where(eq(batches.id, id)).limit(1);
  if (!batch) return null;
  const rows = await db()
    .select({ code: tags.code, status: tags.status, label: tags.label, businessName: businesses.name })
    .from(tags)
    .leftJoin(businesses, eq(businesses.id, tags.businessId))
    .where(eq(tags.batchId, id))
    .orderBy(asc(tags.createdAt), asc(tags.code));
  return { batch, tags: rows };
}

// ---------- Negocios ----------

export async function searchBusinesses(q: string, limit = 8) {
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  return db()
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug, googlePlaceId: businesses.googlePlaceId })
    .from(businesses)
    .where(and(isNull(businesses.archivedAt), or(ilike(businesses.name, like), ilike(businesses.slug, like))))
    .orderBy(asc(businesses.name))
    .limit(limit);
}

export async function listBusinesses() {
  return db()
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      googlePlaceId: businesses.googlePlaceId,
      archivedAt: businesses.archivedAt,
      activeTags: sql<number>`count(${tags.id}) FILTER (WHERE ${tags.status} = 'active')::int`,
      totalTags: sql<number>`count(${tags.id})::int`,
    })
    .from(businesses)
    .leftJoin(tags, eq(tags.businessId, businesses.id))
    .groupBy(businesses.id)
    .orderBy(asc(businesses.name));
}

export async function listBusinessOptions() {
  return db()
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(isNull(businesses.archivedAt))
    .orderBy(asc(businesses.name));
}

export async function getBusiness(id: string): Promise<Business | null> {
  const [b] = await db().select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return b ?? null;
}

export async function getBusinessTx(tx: Executor, id: string): Promise<Business | null> {
  const [b] = await tx.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return b ?? null;
}

export async function getBusinessesByIds(ids: string[], tx: Executor = db()) {
  if (!ids.length) return [];
  return tx.select({ id: businesses.id, name: businesses.name }).from(businesses).where(inArray(businesses.id, ids));
}

export async function findBusinessByPlaceId(tx: Executor, placeId: string): Promise<Business | null> {
  const [b] = await tx
    .select()
    .from(businesses)
    .where(and(eq(businesses.googlePlaceId, placeId), isNull(businesses.archivedAt)))
    .limit(1);
  return b ?? null;
}

/** Crea el negocio con un slug libre (slug, slug-2, slug-3…). */
export async function insertBusiness(
  tx: Executor,
  input: { baseSlug: string; name: string; googlePlaceId: string | null; notes: string | null },
): Promise<Business> {
  const base = input.baseSlug || "negocio";
  for (let i = 1; i <= 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [b] = await tx
      .insert(businesses)
      .values({ slug, name: input.name, googlePlaceId: input.googlePlaceId, notes: input.notes })
      .onConflictDoNothing({ target: businesses.slug })
      .returning();
    if (b) return b;
  }
  throw new Error("No se encontró un slug libre");
}

export async function updateBusinessRow(
  id: string,
  patch: Partial<Pick<Business, "name" | "googlePlaceId" | "notes" | "archivedAt">>,
): Promise<Business | null> {
  const [b] = await db().update(businesses).set({ ...patch, updatedAt: new Date() }).where(eq(businesses.id, id)).returning();
  return b ?? null;
}

export async function listBusinessTags(businessId: string) {
  return db()
    .select({ code: tags.code, status: tags.status, label: tags.label })
    .from(tags)
    .where(eq(tags.businessId, businessId))
    .orderBy(asc(tags.label), asc(tags.code));
}
