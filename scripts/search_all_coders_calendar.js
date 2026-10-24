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

  const queries = ['Omosuyi', 'King', 'Joshua', 'Pearl', 'Babalola', 'Gbolade', 'Farouq', 'Quest', 'Coding Class'];
  const results = {};

  for (const q of queries) {
    console.log(`[Search] Searching for "${q}"...`);
    await page.goto(`https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(q)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const matches = await page.$$eval('[data-eventid]', els => {
      return Array.from(new Set(els.map(e => e.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)));
    });

    results[q] = matches.slice(0, 5);
    console.log(`[Search] Results for "${q}":`, matches.length, matches.slice(0, 3));
  }

  console.log('\n[SUMMARY OF ALL SEARCHES]:');
  console.log(JSON.stringify(results, null, 2));

  await context.close();
})();
