import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { createBatchAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { PageTitle } from "@/components/admin/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { listBatches } from "@/lib/db/queries/admin";
import { formatDate } from "@/lib/format";

export default async function BatchesPage() {
  const batches = await listBatches();
  return (
    <>
      <PageTitle title="Lotes" />
      <Card>
        <CardHeader>
          <CardTitle>Nuevo lote</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createBatchAction} submitLabel="Generar códigos" variant="brand">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required maxLength={80} defaultValue={`Lote ${new Date().toLocaleDateString("es-ES")}`} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" inputMode="numeric" min={1} max={1000} required defaultValue={20} />
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {batches.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/batches/${b.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-muted">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{b.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(b.createdAt)} · {b.total} tags · {b.unassigned} sin asignar
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {batches.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Aún no hay lotes.</li>}
      </ul>
    </>
  );
}
