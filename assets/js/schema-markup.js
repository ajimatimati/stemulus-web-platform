/**
 * SchemaMarkup - JSON-LD Structured Data Management
 */

const SchemaMarkup = (function() {
    const orgData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "STEMulus",
        "url": "https://stemuluskidstech.com",
        "logo": "https://stemuluskidstech.com/logo.png",
        "sameAs": [
            "https://x.com/STEMulus_Clubs",
            "https://instagram.com/stemulus_clubs",
            "https://www.tiktok.com/@stemulus_clubs"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+2347052466716",
            "contactType": "customer service",
            "areaServed": "NG",
            "availableLanguage": "en"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "150"
        }
    };

    const localBusinessData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "STEMulus Nigeria",
        "image": "https://stemuluskidstech.com/assets/images/hero_coding_girl_futuristic.webp",
        "@id": "https://stemuluskidstech.com",
        "url": "https://stemuluskidstech.com",
        "telephone": "+2347052466716",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Lagos, Nigeria",
            "addressLocality": "Lagos",
            "addressRegion": "Lagos",
            "postalCode": "100001",
            "addressCountry": "NG"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 6.5244,
            "longitude": 3.3792
        }
    };

    function inject(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
    }

    function generateBreadcrumbs() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p && p !== 'index.html' && p !== 'Index.html');
        
        const items = [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://stemuluskidstech.com"
        }];

        parts.forEach((p, i) => {
            const name = p.replace('.html', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            items.push({
                "@type": "ListItem",
                "position": i + 2,
                "name": name,
                "item": `https://stemuluskidstech.com/${p}`
            });
        });

        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items
        };
    }

    function init() {
        // Always inject Organization and LocalBusiness on homepage
        if (window.location.pathname === '/' || window.location.pathname.endsWith('Index.html')) {
            inject(orgData);
            inject(localBusinessData);
        }

        // Always inject Breadcrumbs (Phase 5 Hack)
        inject(generateBreadcrumbs());

        // Inject Page Specific Schema from window.PAGE_SCHEMA
        if (window.PAGE_SCHEMA) {
            if (Array.isArray(window.PAGE_SCHEMA)) {
                window.PAGE_SCHEMA.forEach(inject);
            } else {
                inject(window.PAGE_SCHEMA);
            }
        }
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', SchemaMarkup.init);
