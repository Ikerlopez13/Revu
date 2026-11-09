import { describe, expect, it, vi } from "vitest";
import { adminCreateHref, handleScan, type ScanDeps, type ScanRecord } from "@/lib/redirect/resolve";
import type { LookupKey, ResolvedTag } from "@/lib/redirect/types";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile";

const baseTag: ResolvedTag = {
  tagId: "tag-1",
  code: "AB3K9Z",
  businessId: "biz-1",
  status: "active",
  destinationType: "google_review",
  placeId: "ChIJ_place",
  destinationUrl: null,
};

function setup(tag: ResolvedTag | null, overrides: Partial<ScanDeps> = {}) {
  const scans: ScanRecord[] = [];
  const background: Promise<unknown>[] = [];
  const deps: ScanDeps = {
    lookup: vi.fn(async () => tag),
    rateLimit: vi.fn(async () => true),
    isAdmin: vi.fn(async () => false),
    recordScan: vi.fn(async (s: ScanRecord) => void scans.push(s)),
    background: (p) => void background.push(p),
    whatsappNumber: "34675977794",
    ...overrides,
  };
  return { deps, scans, flush: () => Promise.all(background) };
}

function req(opts: { ua?: string; method?: string; headers?: Record<string, string> } = {}) {
  return new Request("https://revutags.com/t/AB3K9Z", {
    method: opts.method ?? "GET",
    headers: { "user-agent": opts.ua ?? IPHONE, ...opts.headers },
  });
}

const code: LookupKey = { kind: "code", value: "AB3K9Z" };

describe("GET /t/[code]: resolución", () => {
  it("google_review activo → 302 a la ficha de reseña, no-store", async () => {
    const { deps, scans, flush } = setup(baseTag);
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://search.google.com/local/writereview?placeid=ChIJ_place");
    expect(res.headers.get("cache-control")).toBe("no-store");
    await flush();
    expect(scans).toEqual([
      { tagId: "tag-1", businessId: "biz-1", os: "ios", country: null, referer: null, via: "code", outcome: "redirect" },
    ]);
  });

  it("misma URL en iOS y Android", async () => {
    const a = await handleScan(req({ ua: IPHONE }), code, setup(baseTag).deps);
    const b = await handleScan(req({ ua: ANDROID }), code, setup(baseTag).deps);
    expect(a.headers.get("location")).toBe(b.headers.get("location"));
  });

  it("custom_url activo → 302 directo", async () => {
    const { deps } = setup({ ...baseTag, destinationType: "custom_url", destinationUrl: "https://tryredcarpet.com" });
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://tryredcarpet.com/");
  });

  it("custom_url inseguro guardado en BD → no redirige", async () => {
    const { deps } = setup({ ...baseTag, destinationType: "custom_url", destinationUrl: "javascript:alert(1)" });
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("activo sin place_id → página de no activado en vez de enlace roto", async () => {
    const res = await handleScan(req(), code, setup({ ...baseTag, placeId: null }).deps);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("aún no está activado");
  });

  it.each(["unassigned", "disabled"] as const)("%s → página de RevuTags con WhatsApp y se registra", async (status) => {
    const { deps, scans, flush } = setup({ ...baseTag, status, businessId: status === "unassigned" ? null : "biz-1" });
    const res = await handleScan(req({ ua: ANDROID }), code, deps);
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body).toContain("Este tag aún no está activado");
    expect(body).toContain("https://wa.me/34675977794?text=");
    expect(body).toContain("AB3K9Z");
    await flush();
    expect(scans[0]).toMatchObject({ outcome: "inactive", os: "android" });
  });

  it("código inexistente → 404, consulta el límite de fallos y no registra", async () => {
    const { deps, scans, flush } = setup(null);
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(404);
    expect(deps.rateLimit).toHaveBeenCalledWith(expect.any(Request), "miss");
    await flush();
    expect(scans).toHaveLength(0);
  });

  it("slug inexistente → enlace discreto 'Soy un admin' que abre el alta de ese slug", async () => {
    const { deps } = setup(null);
    const body = await (await handleScan(req(), { kind: "alias", value: "0002" }, deps)).text();
    expect(body).toContain('href="/admin/tags?nuevo=0002"');
    expect(body).toContain("Soy un admin");
  });

  it("adminCreateHref: solo rellena slugs válidos y no reservados", () => {
    expect(adminCreateHref({ kind: "alias", value: "mi-bar" })).toBe("/admin/tags?nuevo=mi-bar");
    expect(adminCreateHref({ kind: "alias", value: "admin" })).toBe("/admin/tags");
    expect(adminCreateHref({ kind: "alias", value: "<x>" })).toBe("/admin/tags");
    expect(adminCreateHref(code)).toBe("/admin/tags");
  });

  it("enumeración: superado el límite de fallos → 429", async () => {
    const { deps } = setup(null, { rateLimit: vi.fn(async (_r: Request, kind: "hit" | "miss") => kind === "hit") });
    expect((await handleScan(req(), code, deps)).status).toBe(429);
  });

  it("rate limit general → 429 con Retry-After", async () => {
    const { deps, scans, flush } = setup(baseTag, { rateLimit: vi.fn(async () => false) });
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    await flush();
    expect(scans).toHaveLength(0);
  });

  it("admin con sesión → a la ficha del tag, sin registrar escaneo", async () => {
    const { deps, scans, flush } = setup(baseTag, { isAdmin: vi.fn(async () => true) });
    const res = await handleScan(req(), { kind: "alias", value: "birres" }, deps);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/tags/AB3K9Z");
    await flush();
    expect(scans).toHaveLength(0);
  });

  it("alias legacy → mismo destino, registrado como legacy", async () => {
    const { deps, scans, flush } = setup(baseTag);
    const res = await handleScan(req(), { kind: "alias", value: "birres" }, deps);
    expect(res.status).toBe(302);
    await flush();
    expect(scans[0]?.via).toBe("legacy");
  });

  it("guarda país y solo el host del referer; nunca IP ni user-agent", async () => {
    const { deps, scans, flush } = setup(baseTag);
    await handleScan(
      req({ headers: { "x-vercel-ip-country": "es", referer: "https://www.instagram.com/p/abc?x=1", "x-forwarded-for": "1.2.3.4" } }),
      code,
      deps,
    );
    await flush();
    expect(scans[0]).toMatchObject({ country: "ES", referer: "www.instagram.com" });
    expect(JSON.stringify(scans[0])).not.toMatch(/1\.2\.3\.4|iPhone/);
  });

  it("HEAD no cuenta como escaneo", async () => {
    const { deps, scans, flush } = setup(baseTag);
    await handleScan(req({ method: "HEAD" }), code, deps);
    await flush();
    expect(scans).toHaveLength(0);
  });

  it("un fallo al registrar no rompe la redirección", async () => {
    const { deps, flush } = setup(baseTag, { recordScan: vi.fn(async () => Promise.reject(new Error("db down"))) });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleScan(req(), code, deps);
    expect(res.status).toBe(302);
    await flush();
    spy.mockRestore();
  });

  it("nunca responde 301", async () => {
    const states: (ResolvedTag | null)[] = [
      baseTag,
      { ...baseTag, status: "disabled" },
      { ...baseTag, destinationType: "custom_url", destinationUrl: "https://a.com" },
      null,
    ];
    for (const t of states) expect((await handleScan(req(), code, setup(t).deps)).status).not.toBe(301);
  });
});
