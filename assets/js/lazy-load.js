/**
 * Lazy Loading Utility
 * Adds native lazy loading to images that are below the fold
 * Improves Core Web Vitals (LCP, FID) by deferring off-screen image loading
 */
const LazyLoadImages = (function() {
    // CSS selectors for above-the-fold images that should NOT be lazy loaded
    const ABOVE_FOLD_SELECTORS = [
        '.nav-logo',
        '.loader-logo',
        '#hero-image',
        '[fetchpriority="high"]',
        '.hero-section img:first-child',
        '[data-no-lazy]'
    ];
    
    function isAboveFold(img) {
        // Check if image matches any above-fold selector
        for (const selector of ABOVE_FOLD_SELECTORS) {
            try {
                if (img.matches(selector) || img.closest(selector)) {
                    return true;
                }
            } catch (e) {
                // Selector might be invalid, skip
            }
        }
        
        // Check if image is in the first 600px of the viewport
        const rect = img.getBoundingClientRect();
        if (rect.top < 600 && rect.top >= 0) {
            return true;
        }
        
        return false;
    }
    
    function applyLazyLoading() {
        const images = document.querySelectorAll('img:not([loading])');
        
        images.forEach(img => {
            // Skip above-fold images
            if (isAboveFold(img)) {
                return;
            }
            
            // Add lazy loading attributes
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    }
    
    return {
        init: function() {
            // Run after a short delay to ensure DOM is fully parsed
            // and images have their initial positions
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(applyLazyLoading, 100);
                });
            } else {
                setTimeout(applyLazyLoading, 100);
            }
        }
    };
})();

// Initialize
LazyLoadImages.init();
