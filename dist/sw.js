// Replaced by a content hash at build time so each release has its own cache.
const BASE = new URL('./', self.location.href);
const PREFIX = 'hebrew-date-' + BASE.pathname + '-';
const CACHE = PREFIX + 'c7448cde9ca8e40a';
const ASSETS = ['index.html','app.js','style.css','favicon.svg','manifest.webmanifest','icons/logo.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'].map(path=>new URL(path,BASE).href);
self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event=>{
  // Scope the cleanup to this app: sibling GitHub Pages apps share the origin.
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if(event.request.mode==='navigate') {
    // Other GitHub Pages projects can live beneath our root worker scope.
    if(url.pathname!==BASE.pathname && url.pathname!==new URL('index.html',BASE).pathname) return;
    // Keep the HTML and JavaScript from the same release. New workers refresh
    // the whole shell together; the next launch uses the updated cache.
    event.respondWith(caches.match(new URL('index.html',BASE).href,{cacheName:CACHE}).then(cached=>cached||fetch(event.request)));
    return;
  }
  // Only cache the app shell. Downloads and third-party links stay outside it.
  if(ASSETS.includes(url.href)) event.respondWith(caches.match(event.request,{cacheName:CACHE}).then(cached=>cached||fetch(event.request)));
});
