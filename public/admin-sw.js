// Service worker del panel. Ámbito /admin/: nunca intercepta /t/{code} ni la web pública.
// Los datos del panel no se cachean (siempre frescos); solo el "shell" estático
// y una página para cuando no hay conexión.
const CACHE = "revu-admin-v1";
const OFFLINE = "/admin-offline.html";
const PRECACHE = [OFFLINE, "/icons/icon-192.png", "/assets/logo.svg", "/assets/logo-dark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: red primero; sin red, página offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Estáticos con hash de Next: caché primero (son inmutables).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
  }
});
