"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBusinessAction } from "@/app/admin/actions";
import { Input, Label } from "@/components/ui/input";
import { ActionForm } from "./action-form";
import { BusinessPicker } from "./business-picker";

export function NewBusiness() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <BusinessPicker
        onPick={(b) => {
          if (b.kind === "existing") return router.push(`/admin/businesses/${b.id}`);
          start(async () => {
            const r = await createBusinessAction({ name: b.name, googlePlaceId: b.placeId });
            if (!r.ok) setError(r.error);
          });
        }}
      />
      {pending && <p className="text-sm text-muted-foreground">Creando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">Crear a mano (sin ficha de Google)</summary>
        <div className="pt-3">
          <ActionForm action={createBusinessAction} submitLabel="Crear negocio" variant="outline">
            <Label htmlFor="new-name">Nombre</Label>
            <Input id="new-name" name="name" required maxLength={120} />
          </ActionForm>
        </div>
      </details>
    </div>
  );
}
