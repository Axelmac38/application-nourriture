const CACHE = 'repas-stock-v53';
const ASSETS = ['./', './index.html', './styles.css', './recipe.css', './src/main.js', './src/domain.js', './manifest.webmanifest', './assets/icon.svg'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const freshAsset = request.mode === 'navigate' || request.destination === 'script' || request.destination === 'style';
  if (freshAsset) {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
