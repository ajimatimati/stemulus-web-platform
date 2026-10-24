const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 8199;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log('HTTP 404 on local server:', reqPath);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  });
});

const securityCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'stemulus-security.js'), 'utf8');

async function diagnose() {
    await new Promise(r => server.listen(PORT, r));
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // 1. Diagnose Admin Dashboard
    console.log('=== Diagnosing Admin Dashboard ===');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on('response', resp => {
        if (resp.status() === 404) {
            console.log('Admin 404 URL:', resp.url());
        }
    });
    await adminPage.addInitScript(({ secCode }) => {
        const fn = new Function(secCode); fn();
        window.StemulusSecurity.saveSecureSession({
            role: 'admin', email: 'admin@stemuluskidstech.com', name: 'STEMulus Admin', issuedAt: Date.now()
        });
    }, { secCode: securityCode });

    await adminPage.setViewportSize({ width: 414, height: 896 });
    await adminPage.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(1500);

    // Find broken images
    const brokenImages = await adminPage.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
            .filter(img => !img.complete || img.naturalWidth === 0)
            .map(img => ({ src: img.src, outerHTML: img.outerHTML.slice(0, 100) }));
    });
    console.log('Admin Broken Images:', brokenImages);

    // Find overflowing elements
    const adminOverflowing = await adminPage.evaluate(() => {
        const winW = window.innerWidth;
        const all = Array.from(document.querySelectorAll('*'));
        return all
            .filter(el => el.getBoundingClientRect().right > winW + 1)
            .slice(0, 8)
            .map(el => ({
                tag: el.tagName,
                id: el.id,
                className: el.className ? el.className.toString().slice(0, 60) : '',
                right: el.getBoundingClientRect().right,
                width: el.getBoundingClientRect().width
            }));
    });
    console.log('Admin Overflowing Elements at 414px:', adminOverflowing);

    await adminContext.close();

    // 2. Diagnose Parent Progress (1280px overflow)
    console.log('\n=== Diagnosing Parent Progress at 1280px ===');
    const progContext = await browser.newContext();
    const progPage = await progContext.newPage();
    await progPage.addInitScript(({ secCode }) => {
        const fn = new Function(secCode); fn();
        window.StemulusSecurity.saveSecureSession({
            role: 'parent', email: 'parent.mark@gmail.com', name: 'Mark Parent', issuedAt: Date.now()
        });
    }, { secCode: securityCode });
    await progPage.setViewportSize({ width: 1280, height: 800 });
    await progPage.goto(`http://localhost:${PORT}/parent-progress.html?id=std-001`, { waitUntil: 'domcontentloaded' });
    await progPage.waitForTimeout(1500);

    const progOverflowing = await progPage.evaluate(() => {
        const winW = window.innerWidth;
        const all = Array.from(document.querySelectorAll('*'));
        return all
            .filter(el => el.getBoundingClientRect().right > winW + 1)
            .slice(0, 8)
            .map(el => ({
                tag: el.tagName,
                id: el.id,
                className: el.className ? el.className.toString().slice(0, 60) : '',
                right: el.getBoundingClientRect().right,
                width: el.getBoundingClientRect().width
            }));
    });
    console.log('Parent Progress Overflowing Elements at 1280px:', progOverflowing);
    await progContext.close();

    // 3. Diagnose Tutor Monthly Report broken images
    console.log('\n=== Diagnosing Tutor Monthly Report broken images ===');
    const tutorContext = await browser.newContext();
    const tutorPage = await tutorContext.newPage();
    await tutorPage.addInitScript(({ secCode }) => {
        const fn = new Function(secCode); fn();
        window.StemulusSecurity.saveSecureSession({
            role: 'tutor', email: 'tutor@stemuluskidstech.com', name: 'Sarah Jane', issuedAt: Date.now()
        });
    }, { secCode: securityCode });
    await tutorPage.setViewportSize({ width: 1280, height: 800 });
    await tutorPage.goto(`http://localhost:${PORT}/tutor-monthly-report.html`, { waitUntil: 'domcontentloaded' });
    await tutorPage.waitForTimeout(1500);

    const tutorBrokenImgs = await tutorPage.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
            .filter(img => !img.complete || img.naturalWidth === 0)
            .map(img => ({ src: img.src, outerHTML: img.outerHTML.slice(0, 100) }));
    });
    console.log('Tutor Monthly Report Broken Images:', tutorBrokenImgs);
    await tutorContext.close();

    await browser.close();
    server.close();
}

diagnose().catch(err => {
    console.error(err);
    server.close();
});
