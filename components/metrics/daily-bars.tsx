"use client";

import { useState } from "react";

type Point = { day: string; count: number };

const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...opts }).format(new Date(`${day}T12:00:00Z`));

/**
 * Escaneos por día. Una sola serie (sin leyenda: el título la nombra).
 * Tocar o pasar por una barra muestra su valor en la línea de lectura.
 */
export function DailyBars({ data, label = "escaneos" }: { data: Point[]; label?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const sel = active !== null ? data[active] : null;
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-6 items-baseline justify-between text-sm" aria-live="polite">
        {sel ? (
          <>
            <span className="text-muted-foreground">{fmtDay(sel.day, { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="font-semibold tabular-nums">
              {sel.count} {label}
            </span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">Máximo diario: {max === 1 && total === 0 ? 0 : max}</span>
            <span className="text-muted-foreground">Toca una barra</span>
          </>
        )}
      </div>

      <div
        className="relative flex h-36 items-end gap-[2px] border-b border-border"
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label={`Gráfico de ${label} por día, ${total} en total`}
      >
        {data.map((d, i) => (
          <button
            key={d.day}
            type="button"
            aria-label={`${d.day}: ${d.count}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="group flex h-full min-w-0 flex-1 items-end outline-none"
          >
            <span
              className={`block w-full rounded-t-[4px] transition-opacity ${d.count ? "bg-brand" : "bg-border"} ${active !== null && active !== i ? "opacity-40" : ""}`}
              style={{ height: d.count ? `${Math.max(3, (d.count / max) * 100)}%` : "2px" }}
            />
          </button>
        ))}
      </div>

      <div className="relative h-4 text-[11px] text-muted-foreground">
        {ticks.map((i, k) => (
          <span
            key={k}
            className="absolute top-0"
            style={k === 0 ? { left: 0 } : k === 2 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }}
          >
            {fmtDay(data[i]!.day, { day: "numeric", month: "short" })}
          </span>
        ))}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground">Ver como tabla</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">Día</th>
              <th className="py-1 text-right font-medium">{label}</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.day} className="border-t">
                <td className="py-1">{fmtDay(d.day, { weekday: "short", day: "numeric", month: "short" })}</td>
                <td className="py-1 text-right">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
