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

  const codes = [
    'nxg-rbcg-nsr', // Myles
    'gyd-fewb-cdh', // Junayd
    'ckd-ngjs-cth', // David
    'yko-xwce-ugd', // Joshua
    'yre-naci-zmp', // Pearl
    'vdp-nmbh-sjj', // Momooreoluwa
    'qye-ezub-uqi', // Gbolade
    'mim-qifa-avc'  // Farouq
  ];

  for (const c of codes) {
    console.log(`[Code Search] Searching for "${c}"...`);
    await page.goto(`https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(c)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const matches = await page.$$eval('[data-eventid]', els => {
      return Array.from(new Set(els.map(e => e.innerText.replace(/\n+/g, ' ').trim()).filter(Boolean)));
    });

    console.log(`[Code Search] "${c}":`, matches.length, matches);
  }

  await context.close();
})();
