const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8097;
const rootDir = path.join(__dirname, '..');
const authenticDb = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'stemulus_db_latest.json'), 'utf8'));

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
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/__prime') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.js"></script></head><body></body></html>');
    return;
  }
  const filePath = path.join(rootDir, reqPath.replace(/\//g, path.sep));
  const ext = path.extname(filePath).toLowerCase();

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function primeStorage(page, role, userEmail, userName) {
  await page.goto(`http://localhost:${PORT}/__prime`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ role, userEmail, userName, authenticDb }) => {
    const sessionObj = {
      role: role,
      email: userEmail,
      name: userName || (role === 'admin' ? 'Super Admin' : (role === 'tutor' ? 'Coach Olalekan' : 'Parent User')),
      issuedAt: Date.now()
    };
    if (typeof StemulusSecurity !== 'undefined') {
      StemulusSecurity.saveSecureSession(sessionObj);
    }
    sessionStorage.setItem('stemulus_session_raw', JSON.stringify(sessionObj));
    localStorage.setItem('user', JSON.stringify(sessionObj));
    localStorage.setItem('role', role);
    localStorage.setItem('stemulus_auth_role', role);
    localStorage.setItem('stemulus_user_email', userEmail);
    localStorage.setItem('stemulus_auth_token', 'stemulus_e2e_verified_token');
    localStorage.setItem('stemulus_session', JSON.stringify(sessionObj));
    localStorage.setItem('stemulus_db', JSON.stringify(authenticDb));
  }, { role, userEmail, userName, authenticDb });
}

server.listen(PORT, async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Test 1: Admin Dashboard at native 100% zoom
  await primeStorage(page, 'admin', 'admin@stemuluskidstech.com', 'Super Admin');
  await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_admin_dashboard_compact.png', fullPage: false });

  // Test 2: Tutor Dashboard at native 100% zoom
  await primeStorage(page, 'tutor', 'tutor@stemuluskidstech.com', 'Sarah Jane');
  await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_tutor_dashboard_compact.png', fullPage: false });

  // Test 3: Parent Dashboard at native 100% zoom
  await primeStorage(page, 'parent', 'parent@stemuluskidstech.com', 'Parent User');
  await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_parent_dashboard_compact.png', fullPage: false });

  // Test 4: Join Class Companion
  await page.goto(`http://localhost:${PORT}/join-class.html?sessionId=session_1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_join_class_compact.png', fullPage: false });

  // Test 5: Mobile viewport checks (375x667)
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await primeStorage(mobilePage, 'tutor', 'tutor@stemuluskidstech.com', 'Sarah Jane');
  await mobilePage.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_mobile_tutor_dashboard.png', fullPage: false });

  await primeStorage(mobilePage, 'parent', 'parent@stemuluskidstech.com', 'Parent User');
  await mobilePage.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/final_mobile_parent_dashboard.png', fullPage: false });

  await browser.close();
  server.close();
  console.log('All compact visual & mobile screenshots captured successfully!');
});
