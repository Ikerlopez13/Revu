import "server-only";
import { generateUniqueCodes, type CodeGenerator } from "@/lib/codes/generate";
import { db } from "@/lib/db/client";
import { insertBatch, insertBatchTags } from "@/lib/db/queries/admin";

/**
 * Rellena un lote con `quantity` códigos nuevos. Si alguno choca con uno que ya
 * existe en la BD (UNIQUE), se descarta y se generan más.
 */
export async function fillWithUniqueCodes(
  quantity: number,
  insert: (codes: string[]) => Promise<string[]>,
  generate?: CodeGenerator,
  maxRounds = 5,
): Promise<string[]> {
  const created: string[] = [];
  const tried = new Set<string>();
  for (let round = 0; round < maxRounds && created.length < quantity; round++) {
    const codes = generateUniqueCodes(quantity - created.length, { taken: tried, generate });
    codes.forEach((c) => tried.add(c));
    created.push(...(await insert(codes)));
  }
  if (created.length < quantity) throw new Error(`Solo se pudieron crear ${created.length} de ${quantity} códigos`);
  return created;
}

export async function createBatch(input: { name: string; quantity: number }) {
  return db().transaction(async (tx) => {
    const batch = await insertBatch(tx, input.name, input.quantity);
    await fillWithUniqueCodes(input.quantity, (codes) => insertBatchTags(tx, batch.id, codes));
    return batch;
  });
}

export function publicTagUrl(code: string): string {
  const base = (process.env.PUBLIC_BASE_URL || "https://revutags.com").replace(/\/+$/, "");
  return `${base}/t/${code}`;
}

/** Una URL por línea, para grabar en serie con NFC Tools. */
export function toPlainText(codes: string[]): string {
  return codes.map(publicTagUrl).join("\n") + "\n";
}

export function toCsv(rows: { code: string; status: string; label: string | null; businessName: string | null }[]): string {
  const esc = (v: string | null) => {
    const s = v ?? "";
    // Comillas siempre y neutraliza fórmulas al abrir en Excel/Numbers.
    return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const lines = rows.map((r) => [r.code, publicTagUrl(r.code), r.status, r.label, r.businessName].map(esc).join(","));
  return ["code,url,status,label,business", ...lines].join("\r\n") + "\r\n";
}
