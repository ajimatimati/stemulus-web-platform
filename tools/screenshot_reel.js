const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const server = http.createServer((req, res) => {
  const p = path.join(__dirname, '..', req.url.split('?')[0] === '/' ? 'coding-classes-for-kids-usa.html' : req.url.split('?')[0]);
  if (fs.existsSync(p)) res.end(fs.readFileSync(p));
  else { res.statusCode = 404; res.end(); }
}).listen(8096, async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto('http://localhost:8096/coding-classes-for-kids-usa.html', { waitUntil: 'networkidle' });
  const reel = await page.$('.geo-project-reel');
  if (reel) {
    await reel.screenshot({ path: path.join(__dirname, 'debug_project_reel.png') });
    console.log('Project reel screenshot saved to tools/debug_project_reel.png');
  }
  await browser.close();
  server.close();
});
