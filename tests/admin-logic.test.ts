import { describe, expect, it } from "vitest";
import { fillWithUniqueCodes, toCsv, toPlainText } from "@/lib/admin/batches";
import { assignTagSchema, createBatchSchema, slugify } from "@/lib/admin/schemas";
import { diff } from "@/lib/admin/tags";

describe("lotes", () => {
  it("si un código ya existe en la BD, genera otro hasta completar el lote", async () => {
    const existing = new Set(["AAAAAA", "BBBBBB"]);
    const seq = ["AAAAAA", "CCCCCC", "BBBBBB", "DDDDDD", "EEEEEE"];
    let i = 0;
    const inserted: string[] = [];
    const codes = await fillWithUniqueCodes(
      3,
      async (batch) => {
        const ok = batch.filter((c) => !existing.has(c));
        ok.forEach((c) => existing.add(c));
        inserted.push(...ok);
        return ok;
      },
      () => seq[i++]!,
    );
    expect(codes.sort()).toEqual(["CCCCCC", "DDDDDD", "EEEEEE"]);
    expect(new Set(inserted).size).toBe(3);
  });

  it("falla en vez de crear un lote incompleto", async () => {
    await expect(fillWithUniqueCodes(2, async () => [], () => "AAAAAA", 2)).rejects.toThrow();
  });

  it("valida la cantidad", () => {
    expect(createBatchSchema.safeParse({ name: "x", quantity: "0" }).success).toBe(false);
    expect(createBatchSchema.safeParse({ name: "x", quantity: "1001" }).success).toBe(false);
    expect(createBatchSchema.parse({ name: " Lote 1 ", quantity: "50" })).toEqual({ name: "Lote 1", quantity: 50 });
  });

  it("exporta una URL por línea", () => {
    expect(toPlainText(["AB3K9Z", "CD4M7P"])).toBe("https://revutags.com/t/AB3K9Z\nhttps://revutags.com/t/CD4M7P\n");
  });

  it("CSV con comillas y sin inyección de fórmulas", () => {
    const csv = toCsv([{ code: "AB3K9Z", status: "active", label: '=HYPERLINK("x")', businessName: 'Bar "Pepe"' }]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"Bar ""Pepe"""');
    expect(csv.startsWith("code,url,status,label,business\r\n")).toBe(true);
  });
});

describe("asignación", () => {
  const base = { code: "ab3k9z", business: { kind: "existing", id: "3f6c1b2e-8a4d-4c1e-9b7a-2d5e6f7a8b9c" } };

  it("google_review descarta cualquier URL", () => {
    const r = assignTagSchema.parse({ ...base, destinationType: "google_review", destinationUrl: "https://x.com" });
    expect(r).toMatchObject({ code: "AB3K9Z", destinationUrl: null, label: null });
  });

  it("custom_url exige https externo", () => {
    expect(assignTagSchema.safeParse({ ...base, destinationType: "custom_url" }).success).toBe(false);
    expect(assignTagSchema.safeParse({ ...base, destinationType: "custom_url", destinationUrl: "http://x.com" }).success).toBe(false);
    expect(assignTagSchema.parse({ ...base, destinationType: "custom_url", destinationUrl: "https://x.com" }).destinationUrl).toBe("https://x.com/");
  });

  it("una ficha de Google nueva necesita place_id válido", () => {
    expect(assignTagSchema.safeParse({ ...base, business: { kind: "place", placeId: "x", name: "Bar" } }).success).toBe(false);
    expect(assignTagSchema.safeParse({ ...base, business: { kind: "place", placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4", name: "Bar" } }).success).toBe(true);
  });

  it("slug a partir del nombre", () => {
    expect(slugify("L'Escora - Restaurant")).toBe("l-escora-restaurant");
    expect(slugify("Àmat bellesa i wellness")).toBe("amat-bellesa-i-wellness");
    expect(slugify("1982 Birres & Burgers")).toBe("1982-birres-burgers");
  });

  it("el historial guarda solo lo que cambia", () => {
    const before = { businessId: "a", status: "active", destinationType: "google_review", destinationUrl: null, label: "Barra" } as const;
    expect(diff(before, { ...before, businessId: "b", label: "Mesa 1" })).toEqual({
      before: { businessId: "a", label: "Barra" },
      after: { businessId: "b", label: "Mesa 1" },
    });
  });
});
