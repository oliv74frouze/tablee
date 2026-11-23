// Tablée — service worker : l'application s'ouvre même avec un réseau faible.
// Les fichiers de l'appli sont pris sur le réseau en priorité (pour avoir toujours la dernière version),
// avec la copie en cache en secours. Les données (Supabase) ne sont jamais mises en cache ici.
const CACHE = 'tablee-v9';
const SHELL = ['./', 'index.html', 'app.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, {cache:'no-cache'}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// Notifications : affichage, puis ouverture de la recette quand on touche la notification.
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch(x){ d = {title:'Tablée', body:e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tablée', {body:d.body || '', icon:'icons/icon-192.png', badge:'icons/badge-96.png', tag:d.tag, data:{url:d.url || './'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href, post = new URL(url).searchParams.get('post');
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(L => {
    const c = L.find(x => x.url.startsWith(self.registration.scope));
    if (c){ if (post) c.postMessage({openPost:post}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
