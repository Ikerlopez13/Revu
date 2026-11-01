import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { NewBusiness } from "@/components/admin/new-business";
import { PageTitle } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBusinesses } from "@/lib/db/queries/admin";

export default async function BusinessesPage() {
  const rows = await listBusinesses();
  return (
    <>
      <PageTitle title="Negocios" subtitle={`${rows.filter((r) => !r.archivedAt).length} activos`} />
      <Card>
        <CardHeader>
          <CardTitle>Añadir negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <NewBusiness />
        </CardContent>
      </Card>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/businesses/${b.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-muted">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{b.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  /{b.slug} · {b.activeTags} activos de {b.totalTags}
                </span>
              </span>
              {b.archivedAt && <Badge variant="muted">Archivado</Badge>}
              {!b.googlePlaceId && !b.archivedAt && <Badge variant="warning">Sin ficha</Badge>}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
