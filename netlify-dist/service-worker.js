/* REVALIDDA Simulator Service Worker — revalida-v1.0.0 */
const CACHE_VERSION = "revalida-activity-v1";
const CORE_ASSETS = ["./", "./index.html", "./404.html", "./manifest.webmanifest", "./css/style.css", "./js/questions.js", "./js/utils.js", "./js/storage.js", "./js/score.js", "./js/question-repository.js", "./js/eo-repository.js", "./js/resolver.js", "./js/simulator.js", "./js/review.js", "./js/app.js", "./data/eo-index.json", "./data/references.json", "./data/eo-inventory.json"];

CORE_ASSETS.push('./css/areas.css', './js/question-classification.js', './js/area-repository.js', './js/areas.js', './js/rapid.js');
CORE_ASSETS.push('./js/questions-quinzena-01.js','./assets/quinzena-01/tabela-64.png','./assets/quinzena-01/tabela-77.png');
CORE_ASSETS.push('./css/statistics.css', './js/statistics.js');
CORE_ASSETS.push('./js/site-activity.js');
CORE_ASSETS.push('./js/results-transfer.js');
CORE_ASSETS.push('./js/cloud-config.js','./js/cloud-sync.js','./vendor/supabase-2.117.2.js');
CORE_ASSETS.push('./css/study-buttons.css');
CORE_ASSETS.push('./css/quiz-clock.css','./js/quiz-clock.js');
CORE_ASSETS.push('./css/mobile-app.css','./assets/brain-icon-192.png','./assets/brain-icon-512.png','./assets/brain-apple-touch-icon.png');
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML: network-first
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // data/eo JSON + shell: cache-first with network update
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetcher = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetcher;
    })
  );
});
