import { describe, expect, it } from "vitest";
import { nextSequentialSlug, slugSchema } from "@/lib/admin/slugs";
import { normalizeAlias } from "@/lib/redirect/alias";

describe("slugs propios", () => {
  it("propone el siguiente número con 4 cifras", () => {
    expect(nextSequentialSlug([])).toBe("0001");
    expect(nextSequentialSlug(["0001", "0002", "birres"])).toBe("0003");
    expect(nextSequentialSlug(["0009"])).toBe("0010");
    expect(nextSequentialSlug(["9999"])).toBe("10000");
  });

  it("acepta slugs válidos y los normaliza", () => {
    expect(slugSchema.parse(" 0001 ")).toBe("0001");
    expect(slugSchema.parse("Mesa-4")).toBe("mesa-4");
  });

  it.each(["admin", "t", "api", "analytics", "", "-x", "a b", "a/b", "a.b", "ñandú", "x".repeat(41)])("rechaza %j", (s) => {
    expect(slugSchema.safeParse(s).success).toBe(false);
  });

  it("todo slug válido lo resuelve la ruta /{slug}", () => {
    for (const s of ["0001", "mesa-4", "bar_9"]) expect(normalizeAlias(s)).toBe(s);
  });
});
