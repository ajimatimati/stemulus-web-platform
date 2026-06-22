const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexFile, 'utf-8');
let origHtml = html;

// 1. We need to inject the inline style block into the head or update the <style> block 
// But an elegant way is to just add the Tailwind parallax classes directly to the `<section class="stats-section"` element.
// since index.html uses a custom CSS file for that class, we will inject a style block right above it.

const injectionCSS = `
<style>
  /* Injected Parallax for Stats Section */
  #stats-section {
    position: relative;
    background-image: url('assets/images/stats-parallax-bg.png');
    background-attachment: fixed;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    z-index: 1;
  }
  
  /* Dark overlay to ensure DM Sans numbers pop */
  #stats-section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 10, 15, 0.85); /* Deep slate brutalist tint */
    z-index: -1;
  }
</style>
`;

// Inject before the stats section
if (!html.includes('stats-parallax-bg.png')) {
    html = html.replace(/<section class="stats-section"/g, injectionCSS + '\n<section class="stats-section"');
}

// 2. Also found a lingering "Ages 6 - 18" in the cinematic loader. Fixing that immediately.
html = html.replace(/Ages 6 – 18/g, 'Ages 5 – 17');
html = html.replace(/Ages 6 - 18/g, 'Ages 5 – 17');

if (html !== origHtml) {
    fs.writeFileSync(indexFile, html, 'utf-8');
    console.log('Parallax injected and loader age fixed.');
}
