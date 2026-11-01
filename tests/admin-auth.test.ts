import { describe, expect, it } from "vitest";
import { isAllowedEmail, parseAllowlist } from "@/lib/auth/allowlist";
import { adminGate, safeNextPath } from "@/lib/auth/gate";

const allow = parseAllowlist(" Iker@Example.com, otra@x.com ");
const url = (p: string) => new URL(p, "https://revutags.com");

describe("allowlist", () => {
  it("normaliza mayúsculas y espacios", () => {
    expect(isAllowedEmail("iker@example.com", allow)).toBe(true);
    expect(isAllowedEmail(" IKER@EXAMPLE.COM ", allow)).toBe(true);
    expect(isAllowedEmail("intruso@example.com", allow)).toBe(false);
    expect(isAllowedEmail(null, allow)).toBe(false);
  });
  it("vacía o mal formada no deja entrar a nadie", () => {
    expect(parseAllowlist("").size).toBe(0);
    expect(parseAllowlist(undefined).size).toBe(0);
    expect(parseAllowlist("no-es-un-email").size).toBe(0);
  });
});

describe("protección de /admin (middleware)", () => {
  it("sin sesión → login, conservando a dónde iba", () => {
    expect(adminGate(url("/admin/tags/AB3K9Z"), null, allow)).toEqual({
      action: "redirect",
      to: "/admin/login?next=%2Fadmin%2Ftags%2FAB3K9Z",
    });
  });
  it.each(["/admin", "/admin/batches/123/export?format=csv", "/admin/businesses"])("sin sesión no se entra a %s", (p) => {
    expect(adminGate(url(p), undefined, allow).action).toBe("redirect");
  });
  it("con sesión pero fuera de la allowlist → 403", () => {
    expect(adminGate(url("/admin"), "intruso@example.com", allow)).toEqual({ action: "forbidden" });
  });
  it("admin de la allowlist → pasa", () => {
    expect(adminGate(url("/admin/tags"), "iker@example.com", allow)).toEqual({ action: "next" });
  });
  it("la página de login es pública, y si ya eres admin te manda al panel", () => {
    expect(adminGate(url("/admin/login"), null, allow)).toEqual({ action: "next" });
    expect(adminGate(url("/admin/login"), "iker@example.com", allow)).toEqual({ action: "redirect", to: "/admin" });
  });
  it("no afecta a las rutas públicas", () => {
    expect(adminGate(url("/t/AB3K9Z"), null, allow)).toEqual({ action: "next" });
  });
  it("tras el login solo redirige a rutas internas del panel", () => {
    expect(safeNextPath("/admin/tags/X")).toBe("/admin/tags/X");
    for (const bad of ["https://evil.com", "//evil.com", "/t/ABC", "/admin\\..\\x", null]) expect(safeNextPath(bad)).toBe("/admin");
  });
});
