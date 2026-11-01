// Datos de prueba: 1 negocio con 1 tag activo + 1 lote de 10 tags sin asignar.
// Pensado para una BD de desarrollo (rama de Supabase o Postgres local), no producción.
//   DATABASE_URL=... npm run db:seed
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateUniqueCodes } from "../lib/codes/generate";
import { batches, businesses, tags } from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client);

const existing = new Set((await db.select({ code: tags.code }).from(tags)).map((t) => t.code));
const [activeCode, ...batchCodes] = generateUniqueCodes(11, { taken: existing });

const [business] = await db
  .insert(businesses)
  .values({ slug: "demo", name: "Restaurante Demo", googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4", notes: "Seed" })
  .onConflictDoNothing()
  .returning();

const [batch] = await db.insert(batches).values({ name: "Lote de prueba", quantity: batchCodes.length }).returning();

if (business) {
  await db.insert(tags).values({ code: activeCode!, businessId: business.id, batchId: batch!.id, status: "active", label: "Mesa 1" });
}
await db.insert(tags).values(batchCodes.map((code) => ({ code, batchId: batch!.id })));

console.log("Seed OK");
console.log(business ? `Tag activo: /t/${activeCode}` : "El negocio demo ya existía");
console.log("Lote:", batchCodes.map((c) => `/t/${c}`).join(" "));
await client.end();
