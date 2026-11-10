const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8888;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
};

const REDIRECTS_301 = {
  '/academy': '/programs.html',
  '/hub': '/programs.html',
  '/quest': '/programs.html',
  '/lms': '/programs.html',
  '/pass': '/programs.html',
  '/portal': '/parent-login.html',
  '/portal.html': '/parent-login.html'
};

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 301 redirects (clean LMS removal verification)
    if (REDIRECTS_301[pathname] || pathname.startsWith('/curriculum/')) {
      res.writeHead(301, { 'Location': '/programs.html' });
      res.end();
      return;
    }

    // Netlify functions emulation
    if (pathname.startsWith('/.netlify/functions/')) {
      const fnName = pathname.replace('/.netlify/functions/', '').split('/')[0];
      const fnPath = path.join(ROOT, 'netlify', 'functions', fnName + '.js');
      if (fs.existsSync(fnPath)) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            delete require.cache[require.resolve(fnPath)];
            const fnModule = require(fnPath);
            const event = {
              httpMethod: req.method,
              headers: req.headers,
              path: pathname,
              queryStringParameters: Object.fromEntries(parsedUrl.searchParams.entries()),
              body: body
            };
            const result = await fnModule.handler(event, {});
            res.writeHead(result.statusCode || 200, Object.assign({ 'Content-Type': 'application/json' }, result.headers || {}));
            res.end(result.body || '{}');
          } catch (fnErr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: fnErr.message }));
          }
        });
        return;
      }
    }

    let safePath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(ROOT, safePath);

    // Security boundary check
    if (filePath.toLowerCase().indexOf(ROOT.toLowerCase()) !== 0) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log('   STEMULUS LOCAL FULL-STACK DEV & QA SERVER ACTIVE');
  console.log('=============================================================');
  console.log(`  Local URL:        http://localhost:${PORT}`);
  console.log(`  Main Website:     http://localhost:${PORT}/index.html`);
  console.log('-------------------------------------------------------------');
  console.log('  LOGIN GATEWAYS & TEST CREDENTIALS:');
  console.log(`  * Admin:   http://localhost:${PORT}/admin-login.html  (admin@stemuluskidstech.com / Admin2026!)`);
  console.log(`  * Tutor:   http://localhost:${PORT}/tutor-login.html  (adefemiadebayo20@gmail.com / Tutor2026!)`);
  console.log(`  * Parent:  http://localhost:${PORT}/parent-login.html (parent@stemuluskidstech.com / Parent2026!)`);
  console.log('-------------------------------------------------------------');
  console.log('  DIRECT AUTHENTICATED HUDS:');
  console.log(`  * Admin Dashboard:  http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`  * Tutor Dashboard:  http://localhost:${PORT}/tutor-dashboard.html`);
  console.log(`  * Parent Dashboard: http://localhost:${PORT}/parent-dashboard.html`);
  console.log(`  * Parent Progress:  http://localhost:${PORT}/parent-progress.html`);
  console.log('=============================================================\n');
});
