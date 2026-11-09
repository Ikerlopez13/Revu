import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { NewTagForm } from "@/components/admin/new-tag-form";
import { PageTitle } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { TagFilters } from "@/components/admin/tag-filters";
import { slugSchema } from "@/lib/admin/slugs";
import { listBatches, listBusinessOptions, listTags } from "@/lib/db/queries/admin";

const filtersSchema = z.object({
  status: z.enum(["unassigned", "active", "disabled"]).optional().catch(undefined),
  business: z.string().uuid().optional().catch(undefined),
  batch: z.string().uuid().optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
  // Viene del enlace "Soy un admin" de un slug que no existe.
  nuevo: slugSchema.optional().catch(undefined),
});

export default async function TagsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const f = filtersSchema.parse(await searchParams);
  const [rows, businesses, batches] = await Promise.all([
    listTags({ status: f.status, businessId: f.business, batchId: f.batch, q: f.q || undefined }),
    listBusinessOptions(),
    listBatches(),
  ]);

  return (
    <>
      <PageTitle title="Tags" subtitle={`${rows.length}${rows.length === 200 ? "+" : ""} resultados`} />
      <NewTagForm initialSlug={f.nuevo} />
      <TagFilters businesses={businesses} batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((t) => (
          <li key={t.code}>
            <Link href={`/admin/tags/${t.code}`} className="flex items-center gap-3 px-3 py-3 active:bg-muted">
              <span className="font-mono text-sm font-semibold tracking-wider">{t.code}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.businessName ?? "—"}</span>
                <span className="block truncate text-xs text-muted-foreground">{[t.label, t.batchName].filter(Boolean).join(" · ") || " "}</span>
              </span>
              <StatusBadge status={t.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No hay tags con estos filtros.</li>}
      </ul>
    </>
  );
}
