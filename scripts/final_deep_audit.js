/**
 * Final Deep Quality Audit across Marketing Website & Portal
 * Checks:
 * 1. Serverless functions & build scripts integrity
 * 2. Static HTML asset references, internal links, CSP alignment, and .js/.min.js sync
 * 3. Live Playwright runtime verification (Desktop 1440x900 & Mobile 375x812) across Marketing & Portal pages
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

async function runAudit() {
  const report = {
    functions: [],
    staticIssues: [],
    cspExternalDomains: new Set(),
    roleTutorLegacyLinks: [],
    unminifiedDiffs: [],
    runtimePages: []
  };

  console.log('=== 1. AUDITING NETLIFY FUNCTIONS & BUILD SCRIPTS ===');
  const fnDir = path.join(ROOT, 'netlify', 'functions');
  if (fs.existsSync(fnDir)) {
    const fnFiles = fs.readdirSync(fnDir).filter(f => f.endsWith('.js'));
    for (const f of fnFiles) {
      const fullPath = path.join(fnDir, f);
      try {
        const mod = require(fullPath);
        report.functions.push({ file: f, ok: typeof mod.handler === 'function', exports: Object.keys(mod) });
        console.log(`  [OK] Function ${f} loaded (handler: ${typeof mod.handler === 'function'})`);
      } catch (err) {
        report.functions.push({ file: f, ok: false, error: err.message });
        console.error(`  [FAIL] Function ${f}:`, err.message);
      }
    }
  }

  console.log('\n=== 2. AUDITING ALL HTML FILES & JS/MIN.JS SYNC ===');
  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');

    // Check for legacy parent-login.html?role=tutor links
    if (content.includes('parent-login.html?role=tutor')) {
      report.roleTutorLegacyLinks.push(htmlFile);
    }

    // Check script src
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = scriptRegex.exec(content)) !== null) {
      const src = m[1];
      if (src.startsWith('http://') || src.startsWith('https://')) {
        try {
          const u = new URL(src);
          report.cspExternalDomains.add(`script: ${u.origin}`);
        } catch (e) {}
      } else {
        const cleanSrc = src.split('?')[0].split('#')[0].replace(/^\//, '');
        if (cleanSrc && !fs.existsSync(path.join(ROOT, cleanSrc))) {
          report.staticIssues.push({ page: htmlFile, type: 'missing_script', target: src });
        }
      }
    }

    // Check link stylesheet href
    const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    while ((m = linkRegex.exec(content)) !== null) {
      const tag = m[0];
      const href = m[1];
      if (/rel=["']stylesheet["']/i.test(tag)) {
        if (href.startsWith('http://') || href.startsWith('https://')) {
          try {
            const u = new URL(href);
            report.cspExternalDomains.add(`style: ${u.origin}`);
          } catch (e) {}
        } else {
          const cleanHref = href.split('?')[0].split('#')[0].replace(/^\//, '');
          if (cleanHref && !fs.existsSync(path.join(ROOT, cleanHref))) {
            report.staticIssues.push({ page: htmlFile, type: 'missing_stylesheet', target: href });
          }
        }
      }
    }

    // Check local page links <a href="...">
    const aRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    while ((m = aRegex.exec(content)) !== null) {
      const href = m[1].trim();
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.includes('${') ||
        href.includes("' +") ||
        href.includes('" +')
      ) {
        continue;
      }
      const cleanPage = href.split('?')[0].split('#')[0].replace(/^\//, '');
      if (cleanPage && cleanPage.endsWith('.html') && !fs.existsSync(path.join(ROOT, cleanPage))) {
        report.staticIssues.push({ page: htmlFile, type: 'broken_html_link', target: href });
      }
    }
  }

  // Check assets/js/*.js vs *.min.js modification times
  const jsDir = path.join(ROOT, 'assets', 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
    for (const jf of jsFiles) {
      const minFile = jf.replace(/\.js$/, '.min.js');
      const fullJs = path.join(jsDir, jf);
      const fullMin = path.join(jsDir, minFile);
      if (fs.existsSync(fullMin)) {
        const jsStat = fs.statSync(fullJs);
        const minStat = fs.statSync(fullMin);
        if (jsStat.mtimeMs > minStat.mtimeMs + 2000) {
          report.unminifiedDiffs.push({ js: jf, min: minFile });
        }
      }
    }
  }

  console.log('  Legacy role=tutor links in HTML:', report.roleTutorLegacyLinks);
  console.log('  Static asset/link issues:', report.staticIssues);
  console.log('  External CSP domains used:', Array.from(report.cspExternalDomains));
  console.log('  JS files newer than .min.js:', report.unminifiedDiffs);

  console.log('\n=== 3. PLAYWRIGHT LIVE RUNTIME AUDIT (MARKETING + PORTAL) ===');
  // Start static file server
  const server = http.createServer((req, res) => {
    const reqUrl = req.url.split('?')[0];
    if (req.method === 'POST' && reqUrl.startsWith('/.netlify/functions/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    let filePath = path.join(ROOT, reqUrl === '/' ? 'index.html' : reqUrl);
    if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
      filePath += '.html';
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const pagesToTest = [
    // Marketing pages
    { url: '/index.html', role: null, group: 'marketing' },
    { url: '/programs.html', role: null, group: 'marketing' },
    { url: '/enroll.html', role: null, group: 'marketing' },
    { url: '/book-class.html', role: null, group: 'marketing' },
    { url: '/contact.html', role: null, group: 'marketing' },
    { url: '/for-parents.html', role: null, group: 'marketing' },
    { url: '/join-as-tutor.html', role: null, group: 'marketing' },
    // Portal login pages
    { url: '/parent-login.html', role: null, group: 'portal-login' },
    { url: '/tutor-login.html', role: null, group: 'portal-login' },
    { url: '/admin-login.html', role: null, group: 'portal-login' },
    // Authenticated Portal pages
    { url: '/admin-dashboard.html', role: 'admin', email: 'admin@stemuluskidstech.com', name: 'STEMulus Admin', group: 'portal-auth' },
    { url: '/tutor-dashboard.html', role: 'tutor', email: 'kafayat@stemuluskidstech.com', name: 'Kafayat', group: 'portal-auth' },
    { url: '/parent-dashboard.html', role: 'parent', email: 'kazeem@example.com', name: 'Mr. & Mrs. Kazeem', group: 'portal-auth' },
    { url: '/join-class.html?id=sch-1&role=parent', role: 'parent', email: 'kazeem@example.com', name: 'Mr. & Mrs. Kazeem', group: 'portal-auth' },
    { url: '/tutor-attendance-create.html', role: 'tutor', email: 'kafayat@stemuluskidstech.com', name: 'Kafayat', group: 'portal-auth' },
    { url: '/tutor-monthly-report.html', role: 'tutor', email: 'kafayat@stemuluskidstech.com', name: 'Kafayat', group: 'portal-auth' }
  ];

  for (const item of pagesToTest) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const pageErrors = [];
    const consoleErrors = [];
    const brokenAssets = [];

    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('firestore.googleapis.com') && !text.includes('ERR_NAME_NOT_RESOLVED')) {
          consoleErrors.push(text);
        }
      }
    });
    page.on('response', resp => {
      if (resp.status() >= 400 && resp.url().startsWith(baseUrl) && !resp.url().includes('favicon')) {
        brokenAssets.push(`${resp.status()} ${resp.url().replace(baseUrl, '')}`);
      }
    });

    if (item.role) {
      await page.addInitScript(u => {
        const sessionObj = {
          email: u.email,
          name: u.name,
          role: u.role,
          loginTime: new Date().toISOString(),
          expiresAt: Date.now() + 86400000
        };
        sessionStorage.setItem('stemulus_user_session', JSON.stringify(sessionObj));
        localStorage.setItem('stemulus_session', JSON.stringify(sessionObj));
        localStorage.setItem('stemulus_auth_session', JSON.stringify(sessionObj));
      }, item);
    }

    try {
      await page.goto(baseUrl + item.url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(800);

      // Check Desktop overflow
      const desktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 4;
      });

      // Check Mobile 375x812 overflow
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);
      const mobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 4;
      });

      const resEntry = {
        url: item.url,
        pageErrors,
        consoleErrors,
        brokenAssets,
        desktopOverflow,
        mobileOverflow
      };
      report.runtimePages.push(resEntry);
      console.log(`  [${pageErrors.length === 0 && brokenAssets.length === 0 ? 'PASS' : 'ISSUE'}] ${item.url} | Errors: ${pageErrors.length} | ConsoleErr: ${consoleErrors.length} | 404s: ${brokenAssets.length} | MobOverflow: ${mobileOverflow}`);
      if (pageErrors.length) console.log('     PageErrors:', pageErrors);
      if (consoleErrors.length) console.log('     ConsoleErrors:', consoleErrors);
      if (brokenAssets.length) console.log('     BrokenAssets:', brokenAssets);
    } catch (err) {
      console.error(`  [ERROR loading ${item.url}]:`, err.message);
      report.runtimePages.push({ url: item.url, loadError: err.message });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
