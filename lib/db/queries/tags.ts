import "server-only";
import { eq } from "drizzle-orm";
import type { LookupKey, ResolvedTag } from "@/lib/redirect/types";
import type { ScanRecord } from "@/lib/redirect/resolve";
import { db } from "../client";
import { businesses, scans, tagAliases, tags } from "../schema";

const resolvedColumns = {
  tagId: tags.id,
  code: tags.code,
  businessId: tags.businessId,
  status: tags.status,
  destinationType: tags.destinationType,
  placeId: businesses.googlePlaceId,
  destinationUrl: tags.destinationUrl,
};

export async function findResolvedTag(key: LookupKey): Promise<ResolvedTag | null> {
  const base = db().select(resolvedColumns).from(tags).leftJoin(businesses, eq(businesses.id, tags.businessId));
  const rows =
    key.kind === "code"
      ? await base.where(eq(tags.code, key.value)).limit(1)
      : await base.innerJoin(tagAliases, eq(tagAliases.tagId, tags.id)).where(eq(tagAliases.alias, key.value)).limit(1);
  return rows[0] ?? null;
}

/** El tag resuelto y todas las claves por las que se puede escanear (código + alias). */
export async function findTagForCache(tagId: string): Promise<{ tag: ResolvedTag; keys: LookupKey[] } | null> {
  const [tag] = await db()
    .select(resolvedColumns)
    .from(tags)
    .leftJoin(businesses, eq(businesses.id, tags.businessId))
    .where(eq(tags.id, tagId))
    .limit(1);
  if (!tag) return null;
  const aliases = await db().select({ alias: tagAliases.alias }).from(tagAliases).where(eq(tagAliases.tagId, tagId));
  return {
    tag,
    keys: [{ kind: "code", value: tag.code }, ...aliases.map((a) => ({ kind: "alias" as const, value: a.alias }))],
  };
}

export async function findTagIdsByBusiness(businessId: string): Promise<string[]> {
  const rows = await db().select({ id: tags.id }).from(tags).where(eq(tags.businessId, businessId));
  return rows.map((r) => r.id);
}

export async function insertScan(scan: ScanRecord): Promise<void> {
  await db().insert(scans).values(scan);
}

