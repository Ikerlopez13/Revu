import "server-only";

/**
 * ¿La petición viene de un admin con sesión? Se implementa en la fase 3
 * (Auth.js). Mientras tanto nadie es admin y todos los escaneos redirigen.
 */
export async function isAdminRequest(_request: Request): Promise<boolean> {
  return false;
}
