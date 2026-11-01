import { z } from "zod";
import { toCsv, toPlainText } from "@/lib/admin/batches";
import { getAdminEmail } from "@/lib/auth/session";
import { getBatchWithTags } from "@/lib/db/queries/admin";
import { slugify } from "@/lib/admin/schemas";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Además del middleware: la exportación lista URLs que aún no están activadas.
  if (!(await getAdminEmail())) return new Response("Unauthorized", { status: 401 });

  const id = z.string().uuid().safeParse((await params).id);
  const data = id.success ? await getBatchWithTags(id.data) : null;
  if (!data) return new Response("Not found", { status: 404 });

  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "txt";
  const body = format === "csv" ? toCsv(data.tags) : toPlainText(data.tags.map((t) => t.code));
  const filename = `revutags-${slugify(data.batch.name) || "lote"}.${format}`;
  return new Response(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
