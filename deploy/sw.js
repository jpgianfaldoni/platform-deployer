const CACHE_NAME = 'platform-deployer-v1';
const BASE_URL = new URL('./', self.location).href;

const shellFiles = [
  '', 'index.html', 'manifest.json', 'css/main.css',
  'js/cidr-utils.js', 'js/configuration.js', 'js/tfvars-generator.js',
  'js/source-loader.js', 'js/terraform-generator.js', 'js/app.js',
  'libs/bootstrap/css/bootstrap.min.css', 'libs/bootstrap/js/bootstrap.bundle.min.js',
  'libs/bootstrap-icons/font/bootstrap-icons.css',
  'libs/bootstrap-icons/font/fonts/bootstrap-icons.woff',
  'libs/bootstrap-icons/font/fonts/bootstrap-icons.woff2',
  'libs/jszip/jszip.min.js', 'icons/favicon.svg', 'icons/icon-192x192.png',
  'fonts/manrope/manrope-latin-wght-normal.woff2',
  'fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2',
  'fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2',
  'fonts/jetbrains-mono/jetbrains-mono-latin-500-normal.woff2'
];

async function terraformSourceUrls() {
  const manifestUrl = new URL('terraform-sources/manifest.json', BASE_URL).href;
  const response = await fetch(manifestUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Source manifest returned ${response.status}`);
  const manifest = await response.json();
  const urls = [manifestUrl];
  manifest.commonFiles.forEach(file => urls.push(new URL(`terraform-sources/${manifest.commit}/${file.path}`, BASE_URL).href));
  Object.entries(manifest.variants).forEach(([id, variant]) => {
    variant.files.forEach(file => urls.push(new URL(`terraform-sources/${manifest.commit}/${id}/${file.path}`, BASE_URL).href));
  });
  return urls;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const urls = shellFiles.map(file => new URL(file, BASE_URL).href);
    try { urls.push(...await terraformSourceUrls()); } catch (error) { console.warn('Terraform sources were not precached', error); }
    await Promise.allSettled(urls.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/terraform-sources/manifest.json')) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (event.request.mode === 'navigate') return caches.match(new URL('index.html', BASE_URL).href);
      return new Response('Offline resource unavailable', { status: 503 });
    }
  })());
});
