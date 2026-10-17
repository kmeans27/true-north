/* ------------------------------------------------------------------
   TRUE NORTH — offline shell (spec M9)

   The whole game is one shell plus charts generated in the browser, so
   a single visit is enough to play offline for good. Navigations go to
   the network first (a new day should win) and fall back to the cached
   shell; hashed assets are cache-first, since their names change when
   they change.
   ------------------------------------------------------------------ */

const CACHE = "truenorth-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function put(request, response) {
  if (response && response.ok && response.type === "basic") {
    caches.open(CACHE).then((cache) => cache.put(request, response));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          put(request, response.clone());
          return response;
        })
        .catch(() =>
          caches
            .match("./index.html")
            .then((hit) => hit || caches.match("./"))
            .then((hit) => hit || Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          put(request, response.clone());
          return response;
        }),
    ),
  );
});
