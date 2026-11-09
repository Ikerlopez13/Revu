// Ficha de Google a partir de un enlace de Google Maps, sin API key.
//
// El place_id "ChIJ…" es un protobuf en base64 con el "feature id" de la ficha
// (dos enteros de 64 bits), el mismo que aparece en los enlaces de Maps como
// "0x12a4bcd625f86b3f:0x54c3068e032f1751". Así que basta con leerlo del enlace.

export type MapsPlace = { placeId: string; name: string | null };

const FTID = /(0x[0-9a-f]{1,16}):(0x[0-9a-f]{1,16})/i;
const PLACE_ID = /(?:placeid|place_id|query_place_id)[=:](ChIJ[\w-]{20,})/;

// Solo se siguen redirecciones de los acortadores de Google (nada más se descarga).
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co", "g.page"]);
const GOOGLE_HOST = /(^|\.)google\.[a-z.]{2,6}$/;

export function looksLikeMapsLink(input: string): boolean {
  return /^https?:\/\//i.test(input.trim()) || /^(maps\.app\.goo\.gl|goo\.gl|g\.page)\//i.test(input.trim());
}

/** "0x…:0x…" → "ChIJ…" (el formato que usa writereview?placeid=). */
export function placeIdFromFtid(ftid: string): string | null {
  const m = FTID.exec(ftid);
  if (!m) return null;
  const buf = Buffer.alloc(21);
  buf.set([0x0a, 0x12, 0x09], 0);
  buf.writeBigUInt64LE(BigInt(m[1]!), 3);
  buf[11] = 0x11;
  buf.writeBigUInt64LE(BigInt(m[2]!), 12);
  return buf.subarray(0, 20).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function nameFrom(url: string): string | null {
  const decoded = safeDecode(url);
  const place = /\/maps\/place\/([^/@?]+)/.exec(decoded)?.[1];
  const q = /[?&]q=([^&]+)/.exec(decoded)?.[1];
  const raw = place ?? q;
  if (!raw) return null;
  // "Kolchonia+Meridiana,+Av.+Meridiana…" → "Kolchonia Meridiana"
  const name = raw.replace(/\+/g, " ").split(",")[0]!.trim();
  return name && !/^-?\d/.test(name) ? name.slice(0, 120) : null;
}

/** Lee la ficha de una URL ya expandida (o de varias, p. ej. la cadena de redirecciones). */
export function parseMapsUrls(urls: string[]): MapsPlace | null {
  let placeId: string | null = null;
  let name: string | null = null;
  for (const url of urls) {
    const decoded = safeDecode(safeDecode(url));
    placeId ??= PLACE_ID.exec(decoded)?.[1] ?? null;
    if (!placeId) {
      const ftid = FTID.exec(decoded);
      if (ftid) placeId = placeIdFromFtid(ftid[0]);
    }
    name ??= nameFrom(url);
  }
  return placeId ? { placeId, name } : null;
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Expande un enlace corto (maps.app.goo.gl, g.page…) y saca la ficha. */
export async function resolveMapsLink(input: string, fetchImpl: Fetch = fetch): Promise<MapsPlace | null> {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const chain: string[] = [];
  for (let hop = 0; hop < 6; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      break;
    }
    const isShort = SHORT_HOSTS.has(parsed.hostname);
    if (!isShort && !GOOGLE_HOST.test(parsed.hostname)) break;
    chain.push(url);
    if (!isShort) break;
    if (parsed.protocol !== "https:") break;
    const res = await fetchImpl(parsed.href, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    const next = res.headers.get("location");
    if (!next) break;
    const nextUrl = new URL(next, parsed).href;
    const host = new URL(nextUrl).hostname;
    // Fuera de Google no se sigue ni se lee.
    if (!SHORT_HOSTS.has(host) && !GOOGLE_HOST.test(host)) break;
    url = nextUrl;
  }
  return parseMapsUrls(chain);
}
