import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { adminUsers } from "../schema";

export async function findAdminUser(email: string) {
  const [u] = await db().select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);
  return u ?? null;
}

export async function touchLastLogin(id: string) {
  await db().update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
}

export async function setAdminPassword(email: string, passwordHash: string) {
  await db()
    .insert(adminUsers)
    .values({ email: email.toLowerCase(), passwordHash })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash, updatedAt: new Date() } });
}
