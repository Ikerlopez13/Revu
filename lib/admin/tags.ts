import "server-only";
import { refreshTagCache } from "@/lib/cache/invalidate";
import { db } from "@/lib/db/client";
import {
  aliasExists,
  getBusinessTx,
  insertAlias,
  insertLooseTag,
  insertTagEvent,
  lockTagByCode,
  updateTag,
  type Executor,
  type TagPatch,
} from "@/lib/db/queries/admin";
import { fillWithUniqueCodes } from "./batches";
import type { Tag, TagEventAction } from "@/lib/db/schema";
import { resolveBusinessChoice } from "./businesses";
import { AdminError } from "./errors";
import type { AssignTagInput } from "./schemas";

type Snapshot = Pick<Tag, "businessId" | "status" | "destinationType" | "destinationUrl" | "label">;

const snapshot = (t: Snapshot): Snapshot => ({
  businessId: t.businessId,
  status: t.status,
  destinationType: t.destinationType,
  destinationUrl: t.destinationUrl,
  label: t.label,
});

/** Solo los campos que cambian, para que el historial se lea fácil. */
export function diff(before: Snapshot, after: Snapshot) {
  const keys = (Object.keys(after) as (keyof Snapshot)[]).filter((k) => before[k] !== after[k]);
  return {
    before: Object.fromEntries(keys.map((k) => [k, before[k]])),
    after: Object.fromEntries(keys.map((k) => [k, after[k]])),
  };
}

const NO_PLACE = "Este negocio no tiene ficha de Google: añádela en el negocio o usa una URL personalizada";

async function requirePlaceIfGoogle(tx: Executor, businessId: string | null, type: Tag["destinationType"]) {
  if (type !== "google_review" || !businessId) return;
  const b = await getBusinessTx(tx, businessId);
  if (!b?.googlePlaceId) throw new AdminError(NO_PLACE);
}

export type MutationResult = { code: string; cacheWarning: boolean };

/**
 * Bloquea el tag, aplica el cambio y registra el evento en una transacción.
 * Después escribe el valor nuevo en Redis (write-through).
 */
async function mutateTag(
  code: string,
  actor: string,
  build: (tag: Tag, tx: Executor) => Promise<{ patch: TagPatch; action: TagEventAction } | null>,
): Promise<MutationResult> {
  const tagId = await db().transaction(async (tx) => {
    const tag = await lockTagByCode(tx, code);
    if (!tag) throw new AdminError("Tag no encontrado");
    const change = await build(tag, tx);
    if (!change) return tag.id;
    const updated = await updateTag(tx, tag.id, change.patch);
    const d = diff(snapshot(tag), snapshot(updated));
    if (Object.keys(d.after).length) await insertTagEvent(tx, { tagId: tag.id, actorEmail: actor, action: change.action, ...d });
    return tag.id;
  });
  try {
    await refreshTagCache(tagId);
    return { code, cacheWarning: false };
  } catch (err) {
    console.error("refreshTagCache failed", err);
    return { code, cacheWarning: true };
  }
}

/** Asignar o reasignar: elige negocio, etiqueta y destino, y activa. */
export function assignTag(actor: string, input: AssignTagInput) {
  return mutateTag(input.code, actor, async (tag, tx) => {
    const business = await resolveBusinessChoice(tx, input.business);
    if (input.destinationType === "google_review" && !business.googlePlaceId) throw new AdminError(NO_PLACE);
    const businessId = business.id;
    const action: TagEventAction = tag.businessId && tag.businessId !== businessId ? "reassign" : "assign";
    return {
      action,
      patch: {
        businessId,
        label: input.label,
        destinationType: input.destinationType,
        destinationUrl: input.destinationUrl,
        status: "active",
      },
    };
  });
}

export function updateDestination(
  actor: string,
  input: { code: string; destinationType: Tag["destinationType"]; destinationUrl: string | null },
) {
  return mutateTag(input.code, actor, async (tag, tx) => {
    if (tag.status === "active") await requirePlaceIfGoogle(tx, tag.businessId, input.destinationType);
    return {
    action: "change_destination",
    patch: { destinationType: input.destinationType, destinationUrl: input.destinationUrl },
    };
  });
}

export function setTagStatus(actor: string, input: { code: string; status: "active" | "disabled" }) {
  return mutateTag(input.code, actor, async (tag, tx) => {
    if (tag.status === input.status) return null;
    if (input.status === "active" && !tag.businessId) throw new AdminError("Asigna un negocio antes de activarlo");
    if (input.status === "active") await requirePlaceIfGoogle(tx, tag.businessId, tag.destinationType);
    return { action: input.status === "active" ? "enable" : "disable", patch: { status: input.status } };
  });
}

export function relabelTag(actor: string, input: { code: string; label: string | null }) {
  return mutateTag(input.code, actor, async () => ({ action: "relabel", patch: { label: input.label } }));
}

/** Devuelve el tag al stock (p. ej. un cliente que se da de baja). */
export function unassignTag(actor: string, input: { code: string }) {
  return mutateTag(input.code, actor, async (tag) => {
    if (tag.status === "unassigned" && !tag.businessId) return null;
    return {
      action: "unassign",
      patch: { businessId: null, status: "unassigned", destinationType: "google_review", destinationUrl: null, label: null },
    };
  });
}

/**
 * Tag nuevo con URL corta propia (revutags.com/{slug}), sin asignar.
 * Por dentro también tiene su código de 6 caracteres (/t/{code}).
 */
export async function createTagWithSlug(actor: string, input: { slug: string }): Promise<{ code: string }> {
  return db().transaction(async (tx) => {
    if (await aliasExists(tx, input.slug)) throw new AdminError(`revutags.com/${input.slug} ya existe`);
    let tag: Tag | null = null;
    await fillWithUniqueCodes(1, async ([code]) => {
      tag = await insertLooseTag(tx, code!);
      return tag ? [code!] : [];
    });
    const created = tag! as Tag;
    await insertAlias(tx, input.slug, created.id);
    await insertTagEvent(tx, { tagId: created.id, actorEmail: actor, action: "create", before: null, after: { slug: input.slug } });
    return { code: created.code };
  });
}
