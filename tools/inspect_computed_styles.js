const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8098;
const ROOT_DIR = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/coding-classes-for-kids-usa.html';
    const filePath = path.join(ROOT_DIR, reqPath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + reqPath);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, async () => {
  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/coding-classes-for-kids-usa.html`, { waitUntil: 'networkidle' });

    const results = await page.evaluate(() => {
      function getDetails(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const comp = window.getComputedStyle(el);
        return {
          selector: sel,
          color: comp.color,
          backgroundColor: comp.backgroundColor,
          fontSize: comp.fontSize,
          text: el.innerText.trim().slice(0, 70)
        };
      }

      return {
        heroHeader: getDetails('header.geo-hero-luxury'),
        pillContainer: getDetails('header.geo-hero-luxury .inline-flex'),
        pillOrangeText: getDetails('header.geo-hero-luxury .inline-flex .text-orange-400'),
        pillSlateText: getDetails('header.geo-hero-luxury .inline-flex .text-slate-400'),
        heroH1: getDetails('header.geo-hero-luxury h1'),
        heroP: getDetails('header.geo-hero-luxury p'),
        heroPStrong: getDetails('header.geo-hero-luxury p strong'),
        trustBadgesRow: getDetails('header.geo-hero-luxury .border-t'),
        trustBadgeSpan: getDetails('header.geo-hero-luxury .border-t span span'),
        stageBadgeLive: getDetails('.geo-stage-badge'),
        projectSection: getDetails('main section:nth-of-type(1)'),
        projectCardH4: getDetails('main section:nth-of-type(1) h4'),
        projectCardP: getDetails('main section:nth-of-type(1) p')
      };
    });

    console.log('COMPUTED STYLES:');
    console.log(JSON.stringify(results, null, 2));

    await page.screenshot({ path: 'tools/debug_hero_contrast.png', clip: { x: 0, y: 0, width: 1440, height: 1200 } });
    console.log('Screenshot saved to tools/debug_hero_contrast.png');

    await browser.close();
  } catch (err) {
    console.error('Error in inspector:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
