const PLACES = {
    "birres":     "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b":          "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b1":         "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b&b":        "ChIJMxG8Sl28pBIROMMjlAonero",
    "samalica":   "ChIJT8YYYzwWuxIRk-0qz6QTl2g",
    "s":          "ChIJT8YYYzwWuxIRk-0qz6QTl2g",
    "s1":         "ChIJT8YYYzwWuxIRk-0qz6QTl2g",
    "palomera":   "ChIJrad7jzwWuxIR_0fyOwq4auE",
    "p":          "ChIJrad7jzwWuxIR_0fyOwq4auE",
    "p1":         "ChIJrad7jzwWuxIR_0fyOwq4auE",
    "caseta":     "ChIJ_1fV3zUXuxIRd9BPxXWAH08",
    "c":          "ChIJ_1fV3zUXuxIRd9BPxXWAH08",
    "c1":         "ChIJ_1fV3zUXuxIRd9BPxXWAH08",
    "amura":      "ChIJe-lG9RwWuxIRLsMaxN_IH00",
    "a":          "ChIJr-yi2sGVpBIR6Drh1ZzpjDg",
    "a1":         "ChIJe-lG9RwWuxIRLsMaxN_IH00",
    "ab":         "ChIJe-lG9RwWuxIRLsMaxN_IH00",
    "escora":     "ChIJ3UQ5zBcXuxIRuVC_GuAKJjk",
    "e":          "ChIJ3UQ5zBcXuxIRuVC_GuAKJjk",
    "e1":         "ChIJ3UQ5zBcXuxIRuVC_GuAKJjk",
    "hivernacle": "ChIJZ_TOw0cWuxIRvvmVBoZH8QA",
    "h":          "ChIJZ_TOw0cWuxIRvvmVBoZH8QA",
    "h1":         "ChIJZ_TOw0cWuxIRvvmVBoZH8QA",
    "taranna":    "ChIJ5dteDAYXuxIRbt4EJDKWgKg",
    "t":          "ChIJ5dteDAYXuxIRbt4EJDKWgKg",
    "tb1":        "ChIJ5dteDAYXuxIRbt4EJDKWgKg",
    "clandestin": "ChIJ0ZMC3oS9pBIRU74WtUdNr0E",
    "cl":         "ChIJ0ZMC3oS9pBIRU74WtUdNr0E",
    "nvareformes":"ChIJZ6s2A9a-pBIRfkVZfhD4Yso",
    "nva":        "ChIJZ6s2A9a-pBIRfkVZfhD4Yso",
    "n":          "ChIJZ6s2A9a-pBIRfkVZfhD4Yso",
    "n1":         "ChIJZ6s2A9a-pBIRfkVZfhD4Yso",
    "amat":       "ChIJr-yi2sGvpBIR6Drh1ZzpjDg",
    "bellesa":    "ChIJr-yi2sGvpBIR6Drh1ZzpjDg",
    "m":          "ChIJr-yi2sGvpBIR6Drh1ZzpjDg",
    "red":        "https://tryredcarpet.com",
    "im10":       "https://g.page/r/CajoDPj7oDtwEBE/review"
};

// Load shortlink mappings (code -> place slug)
import { promises as fs } from "fs";
import path from "path";

const SHORTLINKS_PATH = path.join(process.cwd(), "data", "shortlinks.json");
async function loadShortlinks() {
  try {
    const raw = await fs.readFile(SHORTLINKS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(SHORTLINKS_PATH, JSON.stringify({}), "utf8");
    return {};
  }
}

export default async function handler(req, res) {
  // Resolve slug or shortcode
  const incoming = req.query.slug || req.query[Object.keys(req.query)[0]];
  const shortlinks = await loadShortlinks();
  const resolvedSlug = shortlinks[incoming] || incoming; // if shortcode found, get actual slug
  const placeIdOrUrl = PLACES[resolvedSlug];

  if (!placeIdOrUrl) {
    return res.status(404).send("Place not found");
  }

  // Support full URLs
  if (placeIdOrUrl.startsWith("http")) {
    return res.redirect(302, placeIdOrUrl);
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeIdOrUrl}`;
  return res.redirect(302, reviewUrl);
}
