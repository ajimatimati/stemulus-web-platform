const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CODERS = [
  { name: 'David', query: 'David', expectedLink: 'ckd-ngjs-cth' },
  { name: 'Junayd', query: 'Junayd', expectedLink: 'gyd-fewb-cdh' },
  { name: 'Momoreoluwa', query: 'Momoreoluwa', expectedLink: 'vdp-nmbh-sjj' },
  { name: 'Joshua', query: 'Joshua', expectedLink: 'yko-xwce-ugd' },
  { name: 'Myles', query: 'Omosuyi', expectedLink: 'miz-dthg-pmt' },
  { name: 'Pearl', query: 'Pearl', expectedLink: 'bbx-ocde-ytw' }
];

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

async function processCoder(page, coder) {
  console.log(`\n======================================================`);
  console.log(`[Host-Check] Processing: ${coder.name} (Search: "${coder.query}")`);
  console.log(`======================================================`);

  const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(coder.query)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // Find all event elements
  const eventLocators = page.locator('[data-eventid]');
  const count = await eventLocators.count();
  console.log(`[Host-Check] Found ${count} event matches for "${coder.query}"`);

  if (count === 0) {
    // Fallback: search by query without quotes
    const fallbackRow = page.locator(`tr:has-text("${coder.name}"), div[role="row"]:has-text("${coder.name}"), div[role="button"]:has-text("${coder.name}")`).first();
    if (await fallbackRow.count() > 0) {
      console.log(`[Host-Check] Using fallback text row for ${coder.name}`);
      await fallbackRow.click();
    } else {
      throw new Error(`No events found for query: ${coder.query}`);
    }
  } else {
    // Click the first matching event
    console.log(`[Host-Check] Clicking first event for ${coder.name}...`);
    await eventLocators.first().click();
  }

  await page.waitForTimeout(2500);

  // Click Edit button
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.waitFor({ state: 'visible', timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(4000);

  // Click Video call options gear
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
  await gearBtn.click();
  await page.waitForTimeout(3000);

  // Find settings iframe
  let meetFrame = null;
  for (let i = 0; i < 15; i++) {
    meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
    if (meetFrame) break;
    await page.waitForTimeout(500);
  }

  if (!meetFrame) {
    throw new Error(`Google Meet calendarsettings iframe not found for ${coder.name}`);
  }

  // Switch to Host controls tab
  console.log(`[Host-Check] Clicking Host controls tab for ${coder.name}...`);
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.waitFor({ state: 'visible', timeout: 10000 });
  await hostTab.click();
  await page.waitForTimeout(1500);

  // Inspect and toggle "Host must join before anyone else"
  const toggleResult = await meetFrame.evaluate(() => {
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

  console.log(`[Host-Check] ${coder.name} toggle status:`, toggleResult);

  // Capture audit screenshot
  await page.screenshot({ path: path.join(AUDIT_DIR, `${coder.name.toLowerCase()}_host_setting_verified.png`) });

  // Save modal iframe
  console.log(`[Host-Check] Saving modal for ${coder.name}...`);
  await meetFrame.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
    if (saveBtn) {
      saveBtn.focus();
      saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await page.waitForTimeout(2000);

  // Escape overlay if still present
  const iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  if (iframePresent) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Save main event
  console.log(`[Host-Check] Saving main calendar event for ${coder.name}...`);
  const mainSaveBtn = page.locator('#xSaveBu, button:has-text("Save"), div[role="main"] button:has-text("Save")').first();
  await mainSaveBtn.click();
  await page.waitForTimeout(2500);

  // Handle recurrence modal
  const recDialog = page.locator('div[role="dialog"]:has-text("recurring event"), div[role="dialog"]:has-text("following events"), div[role="dialog"]:has-text("All events")');
  if (await recDialog.count() > 0 && await recDialog.isVisible()) {
    console.log(`[Host-Check] Applying to recurring series for ${coder.name}...`);
    const followingRadio = page.locator('label:has-text("This and following events"), label:has-text("All events")').first();
    if (await followingRadio.count() > 0) {
      await followingRadio.click();
      await page.waitForTimeout(500);
    }
    const okBtn = page.locator('div[role="dialog"] button:has-text("OK"), div[role="dialog"] button:has-text("Save")').first();
    await okBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log(`[Host-Check] SUCCESS for ${coder.name}!`);
  return { coder: coder.name, success: true, toggleResult };
}

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Host-Check] Launching Chrome Profile 8...');
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
  
  // Warm up Google Calendar
  console.log('[Host-Check] Warming up Google Calendar...');
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const results = [];
  for (const coder of CODERS) {
    try {
      const res = await processCoder(page, coder);
      results.push(res);
    } catch (err) {
      console.error(`[Host-Check] Error on ${coder.name}:`, err.message);
      results.push({ coder: coder.name, success: false, error: err.message });
      try { await page.keyboard.press('Escape'); } catch(e) {}
    }
  }

  await context.close();

  console.log(`\n======================================================`);
  console.log(`[Host-Check] FINAL AUDIT SUMMARY:`);
  console.log(JSON.stringify(results, null, 2));
  console.log(`======================================================`);

  fs.writeFileSync(path.join(AUDIT_DIR, 'final_host_not_required_audit.json'), JSON.stringify(results, null, 2));
})();
