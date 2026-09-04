/**
 * STEMulus Service Worker
 * Enables offline access and faster repeat visits
 */

const CACHE_NAME = 'stemulus-v2';
const OFFLINE_URL = '/404.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/programs.html',
    '/style.css',
    '/logo.png',
    '/favicon.png',
    '/assets/js/main.js',
    '/assets/js/scroll-reveal.js',
    OFFLINE_URL
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    // console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // console.log('[SW] Precaching critical assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Force activation without waiting
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    // console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            // console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    event.waitUntil(updateCache(event.request));
                    return cachedResponse;
                }
                
                // Not in cache - fetch from network
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // Network failed and not in cache
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

// Fetch and add to cache
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response);
        }
    } catch (error) {
        // Network failed, cache stays as is
        console.log('[SW] Background update failed:', error);
    }
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// console.log('[SW] Service Worker loaded');
