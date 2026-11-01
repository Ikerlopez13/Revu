"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input, NativeSelect } from "@/components/ui/input";

type Option = { id: string; name: string };

export function TagFilters({ businesses, batches }: { businesses: Option[]; batches: Option[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/admin/tags?${next}`);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Buscar código, etiqueta o negocio"
        className="col-span-2"
        onKeyDown={(e) => e.key === "Enter" && set("q", e.currentTarget.value.trim())}
        onBlur={(e) => e.currentTarget.value.trim() !== (params.get("q") ?? "") && set("q", e.currentTarget.value.trim())}
      />
      <NativeSelect value={params.get("status") ?? ""} onChange={(e) => set("status", e.target.value)} aria-label="Estado">
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="unassigned">Sin asignar</option>
        <option value="disabled">Desactivados</option>
      </NativeSelect>
      <NativeSelect value={params.get("batch") ?? ""} onChange={(e) => set("batch", e.target.value)} aria-label="Lote">
        <option value="">Todos los lotes</option>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect value={params.get("business") ?? ""} onChange={(e) => set("business", e.target.value)} aria-label="Negocio" className="col-span-2">
        <option value="">Todos los negocios</option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
