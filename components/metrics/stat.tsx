import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stat({ label, value, delta, hint, className }: { label: string; value: string | number; delta?: number | null; hint?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {delta !== undefined && delta !== null && (
        <p className={cn("mt-0.5 flex items-center gap-0.5 text-xs font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
          {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {delta >= 0 ? "+" : ""}
          {delta}% <span className="font-normal text-muted-foreground">vs anterior</span>
        </p>
      )}
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
