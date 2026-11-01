// Crea un usuario del panel o cambia su contraseña.
//   npm run admin:password -- tu@email.com
// Pide la contraseña por teclado (no queda en el historial de la shell).
// Recuerda que el email también debe estar en ADMIN_EMAILS.
import "dotenv/config";
import { createInterface } from "node:readline";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../lib/auth/password";
import { adminUsers } from "../lib/db/schema";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) throw new Error("Uso: npm run admin:password -- tu@email.com");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL (en .env o .env.local)");

function ask(question: string): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return Promise.resolve(process.env.ADMIN_PASSWORD);
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // Oculta lo que se escribe.
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
    if (s.startsWith(question)) process.stdout.write(question);
  };
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

const password = await ask("Contraseña: ");
if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
if (!process.env.ADMIN_PASSWORD && (await ask("Repítela: ")) !== password) throw new Error("No coinciden");

const client = postgres(url, { prepare: false, max: 1 });
const passwordHash = await hashPassword(password);
await drizzle(client)
  .insert(adminUsers)
  .values({ email, passwordHash })
  .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash, updatedAt: new Date() } });
console.log(`Contraseña guardada para ${email}`);
await client.end();
