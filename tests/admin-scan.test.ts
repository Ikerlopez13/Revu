import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ getAdminEmail: vi.fn() }));
vi.mock("@/lib/auth/session", () => session);
const { isAdminRequest } = await import("@/lib/auth/admin");

const req = (cookie?: string) => new Request("https://revutags.com/t/AB3K9Z", { headers: cookie ? { cookie } : {} });

beforeEach(() => vi.clearAllMocks());

describe("modo admin al escanear", () => {
  it("sin cookie de sesión no consulta nada (escaneo normal, coste cero)", async () => {
    expect(await isAdminRequest(req("_ga=1; theme=dark"))).toBe(false);
    expect(session.getAdminEmail).not.toHaveBeenCalled();
  });

  it.each(["authjs.session-token=x", "__Secure-authjs.session-token=x", "a=1; __Secure-authjs.session-token.0=x"])(
    "con cookie (%s) y admin válido → true",
    async (cookie) => {
      session.getAdminEmail.mockResolvedValue("iker@example.com");
      expect(await isAdminRequest(req(cookie))).toBe(true);
    },
  );

  it("cookie inválida o fuera de la allowlist → escaneo normal", async () => {
    session.getAdminEmail.mockResolvedValue(null);
    expect(await isAdminRequest(req("authjs.session-token=bad"))).toBe(false);
    session.getAdminEmail.mockRejectedValue(new Error("JWT inválido"));
    expect(await isAdminRequest(req("authjs.session-token=bad"))).toBe(false);
  });
});
