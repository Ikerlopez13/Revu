import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { adminAllowlist, isAllowedEmail } from "@/lib/auth/allowlist";

// Parte de la config sin base de datos: la usa el middleware.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 24 * 60 * 60 }, // 60 días: no relogin constante en el iPhone
  pages: { signIn: "/admin/login", verifyRequest: "/admin/login?sent=1", error: "/admin/login" },
  providers: process.env.AUTH_GOOGLE_ID ? [Google] : [],
  callbacks: {
    // La allowlist se aplica antes de crear sesión o enviar el magic link.
    signIn: ({ user }) => isAllowedEmail(user.email, adminAllowlist()),
  },
} satisfies NextAuthConfig;
