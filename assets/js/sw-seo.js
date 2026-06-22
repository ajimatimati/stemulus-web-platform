const CACHE_NAME = 'stemulus-seo-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/Index.html',
  '/programs.html',
  '/why-stemulus.html',
  '/Blog.html',
  '/contact.html',
  '/style.min.css',
  '/assets/js/main.min.js',
  '/assets/js/meta-manager.min.js',
  '/assets/js/schema-markup.min.js',
  '/assets/js/newsletter.min.js',
  '/assets/js/social-share.min.js',
  '/assets/js/internal-links.min.js',
  '/assets/js/progress-tracker.min.js',
  '/assets/js/performance-monitor.min.js',
  '/assets/js/firebase-config.min.js',
  '/assets/js/cloud-sync.min.js',
  '/assets/js/portal.min.js',
  '/assets/js/social-proof.min.js',
  '/assets/js/portfolio-engine.min.js',
  '/assets/js/urgency.min.js',
  '/assets/data/blogs.json',
  '/assets/data/projects.json',
  '/assets/js/blog-engine.min.js',
  '/assets/js/feedback.min.js',
  '/assets/js/prefetch.min.js',
  '/assets/js/admin-engine.min.js',
  '/assets/js/email-service.min.js',
  '/assets/data/email-templates.json',
  '/favicon.png',
  '/logo.png',
  '/sitemap.xml',
  '/robots.txt'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then(response => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});
