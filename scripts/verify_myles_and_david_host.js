const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

async function verifyCoder(page, name, query) {
  console.log(`\n======================================================`);
  console.log(`[Target-Check] Searching for ${name} using "${query}"...`);
  console.log(`======================================================`);

  await page.goto(`https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const locators = page.locator('[data-eventid]');
  const count = await locators.count();
  console.log(`[Target-Check] Matches for ${name}: ${count}`);

  if (count === 0) {
    throw new Error(`No events found for ${query}`);
  }

  await locators.first().click();
  await page.waitForTimeout(2500);

  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.waitFor({ state: 'visible', timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(4000);

  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  let meetFrame = null;
  for (let i = 0; i < 15; i++) {
    meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
    if (meetFrame) break;
    await page.waitForTimeout(500);
  }

  if (!meetFrame) throw new Error(`Google Meet frame not found for ${name}`);

  console.log(`[Target-Check] Clicking Host controls tab for ${name}...`);
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.waitFor({ state: 'visible', timeout: 10000 });
  await hostTab.click();
  await page.waitForTimeout(1500);

  const toggleStatus = await meetFrame.evaluate(() => {
    const switches = Array.from(document.querySelectorAll('button[role="switch"], [role="switch"]'));
    const hostJoinSwitch = switches.find(s => {
      const label = (s.getAttribute('aria-label') || s.innerText || '').toLowerCase();
      return label.includes('host must join before anyone else');
    });

    if (hostJoinSwitch) {
      const isChecked = hostJoinSwitch.getAttribute('aria-checked') === 'true';
      if (isChecked) {
        hostJoinSwitch.click();
        return { found: true, wasChecked: true, nowChecked: false, toggled: true };
      }
      return { found: true, wasChecked: false, nowChecked: false, toggled: false, alreadyOff: true };
    }
    return { found: false, error: 'Switch not found' };
  });

  console.log(`[Target-Check] ${name} toggle status:`, toggleStatus);
  await page.screenshot({ path: path.join(AUDIT_DIR, `${name.toLowerCase()}_host_verified.png`) });

  // Save iframe
  await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    if (saveBtn) {
      saveBtn.focus();
      saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await page.waitForTimeout(2000);

  // Close iframe overlay if needed
  const iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  if (iframePresent) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Save main event
  const mainSaveBtn = page.locator('#xSaveBu, button:has-text("Save"), div[role="main"] button:has-text("Save")').first();
  await mainSaveBtn.click();
  await page.waitForTimeout(2500);

  // Recurrence dialog
  const recDialog = page.locator('div[role="dialog"]:has-text("recurring event"), div[role="dialog"]:has-text("following events"), div[role="dialog"]:has-text("All events")');
  if (await recDialog.count() > 0 && await recDialog.isVisible()) {
    console.log(`[Target-Check] Applying to recurring series for ${name}...`);
    const followingRadio = page.locator('label:has-text("This and following events"), label:has-text("All events")').first();
    if (await followingRadio.count() > 0) {
      await followingRadio.click();
      await page.waitForTimeout(500);
    }
    const okBtn = page.locator('div[role="dialog"] button:has-text("OK"), div[role="dialog"] button:has-text("Save")').first();
    await okBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log(`[Target-Check] SUCCESS for ${name}!`);
  return { name, success: true, toggleStatus };
}

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Target-Check] Launching Chrome Profile 8...');
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
  
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  const results = [];
  
  // 1. David
  try {
    const resDavid = await verifyCoder(page, 'David', 'David');
    results.push(resDavid);
  } catch(e) {
    console.error('David error:', e.message);
    results.push({ name: 'David', success: false, error: e.message });
    try { await page.keyboard.press('Escape'); } catch(err) {}
  }

  // 2. Myles
  try {
    const resMyles = await verifyCoder(page, 'Myles', 'King Myles');
    results.push(resMyles);
  } catch(e) {
    console.error('Myles error:', e.message);
    results.push({ name: 'Myles', success: false, error: e.message });
    try { await page.keyboard.press('Escape'); } catch(err) {}
  }

  await context.close();
  console.log('\n[Target-Check] Results:', JSON.stringify(results, null, 2));
})();
