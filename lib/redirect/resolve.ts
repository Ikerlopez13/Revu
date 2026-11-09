import type { ScanOs, ScanVia } from "@/lib/db/schema";
import { slugSchema } from "@/lib/admin/slugs";
import { buildGoogleReviewUrl } from "./google-review";
import { detectOs } from "./os";
import { renderStatusPage } from "./status-page";
import type { LookupKey, ResolvedTag } from "./types";
import { sanitizeRedirectUrl } from "./url-safety";

export type Decision =
  | { kind: "redirect"; location: string }
  | { kind: "inactive" }
  | { kind: "not_found" };

/** Decide qué hacer con un tag. Sin efectos secundarios. */
export function decide(tag: ResolvedTag | null, os: ScanOs): Decision {
  if (!tag) return { kind: "not_found" };
  if (tag.status !== "active") return { kind: "inactive" };

  if (tag.destinationType === "google_review") {
    // Un tag activo sin place_id es un error de configuración: mejor la página
    // de "no activado" que un enlace roto.
    return tag.placeId ? { kind: "redirect", location: buildGoogleReviewUrl(tag.placeId, os) } : { kind: "inactive" };
  }

  // Se vuelve a validar aquí aunque ya se validó al guardar: defensa en profundidad.
  const safe = sanitizeRedirectUrl(tag.destinationUrl);
  return safe ? { kind: "redirect", location: safe } : { kind: "inactive" };
}

export type ScanRecord = {
  tagId: string;
  businessId: string | null;
  os: ScanOs;
  country: string | null;
  referer: string | null;
  via: ScanVia;
  outcome: "redirect" | "inactive";
};

export type ScanDeps = {
  lookup: (key: LookupKey) => Promise<ResolvedTag | null>;
  /** true si la petición puede seguir; `miss` = el código no existe. */
  rateLimit: (request: Request, kind: "hit" | "miss") => Promise<boolean>;
  isAdmin: (request: Request) => Promise<boolean>;
  recordScan: (scan: ScanRecord) => Promise<void>;
  /** waitUntil de Vercel: ejecuta la promesa sin retrasar la respuesta. */
  background: (promise: Promise<unknown>) => void;
  whatsappNumber: string;
};

const NO_STORE = { "Cache-Control": "no-store" } as const;

function redirect(location: string): Response {
  // 302 y no-store: el destino puede cambiar en cualquier momento y ningún
  // navegador ni CDN debe recordarlo.
  return new Response(null, {
    status: 302,
    headers: { ...NO_STORE, Location: location, "Referrer-Policy": "no-referrer" },
  });
}

function html(body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { ...NO_STORE, "Content-Type": "text/html; charset=utf-8", ...extra },
  });
}

export function refererHost(request: Request): string | null {
  const raw = request.headers.get("referer");
  if (!raw) return null;
  try {
    return new URL(raw).hostname.slice(0, 255) || null;
  } catch {
    return null;
  }
}

export function countryOf(request: Request): string | null {
  const c = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
}

/** "Soy un admin": abre el panel para darle destino a este enlace. */
export function adminLinkHref(key: LookupKey): string {
  if (key.kind !== "alias") return "/admin/tags";
  const slug = slugSchema.safeParse(key.value);
  return slug.success ? `/admin/enlazar/${encodeURIComponent(slug.data)}` : "/admin/tags";
}

/** Ruta crítica: /t/{code} y alias legacy. */
export async function handleScan(request: Request, key: LookupKey, deps: ScanDeps): Promise<Response> {
  const [allowed, tag] = await Promise.all([deps.rateLimit(request, "hit"), deps.lookup(key)]);
  if (!allowed) return html(renderStatusPage("rate_limited", deps.whatsappNumber), 429, { "Retry-After": "60" });

  if (!tag) {
    // Los fallos tienen un límite aparte, mucho más bajo, contra la enumeración.
    const ok = await deps.rateLimit(request, "miss");
    if (!ok) return html(renderStatusPage("rate_limited", deps.whatsappNumber), 429);
    return html(renderStatusPage("not_found", deps.whatsappNumber, undefined, { adminHref: adminLinkHref(key) }), 404);
  }

  if (tag.code && (await deps.isAdmin(request))) {
    return redirect(`/admin/tags/${encodeURIComponent(tag.code)}`);
  }

  const os = detectOs(request.headers.get("user-agent"));
  const decision = decide(tag, os);

  if (request.method === "GET" && decision.kind !== "not_found") {
    deps.background(
      deps
        .recordScan({
          tagId: tag.tagId,
          businessId: tag.businessId,
          os,
          country: countryOf(request),
          referer: refererHost(request),
          via: key.kind === "code" ? "code" : "legacy",
          outcome: decision.kind,
        })
        .catch((err: unknown) => console.error("recordScan failed", err)),
    );
  }

  if (decision.kind === "redirect") return redirect(decision.location);
  return html(renderStatusPage("inactive", deps.whatsappNumber, tag.code), 200);
}
