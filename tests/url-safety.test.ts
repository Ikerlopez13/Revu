import { describe, expect, it } from "vitest";
import { customUrlSchema, sanitizeRedirectUrl } from "@/lib/redirect/url-safety";
import { normalizeAlias } from "@/lib/redirect/alias";

describe("validación de URLs de destino (open redirect)", () => {
  it.each([
    "https://tryredcarpet.com",
    "https://g.page/r/CajoDPj7oDtwEBE/review",
    "https://search.google.com/local/writereview?placeid=ChIJ123",
  ])("acepta %s", (url) => {
    expect(sanitizeRedirectUrl(url)).not.toBeNull();
  });

  it.each([
    ["http", "http://example.com"],
    ["javascript", "javascript:alert(1)"],
    ["data", "data:text/html,<script>alert(1)</script>"],
    ["relativa", "/admin"],
    ["protocol-relative", "//evil.com"],
    ["credenciales", "https://user:pass@evil.com"],
    ["usuario tipo google.com@", "https://google.com@evil.com"],
    ["tabulador", "https:\t//evil.com"],
    ["backslash", "https:\\\\evil.com"],
    ["salto de línea", "https://evil.com/\nLocation: x"],
    ["host sin punto", "https://localhost"],
    ["dominio propio", "https://revutags.com/t/ABCDEF"],
    ["dominio propio www", "https://WWW.revutags.com/x"],
    ["vacía", ""],
    ["null", null],
    ["muy larga", "https://a.com/" + "x".repeat(3000)],
  ])("rechaza %s", (_name, url) => {
    expect(sanitizeRedirectUrl(url)).toBeNull();
  });

  it("el schema de Zod devuelve la URL normalizada o un error", () => {
    expect(customUrlSchema.parse("  https://Example.com  ")).toBe("https://example.com/");
    expect(customUrlSchema.safeParse("http://example.com").success).toBe(false);
  });
});

describe("alias legacy", () => {
  it("normaliza a minúsculas y decodifica", () => {
    expect(normalizeAlias("Birres")).toBe("birres");
    expect(normalizeAlias("b%26b")).toBe("b&b");
    expect(normalizeAlias("b&b")).toBe("b&b");
  });
  it("rechaza lo que no puede ser un alias", () => {
    for (const bad of ["", "a b", "../x", "%E0%A4%A", "x".repeat(41), "index.html"]) expect(normalizeAlias(bad)).toBeNull();
  });
});
