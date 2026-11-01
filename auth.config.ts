import type { NextAuthConfig } from "next-auth";
import { adminAllowlist, isAllowedEmail } from "@/lib/auth/allowlist";

// Parte de la config sin base de datos: la usa el middleware para leer el JWT.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 24 * 60 * 60 }, // 60 días: no relogin constante en el iPhone
  pages: { signIn: "/admin/login", error: "/admin/login" },
  providers: [],
  callbacks: {
    signIn: ({ user }) => isAllowedEmail(user.email, adminAllowlist()),
  },
} satisfies NextAuthConfig;
