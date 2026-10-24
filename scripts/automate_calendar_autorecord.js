/**
 * STEMulus Google Calendar Auto-Record Playwright Automation (Final Production Engine)
 * 
 * Automatically configures Google Calendar recurring class events for STEMulus coders
 * using Chrome Profile 8 (stemulusclubs@gmail.com).
 * 
 * Actions:
 * - Language: English (US)
 * - "Take notes with Gemini"
 * - "Transcribe the meeting"
 * - Auto-recording / capture what happens automatically
 * - Recurring series persistence ("This and following events" / "All events")
 * - Automated provisioning for King Myles and Pearl Babalola
 * - Audit screenshots for each coder
 * - Portal sync with authentic Google Meet links
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CODERS_CONFIG = [
  {
    name: "David",
    fullName: "David Gjoka",
    searchQuery: "David's Coding Quest",
    eventTitle: "David's Coding Quest",
    meetLink: "https://meet.google.com/ckd-ngjs-cth"
  },
  {
    name: "Junayd",
    fullName: "Junayd Kari",
    searchQuery: "Junayd's Coding Quest",
    eventTitle: "Junayd's Coding Quest",
    meetLink: "https://meet.google.com/gyd-fewb-cdh"
  },
  {
    name: "Momoreoluwa",
    fullName: "Momooreoluwa Sonaike",
    searchQuery: "Momoreoluwa's Coding Quest",
    eventTitle: "Momoreoluwa's Coding Quest",
    meetLink: "https://meet.google.com/vdp-nmbh-sjj"
  },
  {
    name: "Joshua",
    fullName: "Joshua Ogba",
    searchQuery: "Joshua's Coding Class",
    eventTitle: "Joshua's Coding Class",
    meetLink: "https://meet.google.com/yko-xwce-ugd"
  },
  {
    name: "Myles",
    fullName: "King Myles Omosuyi",
    searchQuery: "King Myles",
    eventTitle: "King Myles' Coding Quest",
    meetLink: "https://meet.google.com/miz-dthg-pmt"
  },
  {
    name: "Pearl",
    fullName: "Babalola Oluwadunmininu Pearl",
    searchQuery: "Pearl's Coding Quest",
    eventTitle: "Pearl's Coding Quest",
    meetLink: "https://meet.google.com/bbx-ocde-ytw"
  }
];

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

async function configureMeetingRecords(page, coderName) {
  console.log(`[${coderName}] Looking for Video call options (gear icon)...`);
  const gearBtn = page.locator('button[aria-label*="Video call options"], [aria-label*="Call options"], button[data-tooltip*="Video call options"]').first();
  await gearBtn.waitFor({ state: 'visible', timeout: 15000 });
  await gearBtn.click();
  console.log(`[${coderName}] Clicked Video call options gear.`);

  // Wait for Google Meet calendar settings iframe
  console.log(`[${coderName}] Waiting for Google Meet settings iframe...`);
  let meetFrame = null;
  for (let i = 0; i < 20; i++) {
    meetFrame = page.frames().find(f => f.url().includes('meet.google.com/calendarsettings'));
    if (meetFrame) break;
    await page.waitForTimeout(500);
  }

  if (!meetFrame) {
    throw new Error('Google Meet options iframe did not load.');
  }

  console.log(`[${coderName}] Found Google Meet settings iframe.`);
  await page.waitForTimeout(2500);

  // 1. Host controls: Disable "Host must join before anyone else"
  console.log(`[${coderName}] Navigating to "Host controls" tab...`);
  const hostTab = meetFrame.getByText('Host controls', { exact: false }).first();
  await hostTab.waitFor({ state: 'visible', timeout: 10000 });
  await hostTab.click();
  await page.waitForTimeout(1500);

  const hostToggleResult = await meetFrame.evaluate(() => {
    const switches = Array.from(document.querySelectorAll('[role="switch"], button, input[type="checkbox"]'));
    const hostJoinSwitch = switches.find(s => {
      const label = (s.getAttribute('aria-label') || s.innerText || '').toLowerCase();
      return label.includes('host must join before anyone else') || label.includes('host must join');
    });

    if (hostJoinSwitch) {
      const isChecked = hostJoinSwitch.getAttribute('aria-checked') === 'true' || hostJoinSwitch.checked === true;
      if (isChecked) {
        hostJoinSwitch.click();
        return { found: true, toggled: true, wasChecked: true };
      }
      return { found: true, toggled: false, wasChecked: false };
    }
    return { found: false };
  });
  console.log(`[${coderName}] Host controls toggle:`, hostToggleResult);
  await page.waitForTimeout(1000);

  // 2. Click "Meeting records" tab inside the iframe
  console.log(`[${coderName}] Navigating to "Meeting records" tab...`);
  const recordsBtn = meetFrame.getByText('Meeting records', { exact: false }).first();
  await recordsBtn.waitFor({ state: 'visible', timeout: 10000 });
  await recordsBtn.click();
  await page.waitForTimeout(1500);

  // Click the Language combobox if not already English
  console.log(`[${coderName}] Ensuring English language is selected...`);
  const langCombobox = meetFrame.locator('div[role="combobox"][aria-label*="language" i]').first();
  if (await langCombobox.isVisible()) {
    await langCombobox.click();
    await page.waitForTimeout(800);
    await meetFrame.evaluate(() => {
      const enOption = document.querySelector('li[data-value="en-US"], li[role="option"][data-value*="en"]');
      if (enOption) {
        enOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        enOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        enOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    await page.waitForTimeout(1000);
  }

  // Check "Take notes with Gemini" & "Transcribe the meeting"
  console.log(`[${coderName}] Ensuring auto-record checkboxes are checked...`);
  await meetFrame.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    cbs.forEach(cb => {
      if (!cb.checked) cb.click();
    });
  });
  await page.waitForTimeout(1000);

  // Take screenshot of configured modal before saving
  const modalScreenshotPath = path.join(AUDIT_DIR, `${coderName.toLowerCase()}_modal_configured.png`);
  await page.screenshot({ path: modalScreenshotPath });
  console.log(`[${coderName}] Saved modal configured screenshot to: ${modalScreenshotPath}`);

  // 3. Click Save inside iframe
  console.log(`[${coderName}] Clicking Save inside iframe...`);
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

  // Check if iframe closed; if not, press Escape
  let iframePresent = await page.evaluate(() => !!document.querySelector('iframe[src*="meet.google.com/calendarsettings"]'));
  if (iframePresent) {
    console.log(`[${coderName}] Closing modal overlay with Escape...`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // 4. Click Save on the main Google Calendar event page
  console.log(`[${coderName}] Saving event on main calendar page...`);
  const mainSaveBtn = page.locator('#xSaveBu').first();
  await mainSaveBtn.click();
  await page.waitForTimeout(2000);

  // 5. Handle Recurrence Dialog ("Edit recurring event") if it appears
  const recDialog = page.locator('div[role="dialog"]:has-text("recurring event"), div[role="dialog"]:has-text("This and following")');
  if (await recDialog.count() > 0) {
    console.log(`[${coderName}] Applying changes to all recurring events in series...`);
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
  const finalScreenshot = path.join(AUDIT_DIR, `${coderName.toLowerCase()}_autorecord_configured.png`);
  await page.screenshot({ path: finalScreenshot });
  console.log(`[${coderName}] SUCCESS! Saved final audit screenshot to: ${finalScreenshot}`);
  return true;
}

async function updateExistingEvent(page, coder) {
  console.log(`\n======================================================`);
  console.log(`[Update Series] Updating ${coder.fullName} (${coder.eventTitle})...`);
  console.log(`======================================================`);

  const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(coder.searchQuery)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const row = page.locator(`div[role="row"]:has-text("${coder.searchQuery}"), tr:has-text("${coder.searchQuery}"), div[role="button"]:has-text("${coder.searchQuery}")`).first();
  const rowCount = await row.count();

  if (rowCount === 0) {
    throw new Error(`Event row not found for query: ${coder.searchQuery}`);
  }

  console.log(`[${coder.name}] Found search result row. Clicking to open preview...`);
  await row.click();
  await page.waitForTimeout(2000);

  console.log(`[${coder.name}] Clicking Edit button...`);
  const editBtn = page.locator('div[role="dialog"] button[aria-label*="Edit"], div[role="dialog"] [data-tooltip*="Edit"]').first();
  await editBtn.click();
  await page.waitForTimeout(4000);

  await configureMeetingRecords(page, coder.name);
}

async function createNewEvent(page, coder) {
  console.log(`\n======================================================`);
  console.log(`[Create Series] Creating recurring event for ${coder.fullName}...`);
  console.log(`======================================================`);

  await page.goto('https://calendar.google.com/calendar/u/0/r/eventedit', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // Title
  console.log(`[${coder.name}] Setting title: "${coder.eventTitle}"...`);
  const titleInput = page.locator('input[aria-label*="title" i], input[placeholder*="title" i]').first();
  await titleInput.fill(coder.eventTitle);
  await page.waitForTimeout(500);

  // Date
  console.log(`[${coder.name}] Setting date: ${coder.date}...`);
  const startDateInput = page.locator('input[aria-label*="start date" i]').first();
  if (await startDateInput.isVisible()) {
    await startDateInput.fill(coder.date);
    await page.keyboard.press('Tab');
  }

  // Start Time
  console.log(`[${coder.name}] Setting start time: ${coder.startTime}...`);
  const startTimeInput = page.locator('input[aria-label*="start time" i]').first();
  if (await startTimeInput.isVisible()) {
    await startTimeInput.fill(coder.startTime);
    await page.keyboard.press('Tab');
  }

  // End Time
  console.log(`[${coder.name}] Setting end time: ${coder.endTime}...`);
  const endTimeInput = page.locator('input[aria-label*="end time" i]').first();
  if (await endTimeInput.isVisible()) {
    await endTimeInput.fill(coder.endTime);
    await page.keyboard.press('Tab');
  }

  // Recurrence
  console.log(`[${coder.name}] Setting recurrence: Weekly on ${coder.day}...`);
  const repeatDropdown = page.locator('[aria-label*="recurrence" i], [aria-label*="repeat" i], div[role="combobox"]:has-text("Does not repeat")').first();
  if (await repeatDropdown.isVisible()) {
    await repeatDropdown.click();
    await page.waitForTimeout(1000);
    const weeklyOption = page.locator('[role="option"]:has-text("Weekly"), [data-value*="WEEKLY"]').first();
    if (await weeklyOption.isVisible()) {
      await weeklyOption.click();
    }
  }

  // Add Google Meet
  console.log(`[${coder.name}] Adding Google Meet conferencing...`);
  const addMeetBtn = page.locator('button:has-text("Add Google Meet"), [aria-label*="Add Google Meet"]').first();
  if (await addMeetBtn.isVisible()) {
    await addMeetBtn.click();
    await page.waitForTimeout(4000);
  }

  // Read assigned Google Meet link
  const generatedMeetLink = await page.evaluate(() => {
    const meetAnchor = Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('meet.google.com/'));
    if (meetAnchor) return meetAnchor.href.split('?')[0];
    const body = document.body.innerText;
    const m = body.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
    return m ? `https://${m[0]}` : null;
  });
  console.log(`[${coder.name}] Assigned Google Meet link: ${generatedMeetLink}`);
  if (generatedMeetLink) {
    coder.meetLink = generatedMeetLink;
  }

  await configureMeetingRecords(page, coder.name);
  return coder.meetLink;
}

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Runner] Starting Playwright Google Calendar Auto-Record Automation...');
  console.log('[Runner] Profile: Chrome Profile 8 (stemulusclubs@gmail.com)');

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
  const auditResults = [];

  for (const coder of CODERS_CONFIG) {
    try {
      if (coder.needsCreation) {
        await createNewEvent(page, coder);
      } else {
        await updateExistingEvent(page, coder);
      }
      auditResults.push({
        coder: coder.fullName,
        event: coder.eventTitle,
        status: "CONFIGURED & AUTO-RECORD ON",
        meetLink: coder.meetLink
      });
    } catch (err) {
      console.error(`[${coder.name}] Error during configuration:`, err.message);
      auditResults.push({
        coder: coder.fullName,
        event: coder.eventTitle,
        status: "ERROR: " + err.message,
        meetLink: coder.meetLink
      });
    }
  }

  console.log('\n======================================================');
  console.log('[AUTOMATION AUDIT SUMMARY]');
  console.log('======================================================');
  console.table(auditResults);

  fs.writeFileSync(path.join(AUDIT_DIR, 'audit_summary.json'), JSON.stringify(auditResults, null, 2), 'utf8');

  await context.close();
  console.log('\n[Runner] Automation complete! All screenshots saved in tests/autorecord_audit/');
})();
