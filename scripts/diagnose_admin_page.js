const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const BASE_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';
  let filePath = path.join(BASE_DIR, cleanUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function run() {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to admin-login.html...');
  await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'networkidle' });
  await page.fill('#emailInput', 'admin@stemuluskidstech.com');
  await page.fill('#passwordInput', 'Admin2026!');
  await page.click('#submitBtn');
  await page.waitForTimeout(2000);

  console.log('Current URL after submit:', page.url());

  if (!page.url().includes('admin-dashboard.html')) {
    await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  }

  console.log('Page URL now:', page.url());

  const state = await page.evaluate(() => {
    return {
      session: sessionStorage.getItem('stemulus_session'),
      localSession: localStorage.getItem('stemulus_session'),
      dbExists: !!localStorage.getItem('stemulus_db'),
      statTotalStudents: document.getElementById('stat-total-students') ? document.getElementById('stat-total-students').textContent : null,
      statUpcomingClasses: document.getElementById('stat-upcoming-classes') ? document.getElementById('stat-upcoming-classes').textContent : null,
      weekSessions: document.getElementById('week-sessions') ? document.getElementById('week-sessions').textContent : null,
      weekPresent: document.getElementById('week-present') ? document.getElementById('week-present').textContent : null,
      weekPending: document.getElementById('week-pending') ? document.getElementById('week-pending').textContent : null,
      todaysClassesCount: document.getElementById('todays-classes-list') ? document.getElementById('todays-classes-list').children.length : 0,
      adminEngineExists: typeof AdminEngine !== 'undefined',
      dashboardEngineExists: typeof DashboardEngine !== 'undefined'
    };
  });

  console.log('Evaluated State:', JSON.stringify(state, null, 2));

  await browser.close();
  server.close();
}

run();
