// Cálculos de métricas sin BD (testeables).

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(raw: string | undefined): RangeDays {
  const n = Number(raw);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" del día de `date` en Madrid. */
export function madridDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return parts; // en-CA ya da YYYY-MM-DD
}

/** Serie continua de `days` días acabando en `today`, con 0 donde no hubo escaneos. */
export function fillDays(rows: { day: string; count: number }[], days: number, today: string): { day: string; count: number }[] {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const key = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
    out.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

/** Variación porcentual; null si no hay base con la que comparar. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Reparto en %, redondeado para que sume 100. */
export function shares<T extends { count: number }>(rows: T[]): (T & { pct: number })[] {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (!total) return rows.map((r) => ({ ...r, pct: 0 }));
  const raw = rows.map((r) => (r.count / total) * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest-- <= 0) break;
    floored[i]! += 1;
  }
  return rows.map((r, i) => ({ ...r, pct: floored[i]! }));
}
