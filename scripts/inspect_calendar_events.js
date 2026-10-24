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

  // Test searching for "Coding Quest"
  console.log('[Inspect] Searching for "Coding Quest"...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=Coding%20Quest', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const screenshot1 = path.join(__dirname, '..', 'tests', 'search_coding_quest.png');
  await page.screenshot({ path: screenshot1 });
  console.log('[Inspect] Screenshot 1 saved to:', screenshot1);

  // Extract all event texts visible in search results
  const items = await page.$$eval('[role="row"], [data-eventid], tr, div[jslog*="event"]', els => {
    return els.map(e => e.innerText.replace(/\n+/g, ' | ').trim()).filter(Boolean);
  });
  console.log('[Inspect] Search results for Coding Quest:', items);

  // Also search for "STEMulus"
  console.log('[Inspect] Searching for "STEMulus"...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=STEMulus', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const screenshot2 = path.join(__dirname, '..', 'tests', 'search_stemulus.png');
  await page.screenshot({ path: screenshot2 });
  console.log('[Inspect] Screenshot 2 saved to:', screenshot2);

  const stemulusItems = await page.$$eval('[role="row"], [data-eventid], tr, div[jslog*="event"]', els => {
    return els.map(e => e.innerText.replace(/\n+/g, ' | ').trim()).filter(Boolean);
  });
  console.log('[Inspect] Search results for STEMulus:', stemulusItems);

  await context.close();
})();
