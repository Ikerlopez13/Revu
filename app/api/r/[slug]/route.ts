import { normalizeAlias } from "@/lib/redirect/alias";
import { notFound, scan } from "@/lib/redirect/scan-handler";

// Formas antiguas de los enlaces legacy (/r/{slug} existió el 22/04/2026 y
// /api/r/{slug} era la función original). Se resuelven igual que /{slug}.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const alias = normalizeAlias((await params).slug);
  if (!alias) return notFound();
  return scan(request, { kind: "alias", value: alias });
}
