// Service Worker v6: Network-first for critical files
const CACHE = 'rt-translator-v6';

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
  console.log('[SW] Installing v6');
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v6');
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
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
