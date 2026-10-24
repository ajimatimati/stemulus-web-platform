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
    await context.close();
    return;
  }

  // 1. Inspect Meeting records tab
  console.log('--- Inspecting Meeting records tab ---');
  const recordsTab = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsTab.click();
  await page.waitForTimeout(1500);

  // Scroll down in records tab
  await meetFrame.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div')).filter(d => d.scrollHeight > d.clientHeight && d.clientHeight > 100);
    scrollables.forEach(s => s.scrollTop = s.scrollHeight);
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_records_scrolled_full.png') });

  const recordCheckboxes = await meetFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [role="switch"]')).map(el => ({
      role: el.getAttribute('role'),
      checked: el.checked || el.getAttribute('aria-checked') === 'true',
      ariaLabel: el.getAttribute('aria-label'),
      text: (el.parentElement ? el.parentElement.innerText : '').replace(/\n/g, ' ')
    }));
  });
  console.log('Record checkboxes:', JSON.stringify(recordCheckboxes, null, 2));

  // 2. Inspect Host controls tab
  console.log('--- Inspecting Host controls tab ---');
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.click();
  await page.waitForTimeout(1500);

  // Scroll down in host tab
  await meetFrame.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('div')).filter(d => d.scrollHeight > d.clientHeight && d.clientHeight > 100);
    scrollables.forEach(s => s.scrollTop = s.scrollHeight);
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_host_scrolled_full.png') });

  const hostSwitches = await meetFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [role="switch"], [role="radio"]')).map(el => ({
      role: el.getAttribute('role'),
      checked: el.checked || el.getAttribute('aria-checked') === 'true',
      ariaLabel: el.getAttribute('aria-label'),
      text: (el.parentElement ? el.parentElement.innerText : '').replace(/\n/g, ' ')
    }));
  });
  console.log('Host switches & radios:', JSON.stringify(hostSwitches, null, 2));

  await context.close();
})();
