import { z } from "zod";

// Rutas propias de la web: un slug con estos nombres las taparía o se taparía.
export const RESERVED_SLUGS = new Set([
  "admin", "api", "t", "m", "r", "analytics", "configurador", "dashboard", "assets", "icons",
  "login", "logout", "_next", "static", "public", "index", "favicon", "manifest", "robots", "sitemap",
  "apple-icon", "icon", "admin-sw", "admin-offline", "www", "app",
]);

/** Slug para una URL corta revutags.com/{slug}: minúsculas, números, - y _. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{0,39}$/, "Solo letras, números, - y _ (máx. 40)")
  .refine((s) => !RESERVED_SLUGS.has(s), "Ese nombre está reservado por la web");

/** Siguiente número libre con 4 cifras (0001, 0002…) a partir de los slugs existentes. */
export function nextSequentialSlug(existing: string[]): string {
  const nums = existing.filter((s) => /^\d+$/.test(s)).map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return String(next).padStart(4, "0");
}
