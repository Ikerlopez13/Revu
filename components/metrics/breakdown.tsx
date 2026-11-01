import { shares } from "@/lib/metrics";

/** Reparto como barras horizontales con etiqueta: la identidad va en el texto, no en el color. */
export function Breakdown({ rows, empty = "Sin datos en este periodo" }: { rows: { key: string; label: string; sub?: string | null; count: number }[]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="flex flex-col gap-3">
      {shares(rows).map((r) => (
        <li key={r.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{r.label}</span>
              {r.sub && <span className="text-muted-foreground"> · {r.sub}</span>}
            </span>
            <span className="shrink-0 tabular-nums">
              {r.count} <span className="text-muted-foreground">({r.pct}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(2, (r.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
