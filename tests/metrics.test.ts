import { describe, expect, it } from "vitest";
import { fillDays, madridDay, parseRange, pctChange, shares } from "@/lib/metrics";

describe("métricas", () => {
  it("rellena con 0 los días sin escaneos y acaba en hoy", () => {
    const out = fillDays([{ day: "2026-10-30", count: 4 }], 3, "2026-10-31");
    expect(out).toEqual([
      { day: "2026-10-29", count: 0 },
      { day: "2026-10-30", count: 4 },
      { day: "2026-10-31", count: 0 },
    ]);
  });

  it("cruza meses y el cambio de hora sin saltarse días", () => {
    const out = fillDays([], 5, "2026-11-02");
    expect(out.map((d) => d.day)).toEqual(["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("el día se calcula en hora de Madrid", () => {
    expect(madridDay(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
    expect(madridDay(new Date("2026-07-15T21:59:00Z"))).toBe("2026-07-15");
  });

  it("variación entre periodos", () => {
    expect(pctChange(15, 10)).toBe(50);
    expect(pctChange(5, 10)).toBe(-50);
    expect(pctChange(5, 0)).toBeNull();
  });

  it("los porcentajes suman 100", () => {
    const r = shares([{ count: 1 }, { count: 1 }, { count: 1 }]);
    expect(r.reduce((s, x) => s + x.pct, 0)).toBe(100);
    expect(shares([{ count: 0 }]).map((x) => x.pct)).toEqual([0]);
  });

  it("rango por defecto 30 días", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });
});
