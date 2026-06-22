/**
 * STEMulus Speculative Prefetching
 * Prefetches links in the viewport (using IntersectionObserver) or on hover
 * to provide an "instant-load" experience for global users.
 */

const Prefetcher = (function() {
    const prefetched = new Set();

    /**
     * Prefetch a specific URL
     */
    function prefetch(url) {
        if (!url || prefetched.has(url) || !url.startsWith(window.location.origin)) return;
        
        // Don't prefetch the current page
        if (url === window.location.href.split('#')[0]) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        prefetched.add(url);
        // console.log(`[STEMulus] Prefetched: ${url}`);
    }

    /**
     * Observe links in the viewport
     */
    function init() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const url = entry.target.href;
                    prefetch(url);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px' });

        // Select all internal links
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.href;
            if (href.startsWith(window.location.origin) && !href.includes('#')) {
                // 1. Observer strategy (on scroll)
                observer.observe(link);

                // 2. Hover strategy (immediate interest)
                link.addEventListener('mouseenter', () => prefetch(href), { once: true });
                link.addEventListener('touchstart', () => prefetch(href), { once: true });
            }
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', Prefetcher.init);
