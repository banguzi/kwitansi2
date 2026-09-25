'use strict';

/* =========================================================
   Service Worker — Kwitansi Thermal 58mm
   Strategi: cache-first untuk file aplikasi (app shell),
   dengan fallback ke index.html untuk navigasi saat offline.
   Naikkan CACHE_VERSION setiap kali file di ASSETS berubah
   agar pengguna mendapat versi terbaru.
   ========================================================= */

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'trpwa-cache-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key.startsWith('trpwa-cache-') && key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  // Hanya tangani GET request dari origin yang sama.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Navigasi halaman (mis. reload) -> cache-first, fallback ke index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(function (cached) {
        return cached || fetch(request).catch(function () {
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Aset lain (CSS, JS, manifest, ikon) -> cache-first, lalu simpan hasil network ke cache.
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        // Tidak ada di cache dan tidak ada koneksi: biarkan gagal secara alami.
        return new Response('', { status: 504, statusText: 'Offline dan aset tidak tersedia di cache' });
      });
    })
  );
});
