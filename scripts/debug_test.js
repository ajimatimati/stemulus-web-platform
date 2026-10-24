const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/__prime') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.min.js"></script></head><body></body></html>');
    return;
  }
  const filePath = path.join(rootDir, reqUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found: ' + reqUrl);
  }
});

server.listen(8109, async () => {
  console.log('Server running on 8109');
  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    const page = await browser.newPage();
    page.on('console', msg => console.log('[BROWSER]', msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    console.log('Navigating to __prime...');
    await page.goto('http://localhost:8109/__prime', { waitUntil: 'domcontentloaded' });
    
    await page.evaluate(() => {
      const s = {
        id: 'usr-parent-01',
        name: 'Parent User',
        email: 'parent@stemuluskidstech.com',
        role: 'parent'
      };
      if (typeof StemulusSecurity !== 'undefined') {
        StemulusSecurity.saveSecureSession(s);
      }
      sessionStorage.setItem('stemulus_session_raw', JSON.stringify(s));
      localStorage.setItem('user', JSON.stringify(s));
      localStorage.setItem('role', s.role);
      localStorage.setItem('stemulus_auth_role', s.role);
      localStorage.setItem('stemulus_user_email', s.email);
      localStorage.setItem('stemulus_auth_token', 'stemulus_e2e_verified_token');
    });

    console.log('Navigating to parent-dashboard.html...');
    await page.goto('http://localhost:8109/parent-dashboard.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    console.log('Final URL:', page.url());
    const hasSlot = await page.evaluate(() => typeof ParentEngine !== 'undefined' && typeof ParentEngine.selectRecommendedSlot === 'function');
    console.log('hasSlot:', hasSlot);
    console.log('ParentEngine exists:', await page.evaluate(() => typeof ParentEngine !== 'undefined'));
    if (await page.evaluate(() => typeof ParentEngine !== 'undefined')) {
      console.log('ParentEngine keys:', await page.evaluate(() => Object.keys(ParentEngine)));
    }

  } catch (err) {
    console.error('Debug script error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(0);
  }
});
