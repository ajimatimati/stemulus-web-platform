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

  // Let's inspect Tuesday Oct 20, 2026 (King Myles scheduled day!)
  console.log('[Tuesday View] Navigating to Tuesday 20 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const tuesdayScreenshot = path.join(__dirname, '..', 'tests', 'calendar_tuesday_oct20.png');
  await page.screenshot({ path: tuesdayScreenshot });
  console.log('[Tuesday View] Saved screenshot to:', tuesdayScreenshot);

  // Extract all event texts on this day
  const tuesdayEvents = await page.$$eval('[data-eventid]', els => {
    return Array.from(new Set(els.map(e => e.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)));
  });
  console.log('[Tuesday View] Events on Tuesday Oct 20:', tuesdayEvents);

  // Let's also inspect Wednesday Oct 21, 2026 (Junayd scheduled day!)
  console.log('[Wednesday View] Navigating to Wednesday 21 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/21', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const wedEvents = await page.$$eval('[data-eventid]', els => {
    return Array.from(new Set(els.map(e => e.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)));
  });
  console.log('[Wednesday View] Events on Wednesday Oct 21:', wedEvents);

  // Let's also inspect Friday Oct 23, 2026 (Pearl & Myles & Junayd scheduled day!)
  console.log('[Friday View] Navigating to Friday 23 October 2026...');
  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/23', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const friEvents = await page.$$eval('[data-eventid]', els => {
    return Array.from(new Set(els.map(e => e.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)));
  });
  console.log('[Friday View] Events on Friday Oct 23:', friEvents);

  await context.close();
})();
