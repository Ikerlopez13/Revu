"use client";

import { Building2, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchBusinessAction, type BusinessSearchResult } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";

export type PickedBusiness =
  | { kind: "existing"; id: string; name: string }
  | { kind: "place"; placeId: string; name: string; address: string | null };

/**
 * Un solo buscador para tus negocios y para Google Places. Elegir un resultado
 * es un toque: si es una ficha de Google nueva, el negocio se crea al guardar.
 */
export function BusinessPicker({ onPick, autoFocus }: { onPick: (b: PickedBusiness) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResult(null);
      return;
    }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchBusinessAction(query);
      if (id !== seq.current) return; // respuesta vieja
      setLoading(false);
      if (r.ok) {
        setResult(r.data ?? null);
        setError(null);
      } else setError(r.error);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const empty = result && !result.existing.length && !result.places.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Nombre del negocio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
        {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {empty && <p className="px-1 text-sm text-muted-foreground">Sin resultados.</p>}

      {result && result.existing.length > 0 && (
        <ResultGroup title="Tus negocios">
          {result.existing.map((b) => (
            <ResultItem key={b.id} icon={<Building2 />} title={b.name} subtitle={`/${b.slug}`} onClick={() => onPick({ kind: "existing", id: b.id, name: b.name })} />
          ))}
        </ResultGroup>
      )}
      {result && result.places.length > 0 && (
        <ResultGroup title="En Google">
          {result.places.map((p) => (
            <ResultItem key={p.placeId} icon={<MapPin />} title={p.name} subtitle={p.address ?? ""} onClick={() => onPick({ kind: "place", ...p })} />
          ))}
        </ResultGroup>
      )}
      {result?.placesError && <p className="px-1 text-xs text-muted-foreground">{result.placesError}</p>}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <p className="border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul className="divide-y">{children}</ul>
    </div>
  );
}

function ResultItem({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
        {icon}
        <span className="min-w-0">
          <span className="block truncate font-medium">{title}</span>
          {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      </button>
    </li>
  );
}
