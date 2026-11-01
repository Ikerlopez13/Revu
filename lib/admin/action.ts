import { z } from "zod";
import { AdminError } from "./errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function toInput(raw: unknown): unknown {
  if (raw instanceof FormData) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of raw.entries()) if (typeof v === "string") obj[k] = v;
    return obj;
  }
  return raw;
}

/**
 * Esqueleto de toda server action del panel:
 * 1) sesión de admin comprobada en el servidor, 2) validación con Zod,
 * 3) lógica de negocio. Nunca filtra errores internos al cliente.
 */
export async function runAdminAction<S extends z.ZodTypeAny, R>(
  deps: { requireAdmin: () => Promise<string> },
  schema: S,
  raw: unknown,
  handler: (input: z.output<S>, actor: string) => Promise<R>,
): Promise<ActionResult<R>> {
  let actor: string;
  try {
    actor = await deps.requireAdmin();
  } catch {
    return { ok: false, error: "No autorizado" };
  }
  const parsed = schema.safeParse(toInput(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    return { ok: false, error: Object.values(fieldErrors)[0] ?? "Datos no válidos", fieldErrors };
  }
  try {
    return { ok: true, data: await handler(parsed.data, actor) };
  } catch (err) {
    if (err instanceof AdminError) return { ok: false, error: err.message };
    console.error("admin action failed", err);
    return { ok: false, error: "Algo ha fallado. Inténtalo de nuevo." };
  }
}
