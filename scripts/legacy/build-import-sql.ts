// Genera drizzle/0002_import_legacy.sql a partir de scripts/legacy/data.ts.
// Se ejecutó una vez (los códigos quedan fijados en el SQL). Uso:
//   npx tsx scripts/legacy/build-import-sql.ts > drizzle/0002_import_legacy.sql
import { generateUniqueCodes } from "../../lib/codes/generate";
import { LEGACY_BUSINESSES } from "../../lib/redirect/legacy-data";

const q = (v: string | null) => (v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`);

const allAliases = LEGACY_BUSINESSES.flatMap((b) => b.aliases);
const codes = generateUniqueCodes(allAliases.length);
let i = 0;

const lines: string[] = [
  "-- Importa los enlaces legacy (revutags.com/{slug} y /m/{slug}) y el historial de clicks.",
  "-- Generado por scripts/legacy/build-import-sql.ts",
];

for (const b of LEGACY_BUSINESSES) {
  lines.push(
    `INSERT INTO "revu"."businesses" ("slug","name","google_place_id","notes") VALUES (${q(b.slug)},${q(b.name)},${q(b.placeId)},${q(b.notes ?? null)});--> statement-breakpoint`,
  );
  for (const a of b.aliases) {
    const alias = typeof a === "string" ? a : a.alias;
    const url = typeof a === "string" ? null : a.customUrl;
    const code = codes[i++]!;
    lines.push(
      `INSERT INTO "revu"."tags" ("code","business_id","status","destination_type","destination_url","label") ` +
        `SELECT ${q(code)}, id, 'active', ${url ? "'custom_url'" : "'google_review'"}, ${q(url)}, ${q(`Legacy /${alias}`)} ` +
        `FROM "revu"."businesses" WHERE slug = ${q(b.slug)};--> statement-breakpoint`,
    );
    lines.push(
      `INSERT INTO "revu"."tag_aliases" ("alias","tag_id") SELECT ${q(alias)}, id FROM "revu"."tags" WHERE code = ${q(code)};--> statement-breakpoint`,
    );
  }
}

// Historial de public.revu_clicks (solo si existe: en una BD local nueva no está).
// Del user-agent solo se conserva el SO; el referer se reduce al host.
lines.push(`DO $$
BEGIN
  IF to_regclass('public.revu_clicks') IS NOT NULL THEN
    INSERT INTO "revu"."scans" ("tag_id","business_id","scanned_at","os","referer","via","outcome")
    SELECT t.id, t.business_id, c.created_at,
      (CASE WHEN c.user_agent ~* 'iphone|ipad|ipod' THEN 'ios'
            WHEN c.user_agent ~* 'android' THEN 'android'
            ELSE 'other' END)::"revu"."scan_os",
      NULLIF(substring(c.referer from '^https?://([^/:?#]+)'), ''),
      'legacy', 'redirect'
    FROM public.revu_clicks c
    JOIN "revu"."tag_aliases" a ON a.alias = lower(c.slug)
    JOIN "revu"."tags" t ON t.id = a.tag_id;
  END IF;
END $$;`);

console.log(lines.join("\n"));
