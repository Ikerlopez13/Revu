import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db/client";
import { authAccounts, authSessions, authUsers, authVerificationTokens } from "@/lib/db/schema";

// Config perezosa: la conexión a la BD se crea en la primera petición, no en el build.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  ...authConfig,
  adapter: DrizzleAdapter(db(), {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  providers: [
    ...authConfig.providers,
    ...(process.env.AUTH_RESEND_KEY
      ? [Resend({ apiKey: process.env.AUTH_RESEND_KEY, from: process.env.AUTH_EMAIL_FROM ?? "RevuTags <login@revutags.com>" })]
      : []),
  ],
}));
