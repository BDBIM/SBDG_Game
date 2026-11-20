const CACHE = "sbdg-offline-v4";

const names = [];
for (let n = 1; n <= 5; n += 1) {
  ["a", "b"].forEach(function (side) {
    ["QUE", "ANS", "REP"].forEach(function (kind) {
      names.push("Q" + n + side + " " + kind + ".PNG");
    });
    names.push("Q" + n + side + " QUE_image" + (n === 3 ? "3" : "") + ".png");
  });
}

function asset(path) {
  return new URL(path, self.location).href;
}

const urls = [
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

function store(request, response) {
  if (!response || !response.ok || response.redirected) return response;
  const copy = response.clone();
  caches.open(CACHE).then(function (cache) {
    return cache.put(request, copy);
  }).catch(function () {});
  return response;
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then(function (response) {
        return store(asset("index.html"), response);
      }).catch(function () {
        return caches.match(asset("index.html"));
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const update = fetch(event.request).then(function (response) {
        return store(event.request, response);
      }).catch(function () {
        return cached;
      });
      return cached || update;
    })
  );
});
