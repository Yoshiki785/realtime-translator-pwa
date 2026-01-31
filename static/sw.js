// Service Worker v7: Network-first for critical files + update banner support
// BUILD_TIME is replaced by sync_public.sh at deploy time
const BUILD_TIME = '__BUILD_TIME__';
const CACHE = `rt-translator-v7-${BUILD_TIME}`;

// 常にネットワークから取得するファイル（最新版を優先）
const NETWORK_FIRST = ['/', '/index.html', '/app.js', '/sw.js', '/firebase-config.js'];

// キャッシュ対象のアセット
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/firebase-config.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v7, build:', BUILD_TIME);
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v7, build:', BUILD_TIME);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message from client (update banner)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received, calling skipWaiting()');
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isNetworkFirst = NETWORK_FIRST.some((path) => url.pathname === path || url.pathname.endsWith(path));

  if (isNetworkFirst) {
    // Network-first: 最新版を取得し、キャッシュを更新
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Cache-first: オフライン対応（画像、CSS等）
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
    );
  }
});
