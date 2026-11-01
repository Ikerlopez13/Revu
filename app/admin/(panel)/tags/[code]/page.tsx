import { ExternalLink, History, ScanLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { relabelTagAction, setTagStatusAction, unassignTagAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { CopyButton } from "@/components/admin/copy-button";
import { DestinationForm } from "@/components/admin/destination-form";
import { QuickAssign } from "@/components/admin/quick-assign";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publicTagUrl } from "@/lib/admin/batches";
import { normalizeCode } from "@/lib/codes/generate";
import { getBusinessesByIds, getTagDetail, getTagHistory, getTagScanSummary } from "@/lib/db/queries/admin";
import { ACTION_LABEL, OS_LABEL, STATUS_LABEL, formatDateTime } from "@/lib/format";
import { decide } from "@/lib/redirect/resolve";

export default async function TagDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode(decodeURIComponent((await params).code));
  if (!code) notFound();
  const detail = await getTagDetail(code);
  if (!detail) notFound();
  const { tag, business, batch, aliases } = detail;

  const [history, scans] = await Promise.all([getTagHistory(tag.id), getTagScanSummary(tag.id)]);
  const names = await businessNames(history);

  // Mismo cálculo que /t/{code}, para probar el destino sin registrar un escaneo.
  const decision = decide(
    { tagId: tag.id, code: tag.code, businessId: tag.businessId, status: tag.status, destinationType: tag.destinationType, placeId: business?.googlePlaceId ?? null, destinationUrl: tag.destinationUrl },
    "other",
  );
  const url = publicTagUrl(tag.code);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-widest">{tag.code}</h1>
          <StatusBadge status={tag.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {business ? (
            <Link href={`/admin/businesses/${business.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
              {business.name}
            </Link>
          ) : (
            "Sin negocio"
          )}
          {tag.label && ` · ${tag.label}`}
          {batch && ` · ${batch.name}`}
        </p>
      </div>

      {tag.status === "unassigned" ? (
        <Card className="border-brand/40">
          <CardHeader>
            <CardTitle>Asignar y activar</CardTitle>
            <CardDescription>Busca el negocio. Si no existe, elígelo de Google y se crea solo.</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickAssign code={tag.code} />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Destino</CardTitle>
              <CardDescription className="break-all">
                {decision.kind === "redirect" ? decision.location : `Muestra la página de “no activado” (${STATUS_LABEL[tag.status].toLowerCase()})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {decision.kind === "redirect" && (
                <Button asChild variant="brand" size="lg">
                  <a href={decision.location} target="_blank" rel="noopener noreferrer">
                    Continuar al destino <ExternalLink />
                  </a>
                </Button>
              )}
              <DestinationForm code={tag.code} type={tag.destinationType} url={tag.destinationUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiqueta</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={relabelTagAction} submitLabel="Guardar etiqueta" variant="outline" successMessage="Etiqueta guardada">
                <input type="hidden" name="code" value={tag.code} />
                <Input name="label" defaultValue={tag.label ?? ""} maxLength={60} placeholder="Mesa 4, Barra…" aria-label="Etiqueta" />
              </ActionForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reasignar a otro negocio</CardTitle>
              <CardDescription>Para tags recuperados de un cliente que se da de baja. Los escaneos anteriores siguen contando para el negocio anterior.</CardDescription>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-brand">Elegir negocio</summary>
                <div className="pt-3">
                  <QuickAssign code={tag.code} initialLabel={tag.label} submitLabel="Reasignar y activar" />
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ActionForm
                action={setTagStatusAction}
                submitLabel={tag.status === "active" ? "Desactivar tag" : "Activar tag"}
                variant={tag.status === "active" ? "outline" : "brand"}
                confirm={tag.status === "active" ? "¿Desactivar? Quien lo escanee verá “Este tag aún no está activado”." : undefined}
              >
                <input type="hidden" name="code" value={tag.code} />
                <input type="hidden" name="status" value={tag.status === "active" ? "disabled" : "active"} />
              </ActionForm>
              <ActionForm action={unassignTagAction} submitLabel="Devolver al stock" variant="outline" buttonClassName="text-destructive" confirm="Se quitará el negocio y la etiqueta. ¿Seguro?">
                <input type="hidden" name="code" value={tag.code} />
              </ActionForm>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>URL grabada</CardTitle>
          {aliases.length > 0 && <CardDescription>También responde a: {aliases.map((a) => `/${a}`).join(", ")}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-2.5 text-sm">{url}</code>
          <CopyButton text={url} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="size-4" /> Escaneos
          </CardTitle>
          <CardDescription>
            {scans.total} en total · {scans.week} en los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {scans.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay escaneos.</p>
          ) : (
            <ul className="divide-y text-sm">
              {scans.recent.map((s, i) => (
                <li key={i} className="flex justify-between gap-2 py-2">
                  <span>{formatDateTime(s.scannedAt)}</span>
                  <span className="truncate text-muted-foreground">
                    {[OS_LABEL[s.os], s.country, s.outcome === "inactive" ? "no activo" : null, s.businessName].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" /> Historial
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {history.map((ev) => (
                <li key={ev.id} className="border-l-2 pl-3">
                  <p className="font-medium">
                    {ACTION_LABEL[ev.action]} <span className="font-normal text-muted-foreground">· {formatDateTime(ev.createdAt)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.actorEmail}</p>
                  <ChangeList before={ev.before} after={ev.after} names={names} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

const FIELD_LABEL: Record<string, string> = {
  businessId: "Negocio",
  status: "Estado",
  destinationType: "Tipo",
  destinationUrl: "URL",
  label: "Etiqueta",
};

function show(field: string, value: unknown, names: Map<string, string>): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "businessId") return names.get(String(value)) ?? "(negocio eliminado)";
  if (field === "status") return STATUS_LABEL[value as keyof typeof STATUS_LABEL] ?? String(value);
  if (field === "destinationType") return value === "custom_url" ? "URL personalizada" : "Reseña Google";
  return String(value);
}

function ChangeList({ before, after, names }: { before: unknown; after: unknown; names: Map<string, string> }) {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  return (
    <ul className="mt-1 text-xs">
      {Object.keys(a).map((k) => (
        <li key={k} className="break-all">
          {FIELD_LABEL[k] ?? k}: <span className="text-muted-foreground line-through">{show(k, b[k], names)}</span> → {show(k, a[k], names)}
        </li>
      ))}
    </ul>
  );
}

async function businessNames(history: { before: unknown; after: unknown }[]) {
  const ids = new Set<string>();
  for (const ev of history)
    for (const side of [ev.before, ev.after]) {
      const id = (side as { businessId?: unknown } | null)?.businessId;
      if (typeof id === "string") ids.add(id);
    }
  const rows = await getBusinessesByIds([...ids]);
  return new Map(rows.map((r) => [r.id, r.name]));
}
