import { Boxes, Nfc, Store, Tags } from "lucide-react";
import Link from "next/link";
import { OpenTagForm } from "@/components/admin/open-tag-form";
import { PageTitle } from "@/components/admin/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countTagsByStatus } from "@/lib/db/queries/admin";

export default async function AdminHome() {
  const counts = await countTagsByStatus();
  const stats = [
    { label: "Activos", value: counts.active ?? 0, href: "/admin/tags?status=active" },
    { label: "Sin asignar", value: counts.unassigned ?? 0, href: "/admin/tags?status=unassigned" },
    { label: "Desactivados", value: counts.disabled ?? 0, href: "/admin/tags?status=disabled" },
  ];

  return (
    <>
      <PageTitle title="Hola 👋" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Nfc className="size-4 text-brand" /> Abrir un tag
          </CardTitle>
          <CardDescription>Escanea el NFC con el móvil (con sesión iniciada te trae aquí) o escribe su código.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpenTagForm />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border bg-card p-3 active:bg-muted">
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-2">
        {[
          { href: "/admin/batches", icon: Boxes, title: "Crear un lote", text: "Genera códigos y exporta las URLs para NFC Tools" },
          { href: "/admin/tags", icon: Tags, title: "Todos los tags", text: "Filtra por estado, negocio o lote" },
          { href: "/admin/businesses", icon: Store, title: "Negocios", text: "Fichas de Google y tags de cada cliente" },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border bg-card p-4 active:bg-muted">
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
