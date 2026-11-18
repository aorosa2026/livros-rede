/* Bibliotecas da Rede — service worker
 *
 * Guarda no telemóvel SÓ a "casca" pública da app (a página e os ícones,
 * os mesmos ficheiros que estão no GitHub). NUNCA guarda dados:
 *   - pedidos a outros sites (Google, Apps Script, capas…) passam direto, sem tocar aqui;
 *   - só se guardam pedidos GET a ficheiros deste site.
 *
 * Atualizações: a página é sempre pedida à rede primeiro (sem cache do browser);
 * a cópia guardada só é usada sem internet. Ao mudar ficheiros, aumentar VERSAO.
 */
const VERSAO = 'bibliotecas-v1';
const CASCA = ['biblioteca.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // dados e Google: não mexer
  const ehPagina = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (ehPagina) {
    // rede primeiro (sempre a versão mais recente); sem internet, a cópia guardada
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(r => {
          if (r.ok && url.pathname.endsWith('biblioteca.html')) {
            const copia = r.clone();
            caches.open(VERSAO).then(c => c.put('biblioteca.html', copia));
          }
          return r;
        })
        .catch(() => caches.match('biblioteca.html'))
    );
    return;
  }
  // ícones e manifesto: cópia guardada primeiro
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
