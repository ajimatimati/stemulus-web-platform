const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Spin up a simple local static server to test form interactions
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath);
  
  if (req.url === '/.netlify/functions/notify') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('Local mock /.netlify/functions/notify received:', body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8089, async () => {
  console.log('Static server listening on http://localhost:8089');
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Users\\USER\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  const errors = [];
  const requests = [];

  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));
  page.on('request', req => {
    if (req.url().includes('ntfy') || req.url().includes('notify') || req.url().includes('send-email')) {
      requests.push({ url: req.url(), method: req.method(), headers: req.headers() });
    }
  });

  console.log('\n--- Testing book-class.html ---');
  await page.goto('http://localhost:8089/book-class.html', { waitUntil: 'networkidle' });
  
  console.log('Page loaded. Checking for form elements...');
  const formExists = await page.$('#qb-booking-inline-form');
  console.log('qb-booking-inline-form exists:', !!formExists);

  if (formExists) {
    // Fill out form
    await page.fill('#qb-parent-name', 'Test Parent');
    await page.fill('#qb-student-name', 'Amara, age 8');
    await page.fill('#qb-email', 'stemuluskidstech@gmail.com');
    await page.fill('#qb-phone', '+2347052466716');
    await page.fill('#qb-country', 'United Kingdom');
    await page.selectOption('#qb-lead-source', 'Google Search');

    // Click submit
    console.log('Submitting booking form...');
    await page.click('.qb-submit-btn');
    await page.waitForTimeout(4000);
  }

  console.log('\nRequests caught:', requests);
  console.log('\nConsole logs (filtered):');
  logs.filter(l => l.includes('Booking') || l.includes('ntfy') || l.includes('Notify') || l.includes('Email') || l.includes('fail') || l.includes('error'))
      .forEach(l => console.log(l));
  console.log('\nPage errors:', errors);

  await browser.close();
  server.close();
  console.log('\nTest complete.');
});
