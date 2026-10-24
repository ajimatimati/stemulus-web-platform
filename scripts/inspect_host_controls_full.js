const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Inspect] Launching Chrome Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: { width: 1280, height: 800 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  const searchQuery = "David's Coding Quest";
  const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(searchQuery)}`;
  console.log('[Inspect] Navigating to:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const row = page.locator(`div[role="row"]:has-text("${searchQuery}"), tr:has-text("${searchQuery}"), div[role="button"]:has-text("${searchQuery}")`).first();
  await row.click();
  await page.waitForTimeout(2000);

  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (!meetFrame) {
    console.error('No meetFrame found!');
    await browser.close();
    return;
  }

  // Click Host controls tab
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.click();
  await page.waitForTimeout(2000);

  // Scroll down inside the tab container to reveal everything under Meeting access
  await meetFrame.evaluate(() => {
    const scrollable = document.querySelector('div[tabindex="0"], div[jsname], div[role="tabpanel"], div.VIpgJd-j7LFlb') || document.body;
    scrollable.scrollTop = scrollable.scrollHeight;
  });
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_host_controls_scrolled.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved debug_host_controls_scrolled.png');

  // Dump all text and switches in the tab
  const dump = await meetFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).map(el => {
      const text = el.innerText ? el.innerText.trim() : '';
      const role = el.getAttribute('role');
      const ariaChecked = el.getAttribute('aria-checked');
      const ariaLabel = el.getAttribute('aria-label');
      if (role === 'switch' || role === 'radio' || (text && text.length < 100 && (text.includes('Host') || text.includes('join') || text.includes('access') || text.includes('Open') || text.includes('Trusted')))) {
        return { tag: el.tagName, role, ariaChecked, ariaLabel, text };
      }
      return null;
    }).filter(Boolean);
  });

  console.log('Host controls dump:', JSON.stringify(dump, null, 2));

  await context.close();
})();
