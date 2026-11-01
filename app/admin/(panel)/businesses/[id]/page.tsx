import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { archiveBusinessAction, updateBusinessAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { PageTitle } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { getBusiness, listBusinessTags } from "@/lib/db/queries/admin";

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const business = await getBusiness(id.data);
  if (!business) notFound();
  const tags = await listBusinessTags(business.id);

  return (
    <>
      <PageTitle title={business.name} subtitle={`/${business.slug}`} />

      <Button asChild variant="outline">
        <Link href={`/analytics/${encodeURIComponent(business.slug)}`} target="_blank">
          <BarChart3 /> Página pública de estadísticas
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y">
            {tags.map((t) => (
              <li key={t.code}>
                <Link href={`/admin/tags/${t.code}`} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-sm font-semibold tracking-wider">{t.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{t.label}</span>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
            {tags.length === 0 && <li className="py-2 text-sm text-muted-foreground">Sin tags.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={updateBusinessAction} submitLabel="Guardar" variant="outline" successMessage="Guardado">
            <input type="hidden" name="id" value={business.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required maxLength={120} defaultValue={business.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="googlePlaceId">Google place_id</Label>
              <Input id="googlePlaceId" name="googlePlaceId" defaultValue={business.googlePlaceId ?? ""} autoCapitalize="off" autoCorrect="off" spellCheck={false} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Al cambiarlo, todos sus tags de reseña apuntan a la nueva ficha al momento.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" maxLength={1000} defaultValue={business.notes ?? ""} />
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <ActionForm
        action={archiveBusinessAction}
        submitLabel={business.archivedAt ? "Desarchivar negocio" : "Archivar negocio"}
        variant="outline"
        confirm={business.archivedAt ? undefined : "Archivar lo oculta del buscador. Sus tags no cambian: desactívalos o devuélvelos al stock aparte."}
      >
        <input type="hidden" name="id" value={business.id} />
        <input type="hidden" name="archived" value={business.archivedAt ? "false" : "true"} />
      </ActionForm>
    </>
  );
}
