import { normalizeCode } from "@/lib/codes/generate";
import { notFound, scan } from "@/lib/redirect/scan-handler";

// Node y no Edge: Supabase solo es accesible por TCP. Con Redis, la latencia es equivalente.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code);
  if (!code) return notFound();
  return scan(request, { kind: "code", value: code });
}
