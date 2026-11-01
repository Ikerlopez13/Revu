import { normalizeAlias } from "@/lib/redirect/alias";
import { notFound, scan } from "@/lib/redirect/scan-handler";

// Legacy: /m (alias "m") y /m/{slug}, que aceptaba cualquier slug o shortlink.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code?: string[] }> }) {
  const segments = (await params).code ?? [];
  if (segments.length > 1) return notFound();
  const alias = normalizeAlias(segments[0] ?? "m");
  if (!alias) return notFound();
  return scan(request, { kind: "alias", value: alias });
}
