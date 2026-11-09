"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { assignTagAction, linkSlugAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BusinessPicker, type PickedBusiness } from "./business-picker";

const LABEL_CHIPS = ["Barra", "Entrada", "Terraza", "Caja", "Mesa "];

type Target = { code: string; slug?: never } | { slug: string; code?: never };

/**
 * Asignación en 3 toques: 1) resultado del buscador, 2) etiqueta rápida
 * (opcional), 3) Activar. Con `slug` da destino a un enlace corto que aún
 * no existe y al terminar abre su ficha.
 */
export function QuickAssign({
  initialLabel,
  submitLabel = "Activar tag",
  ...target
}: Target & { initialLabel?: string | null; submitLabel?: string }) {
  const router = useRouter();
  const [business, setBusiness] = useState<PickedBusiness | null>(null);
  const [label, setLabel] = useState(initialLabel ?? "");
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const labelRef = useRef<HTMLInputElement>(null);

  if (!business) return <BusinessPicker onPick={setBusiness} autoFocus />;

  const submit = () =>
    start(async () => {
      setError(null);
      const input = {
        label,
        destinationType: customUrl === null ? ("google_review" as const) : ("custom_url" as const),
        destinationUrl: customUrl ?? undefined,
        business: business.kind === "existing" ? { kind: "existing" as const, id: business.id } : { kind: "place" as const, placeId: business.placeId, name: business.name },
      };
      if (target.slug !== undefined) {
        const r = await linkSlugAction({ ...input, slug: target.slug });
        if (!r.ok) return setError(r.error);
        router.replace(`/admin/tags/${r.data!.code}`);
        return;
      }
      const r = await assignTagAction({ ...input, code: target.code });
      if (!r.ok) return setError(r.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate font-semibold">{business.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {business.kind === "place" ? `Nuevo · ${business.address ?? "Google"}` : "Negocio existente"}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Cambiar negocio" onClick={() => setBusiness(null)}>
          <X />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Etiqueta (opcional)</Label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {LABEL_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setLabel(chip);
                if (chip.endsWith(" ")) labelRef.current?.focus();
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${label === chip ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {chip.trim()}
              {chip.endsWith(" ") ? " …" : ""}
            </button>
          ))}
        </div>
        <Input id="label" ref={labelRef} value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} placeholder="Mesa 4, Barra…" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={customUrl !== null}
            onChange={(e) => setCustomUrl(e.target.checked ? "" : null)}
          />
          Mandar a una URL propia en vez de a la reseña
        </label>
        {customUrl !== null && (
          <Input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://…"
            aria-label="URL de destino"
          />
        )}
      </div>

      <Button size="lg" variant="brand" onClick={submit} disabled={pending}>
        <Check />
        {pending ? "Activando…" : submitLabel}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
