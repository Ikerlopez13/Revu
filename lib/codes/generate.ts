import { customAlphabet } from "nanoid";

// Sin 0/O, 1/I/l. Solo mayúsculas: el código se normaliza a mayúsculas al resolver.
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 6;
const CODE_REGEX = /^[2-9A-HJ-NP-Z]{6}$/;

export type CodeGenerator = () => string;

export const generateCode: CodeGenerator = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

/** Devuelve el código canónico o null si no tiene el formato válido. */
export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return CODE_REGEX.test(code) ? code : null;
}

/**
 * Genera `count` códigos distintos entre sí y distintos de `taken`.
 * La BD tiene además un UNIQUE sobre tags.code: quien inserte debe usar
 * ON CONFLICT DO NOTHING y pedir más códigos para los que no entren.
 */
export function generateUniqueCodes(
  count: number,
  options: { taken?: ReadonlySet<string>; generate?: CodeGenerator; maxAttempts?: number } = {},
): string[] {
  const { taken = new Set<string>(), generate = generateCode } = options;
  const maxAttempts = options.maxAttempts ?? count * 20 + 100;
  const out = new Set<string>();
  let attempts = 0;
  while (out.size < count) {
    if (++attempts > maxAttempts) {
      throw new Error(`No se pudieron generar ${count} códigos únicos en ${maxAttempts} intentos`);
    }
    const code = generate();
    if (!taken.has(code)) out.add(code);
  }
  return [...out];
}
