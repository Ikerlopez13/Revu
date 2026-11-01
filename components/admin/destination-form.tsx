"use client";

import { useState } from "react";
import { updateDestinationAction } from "@/app/admin/actions";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import type { DestinationType } from "@/lib/db/schema";
import { ActionForm } from "./action-form";

export function DestinationForm({ code, type, url }: { code: string; type: DestinationType; url: string | null }) {
  const [current, setCurrent] = useState(type);
  return (
    <ActionForm action={updateDestinationAction} submitLabel="Guardar destino" variant="outline" successMessage="Destino actualizado">
      <input type="hidden" name="code" value={code} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="destinationType">Tipo de destino</Label>
        <NativeSelect id="destinationType" name="destinationType" value={current} onChange={(e) => setCurrent(e.target.value as DestinationType)}>
          <option value="google_review">Reseña en Google (ficha del negocio)</option>
          <option value="custom_url">URL personalizada</option>
        </NativeSelect>
      </div>
      {current === "custom_url" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="destinationUrl">URL (https://)</Label>
          <Input id="destinationUrl" name="destinationUrl" type="url" inputMode="url" required defaultValue={url ?? ""} placeholder="https://…" />
        </div>
      )}
    </ActionForm>
  );
}
