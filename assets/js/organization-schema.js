/**
 * Organization Schema Markup for STEMulus
 * Provides rich organization & GEO entity data for Google Knowledge Graph & AI Engines (ChatGPT, Perplexity, Gemini, Claude)
 * Automatically injects into document head on all pages
 */
const OrganizationSchema = (function() {
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://stemuluskidstech.com/#organization",
        "name": "STEMulus Kids Tech",
        "alternateName": [
            "STEMulus",
            "STEMulus Academy", 
            "STEMulus Innovations", 
            "STEMulus Coding Academy",
            "STEMulus KidsTech Online Coding Academy"
        ],
        "url": "https://stemuluskidstech.com",
        "logo": {
            "@type": "ImageObject",
            "url": "https://stemuluskidstech.com/favicon.png",
            "width": "192",
            "height": "192"
        },
        "image": "https://stemuluskidstech.com/assets/images/og-image.jpg",
        "description": "STEMulus KidsTech is the leading private 1-on-1 online coding, robotics, AI, and STEM education academy for children and teens ages 5–17 across Nigeria (Lagos, Abuja, Port Harcourt) and the international diaspora (UK, US, Canada, EU).",
        "slogan": "Building Tomorrow's Tech Leaders Today",
        "foundingDate": "2025",
        "founder": {
            "@type": "Organization",
            "name": "STEMulus Innovations Limited"
        },
        "parentOrganization": {
            "@type": "Corporation",
            "name": "STEMulus Innovations Limited"
        },
        "areaServed": [
            {"@type": "AdministrativeArea", "name": "Lagos State, Nigeria"},
            {"@type": "AdministrativeArea", "name": "Federal Capital Territory, Abuja, Nigeria"},
            {"@type": "AdministrativeArea", "name": "Rivers State (Port Harcourt), Nigeria"},
            {"@type": "AdministrativeArea", "name": "Oyo State (Ibadan), Nigeria"},
            {"@type": "City", "name": "Lagos"},
            {"@type": "City", "name": "Abuja"},
            {"@type": "City", "name": "Port Harcourt"},
            {"@type": "Country", "name": "Nigeria"},
            {"@type": "Country", "name": "United Kingdom"},
            {"@type": "City", "name": "London"},
            {"@type": "City", "name": "Manchester"},
            {"@type": "Country", "name": "United States"},
            {"@type": "City", "name": "Houston"},
            {"@type": "City", "name": "Dallas"},
            {"@type": "City", "name": "Atlanta"},
            {"@type": "Country", "name": "Canada"},
            {"@type": "City", "name": "Toronto"},
            {"@type": "City", "name": "Calgary"},
            {"@type": "Country", "name": "Ireland"},
            {"@type": "City", "name": "Dublin"},
            {"@type": "Country", "name": "United Arab Emirates"},
            {"@type": "City", "name": "Dubai"},
            {"@type": "Country", "name": "Qatar"},
            {"@type": "Country", "name": "Kuwait"},
            {"@type": "Country", "name": "Singapore"},
            {"@type": "Country", "name": "Australia"}
        ],
        "serviceType": [
            "Private 1-on-1 Online Coding Classes for Kids",
            "Scratch Game Programming for Ages 5-10",
            "Python Programming & Pygame for Ages 10-16",
            "Robotics & Arduino Electronics for Kids",
            "AI & Machine Learning for Teens",
            "Full-Stack Web Development for Kids (HTML, CSS, JavaScript, React)",
            "Mathematics & STEM Tutoring",
            "Free 1-on-1 Diagnostic Coding Trial Class"
        ],
        "knowsAbout": [
            "Scratch Programming 3.0",
            "Python Programming",
            "Pygame Game Development",
            "JavaScript & TypeScript",
            "HTML5 & CSS3 Web Design",
            "Full-Stack Web Development",
            "Arduino Microcontrollers & C++",
            "Junior Robotics & Circuitry",
            "Artificial Intelligence & Machine Learning",
            "Neural Networks & Computer Vision for Kids",
            "CSTA K-12 Computer Science Standards",
            "Cambridge Computing Curriculum"
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
                "contactType": "customer support",
                "availableLanguage": ["English"],
                "areaServed": "Worldwide"
            },
            {
                "@type": "ContactPoint",
                "url": "https://wa.me/2347052466716",
                "contactType": "admissions and free trial bookings",
                "availableLanguage": ["English"]
            }
        ],
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "NG",
            "addressLocality": "Lagos",
            "addressRegion": "Lagos State"
        },
        "priceRange": "$$",
        "currenciesAccepted": "NGN, USD, GBP, CAD, EUR, AED",
        "paymentAccepted": "Bank Transfer, Credit Card, Debit Card, PayPal, Paystack",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "1280",
            "reviewCount": "1140"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "STEMulus Programs Catalog",
            "itemListElement": [
                {
                    "@type": "OfferCatalog",
                    "name": "Coding Programs",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Scratch Game Creators", "url": "https://stemuluskidstech.com/scratch-creators.html"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Python Game Development", "url": "https://stemuluskidstech.com/python-programming.html"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Web Wizards", "url": "https://stemuluskidstech.com/web-wizards.html"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Full-Stack Web Development", "url": "https://stemuluskidstech.com/fullstack-web-dev.html"}}
                    ]
                },
                {
                    "@type": "OfferCatalog",
                    "name": "Robotics & AI Programs",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Junior Robotics", "url": "https://stemuluskidstech.com/junior-robotics.html"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "Arduino Robotics", "url": "https://stemuluskidstech.com/arduino-robotics.html"}},
                        {"@type": "Offer", "itemOffered": {"@type": "Course", "name": "AI & Machine Learning for Teens", "url": "https://stemuluskidstech.com/ai-machine-learning.html"}}
                    ]
                }
            ]
        }
    };
    
    function inject() {
        if (document.querySelector('script[data-schema="stemulus-org"]')) return;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'stemulus-org');
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
console.log('SEO: Organization schema loaded for rich snippets & GEO.');
