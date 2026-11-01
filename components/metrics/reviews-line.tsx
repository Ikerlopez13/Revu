"use client";

import { useState } from "react";

type Snap = { rating: number | null; reviewCount: number | null; capturedAt: string };

/** Nº de reseñas en Google a lo largo del tiempo (una serie, un eje). */
export function ReviewsLine({ data }: { data: Snap[] }) {
  const pts = data.filter((d) => d.reviewCount !== null) as (Snap & { reviewCount: number })[];
  const [active, setActive] = useState<number | null>(null);
  if (pts.length < 2) return <p className="text-sm text-muted-foreground">Aún no hay suficientes datos diarios de Google para la gráfica.</p>;

  const W = 320, H = 120, PAD = 6;
  const min = Math.min(...pts.map((p) => p.reviewCount));
  const max = Math.max(...pts.map((p) => p.reviewCount));
  const span = Math.max(1, max - min);
  const x = (i: number) => PAD + (i / (pts.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - 2 * PAD);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.reviewCount).toFixed(1)}`).join(" ");
  const sel = (active !== null ? pts[active] : undefined) ?? pts.at(-1)!;
  const fmt = (s: string) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).format(new Date(s));

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{fmt(sel.capturedAt)}</span>
        <span className="font-semibold tabular-nums">
          {sel.reviewCount} reseñas{sel.rating !== null && <span className="font-normal text-muted-foreground"> · {sel.rating} ★</span>}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full touch-none"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Reseñas en Google: de ${pts[0]!.reviewCount} a ${pts.at(-1)!.reviewCount}`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setActive(Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1)));
        }}
        onPointerLeave={() => setActive(null)}
      >
        <line x1={0} x2={W} y1={H - PAD} y2={H - PAD} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={path} fill="none" className="stroke-brand" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={0} y2={H} className="stroke-muted-foreground" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{fmt(pts[0]!.capturedAt)}</span>
        <span>{fmt(pts.at(-1)!.capturedAt)}</span>
      </div>
    </figure>
  );
}
