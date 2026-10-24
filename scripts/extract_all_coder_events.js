const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: null
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  console.log('[Extract] Searching for "Coding Quest"...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=Coding%20Quest', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const titles = await page.$$eval('[data-eventid]', els => {
    return Array.from(new Set(els.map(e => e.innerText.trim()).filter(Boolean)));
  });

  console.log('[Extract] Unique Event Cards with [data-eventid]:', titles.length);
  titles.slice(0, 30).forEach(t => console.log('  -', t.replace(/\n+/g, ' ')));

  // If data-eventid was empty, try span / role="row"
  if (titles.length === 0) {
    const rows = await page.$$eval('div[role="main"] span', els => {
      return Array.from(new Set(els.map(e => e.innerText.trim()).filter(t => t.includes('Coding Quest'))));
    });
    console.log('[Extract] Spans with Coding Quest:', rows);
  }

  await context.close();
})();
