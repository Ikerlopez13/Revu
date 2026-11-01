"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { safeNextPath } from "@/lib/auth/gate";

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeNextPath(formData.get("next")?.toString()) });
}

export async function signInWithEmail(formData: FormData) {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) redirect("/admin/login?error=email");
  try {
    // Si el email no está en la allowlist, el callback signIn lo rechaza y no se envía nada.
    await signIn("resend", { email: email.data, redirectTo: safeNextPath(formData.get("next")?.toString()) });
  } catch (err) {
    if (err instanceof AuthError) redirect("/admin/login?error=AccessDenied");
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
