// Datos de prueba: 1 negocio con 1 tag activo + 1 lote de 10 tags sin asignar,
// y opcionalmente un admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
// Pensado para una BD de desarrollo (rama de Supabase o Postgres local), no producción.
//   DATABASE_URL=... npm run db:seed
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateUniqueCodes } from "../lib/codes/generate";
import { hashPassword } from "../lib/auth/password";
import { sql } from "drizzle-orm";
import { adminUsers, batches, businesses, tags } from "../lib/db/schema";

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

// Escaneos y reseñas de ejemplo (90 días) para ver las métricas del negocio demo.
if (business) {
  await db.insert(tags).values(["Barra", "Terraza", "Mesa 4"].map((label, i) => ({
    code: generateUniqueCodes(1, { taken: new Set([activeCode!, ...batchCodes]) })[0]!,
    businessId: business.id,
    status: "active" as const,
    label,
  })));
  await db.execute(sql`
    INSERT INTO revu.scans (tag_id, business_id, scanned_at, os, country, via, outcome)
    SELECT t.id, t.business_id,
      date_trunc('day', now()) - (d || ' days')::interval + (random() * interval '14 hours') + interval '9 hours',
      (CASE WHEN random() < 0.62 THEN 'ios' WHEN random() < 0.9 THEN 'android' ELSE 'other' END)::revu.scan_os,
      'ES', 'code', 'redirect'
    FROM revu.tags t
    CROSS JOIN generate_series(0, 89) d
    CROSS JOIN LATERAL generate_series(1, floor(random() * (CASE WHEN extract(dow FROM now() - (d || ' days')::interval) IN (5, 6) THEN 6 ELSE 3 END))::int) n
    WHERE t.business_id = ${business.id}`);
  await db.execute(sql`
    INSERT INTO revu.review_snapshots (business_id, rating, review_count, captured_at)
    SELECT ${business.id}, round((4.2 + d / 400.0)::numeric, 1), 120 + (89 - d) / 2 + (random() * 2)::int,
      date_trunc('day', now()) - (d || ' days')::interval + interval '5 hours'
    FROM generate_series(0, 89) d`);
}

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  await db.insert(adminUsers).values({ email: adminEmail.toLowerCase(), passwordHash: await hashPassword(adminPassword) }).onConflictDoNothing();
  console.log(`Admin local: ${adminEmail} / ${adminPassword}`);
}

console.log("Seed OK");
console.log(business ? `Tag activo: /t/${activeCode}` : "El negocio demo ya existía");
console.log("Lote:", batchCodes.map((c) => `/t/${c}`).join(" "));
await client.end();
