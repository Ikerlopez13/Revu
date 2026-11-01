import { z } from "zod";
import { normalizeCode } from "@/lib/codes/generate";
import { customUrlSchema } from "@/lib/redirect/url-safety";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const codeSchema = z.string().transform((v, ctx) => {
  const code = normalizeCode(v);
  if (!code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Código no válido" });
    return z.NEVER;
  }
  return code;
});

export const placeIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{10,300}$/, "place_id no válido");

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export const createBatchSchema = z.object({
  name: z.string().trim().min(1, "Pon un nombre").max(80),
  quantity: z.coerce.number().int().min(1, "Mínimo 1").max(1000, "Máximo 1000 por lote"),
});

export const businessInputSchema = z.object({
  name: z.string().trim().min(1, "Pon un nombre").max(120),
  googlePlaceId: z
    .union([placeIdSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  notes: optionalText(1000),
});

export const updateBusinessSchema = businessInputSchema.extend({ id: z.string().uuid() });

/** Negocio elegido en el buscador: uno existente o una ficha de Google nueva. */
export const businessChoiceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), id: z.string().uuid() }),
  z.object({ kind: z.literal("place"), placeId: placeIdSchema, name: z.string().trim().min(1).max(120) }),
]);

const destinationFields = {
  destinationType: z.enum(["google_review", "custom_url"]).default("google_review"),
  destinationUrl: z.string().optional(),
};

function refineDestination<T extends { destinationType: "google_review" | "custom_url"; destinationUrl?: string }>(
  value: T,
  ctx: z.RefinementCtx,
): Omit<T, "destinationUrl"> & { destinationUrl: string | null } {
  if (value.destinationType === "google_review") return { ...value, destinationUrl: null };
  const parsed = customUrlSchema.safeParse(value.destinationUrl ?? "");
  if (!parsed.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destinationUrl"], message: "La URL debe empezar por https:// y ser externa" });
    return z.NEVER;
  }
  return { ...value, destinationUrl: parsed.data };
}

export const assignTagSchema = z
  .object({ code: codeSchema, business: businessChoiceSchema, label: optionalText(60), ...destinationFields })
  .transform(refineDestination);

export const updateDestinationSchema = z.object({ code: codeSchema, ...destinationFields }).transform(refineDestination);

export const setStatusSchema = z.object({ code: codeSchema, status: z.enum(["active", "disabled"]) });

export const relabelSchema = z.object({ code: codeSchema, label: optionalText(60) });

export const unassignSchema = z.object({ code: codeSchema });

export const searchSchema = z.string().trim().min(2).max(120);

export type AssignTagInput = z.infer<typeof assignTagSchema>;
export type BusinessChoice = z.infer<typeof businessChoiceSchema>;
