const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const meetUrl = 'https://meet.google.com/ckd-ngjs-cth';

  console.log('[Lobby-Debug] Opening Meet in Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--use-fake-ui-for-media-stream'
    ],
    viewport: { width: 1280, height: 720 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  await page.goto(meetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(6000);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'profile8_meet_lobby_state.png');
  await page.screenshot({ path: screenshotPath });
  console.log('[Lobby-Debug] Screenshot saved to:', screenshotPath);

  const text = await page.innerText('body');
  console.log('[Lobby-Debug] Body text sample:\n', text.slice(0, 500));

  await context.close();
})();
