import { beforeEach, describe, expect, it, vi } from "vitest";

// Todo lo que toca BD o Google, mockeado: aquí solo se comprueba la puerta de entrada.
const services = vi.hoisted(() => ({
  assignTag: vi.fn(),
  updateDestination: vi.fn(),
  setTagStatus: vi.fn(),
  relabelTag: vi.fn(),
  unassignTag: vi.fn(),
  createBatch: vi.fn(),
  createBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  setBusinessArchived: vi.fn(),
  searchBusinesses: vi.fn(),
  searchPlaces: vi.fn(),
}));
const session = vi.hoisted(() => ({ requireAdmin: vi.fn() }));

vi.mock("@/lib/auth/session", () => session);
vi.mock("@/lib/admin/tags", () => ({
  assignTag: services.assignTag,
  updateDestination: services.updateDestination,
  setTagStatus: services.setTagStatus,
  relabelTag: services.relabelTag,
  unassignTag: services.unassignTag,
}));
vi.mock("@/lib/admin/batches", () => ({ createBatch: services.createBatch }));
vi.mock("@/lib/admin/businesses", () => ({
  createBusiness: services.createBusiness,
  updateBusiness: services.updateBusiness,
  setBusinessArchived: services.setBusinessArchived,
}));
vi.mock("@/lib/db/queries/admin", () => ({ searchBusinesses: services.searchBusinesses }));
vi.mock("@/lib/places", () => ({ searchPlaces: services.searchPlaces }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const actions = await import("@/app/admin/actions");
const UUID = "3f6c1b2e-8a4d-4c1e-9b7a-2d5e6f7a8b9c";

// Una entrada válida por acción: así la prueba demuestra que lo que frena es la sesión.
const VALID: Record<string, unknown> = {
  assignTagAction: { code: "AB3K9Z", business: { kind: "existing", id: UUID }, destinationType: "google_review" },
  updateDestinationAction: { code: "AB3K9Z", destinationType: "google_review" },
  setTagStatusAction: { code: "AB3K9Z", status: "disabled" },
  relabelTagAction: { code: "AB3K9Z", label: "Barra" },
  unassignTagAction: { code: "AB3K9Z" },
  searchBusinessAction: "birres",
  createBatchAction: { name: "Lote", quantity: 5 },
  createBusinessAction: { name: "Bar" },
  updateBusinessAction: { id: UUID, name: "Bar" },
  archiveBusinessAction: { id: UUID, archived: "true" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("server actions del panel", () => {
  it("todas las acciones exportadas están cubiertas por este test", () => {
    expect(Object.keys(actions).sort()).toEqual(Object.keys(VALID).sort());
  });

  it.each(Object.keys(VALID))("%s rechaza sin sesión de admin y no ejecuta nada", async (name) => {
    session.requireAdmin.mockRejectedValue(new Error("no session"));
    const fn = (actions as unknown as Record<string, (raw: unknown) => Promise<{ ok: boolean; error?: string }>>)[name]!;
    const result = await fn(VALID[name]);
    expect(result).toEqual({ ok: false, error: "No autorizado" });
    for (const s of Object.values(services)) expect(s).not.toHaveBeenCalled();
  });

  it("con sesión, valida con Zod antes de llamar al servicio", async () => {
    session.requireAdmin.mockResolvedValue("iker@example.com");
    const r = await actions.assignTagAction({ code: "0OOO", business: { kind: "existing", id: "x" } });
    expect(r.ok).toBe(false);
    expect(services.assignTag).not.toHaveBeenCalled();
  });

  it("rechaza una URL personalizada insegura", async () => {
    session.requireAdmin.mockResolvedValue("iker@example.com");
    const r = await actions.updateDestinationAction({ code: "AB3K9Z", destinationType: "custom_url", destinationUrl: "javascript:alert(1)" });
    expect(r).toMatchObject({ ok: false, fieldErrors: { destinationUrl: expect.any(String) } });
    expect(services.updateDestination).not.toHaveBeenCalled();
  });

  it("con sesión y datos válidos, llama al servicio con el email del admin", async () => {
    session.requireAdmin.mockResolvedValue("iker@example.com");
    services.updateDestination.mockResolvedValue({ code: "AB3K9Z", cacheWarning: false });
    const r = await actions.updateDestinationAction({ code: "ab3k9z", destinationType: "custom_url", destinationUrl: "https://example.com" });
    expect(r.ok).toBe(true);
    expect(services.updateDestination).toHaveBeenCalledWith("iker@example.com", {
      code: "AB3K9Z",
      destinationType: "custom_url",
      destinationUrl: "https://example.com/",
    });
  });

  it("no filtra errores internos al cliente", async () => {
    session.requireAdmin.mockResolvedValue("iker@example.com");
    services.relabelTag.mockRejectedValue(new Error("connection refused at 10.0.0.1"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await actions.relabelTagAction({ code: "AB3K9Z", label: "x" });
    expect(r).toEqual({ ok: false, error: "Algo ha fallado. Inténtalo de nuevo." });
  });
});
