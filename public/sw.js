// Rahbar service worker: offline app shell, sample documents and the OCR engine.
// API calls are never cached (they may carry case facts).
const VERSION = "rahbar-v1";
const SHELL = ["/", "/case", "/offer", "/rules", "/evals", "/icon.svg", "/samples/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API traffic

  const cdn = url.hostname === "cdn.jsdelivr.net" || url.hostname === "unpkg.com";
  const staticAsset = url.origin === location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/samples/") || url.pathname.endsWith(".svg"));

  if (cdn || staticAsset) {
    // cache-first: OCR engine, language data, hashed JS/CSS, sample images
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
    return;
  }
  if (req.mode === "navigate") {
    // network-first for pages, fall back to the cached shell when offline
    e.respondWith(
      fetch(req).then((res) => {
        caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
    );
  }
});
