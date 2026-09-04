/**
 * Comprehensive SEO Meta Manager for STEMulus
 * Automatically injects Open Graph, Twitter Cards, and Canonical URLs
 * Include this on all pages for consistent social sharing and SEO
 */
const SEOMetaManager = (function() {
    
    // Get current page info
    const currentUrl = window.location.href;
    const baseUrl = 'https://stemuluskidstech.com';
    const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'index.html';
    
    // Default page metadata (can be overridden by PAGE_META)
    const defaultMeta = {
        siteName: 'STEMulus',
        title: document.title || 'STEMulus - Global Coding Academy for Kids',
        description: document.querySelector('meta[name="description"]')?.content || 
            'STEMulus is a global online STEM education academy offering personalized 1-on-1 coding, robotics, AI, mathematics, and science tutoring for children ages 5-17.',
        image: baseUrl + '/assets/images/stemulus-og-image.png',
        url: baseUrl + '/' + pathname,
        type: 'website',
        twitterHandle: '@STEMulus_Clubs',
        locale: 'en_US'
    };
    
    // Merge with page-specific meta if available
    const meta = Object.assign({}, defaultMeta, window.PAGE_META || {});
    
    // Ensure image URL is absolute
    if (meta.image && !meta.image.startsWith('http')) {
        meta.image = baseUrl + '/' + meta.image.replace(/^\//, '');
    }
    
    // Ensure URL is absolute
    if (meta.url && !meta.url.startsWith('http')) {
        meta.url = baseUrl + '/' + meta.url.replace(/^\//, '');
    }
    
    function createMetaTag(property, content, isName = false) {
        if (!content) return null;
        const meta = document.createElement('meta');
        meta[isName ? 'name' : 'property'] = property;
        meta.content = content;
        return meta;
    }
    
    function createLinkTag(rel, href) {
        if (!href) return null;
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        return link;
    }
    
    function inject() {
        const head = document.head;
        const fragment = document.createDocumentFragment();
        
        // Canonical URL (prevent duplicate content)
        if (!document.querySelector('link[rel="canonical"]')) {
            const canonical = createLinkTag('canonical', meta.url);
            if (canonical) fragment.appendChild(canonical);
        }
        
        // Open Graph Tags (Facebook, LinkedIn, etc.)
        const ogTags = [
            ['og:title', meta.title],
            ['og:description', meta.description],
            ['og:image', meta.image],
            ['og:url', meta.url],
            ['og:type', meta.type],
            ['og:site_name', meta.siteName],
            ['og:locale', meta.locale]
        ];
        
        ogTags.forEach(([property, content]) => {
            if (!document.querySelector(`meta[property="${property}"]`)) {
                const tag = createMetaTag(property, content);
                if (tag) fragment.appendChild(tag);
            }
        });
        
        // Twitter Card Tags
        const twitterTags = [
            ['twitter:card', 'summary_large_image'],
            ['twitter:site', meta.twitterHandle],
            ['twitter:title', meta.title],
            ['twitter:description', meta.description],
            ['twitter:image', meta.image]
        ];
        
        twitterTags.forEach(([name, content]) => {
            if (!document.querySelector(`meta[name="${name}"]`)) {
                const tag = createMetaTag(name, content, true);
                if (tag) fragment.appendChild(tag);
            }
        });
        
        // Additional SEO tags
        if (!document.querySelector('meta[name="author"]')) {
            fragment.appendChild(createMetaTag('author', 'STEMulus Innovations Limited', true));
        }
        
        if (!document.querySelector('meta[name="robots"]') && !pathname.includes('admin') && !pathname.includes('404')) {
            fragment.appendChild(createMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large', true));
        }
        
        // Append all tags
        head.appendChild(fragment);
    }
    
    return {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', inject);
            } else {
                inject();
            }
        },
        getMeta: function() {
            return meta;
        }
    };
})();

// Initialize
SEOMetaManager.init();
console.log('SEO: Open Graph & Canonical tags injected.');
