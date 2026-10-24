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

  const modalDump = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const matched = all.filter(el => el.innerText && (el.innerText.includes('Meeting records') || el.innerText.includes('Host controls')));
    return matched.map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      className: el.className,
      text: el.innerText.slice(0, 50),
      rect: el.getBoundingClientRect()
    })).filter(item => item.rect.width > 0 && item.rect.height > 0);
  });

  console.log('[DOM Dump] Elements matching "Meeting records" or "Host controls":');
  console.log(JSON.stringify(modalDump.slice(0, 15), null, 2));

  // Also let's try clicking by text directly with page.getByText('Meeting records')
  console.log('[DOM Dump] Testing page.getByText("Meeting records")...');
  const locator = page.getByText('Meeting records', { exact: false });
  const count = await locator.count();
  console.log('[DOM Dump] getByText count:', count);
  if (count > 0) {
    await locator.first().click();
    await page.waitForTimeout(2000);
    const screenshot = path.join(__dirname, '..', 'tests', 'clicked_meeting_records_verified.png');
    await page.screenshot({ path: screenshot });
    console.log('[DOM Dump] Screenshot saved to:', screenshot);
  }

  await context.close();
})();
