const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://stemuluskidstech.com';
const EXCLUDE_FILES = ['404.html', 'FP.html', 'loader-logo.png', 'Privacy-policy.html', 'hall-of-fame.html'];
const PRIORITY_MAP = {
    'Index.html': '1.0',
    'programs.html': '0.9',
    'why-stemulus.html': '0.8',
    'Blog.html': '0.7',
    'Contact.html': '0.7',
};

function generateSitemap() {
    const files = fs.readdirSync('./');
    const htmlFiles = files.filter(file => file.endsWith('.html') && !EXCLUDE_FILES.includes(file));
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    htmlFiles.forEach(file => {
        const stats = fs.statSync(file);
        const lastMod = stats.mtime.toISOString().split('T')[0];
        const url = file === 'Index.html' ? DOMAIN + '/' : `${DOMAIN}/${file}`;
        const priority = PRIORITY_MAP[file] || '0.5';
        
        xml += '  <url>\n';
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    fs.writeFileSync('sitemap.xml', xml);
    console.log('✅ sitemap.xml generated successfully!');
}

generateSitemap();
