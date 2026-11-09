import { Link2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { QuickAssign } from "@/components/admin/quick-assign";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicTagUrl } from "@/lib/admin/batches";
import { slugSchema } from "@/lib/admin/slugs";
import { findResolvedTag } from "@/lib/db/queries/tags";

/**
 * Llega desde "Soy un admin" al escanear un NFC cuyo enlace aún no existe:
 * aquí se elige a dónde manda y queda activo.
 */
export default async function LinkSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugSchema.safeParse(decodeURIComponent((await params).slug));
  if (!parsed.success) notFound();
  const slug = parsed.data;

  // Si ya existe (p. ej. lo enlazó otro admin), su ficha es el sitio para cambiarlo.
  const existing = await findResolvedTag({ kind: "alias", value: slug });
  if (existing) redirect(`/admin/tags/${existing.code}`);

  const host = publicTagUrl("").replace(/\/t\/$/, "").replace(/^https?:\/\//, "");

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link2 className="size-4" /> Enlace sin destino
        </p>
        <h1 className="font-mono text-2xl font-bold break-all">
          {host}/{slug}
        </h1>
      </div>

      <Card className="border-brand/40">
        <CardHeader>
          <CardTitle>¿A dónde debe llevar?</CardTitle>
          <CardDescription>Escribe el nombre del negocio o pega su enlace de Google Maps (Compartir → Copiar enlace). Al guardar, el NFC funciona al momento.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuickAssign slug={slug} submitLabel="Activar enlace" />
        </CardContent>
      </Card>
    </>
  );
}
