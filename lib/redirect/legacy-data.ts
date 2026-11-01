// Inventario de los enlaces que ya están grabados en NFCs en producción.
// Lo usan la importación inicial (scripts/legacy) y el modo de emergencia de
// lib/redirect/legacy-fallback.ts. La fuente de verdad es la BD: esto es la foto
// del 31/10/2026.
// Fuente: api/r/[slug].js (PLACES), data/shortlinks.json y public/analytics/index.html.
// Cada alias se importa como un tag propio (puede ser un NFC físico distinto),
// agrupado bajo su negocio.

export type LegacyAlias = string | { alias: string; customUrl: string };

export type LegacyBusiness = {
  slug: string;
  name: string;
  placeId: string | null;
  aliases: LegacyAlias[];
  notes?: string;
};

export const LEGACY_BUSINESSES: LegacyBusiness[] = [
  {
    slug: "birres",
    name: "1982 Birres & Burgers",
    placeId: "ChIzEbxIjbykEjjDI5QKJ3q6",
    aliases: ["birres", "b", "b1", "rev"],
    notes: "REVISAR: el place_id empieza por ChIz (los válidos empiezan por ChIJ).",
  },
  {
    slug: "b&b",
    name: "1982 Birres & Burgers (verificado)",
    placeId: "ChIJMxG8Sl28pBIROMMjlAonero",
    aliases: ["b&b"],
  },
  { slug: "samalica", name: "Restaurant Sa Malica-Can Ton", placeId: "ChIJT8YYYzwWuxIRk-0qz6QTl2g", aliases: ["samalica", "s", "s1", "belleza"] },
  { slug: "palomera", name: "Racó Sa Palomera", placeId: "ChIJrad7jzwWuxIR_0fyOwq4auE", aliases: ["palomera", "p", "p1"] },
  { slug: "caseta", name: "La Caseta Blanes", placeId: "ChIJ_1fV3zUXuxIRd9BPxXWAH08", aliases: ["caseta", "c", "c1"] },
  { slug: "amura", name: "Amura Blanes", placeId: "ChIJe-lG9RwWuxIRLsMaxN_IH00", aliases: ["amura", "a1", "ab"] },
  {
    slug: "amat",
    name: "Àmat bellesa i wellness",
    placeId: "ChIJr-yi2sGvpBIR6Drh1ZzpjDg",
    aliases: [
      "amat",
      "bellesa",
      "m",
      // /a apuntaba a un place_id casi idéntico (GVpBIR en vez de GvpBIR).
      // Se conserva tal cual como URL propia para no cambiar su comportamiento.
      { alias: "a", customUrl: "https://search.google.com/local/writereview?placeid=ChIJr-yi2sGVpBIR6Drh1ZzpjDg" },
    ],
    notes: "REVISAR: el tag /a apunta a un place_id distinto (GVpBIR vs GvpBIR).",
  },
  { slug: "escora", name: "L'Escora - Restaurant", placeId: "ChIJ3UQ5zBcXuxIRuVC_GuAKJjk", aliases: ["escora", "e", "e1"] },
  { slug: "hivernacle", name: "l'hivernacle Restaurant i Copes", placeId: "ChIJZ_TOw0cWuxIRvvmVBoZH8QA", aliases: ["hivernacle", "h", "h1", "wellness"] },
  { slug: "taranna", name: "Taranna", placeId: "ChIJ5dteDAYXuxIRbt4EJDKWgKg", aliases: ["taranna", "t", "tb1"] },
  { slug: "clandestin", name: "Clandestin", placeId: "ChIJ0ZMC3oS9pBIRU74WtUdNr0E", aliases: ["clandestin", "cl"] },
  { slug: "nvareformes", name: "NVA Reformes", placeId: "ChIJZ6s2A9a-pBIRfkVZfhD4Yso", aliases: ["nvareformes", "nva", "n", "n1"] },
  { slug: "latropa", name: "La Tropa", placeId: "ChIJNSGl2du8pBIRL1_f559PmX4", aliases: ["latropa", "tropa", "lt"] },
  { slug: "kolchonia", name: "Kolchonia Meridiana", placeId: "ChIJP2v4Jda8pBIRURcvA44Gw1Q", aliases: ["kolchonia", "k", "k1"] },
  { slug: "red", name: "Try Red Carpet", placeId: null, aliases: [{ alias: "red", customUrl: "https://tryredcarpet.com" }] },
  { slug: "im10", name: "im10", placeId: null, aliases: [{ alias: "im10", customUrl: "https://g.page/r/CajoDPj7oDtwEBE/review" }] },
];
