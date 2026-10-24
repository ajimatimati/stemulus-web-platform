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
  await page.waitForTimeout(5000);

  const frames = page.frames();
  console.log('[Frames Test] Total frames found:', frames.length);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    console.log(`  Frame ${i}: URL=${f.url()} Name=${f.name()}`);
    try {
      const text = await f.evaluate(() => document.body ? document.body.innerText.slice(0, 100) : 'empty');
      console.log(`  Frame ${i} text:`, text.replace(/\n+/g, ' '));
    } catch (e) {
      console.log(`  Frame ${i} eval error:`, e.message);
    }
  }

  // Look for the frame containing "Meeting records"
  const meetFrame = frames.find(f => f.url().includes('meet.google.com') || f.url().includes('calloptions') || f.url().includes('settings'));
  if (meetFrame) {
    console.log('[Frames Test] Found Meet options frame! URL:', meetFrame.url());
    const tabs = await meetFrame.$$eval('[role="tab"], button, div[role="button"]', els => {
      return els.map(e => e.innerText.trim()).filter(Boolean);
    });
    console.log('[Frames Test] Elements inside frame:', tabs);

    // Click "Meeting records"
    console.log('[Frames Test] Clicking "Meeting records" inside frame...');
    const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
    await recordsBtn.click();
    await page.waitForTimeout(2000);

    const afterClickScreenshot = path.join(__dirname, '..', 'tests', 'frame_meeting_records_clicked.png');
    await page.screenshot({ path: afterClickScreenshot });
    console.log('[Frames Test] Saved screenshot to:', afterClickScreenshot);

    const frameText = await meetFrame.evaluate(() => document.body.innerText);
    console.log('[Frames Test] Text inside Meeting records tab:\n', frameText);
  }

  await context.close();
})();
