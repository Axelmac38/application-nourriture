const CACHE = 'repas-stock-v2';
const ASSETS = ['./', './index.html', './styles.css', './recipe.css', './src/main.js', './src/domain.js', './manifest.webmanifest', './assets/icon.svg'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('fetch', (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));
