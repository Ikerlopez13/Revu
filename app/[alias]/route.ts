import { normalizeAlias } from "@/lib/redirect/alias";
import { notFound, scan } from "@/lib/redirect/scan-handler";

// Rutas legacy grabadas en NFCs: revutags.com/birres, /b1, /b&b…
// Las rutas estáticas (/admin, /api, /t) y los ficheros de /public tienen prioridad.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ alias: string }> }) {
  const alias = normalizeAlias((await params).alias);
  if (!alias) return notFound();
  return scan(request, { kind: "alias", value: alias });
}
