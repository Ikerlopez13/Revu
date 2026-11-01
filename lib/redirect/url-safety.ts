import { z } from "zod";

// Dominios propios: redirigir a ellos crearía bucles o abriría la puerta a
// encadenar redirecciones.
const OWN_HOSTS = ["revutags.com", "www.revutags.com"];

/**
 * Valida un destino custom_url contra open-redirect: solo https, sin
 * credenciales embebidas, con host real y que no apunte a nosotros.
 * Devuelve la URL normalizada o null.
 */
export function sanitizeRedirectUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > 2048) return null;
  // Rechaza espacios y caracteres de control (trucos tipo "https:\t//evil").
  if (/[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".")) return null;
  if (OWN_HOSTS.includes(host)) return null;
  return url.toString();
}

export const customUrlSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const safe = sanitizeRedirectUrl(v);
    if (!safe) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La URL debe empezar por https:// y ser externa" });
      return z.NEVER;
    }
    return safe;
  });
