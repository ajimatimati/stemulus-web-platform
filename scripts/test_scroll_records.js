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

  await page.goto('https://calendar.google.com/calendar/u/0/r/day/2026/10/20', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const chip = await page.locator('[data-eventid]:has-text("David")').first();
  await chip.click();
  await page.waitForTimeout(2000);

  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.click();
  await page.waitForTimeout(4000);

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (meetFrame) {
    const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
    await recordsBtn.click();
    await page.waitForTimeout(2000);

    // Scroll down inside the settings panel
    console.log('[Scroll Test] Scrolling down inside settings panel...');
    await meetFrame.evaluate(() => {
      const scrollable = document.querySelector('div[role="tabpanel"], div[jsname], div[class*="content"]') || document.body;
      window.scrollTo(0, 1000);
      const allDivs = document.querySelectorAll('div');
      for (const d of allDivs) {
        if (d.scrollHeight > d.clientHeight) {
          d.scrollTop = 1000;
        }
      }
    });

    await page.waitForTimeout(2000);
    const scrollScreenshot = path.join(__dirname, '..', 'tests', 'frame_meeting_records_scrolled.png');
    await page.screenshot({ path: scrollScreenshot });
    console.log('[Scroll Test] Saved scrolled screenshot to:', scrollScreenshot);

    // Get all checkboxes and labels in the frame
    const checkboxes = await meetFrame.$$eval('input[type="checkbox"], [role="checkbox"]', inputs => {
      return inputs.map(i => ({
        ariaLabel: i.getAttribute('aria-label'),
        checked: i.checked || i.getAttribute('aria-checked'),
        id: i.id,
        text: i.closest('label') ? i.closest('label').innerText.replace(/\n+/g, ' ') : ''
      }));
    });
    console.log('[Scroll Test] Checkboxes found in frame:', checkboxes);
  }

  await context.close();
})();
