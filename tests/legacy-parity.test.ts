import { describe, expect, it } from "vitest";
import oldDestinations from "./fixtures/old-destinations.json";
import { LEGACY_ALIASES, legacyFallback } from "@/lib/redirect/legacy-fallback";
import { decide } from "@/lib/redirect/resolve";

// tests/fixtures/old-destinations.json = lo que devolvía api/r/[slug].js (código
// antiguo de producción) para cada slug, extraído de git (commit ae1e24e).
const OLD = oldDestinations as Record<string, string>;

describe("paridad con los enlaces antiguos en producción", () => {
  it("cubre exactamente los mismos slugs", () => {
    expect([...LEGACY_ALIASES].sort()).toEqual(Object.keys(OLD).sort());
  });

  it.each(Object.entries(OLD))("/%s redirige al mismo destino que antes", (slug, expected) => {
    for (const os of ["ios", "android", "other"] as const) {
      const d = decide(legacyFallback(slug), os);
      expect(d.kind).toBe("redirect");
      expect(d.kind === "redirect" && new URL(d.location).href).toBe(new URL(expected).href);
    }
  });
});
