const CACHE = "sbdg-offline-v1";

const names = [];
for (let n = 1; n <= 5; n += 1) {
  ["a", "b"].forEach(function (side) {
    ["QUE", "NTE", "ANS", "REP"].forEach(function (kind) {
      names.push("Q" + n + side + " " + kind + ".PNG");
    });
  });
}

function asset(path) {
  return new URL(path, self.location).href;
}

const urls = [
  asset("./"),
  asset("index.html"),
  asset("manifest.webmanifest"),
  asset("icon-180.png"),
  asset("icon-512.png")
].concat(names.map(function (name) {
  return asset("QuestionAndAnswer/" + encodeURIComponent(name));
}));

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(urls);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      const update = fetch(event.request).then(function (response) {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match(asset("index.html"));
        return cached;
      });
      return cached || update;
    })
  );
});
