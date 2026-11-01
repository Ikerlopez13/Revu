import "server-only";
import { waitUntil } from "@vercel/functions";
import { isAdminRequest } from "@/lib/auth/admin";
import { redis } from "@/lib/cache/redis";
import { createCachedLookup, redisTagCache } from "@/lib/cache/tag-cache";
import { findResolvedTag, insertScan } from "@/lib/db/queries/tags";
import { env } from "@/lib/env";
import { legacyFallback } from "./legacy-fallback";
import { rateLimit } from "./rate-limit";
import { handleScan } from "./resolve";
import { renderStatusPage } from "./status-page";
import type { LookupKey } from "./types";

/** Conecta handleScan con Redis, Postgres y Vercel. Las rutas solo llaman a esto. */
export async function scan(request: Request, key: LookupKey): Promise<Response> {
  try {
    return await runScan(request, key);
  } catch (err) {
    console.error("scan failed", err);
    return statusResponse("error", 503);
  }
}

function runScan(request: Request, key: LookupKey): Promise<Response> {
  const r = redis();
  const cachedLookup = createCachedLookup(r ? redisTagCache(r) : null, findResolvedTag, waitUntil);
  return handleScan(request, key, {
    lookup: async (k) => {
      try {
        return await cachedLookup(k);
      } catch (err) {
        const fallback = k.kind === "alias" ? legacyFallback(k.value) : null;
        if (!fallback) throw err;
        console.error("DB no disponible: usando destino legacy de emergencia", err);
        return fallback;
      }
    },
    rateLimit,
    isAdmin: isAdminRequest,
    recordScan: (scan) => (scan.tagId ? insertScan(scan) : Promise.resolve()),
    background: waitUntil,
    whatsappNumber: env().WHATSAPP_NUMBER,
  });
}

function statusResponse(kind: "not_found" | "error", status: number): Response {
  return new Response(renderStatusPage(kind, process.env.WHATSAPP_NUMBER || "34675977794"), {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
  });
}

export function notFound(): Response {
  return statusResponse("not_found", 404);
}
