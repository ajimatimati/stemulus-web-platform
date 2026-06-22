const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let filepath = path.join(dir, file);
  let html = fs.readFileSync(filepath, 'utf-8');
  let originalHtml = html;

  // Replace all <link rel="icon"...> tags with the proper logo.png path
  // First, let's remove existing favicon tags to avoid duplicates
  html = html.replace(/<link\s+rel="icon"[^>]*>\s*/gi, '');
  
  // Also remove apple-touch-icon if it exists so we can standardize
  html = html.replace(/<link\s+rel="apple-touch-icon"[^>]*>\s*/gi, '');

  // Now inject the standard high-quality favicon linking to logo.png just before </head>
  const faviconTags = `
    <!-- Standard Favicon -->
    <link rel="icon" type="image/png" href="logo.png">
    <link rel="apple-touch-icon" href="logo.png">
`;

  html = html.replace(/<\/head>/i, faviconTags + '</head>');

  if (html !== originalHtml) {
    fs.writeFileSync(filepath, html, 'utf-8');
    console.log('Injected premium logo favicon in:', file);
  }
});
