// يخلي التطبيق يشتغل بدون إنترنت: يعرض آخر نسخة محفوظة ويحدّثها بالخلفية
const CACHE = "harira-v1";
const CORE = ["./", "index.html", "app.js", "foods.js", "manifest.json", "icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const mine = u.origin === location.origin;
  const fonts = u.host.endsWith("googleapis.com") || u.host.endsWith("gstatic.com");
  if (!mine && !fonts) return;
  // الشبكة أولاً لملفات التطبيق حتى توصل التحديثات فوراً، والمحفوظ إذا ما في نت
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match("index.html")))
  );
});
