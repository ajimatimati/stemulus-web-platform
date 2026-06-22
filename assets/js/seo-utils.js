/**
 * SEO Utilities - Auto-generates and injects canonical URLs and hreflang tags
 * Prevents duplicate content issues and signals language/region to search engines
 */
const SEOUtils = (function() {
    const BASE_URL = 'https://stemuluskidstech.com';
    
    function getCanonicalPath() {
        let path = window.location.pathname;
        
        // Normalize path: lowercase and handle index.html variations
        path = path.toLowerCase();
        
        // Handle root and index.html
        if (path === '/' || path === '/index.html') {
            return '/';
        }
        
        return path;
    }
    
    function injectCanonical() {
        const canonicalPath = getCanonicalPath();
        const canonicalUrl = BASE_URL + canonicalPath;
        
        // Check if canonical already exists
        if (document.querySelector('link[rel="canonical"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonicalUrl;
        document.head.appendChild(link);
    }
    
    function injectHreflang() {
        const canonicalPath = getCanonicalPath();
        const canonicalUrl = BASE_URL + canonicalPath;
        
        // Check if hreflang already exists
        if (document.querySelector('link[hreflang]')) {
            return;
        }
        
        // Add English hreflang
        const enLink = document.createElement('link');
        enLink.rel = 'alternate';
        enLink.hreflang = 'en';
        enLink.href = canonicalUrl;
        document.head.appendChild(enLink);
        
        // Add x-default for international users
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = canonicalUrl;
        document.head.appendChild(defaultLink);
    }
    
    return {
        init: function() {
            injectCanonical();
            injectHreflang();
        }
    };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', SEOUtils.init);
