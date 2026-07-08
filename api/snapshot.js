// Snapshot diario de reseñas y puntuación de cada negocio via Google Places API.
// Se ejecuta con el cron de Vercel (ver vercel.json) o manualmente:
//   GET /api/snapshot?secret=SNAPSHOT_SECRET
// Guarda una fila por negocio en Supabase (revu_review_stats).

const SUPABASE_URL = "https://mqlfptujypzofidvmjnb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGZwdHVqeXB6b2ZpZHZtam5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI1NjksImV4cCI6MjA4NTc4ODU2OX0.mJvjuxTga1xx_TfwGnm0M9QfLFMLikjSP9Fw8DUBOD4";

// Un negocio por Place ID (el slug principal, sin alias)
const BUSINESSES = {
    "birres":      "ChIzEbxIjbykEjjDI5QKJ3q6",
    "b&b":         "ChIJMxG8Sl28pBIROMMjlAonero",
    "samalica":    "ChIJT8YYYzwWuxIRk-0qz6QTl2g",
    "palomera":    "ChIJrad7jzwWuxIR_0fyOwq4auE",
    "caseta":      "ChIJ_1fV3zUXuxIRd9BPxXWAH08",
    "amura":       "ChIJe-lG9RwWuxIRLsMaxN_IH00",
    "escora":      "ChIJ3UQ5zBcXuxIRuVC_GuAKJjk",
    "hivernacle":  "ChIJZ_TOw0cWuxIRvvmVBoZH8QA",
    "taranna":     "ChIJ5dteDAYXuxIRbt4EJDKWgKg",
    "clandestin":  "ChIJ0ZMC3oS9pBIRU74WtUdNr0E",
    "nvareformes": "ChIJZ6s2A9a-pBIRfkVZfhD4Yso",
    "amat":        "ChIJr-yi2sGvpBIR6Drh1ZzpjDg",
    "latropa":     "ChIJNSGl2du8pBIRL1_f559PmX4"
};

async function fetchPlaceStats(placeId, apiKey) {
    const resp = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount,displayName&key=${apiKey}&languageCode=es`
    );
    if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Places API ${resp.status}: ${body.slice(0, 120)}`);
    }
    return resp.json();
}

export default async function handler(req, res) {
    // Autorización: cron de Vercel o secreto manual
    const isVercelCron = req.headers["x-vercel-cron"] !== undefined;
    const hasSecret = req.query.secret && req.query.secret === process.env.SNAPSHOT_SECRET;
    if (!isVercelCron && !hasSecret) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "GOOGLE_PLACES_KEY not configured" });
    }

    const results = [];
    const rows = [];

    for (const [slug, placeId] of Object.entries(BUSINESSES)) {
        try {
            const data = await fetchPlaceStats(placeId, apiKey);
            const row = {
                place_slug: slug,
                place_id: placeId,
                business_name: data.displayName?.text || slug,
                rating: data.rating ?? null,
                review_count: data.userRatingCount ?? null
            };
            rows.push(row);
            results.push({ slug, ok: true, rating: row.rating, reviews: row.review_count });
        } catch (err) {
            results.push({ slug, ok: false, error: err.message });
        }
    }

    if (rows.length > 0) {
        const insert = await fetch(`${SUPABASE_URL}/rest/v1/revu_review_stats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "return=minimal"
            },
            body: JSON.stringify(rows)
        });
        if (!insert.ok) {
            const body = await insert.text();
            return res.status(500).json({ error: "Supabase insert failed", detail: body.slice(0, 200), results });
        }
    }

    return res.status(200).json({ saved: rows.length, results });
}
