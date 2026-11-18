"use strict";

const VERSION_CACHE = "blip-v3";

const FICHIERS_APPLICATION = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION_CACHE)
      .then((cache) => {
        return cache.addAll(FICHIERS_APPLICATION);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomsCaches) => {
        return Promise.all(
          nomsCaches
            .filter((nomCache) => {
              return nomCache !== VERSION_CACHE;
            })
            .map((nomCache) => {
              return caches.delete(nomCache);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((reponseEnCache) => {
        if (reponseEnCache) {
          return reponseEnCache;
        }

        return fetch(event.request);
      })
  );
});
