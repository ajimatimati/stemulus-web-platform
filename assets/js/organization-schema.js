/**
 * Organization Schema Markup for STEMulus
 * Provides rich organization data for Google Knowledge Graph
 * Automatically injects into document head on all pages
 */
const OrganizationSchema = (function() {
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://stemulus.com/#organization",
        "name": "STEMulus",
        "alternateName": ["STEMulus Academy", "STEMulus Innovations", "STEMulus Coding Academy"],
        "url": "https://stemulus.com",
        "logo": {
            "@type": "ImageObject",
            "url": "https://stemulus.com/logo.png",
            "width": "200",
            "height": "200"
        },
        "image": "https://stemulus.com/logo.png",
        "description": "STEMulus is a global online STEM education academy offering personalized 1-on-1 coding, robotics, AI, mathematics, English, and science tutoring for children and teens ages 5-17.",
        "slogan": "Building Tomorrow's Tech Leaders Today",
        "foundingDate": "2025",
        "founder": {
            "@type": "Person",
            "name": "STEMulus Innovations Limited"
        },
        "parentOrganization": {
            "@type": "Corporation",
            "name": "STEMulus Innovations Limited"
        },
        "areaServed": [
            {"@type": "Country", "name": "Nigeria"},
            {"@type": "Country", "name": "United Arab Emirates"},
            {"@type": "Country", "name": "Qatar"},
            {"@type": "Country", "name": "Kuwait"},
            {"@type": "Country", "name": "Singapore"},
            {"@type": "Country", "name": "Turkey"},
            {"@type": "Country", "name": "United States"},
            {"@type": "Country", "name": "United Kingdom"},
            {"@type": "Country", "name": "Canada"},
            {"@type": "Country", "name": "Australia"}
        ],
        "serviceType": [
            "Online Coding Classes for Kids",
            "1-on-1 Virtual Tutoring",
            "STEM Education",
            "Robotics Classes",
            "AI and Machine Learning for Kids",
            "Mathematics Tutoring",
            "English Language Tutoring",
            "Science Tutoring",
            "GCSE Exam Preparation"
        ],
        "knowsAbout": [
            "Scratch Programming",
            "Python Programming",
            "JavaScript",
            "Web Development",
            "Robotics",
            "Arduino",
            "Artificial Intelligence",
            "Machine Learning",
            "Game Development",
            "Mathematics",
            "English Language",
            "Science",
            "GCSE Preparation"
        ],
        "sameAs": [
            "https://x.com/STEMulus_Clubs",
            "https://instagram.com/stemulus_clubs",
            "https://wa.me/2347052466716"
        ],
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+234-705-246-6716",
                "contactType": "customer service",
                "availableLanguage": ["English"],
                "areaServed": "Worldwide"
            },
            {
                "@type": "ContactPoint",
                "url": "https://wa.me/2347052466716",
                "contactType": "sales",
                "availableLanguage": ["English"]
            }
        ],
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "NG",
            "addressLocality": "Global (Online)"
        },
        "priceRange": "$$",
        "currenciesAccepted": "USD, GBP, NGN, AED, QAR, KWD, SGD",
        "paymentAccepted": "Credit Card, Bank Transfer, PayPal",
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "STEMulus Programs",
            "itemListElement": [
                {
                    "@type": "OfferCatalog",
                    "name": "Coding Programs",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Scratch Game Creators"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Python Game Development"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Web Wizards"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Full-Stack Web Development"}}
                    ]
                },
                {
                    "@type": "OfferCatalog",
                    "name": "Robotics & AI Programs",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Arduino Robotics"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Junior Robotics"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "AI & Machine Learning"}}
                    ]
                },
                {
                    "@type": "OfferCatalog",
                    "name": "Academic Programs",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Mathematics Mastery"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "English Language"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Science Explorers"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Triple Science"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "GCSE Past Papers Practice"}}
                    ]
                }
            ]
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "150",
            "reviewCount": "120"
        }
    };
    
    function inject() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }
    
    return {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', inject);
            } else {
                inject();
            }
        },
        getSchema: function() {
            return schema;
        }
    };
})();

// Initialize on load
OrganizationSchema.init();
console.log('SEO: Organization schema loaded for rich snippets.');
