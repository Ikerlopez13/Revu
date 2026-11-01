import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, generateCode, generateUniqueCodes, normalizeCode } from "@/lib/codes/generate";

describe("generación de códigos", () => {
  it("el alfabeto no tiene caracteres ambiguos", () => {
    for (const c of "0O1lI") expect(CODE_ALPHABET).not.toContain(c);
    expect(new Set(CODE_ALPHABET).size).toBe(CODE_ALPHABET.length);
  });

  it("genera códigos de 6 caracteres del alfabeto", () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateCode();
      expect(code).toHaveLength(6);
      expect(normalizeCode(code)).toBe(code);
    }
  });

  it("no hay colisiones en un lote grande", () => {
    const codes = generateUniqueCodes(50_000);
    expect(new Set(codes).size).toBe(50_000);
  });

  it("evita los códigos ya existentes y reintenta las colisiones", () => {
    const sequence = ["AAAAAA", "AAAAAA", "BBBBBB", "CCCCCC", "DDDDDD"];
    let i = 0;
    const codes = generateUniqueCodes(2, { taken: new Set(["BBBBBB"]), generate: () => sequence[i++]! });
    expect(codes).toEqual(["AAAAAA", "CCCCCC"]);
  });

  it("falla en vez de entrar en bucle si no puede generar suficientes", () => {
    expect(() => generateUniqueCodes(2, { generate: () => "AAAAAA", maxAttempts: 50 })).toThrow();
  });

  it("normaliza a mayúsculas y rechaza formatos inválidos", () => {
    expect(normalizeCode(" ab3k9z ")).toBe("AB3K9Z");
    for (const bad of ["AB3K9", "AB3K9ZZ", "AB0K9Z", "ABOK9Z", "AB1K9Z", "ABIK9Z", "../etc", ""]) {
      expect(normalizeCode(bad)).toBeNull();
    }
  });
});
