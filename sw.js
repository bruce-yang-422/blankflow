const CACHE_VERSION = "blankflow-v9";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles/globals.css",
  "./src/main.js",
  "./src/core/blankLines.js",
  "./src/core/chineseSpacing.js",
  "./src/core/characterCount.js",
  "./src/core/statistics.js",
  "./src/core/clipboard.js",
  "./src/core/processText.js",
  "./src/core/history.js",
  "./icons/logo.ico",
  "./icons/favicon-32.png",
  "./icons/pwa-192.png",
  "./icons/pwa-512.png",
  "./icons/pwa-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
