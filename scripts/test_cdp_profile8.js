const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('[CDP Test] Starting Chrome with Profile 8 and remote debugging port 9222...');
  
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  console.log('[CDP Test] Found Chrome path:', chromePath);

  if (!fs.existsSync(chromePath)) {
    console.error('[CDP Test] Chrome executable does not exist at:', chromePath);
    process.exit(1);
  }

  const chromeProcess = spawn(chromePath, [
    '--profile-directory=Profile 8',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    'https://calendar.google.com/calendar/u/0/r'
  ], {
    detached: true,
    stdio: 'ignore'
  });
  chromeProcess.unref();

  // Wait for remote debugging port to be ready
  console.log('[CDP Test] Waiting for Chrome CDP port 9222...');
  let connected = false;
  let browser = null;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise(r => setTimeout(r, 1000));
      browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
      connected = true;
      console.log('[CDP Test] Connected to Chrome over CDP!');
      break;
    } catch (e) {
      process.stdout.write('.');
    }
  }

  if (!connected) {
    console.error('\n[CDP Test] Failed to connect to Chrome on port 9222');
    process.exit(1);
  }

  const contexts = browser.contexts();
  console.log('\n[CDP Test] Contexts found:', contexts.length);
  const context = contexts[0];
  const pages = context.pages();
  console.log('[CDP Test] Pages found:', pages.length);
  const page = pages[0] || await context.newPage();

  console.log('[CDP Test] Waiting for Google Calendar page to load...');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  const title = await page.title();
  const url = page.url();
  console.log('[CDP Test] Active Page Title:', title);
  console.log('[CDP Test] Active Page URL:', url);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'cdp_calendar_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[CDP Test] Verification screenshot saved to:', screenshotPath);

  console.log('[CDP Test] SUCCESS! Chrome Profile 8 verified and connected via Playwright CDP.');
})();
