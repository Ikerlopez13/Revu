import type { ScanOs } from "@/lib/db/schema";

/** Solo se usa para clasificar; el user-agent nunca se guarda. */
export function detectOs(userAgent: string | null | undefined): ScanOs {
  if (!userAgent) return "other";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}
