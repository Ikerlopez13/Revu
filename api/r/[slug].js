const PLACES = {
    "birres":     "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b":          "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b1":         "ChIzEbxIjbykEjjDI5QKJ3q6",
    "samalica":   "ChJPxhhjPBa7EpPtKs-kE5do",
    "s":          "ChJPxhhjPBa7EpPtKs-kE5do",
    "s1":         "ChJPxhhjPBa7EpPtKs-kE5do",
    "palomera":   "ChKtp3uPPBa7Ev9H8jsKuGrh",
    "p":          "ChKtp3uPPBa7Ev9H8jsKuGrh",
    "p1":         "ChKtp3uPPBa7Ev9H8jsKuGrh",
    "caseta":     "ChL_V9XfNRe7EnfQT8V1gB9P",
    "c":          "ChL_V9XfNRe7EnfQT8V1gB9P",
    "c1":         "ChL_V9XfNRe7EnfQT8V1gB9P",
    "amura":      "ChJ76Ub1HBa7Ei7DGsTfyB9N",
    "a":          "ChJ76Ub1HBa7Ei7DGsTfyB9N",
    "a1":         "ChJ76Ub1HBa7Ei7DGsTfyB9N",
    "escora":     "ChLdRDnMFxe7ErlQvxrgCiY5",
    "e":          "ChLdRDnMFxe7ErlQvxrgCiY5",
    "e1":         "ChLdRDnMFxe7ErlQvxrgCiY5",
    "hivernacle": "ChJn9M7DRxa7Er75lQaGR_EA",
    "h":          "ChJn9M7DRxa7Er75lQaGR_EA",
    "h1":         "ChJn9M7DRxa7Er75lQaGR_EA",
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
    "m":          "ChIJr-yi2sGvpBIR6Drh1ZzpjDg"
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
  const placeId = PLACES[resolvedSlug];

  if (!placeId) {
    return res.status(404).send("Place not found");
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
  return res.redirect(302, reviewUrl);
}
