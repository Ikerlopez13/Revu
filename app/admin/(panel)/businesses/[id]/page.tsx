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
import { Breakdown } from "@/components/metrics/breakdown";
import { DailyBars } from "@/components/metrics/daily-bars";
import { ReviewsLine } from "@/components/metrics/reviews-line";
import { Stat } from "@/components/metrics/stat";
import { getBusiness, listBusinessTags } from "@/lib/db/queries/admin";
import { getBusinessMetrics } from "@/lib/db/queries/metrics";
import { OS_LABEL } from "@/lib/format";
import { RANGES, parseRange, pctChange } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const range = parseRange((await searchParams).range);
  const business = await getBusiness(id.data);
  if (!business) notFound();
  const [tags, m] = await Promise.all([listBusinessTags(business.id), getBusinessMetrics(business.id, range)]);
  const firstReview = m.reviews.find((r) => r.reviewCount !== null);
  const lastReview = [...m.reviews].reverse().find((r) => r.reviewCount !== null);

  return (
    <>
      <PageTitle title={business.name} subtitle={`/${business.slug}`} />

      <nav className="grid grid-cols-3 rounded-lg bg-muted p-1 text-sm font-medium" aria-label="Periodo">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`?range=${r}`}
            replace
            scroll={false}
            className={cn("rounded-md py-1.5 text-center", r === range ? "bg-card shadow-xs" : "text-muted-foreground")}
          >
            {r} días
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={`Escaneos (${range} días)`} value={m.current} delta={pctChange(m.current, m.previous)} />
        <Stat label="Llevados a Google" value={m.redirects} hint={m.current ? `${Math.round((m.redirects / m.current) * 100)}% de los escaneos` : undefined} />
        {lastReview ? (
          <>
            <Stat label="Reseñas en Google" value={lastReview.reviewCount ?? "—"} hint={lastReview.rating !== null ? `Nota ${lastReview.rating} ★` : undefined} />
            <Stat
              label="Reseñas nuevas"
              value={`+${(lastReview.reviewCount ?? 0) - (firstReview?.reviewCount ?? 0)}`}
              hint={`en los últimos ${range} días`}
            />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escaneos por día</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DailyBars data={m.daily} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown rows={m.byOs.map((o) => ({ key: o.os, label: OS_LABEL[o.os], count: o.count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por tag</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown rows={m.byTag.map((t) => ({ key: t.code, label: t.label || t.code, sub: t.label ? t.code : null, count: t.count }))} />
          </CardContent>
        </Card>
      </div>

      {business.googlePlaceId && (
        <Card>
          <CardHeader>
            <CardTitle>Reseñas en Google</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ReviewsLine data={m.reviews} />
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline">
        <Link href={`/analytics/${encodeURIComponent(business.slug)}`} target="_blank">
          <BarChart3 /> Página pública para el cliente
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
