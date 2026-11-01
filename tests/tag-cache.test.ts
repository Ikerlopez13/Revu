import { describe, expect, it, vi } from "vitest";
import { createCachedLookup, NOT_FOUND, type TagCache } from "@/lib/cache/tag-cache";
import type { ResolvedTag } from "@/lib/redirect/types";

const tag: ResolvedTag = {
  tagId: "t", code: "AB3K9Z", businessId: "b", status: "active",
  destinationType: "google_review", placeId: "ChIJ", destinationUrl: null,
};
const key = { kind: "code", value: "AB3K9Z" } as const;

function memoryCache(initial: Record<string, ResolvedTag | typeof NOT_FOUND> = {}) {
  const store = new Map(Object.entries(initial));
  const cache: TagCache = {
    get: vi.fn(async (k) => store.get(`${k.kind}:${k.value}`) ?? null),
    set: vi.fn(async (k, v) => void store.set(`${k.kind}:${k.value}`, v)),
  };
  return { cache, store };
}

describe("caché de resolución", () => {
  it("si está en Redis no va a Postgres", async () => {
    const { cache } = memoryCache({ "code:AB3K9Z": tag });
    const load = vi.fn();
    expect(await createCachedLookup(cache, load)(key)).toEqual(tag);
    expect(load).not.toHaveBeenCalled();
  });

  it("si no está, va a Postgres y puebla la caché", async () => {
    const { cache, store } = memoryCache();
    const bg: Promise<unknown>[] = [];
    const lookup = createCachedLookup(cache, async () => tag, (p) => void bg.push(p));
    expect(await lookup(key)).toEqual(tag);
    await Promise.all(bg);
    expect(store.get("code:AB3K9Z")).toEqual(tag);
  });

  it("cachea también los códigos inexistentes", async () => {
    const { cache, store } = memoryCache();
    const bg: Promise<unknown>[] = [];
    await createCachedLookup(cache, async () => null, (p) => void bg.push(p))(key);
    await Promise.all(bg);
    expect(store.get("code:AB3K9Z")).toBe(NOT_FOUND);
    const load = vi.fn();
    expect(await createCachedLookup(cache, load)(key)).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("si Redis falla, resuelve igualmente contra Postgres", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache: TagCache = { get: async () => Promise.reject(new Error("down")), set: async () => Promise.reject(new Error("down")) };
    const bg: Promise<unknown>[] = [];
    expect(await createCachedLookup(cache, async () => tag, (p) => void bg.push(p))(key)).toEqual(tag);
    await Promise.all(bg);
    warn.mockRestore();
  });

  it("sin Redis configurado funciona contra Postgres", async () => {
    expect(await createCachedLookup(null, async () => tag)(key)).toEqual(tag);
  });
});
