/**
 * Breadcrumb Schema for STEMulus
 * Automatically generates and injects breadcrumb structured data
 * Helps Google show breadcrumb navigation in search results
 */
const BreadcrumbSchema = (function() {
    
    const baseUrl = 'https://stemulus.com';
    const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'index.html';
    const filename = pathname.split('/').pop();
    
    // Page title mappings
    const pageTitles = {
        'index.html': 'Home',
        'programs.html': 'Programs',
        'why-stemulus.html': 'Why STEMulus?',
        'Enroll.html': 'Enroll',
        'Contact.html': 'Contact',
        'Blog.html': 'Blog',
        'pricing.html': 'Pricing',
        'for-parents.html': 'For Parents',
        'Privacy-policy.html': 'Privacy Policy',
        'scratch-creators.html': 'Scratch Creators',
        'creative-coding.html': 'Creative Coding',
        'python-programming.html': 'Python Programming',
        'web-wizards.html': 'Web Wizards',
        'arduino-robotics.html': 'Arduino Robotics',
        'junior-robotics.html': 'Junior Robotics',
        'ai-machine-learning.html': 'AI & Machine Learning',
        'fullstack-web-dev.html': 'Full-Stack Web Dev',
        'digital-art.html': 'Digital Art',
        'join-as-tutor.html': 'Join as Tutor',
        'become-a-mentor.html': 'Become a Mentor',
        '404.html': 'Page Not Found'
    };
    
    // Program pages that should show: Home > Programs > [Program Name]
    const programPages = [
        'scratch-creators.html',
        'creative-coding.html',
        'python-programming.html',
        'web-wizards.html',
        'arduino-robotics.html',
        'junior-robotics.html',
        'ai-machine-learning.html',
        'fullstack-web-dev.html',
        'digital-art.html'
    ];
    
    function generateBreadcrumbs() {
        const items = [
            { name: 'Home', url: baseUrl + '/' }
        ];
        
        // Skip breadcrumb for homepage
        if (filename === 'index.html' || filename === '') {
            return null;
        }
        
        // Add Programs parent for program pages
        if (programPages.includes(filename)) {
            items.push({
                name: 'Programs',
                url: baseUrl + '/programs.html'
            });
        }
        
        // Add current page
        const currentTitle = pageTitles[filename] || filename.replace('.html', '').replace(/-/g, ' ');
        items.push({
            name: currentTitle,
            url: baseUrl + '/' + pathname
        });
        
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        };
    }
    
    function inject() {
        const schema = generateBreadcrumbs();
        if (!schema) return;
        
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
        }
    };
})();

// Initialize
BreadcrumbSchema.init();
console.log('SEO: Breadcrumb schema loaded.');
