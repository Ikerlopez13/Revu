import "server-only";
import { getAdminEmail } from "./session";

// Auth.js puede trocear la cookie en .0, .1… si el JWT es grande.
const SESSION_COOKIE = /(?:^|;\s*)(?:__Secure-)?authjs\.session-token(?:\.\d+)?=/;

/**
 * ¿Quien escanea es un admin con sesión? Solo se descifra el JWT si la cookie
 * existe, así los escaneos normales no pagan nada.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  if (!SESSION_COOKIE.test(cookie)) return false;
  try {
    return (await getAdminEmail()) !== null;
  } catch {
    return false;
  }
}
