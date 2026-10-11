/* Root-scope offline shell. Online requests always check the current Pages files. */
const CACHE_NAME = 'revalida-app-startup-v1';
const APP_ROOT = new URL(self.location.pathname.endsWith('/netlify-dist/service-worker.js') ? '../' : './', self.location.href);
const SHELL = new URL('index.html', APP_ROOT).href;
async function fresh(request) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(request, {cache:'no-store', signal:controller.signal});
    if (!response.ok) throw Error('unavailable');
    return response;
  } finally { clearTimeout(timer); }
}
async function installShell() {
  const cache = await caches.open(CACHE_NAME);
  const html = await fresh(SHELL), source = await html.clone().text();
  // Discover the actual versioned entry points instead of a second stale asset list.
  const assets = new Set([new URL('manifest.webmanifest',APP_ROOT).href]);
  const base = new URL('netlify-dist/', APP_ROOT);
  for (const match of source.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const asset = new URL(match[1],base);
    if (asset.origin === APP_ROOT.origin && /\.(?:js|css|png|webmanifest)$/.test(asset.pathname)) assets.add(asset.href);
  }
  // Install only after all entry points are usable; retain the prior worker on failure.
  await Promise.all([...assets].map(async url => { await cache.put(url,await fresh(url)); }));
  await cache.put(SHELL,html);
  await self.skipWaiting();
}
self.addEventListener('install',event => event.waitUntil(installShell()));
self.addEventListener('activate',event => event.waitUntil((async () => {
  // Retain older offline media while another tab may still be studying.
  // Never touch browser profile, study results or another app's caches.
  await self.clients.claim();
})()));
self.addEventListener('fetch',event => {
  const request=event.request, url=new URL(request.url);
  if (request.method !== 'GET' || url.origin !== APP_ROOT.origin || !url.pathname.startsWith(APP_ROOT.pathname) || url.pathname.includes('/api/')) return;
  const navigate=request.mode === 'navigate';
  if (!navigate && !/\.(?:html|js|css|json|png|jpg|jpeg|webp|svg|webmanifest)$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache=await caches.open(CACHE_NAME);
    try {
      const response=await fresh(request);
      await cache.put(request,response.clone());
      // All root query variants share the offline entry point.
      if (navigate && (url.pathname === APP_ROOT.pathname || url.pathname === new URL(SHELL).pathname)) await cache.put(SHELL,response.clone());
      return response;
    } catch (_) {
      let saved=await cache.match(request) || await cache.match(request,{ignoreSearch:true});
      if (!saved && !navigate) {
        for (const name of await caches.keys()) {
          if (!name.startsWith('revalida-') || name === CACHE_NAME) continue;
          const previous=await caches.open(name);
          saved=await previous.match(request) || await previous.match(request,{ignoreSearch:true});
          if (saved) break;
        }
      }
      return saved || (navigate ? await cache.match(SHELL) : null) || new Response('Sem conexão. Abra o aplicativo online uma vez para preparar o uso offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
