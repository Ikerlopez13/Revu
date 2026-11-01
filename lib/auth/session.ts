import "server-only";
import { auth } from "@/auth";
import { adminAllowlist, isAllowedEmail } from "./allowlist";

export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
  }
}

/** Email del admin con sesión válida y en la allowlist, o null. */
export async function getAdminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isAllowedEmail(email, adminAllowlist()) ? email!.toLowerCase() : null;
}

/** Para server actions y route handlers: comprobación en el servidor, no solo en el middleware. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new UnauthorizedError();
  return email;
}
