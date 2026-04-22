const PLACES = {
    "birres":     "ChIzEbxIjbykEjjDI5QKJ3q6",
    "samalica":   "ChJPxhhjPBa7EpPtKs-kE5do",
    "palomera":   "ChKtp3uPPBa7Ev9H8jsKuGrh",
    "caseta":     "ChL_V9XfNRe7EnfQT8V1gB9P",
    "amura":      "ChJ76Ub1HBa7Ei7DGsTfyB9N",
    "escora":     "ChLdRDnMFxe7ErlQvxrgCiY5",
    "hivernacle": "ChJn9M7DRxa7Er75lQaGR_EA",
    "taranna":    "ChIJ5dteDAYXuxIRbt4EJDKWgKg"
};

export default function handler(req, res) {
    const { slug } = req.query;
    const placeId = PLACES[slug];

    if (!placeId) {
        return res.status(404).send("Place not found");
    }

    // Simplified: Always redirect to the official Google review URL
    // This allows the OS to handle the app opening naturally and ensures a perfect web view.
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    
    return res.redirect(302, reviewUrl);
}
