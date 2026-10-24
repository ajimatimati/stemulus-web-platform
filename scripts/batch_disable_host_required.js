const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CODERS = [
  { name: 'David', query: "David's Coding Quest", meet: 'https://meet.google.com/ckd-ngjs-cth' },
  { name: 'Junayd', query: "Junayd's Coding Quest", meet: 'https://meet.google.com/gyd-fewb-cdh' },
  { name: 'Momoreoluwa', query: "Momoreoluwa's Coding Quest", meet: 'https://meet.google.com/vdp-nmbh-sjj' },
  { name: 'Joshua', query: "Joshua's Coding Class", meet: 'https://meet.google.com/yko-xwce-ugd' },
  { name: 'Myles', query: "King Myles", meet: 'https://meet.google.com/miz-dthg-pmt' },
  { name: 'Pearl', query: "Pearl's Coding Quest", meet: 'https://meet.google.com/bbx-ocde-ytw' }
];

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Batch Toggle] Launching Chrome Profile 8 to ensure "Host must join before anyone else" is OFF for all coders...');
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
  const report = [];

  for (const coder of CODERS) {
    console.log(`\n======================================================`);
    console.log(`[Batch Toggle] Processing: ${coder.name} (${coder.query})`);
    console.log(`======================================================`);

    try {
      const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(coder.query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);

      // Find search result row
      const row = page.locator(`div[role="row"]:has-text("${coder.query}"), tr:has-text("${coder.query}"), div[role="button"]:has-text("${coder.query}")`).first();
      if (await row.count() === 0) {
        console.warn(`[Batch Toggle] No row found for query: ${coder.query}`);
        report.push({ name: coder.name, success: false, reason: 'Event not found in search' });
        continue;
      }

      await row.click();
      await page.waitForTimeout(2000);

      const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
      await editBtn.click();
      await page.waitForTimeout(3500);

      const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
      await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
      await gearBtn.click();
      await page.waitForTimeout(3000);

      const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
      if (!meetFrame) {
        throw new Error(`Google Meet calendarsettings frame not found for ${coder.name}`);
      }

      // Click Host controls tab
      console.log(`[Batch Toggle] Navigating to Host controls tab for ${coder.name}...`);
      const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
      await hostTab.waitFor({ state: 'visible', timeout: 10000 });
      await hostTab.click();
      await page.waitForTimeout(1500);

      // Toggle switch OFF if it is ON
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

      console.log(`[Batch Toggle] ${coder.name} toggle status:`, toggleStatus);

      // Take audit screenshot inside iframe
      const hostScreenshot = path.join(AUDIT_DIR, `${coder.name.toLowerCase()}_host_controls_off.png`);
      await page.screenshot({ path: hostScreenshot });

      // Click Save in iframe
      console.log(`[Batch Toggle] Clicking Save in iframe for ${coder.name}...`);
      await meetFrame.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Save');
        if (saveBtn) {
          saveBtn.focus();
          saveBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          saveBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await page.waitForTimeout(2000);

      // Close iframe overlay if still present
      const iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
      if (iframePresent) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
      }

      // Click main event Save button
      console.log(`[Batch Toggle] Clicking main event Save button for ${coder.name}...`);
      const mainSaveBtn = page.locator('div[role="main"] button:has-text("Save"), div#xSavB:visible, button#xSaveBu, button:has-text("Save")').first();
      await mainSaveBtn.click();
      await page.waitForTimeout(2500);

      // Check recurring dialog
      const recDialog = page.locator('div[role="dialog"]:has-text("recurring event"), div[role="dialog"]:has-text("following events"), div[role="dialog"]:has-text("All events")');
      if (await recDialog.count() > 0 && await recDialog.isVisible()) {
        console.log(`[Batch Toggle] Applying to recurring series for ${coder.name}...`);
        const followingRadio = page.locator('label:has-text("This and following events"), label:has-text("All events")').first();
        if (await followingRadio.count() > 0) {
          await followingRadio.click();
          await page.waitForTimeout(500);
        }
        const okBtn = page.locator('div[role="dialog"] button:has-text("OK"), div[role="dialog"] button:has-text("Save")').first();
        await okBtn.click();
        await page.waitForTimeout(3000);
      }

      console.log(`[Batch Toggle] Successfully saved ${coder.name} settings!`);
      report.push({ name: coder.name, success: true, toggleStatus });

    } catch (err) {
      console.error(`[Batch Toggle] Error processing ${coder.name}:`, err.message);
      report.push({ name: coder.name, success: false, error: err.message });
      // Try to recover page
      try { await page.keyboard.press('Escape'); } catch (e) {}
    }
  }

  await context.close();

  console.log(`\n======================================================`);
  console.log(`[Batch Toggle] SUMMARY REPORT:`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`======================================================`);

  fs.writeFileSync(path.join(AUDIT_DIR, 'batch_host_toggle_report.json'), JSON.stringify(report, null, 2));
})();
