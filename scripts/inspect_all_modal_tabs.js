const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('Inspecting Google Meet settings modal tabs (Host controls, Meeting records, Gemini)...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: ['--profile-directory=Profile 8']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  // Go to search for David's Coding Quest
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=David%27s%20Coding%20Quest', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click row
  const row = page.locator('div[role="row"]:has-text("David\'s Coding Quest"), tr:has-text("David\'s Coding Quest"), div[role="button"]:has-text("David\'s Coding Quest")').first();
  await row.click();
  await page.waitForTimeout(2000);

  // Click Edit
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  // Click Gear
  await page.locator('button[aria-label*="Video call options"]').first().click();
  await page.waitForTimeout(3000);

  const meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
  if (!meetFrame) {
    console.error('Frame not found');
    await context.close();
    return;
  }

  // 1. Inspect Host controls tab
  console.log('--- Inspecting Host controls ---');
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.click();
  await page.waitForTimeout(2000);
  const hostContent = await meetFrame.evaluate(() => {
    return {
      text: document.body.innerText,
      toggles: Array.from(document.querySelectorAll('input[type="checkbox"], [role="switch"]')).map(el => ({
        ariaLabel: el.getAttribute('aria-label'),
        checked: el.checked || el.getAttribute('aria-checked'),
        role: el.getAttribute('role'),
        id: el.id,
        outerHTML: el.outerHTML.substring(0, 150)
      }))
    };
  });
  console.log('Host controls content:', JSON.stringify(hostContent, null, 2));
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_tab_host_controls.png') });

  // 2. Inspect Meeting records tab
  console.log('--- Inspecting Meeting records ---');
  const recordsTab = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsTab.click();
  await page.waitForTimeout(2000);
  const recordsContent = await meetFrame.evaluate(() => {
    return {
      text: document.body.innerText,
      checkboxes: Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]')).map(el => ({
        ariaLabel: el.getAttribute('aria-label'),
        checked: el.checked || el.getAttribute('aria-checked'),
        outerHTML: el.outerHTML.substring(0, 150)
      }))
    };
  });
  console.log('Meeting records content:', JSON.stringify(recordsContent, null, 2));
  await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_tab_meeting_records.png') });

  // 3. Inspect Gemini tab
  console.log('--- Inspecting Gemini tab ---');
  const geminiTab = meetFrame.getByText('Gemini', { exact: true }).first();
  if (await geminiTab.count() > 0) {
    await geminiTab.click();
    await page.waitForTimeout(2000);
    const geminiContent = await meetFrame.evaluate(() => {
      return {
        text: document.body.innerText
      };
    });
    console.log('Gemini tab content:', JSON.stringify(geminiContent, null, 2));
    await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'autorecord_audit', 'debug_tab_gemini.png') });
  }

  await context.close();
})();
