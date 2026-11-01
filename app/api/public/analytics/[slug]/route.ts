import { getPublicAnalytics } from "@/lib/db/queries/analytics";
import { normalizeAlias } from "@/lib/redirect/alias";

export const runtime = "nodejs";

// Datos de /analytics/{slug}: los mismos que ya eran públicos con la página antigua.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = normalizeAlias((await params).slug);
  const data = slug ? await getPublicAnalytics(slug) : null;
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(data, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
