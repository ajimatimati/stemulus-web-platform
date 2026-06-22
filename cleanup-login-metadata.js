const fs = require('fs');
const path = require('path');
const dir = __dirname;

const filesToClean = ['sitemap.xml', 'robots.txt', 'seo-update.js'];

filesToClean.forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf-8');
        let origContent = content;
        
        // Remove lines with login.html
        if (file === 'sitemap.xml') {
            content = content.replace(/<url>\s*<loc>https:\/\/stemuluskidstech\.com\/login\.html<\/loc>\s*<lastmod>[^<]*<\/lastmod>\s*<changefreq>[^<]*<\/changefreq>\s*<priority>[^<]*<\/priority>\s*<\/url>/gi, '');
        } else if (file === 'robots.txt') {
            content = content.replace(/Disallow: \/login\.html\n?/gi, '');
        } else if (file === 'seo-update.js') {
            // Remove the whole block for login.html
            content = content.replace(/\s*'login\.html':\s*{[^}]*},\n?/gi, '');
        }

        if (content !== origContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log('Cleaned up references in:', file);
        }
    }
});
