import { isAllowedEmail } from "./allowlist";

export const LOGIN_PATH = "/admin/login";

export type GateResult = { action: "next" } | { action: "redirect"; to: string } | { action: "forbidden" };

/**
 * Decide el acceso a /admin/**. Lo usa el middleware; las server actions y
 * route handlers vuelven a comprobar la sesión por su cuenta.
 */
export function adminGate(
  url: URL,
  email: string | null | undefined,
  allowlist: ReadonlySet<string>,
): GateResult {
  const { pathname } = url;
  if (!pathname.startsWith("/admin")) return { action: "next" };
  if (pathname === LOGIN_PATH) {
    return isAllowedEmail(email, allowlist) ? { action: "redirect", to: "/admin" } : { action: "next" };
  }
  if (!email) {
    const to = new URL(LOGIN_PATH, url);
    to.searchParams.set("next", pathname + url.search);
    return { action: "redirect", to: to.pathname + to.search };
  }
  // Sesión válida pero el email ya no está en la allowlist (p. ej. se quitó).
  return isAllowedEmail(email, allowlist) ? { action: "next" } : { action: "forbidden" };
}

/** Solo rutas internas como destino tras el login (evita open redirect). */
export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.includes("\\") ? next : "/admin";
}
