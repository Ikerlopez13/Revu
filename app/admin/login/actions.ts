"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { safeNextPath } from "@/lib/auth/gate";

export async function signInWithPassword(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  try {
    await signIn("credentials", {
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
      redirectTo: next,
    });
  } catch (err) {
    // signIn lanza un redirect cuando va bien: hay que dejarlo pasar.
    if (err instanceof AuthError) redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
