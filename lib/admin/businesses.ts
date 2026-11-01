import "server-only";
import { refreshBusinessCache } from "@/lib/cache/invalidate";
import { db } from "@/lib/db/client";
import {
  findBusinessByPlaceId,
  getBusiness,
  getBusinessTx,
  insertBusiness,
  updateBusinessRow,
  type Executor,
} from "@/lib/db/queries/admin";
import type { Business } from "@/lib/db/schema";
import { AdminError } from "./errors";
import { slugify, type BusinessChoice } from "./schemas";

export async function createBusiness(input: { name: string; googlePlaceId: string | null; notes: string | null }) {
  if (input.googlePlaceId) {
    const existing = await findBusinessByPlaceId(db(), input.googlePlaceId);
    if (existing) throw new AdminError(`Ya existe un negocio con esa ficha: ${existing.name}`);
  }
  return insertBusiness(db(), { ...input, baseSlug: slugify(input.name) });
}

export async function updateBusiness(input: { id: string; name: string; googlePlaceId: string | null; notes: string | null }) {
  const before = await getBusiness(input.id);
  if (!before) throw new AdminError("Negocio no encontrado");
  const after = await updateBusinessRow(input.id, { name: input.name, googlePlaceId: input.googlePlaceId, notes: input.notes });
  // Cambiar el place_id cambia el destino de todos sus tags: refrescar la caché.
  if (before.googlePlaceId !== input.googlePlaceId) await refreshBusinessCache(input.id);
  return after!;
}

export async function setBusinessArchived(id: string, archived: boolean) {
  const b = await updateBusinessRow(id, { archivedAt: archived ? new Date() : null });
  if (!b) throw new AdminError("Negocio no encontrado");
  return b;
}

/** Negocio elegido; si es una ficha de Google nueva, lo crea (o reutiliza el que ya la tenga). */
export async function resolveBusinessChoice(tx: Executor, choice: BusinessChoice): Promise<Business> {
  if (choice.kind === "existing") {
    const b = await getBusinessTx(tx, choice.id);
    if (!b || b.archivedAt) throw new AdminError("Negocio no encontrado");
    return b;
  }
  const existing = await findBusinessByPlaceId(tx, choice.placeId);
  if (existing) return existing;
  return insertBusiness(tx, {
    baseSlug: slugify(choice.name),
    name: choice.name,
    googlePlaceId: choice.placeId,
    notes: null,
  });
}
