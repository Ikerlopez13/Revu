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

    const userAgent = req.headers['user-agent'] || '';
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

    // Detect OS
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    if (isAndroid) {
        // Direct intent for Android
        const intentUrl = `intent://search.google.com/local/writereview?placeid=${placeId}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
        return res.redirect(302, intentUrl);
    } else if (isIOS) {
        // Intermediate page for iOS to handle fallback
        const iosScheme = `comgooglemaps://?q=Google&place_id=${placeId}`;
        
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redirecting to Google Maps...</title>
                <style>
                    body { font-family: -apple-system, system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
                    .loader { border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 16px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .content { text-align: center; }
                </style>
            </head>
            <body>
                <div class="content">
                    <div class="loader"></div>
                    <p>Abriendo Google Maps...</p>
                </div>
                <script>
                    // Try to open the app
                    window.location.href = "${iosScheme}";
                    
                    // Fallback to web after 1.5s
                    setTimeout(function() {
                        window.location.href = "${reviewUrl}";
                    }, 1500);
                </script>
            </body>
            </html>
        `);
    } else {
        // Desktop or other
        return res.redirect(302, reviewUrl);
    }
}
