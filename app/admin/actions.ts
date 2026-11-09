"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { runAdminAction, type ActionResult } from "@/lib/admin/action";
import { createBatch } from "@/lib/admin/batches";
import { createBusiness, setBusinessArchived, updateBusiness } from "@/lib/admin/businesses";
import {
  assignTagSchema,
  createTagSchema,
  linkSlugSchema,
  businessInputSchema,
  createBatchSchema,
  relabelSchema,
  searchSchema,
  setStatusSchema,
  unassignSchema,
  updateBusinessSchema,
  updateDestinationSchema,
} from "@/lib/admin/schemas";
import { assignTag, createTagWithSlug, linkSlug, relabelTag, setTagStatus, unassignTag, updateDestination, type MutationResult } from "@/lib/admin/tags";
import { AdminError } from "@/lib/admin/errors";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { findAdminUser, setAdminPassword } from "@/lib/db/queries/admin-users";
import { searchBusinesses } from "@/lib/db/queries/admin";
import { searchPlaces, type PlaceResult } from "@/lib/places";

const deps = { requireAdmin };

function afterTagChange(r: MutationResult) {
  revalidatePath(`/admin/tags/${r.code}`);
  revalidatePath("/admin/tags");
  return r;
}

// ---------- Tags ----------

export async function assignTagAction(raw: unknown) {
  return runAdminAction(deps, assignTagSchema, raw, async (input, actor) => afterTagChange(await assignTag(actor, input)));
}

export async function updateDestinationAction(raw: unknown) {
  return runAdminAction(deps, updateDestinationSchema, raw, async (input, actor) =>
    afterTagChange(await updateDestination(actor, input)),
  );
}

export async function setTagStatusAction(raw: unknown) {
  return runAdminAction(deps, setStatusSchema, raw, async (input, actor) => afterTagChange(await setTagStatus(actor, input)));
}

export async function relabelTagAction(raw: unknown) {
  return runAdminAction(deps, relabelSchema, raw, async (input, actor) => afterTagChange(await relabelTag(actor, input)));
}

export async function unassignTagAction(raw: unknown) {
  return runAdminAction(deps, unassignSchema, raw, async (input, actor) => afterTagChange(await unassignTag(actor, input)));
}

export async function createTagAction(raw: unknown) {
  const result = await runAdminAction(deps, createTagSchema, raw, async (input, actor) => {
    const r = await createTagWithSlug(actor, input);
    revalidatePath("/admin/tags");
    return r;
  });
  if (result.ok && result.data) redirect(`/admin/tags/${result.data.code}`);
  return result;
}

export async function linkSlugAction(raw: unknown) {
  return runAdminAction(deps, linkSlugSchema, raw, async (input, actor) => afterTagChange(await linkSlug(actor, input)));
}

// ---------- Búsqueda (asignación rápida) ----------

export type BusinessSearchResult = {
  existing: { id: string; name: string; slug: string }[];
  places: PlaceResult[];
  placesError?: string;
};

export async function searchBusinessAction(raw: unknown): Promise<ActionResult<BusinessSearchResult>> {
  return runAdminAction(deps, searchSchema, raw, async (q) => {
    const [existing, places] = await Promise.all([
      searchBusinesses(q),
      searchPlaces(q).then(
        (p) => ({ ok: true as const, p }),
        () => ({ ok: false as const, p: [] as PlaceResult[] }),
      ),
    ]);
    const known = new Set(existing.map((b) => b.googlePlaceId));
    return {
      existing: existing.map(({ id, name, slug }) => ({ id, name, slug })),
      // Una ficha que ya es negocio solo aparece una vez, como existente.
      places: places.p.filter((p) => !known.has(p.placeId)),
      placesError: places.ok ? undefined : "No se pudo buscar en Google",
    };
  });
}

// ---------- Lotes ----------

export async function createBatchAction(raw: unknown) {
  const result = await runAdminAction(deps, createBatchSchema, raw, async (input) => {
    const batch = await createBatch(input);
    revalidatePath("/admin/batches");
    return { id: batch.id };
  });
  if (result.ok && result.data) redirect(`/admin/batches/${result.data.id}`);
  return result;
}

// ---------- Negocios ----------

export async function createBusinessAction(raw: unknown) {
  const result = await runAdminAction(deps, businessInputSchema, raw, async (input) => {
    const b = await createBusiness(input);
    revalidatePath("/admin/businesses");
    return { id: b.id };
  });
  if (result.ok && result.data) redirect(`/admin/businesses/${result.data.id}`);
  return result;
}

export async function updateBusinessAction(raw: unknown) {
  return runAdminAction(deps, updateBusinessSchema, raw, async (input) => {
    const b = await updateBusiness(input);
    revalidatePath(`/admin/businesses/${b.id}`);
    revalidatePath("/admin/businesses");
    return { id: b.id };
  });
}

export async function archiveBusinessAction(raw: unknown) {
  const schema = z.object({ id: z.string().uuid(), archived: z.enum(["true", "false"]).transform((v) => v === "true") });
  return runAdminAction(deps, schema, raw, async (input) => {
    await setBusinessArchived(input.id, input.archived);
    revalidatePath(`/admin/businesses/${input.id}`);
    revalidatePath("/admin/businesses");
  });
}

// ---------- Cuenta ----------

const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual"),
    next: z.string().min(MIN_PASSWORD_LENGTH, `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

export async function changePasswordAction(raw: unknown) {
  return runAdminAction(deps, changePasswordSchema, raw, async (input, actor) => {
    const user = await findAdminUser(actor);
    if (!user || !(await verifyPassword(input.current, user.passwordHash))) throw new AdminError("La contraseña actual no es correcta");
    await setAdminPassword(actor, await hashPassword(input.next));
  });
}
