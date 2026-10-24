const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Test] Launching Chrome Profile 8 for Host Controls toggle test...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ],
    viewport: null
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  const searchQuery = "David's Coding Quest";
  const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(searchQuery)}`;
  console.log('[Test] Navigating to search:', searchUrl);
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
  console.log('[Test] Clicked gear button.');

  let meetFrame = null;
  for (let i = 0; i < 20; i++) {
    meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
    if (meetFrame) break;
    await page.waitForTimeout(500);
  }

  if (!meetFrame) {
    throw new Error('Google Meet options iframe did not load.');
  }

  console.log('[Test] Found Google Meet settings iframe. Waiting 2.5s...');
  await page.waitForTimeout(2500);

  // Inspect Host controls tab
  console.log('[Test] Clicking "Host controls" tab...');
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.waitFor({ state: 'visible', timeout: 10000 });
  await hostTab.click();
  await page.waitForTimeout(2000);

  // Capture screenshot of Host controls tab
  const hostScreenshot = path.join(AUDIT_DIR, 'debug_host_controls_before.png');
  await page.screenshot({ path: hostScreenshot });
  console.log('[Test] Saved debug_host_controls_before.png');

  // Dump interactive switches and buttons in Host controls
  const hostControlsInfo = await meetFrame.evaluate(() => {
    const switches = Array.from(document.querySelectorAll('[role="switch"], input[type="checkbox"], button')).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      type: el.getAttribute('type'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaChecked: el.getAttribute('aria-checked'),
      checked: el.checked,
      innerText: el.innerText.trim()
    }));
    return switches;
  });

  console.log('[Test] Host Controls elements found:', JSON.stringify(hostControlsInfo, null, 2));

  // Toggle "Host must join before anyone else" to false if found
  const toggleResult = await meetFrame.evaluate(() => {
    // Look for switch with aria-label containing "Host must join before anyone else"
    const switches = Array.from(document.querySelectorAll('[role="switch"], button, input[type="checkbox"]'));
    const hostJoinSwitch = switches.find(s => {
      const label = (s.getAttribute('aria-label') || s.innerText || '').toLowerCase();
      return label.includes('host must join before anyone else') || label.includes('host must join');
    });

    if (hostJoinSwitch) {
      const isChecked = hostJoinSwitch.getAttribute('aria-checked') === 'true' || hostJoinSwitch.checked === true;
      if (isChecked) {
        hostJoinSwitch.click();
        return { found: true, wasChecked: true, toggledTo: false };
      }
      return { found: true, wasChecked: false, toggledTo: false };
    }
    return { found: false };
  });

  console.log('[Test] Toggle result:', toggleResult);
  await page.waitForTimeout(2000);

  // Capture screenshot after toggle
  const hostAfterScreenshot = path.join(AUDIT_DIR, 'debug_host_controls_after.png');
  await page.screenshot({ path: hostAfterScreenshot });
  console.log('[Test] Saved debug_host_controls_after.png');

  // Also verify Meeting records tab
  const recordsTab = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsTab.click();
  await page.waitForTimeout(2000);

  // Click Save inside iframe
  console.log('[Test] Saving modal settings...');
  await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    if (saveBtn) {
      saveBtn.focus();
      saveBtn.click();
    }
  });
  await page.waitForTimeout(2000);

  let iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  if (iframePresent) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Save on main event page
  const mainSaveBtn = page.locator('#xSaveBu').first();
  await mainSaveBtn.click();
  await page.waitForTimeout(2000);

  // Recurrence dialog
  const recDialog = page.locator('div[role="dialog"]:has-text("recurring event"), div[role="dialog"]:has-text("This and following")');
  if (await recDialog.count() > 0) {
    console.log('[Test] Applying to all recurring events in series...');
    const followingRadio = page.locator('label:has-text("This and following"), label:has-text("All events")').first();
    if (await followingRadio.count() > 0) {
      await followingRadio.click();
      await page.waitForTimeout(500);
    }
    const okBtn = page.locator('button:has-text("OK"), button:has-text("Save")').first();
    await okBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(2000);
  console.log('[Test] Event saved successfully!');

  await context.close();
})().catch(err => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
