import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { adminAllowlist, isAllowedEmail } from "@/lib/auth/allowlist";
import { isLoginBlocked, recordLoginFailure } from "@/lib/auth/login-limit";
import { dummyHash, verifyPassword } from "@/lib/auth/password";
import { findAdminUser, touchLastLogin } from "@/lib/db/queries/admin-users";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Una contraseña incorrecta es normal: no ensuciar los logs con ella.
  logger: { error: (e) => e.name !== "CredentialsSignin" && console.error(e) },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const h = await headers();
        const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (await isLoginBlocked(email, ip)) return null;

        const user = isAllowedEmail(email, adminAllowlist()) ? await findAdminUser(email) : null;
        // Siempre se verifica algo, exista o no el usuario: mismo tiempo de respuesta.
        const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
        if (!user || !ok) {
          await recordLoginFailure(email, ip);
          return null;
        }

        await touchLastLogin(user.id);
        return { id: user.id, email: user.email };
      },
    }),
  ],
});
