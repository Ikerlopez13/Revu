import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CopyButton } from "@/components/admin/copy-button";
import { PageTitle } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toPlainText } from "@/lib/admin/batches";
import { getBatchWithTags } from "@/lib/db/queries/admin";
import { formatDate } from "@/lib/format";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const data = await getBatchWithTags(id.data);
  if (!data) notFound();
  const { batch, tags } = data;

  return (
    <>
      <PageTitle title={batch.name} subtitle={`${formatDate(batch.createdAt)} · ${tags.length} códigos`} />

      <Card>
        <CardHeader>
          <CardTitle>Grabar con NFC Tools</CardTitle>
          <CardDescription>Copia las URLs (una por línea) o descarga el fichero y úsalo en “Escritura en serie”.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <CopyButton text={toPlainText(tags.map((t) => t.code))} label="Copiar URLs" />
          <Button asChild variant="outline">
            <a href={`/admin/batches/${batch.id}/export?format=txt`}>
              <Download /> .txt
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/admin/batches/${batch.id}/export?format=csv`}>
              <Download /> .csv
            </a>
          </Button>
        </CardContent>
      </Card>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {tags.map((t) => (
          <li key={t.code}>
            <Link href={`/admin/tags/${t.code}`} className="flex items-center gap-3 px-3 py-2.5 active:bg-muted">
              <span className="font-mono text-sm font-semibold tracking-wider">{t.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{[t.businessName, t.label].filter(Boolean).join(" · ")}</span>
              <StatusBadge status={t.status} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
