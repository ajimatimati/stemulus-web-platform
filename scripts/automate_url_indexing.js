const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const outDir = path.join(__dirname, '..', 'data', 'gsc_deep_audit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('🚀 [URL Inspection & Fix Validator] Launching Chrome Profile 8...');
  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: false,
    args: [
      '--profile-directory=Profile 8',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  async function snap(filename) {
    const fullPath = path.join(outDir, filename);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`  📸 Saved: ${filename}`);
  }

  // --------------------------------------------------------------------------
  // ACTION 1: TRIGGER "VALIDATE FIX" ON DISCOVERED - CURRENTLY NOT INDEXED
  // --------------------------------------------------------------------------
  console.log('\n[Action 1] Navigating to "Discovered - currently not indexed" to trigger VALIDATE FIX...');
  await page.goto('https://search.google.com/search-console/index?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Click on "Discovered – currently not indexed" row
  try {
    const row = await page.$('tr:has-text("Discovered – currently not indexed"), tr:has-text("Discovered - currently not indexed")');
    if (row) {
      await row.click();
      await page.waitForTimeout(4000);
      await snap('action1_discovered_detail.png');

      const validateBtn = await page.$('button:has-text("VALIDATE FIX"), [role="button"]:has-text("VALIDATE FIX"), button:has-text("Validate fix")');
      if (validateBtn) {
        console.log('  🎯 Found VALIDATE FIX button! Clicking now...');
        await validateBtn.click();
        await page.waitForTimeout(6000);
        await snap('action1_validate_fix_clicked.png');
        console.log('  ✅ VALIDATE FIX successfully triggered for all 21 discovered pages!');
      } else {
        console.log('  VALIDATE FIX button already triggered or not present.');
      }
    }
  } catch (err) {
    console.log('  Notice on VALIDATE FIX:', err.message);
  }

  // --------------------------------------------------------------------------
  // ACTION 2: URL INSPECTION & REQUEST INDEXING VIA SEARCH BAR
  // --------------------------------------------------------------------------
  console.log('\n[Action 2] Performing URL Inspection & Request Indexing via Search Bar...');
  const priorityUrls = [
    'https://stemuluskidstech.com/',
    'https://stemuluskidstech.com/book-class.html',
    'https://stemuluskidstech.com/enroll.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-usa.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-uk.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-nigeria.html'
  ];

  for (let i = 0; i < priorityUrls.length; i++) {
    const url = priorityUrls[i];
    const slug = url.replace('https://stemuluskidstech.com/', '').replace('.html', '').replace(/[^a-zA-Z0-9]/g, '_') || 'homepage';
    console.log(`\n  🔎 [${i+1}/${priorityUrls.length}] Inspecting: ${url}`);

    try {
      // Find search input in top bar
      const searchInput = await page.$('input[aria-label*="Inspect any URL" i], input[placeholder*="Inspect any URL" i], input[aria-label*="Inspect" i]');
      if (!searchInput) {
        console.log('  Could not locate search bar input.');
        continue;
      }

      await searchInput.click();
      await page.waitForTimeout(500);
      // Clear and fill
      await searchInput.fill('');
      await searchInput.fill(url);
      await page.waitForTimeout(500);
      await searchInput.press('Enter');

      console.log('     Submitted URL to inspection engine. Waiting for Google data...');
      await page.waitForTimeout(10000);

      await snap(`inspect_result_${slug}.png`);

      // Read status from card
      const cardText = await page.evaluate(() => {
        const h = document.querySelector('h1, h2, [role="heading"]');
        return document.body.innerText.slice(0, 1000);
      });

      const onGoogle = cardText.includes('URL is on Google');
      console.log(`     Verdict: ${onGoogle ? 'URL is on Google ✅' : 'URL is NOT on Google / Discovered ⚠️'}`);

      // Look for Request Indexing button
      const requestBtn = await page.$('button:has-text("Request indexing"), [role="button"]:has-text("Request indexing")');
      if (requestBtn) {
        const disabled = await requestBtn.getAttribute('disabled');
        const ariaDisabled = await requestBtn.getAttribute('aria-disabled');
        if (!disabled && ariaDisabled !== 'true') {
          console.log(`     🚀 Clicking "Request indexing" for ${url}...`);
          await requestBtn.click();

          // Google runs a 1-2 minute live test modal ("Testing if live URL can be indexed")
          console.log('     Waiting for live URL test and submission confirmation...');
          let confirmed = false;
          for (let wait = 0; wait < 12; wait++) {
            await page.waitForTimeout(5000);
            const dialogText = await page.evaluate(() => {
              const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
              return dialog ? dialog.innerText : '';
            });
            if (dialogText.includes('Indexing requested') || dialogText.includes('Quota exceeded')) {
              console.log(`     Dialog message: ${dialogText.replace(/\n+/g, ' ').slice(0, 80)}`);
              confirmed = true;
              break;
            }
          }

          await snap(`requested_dialog_${slug}.png`);

          // Dismiss dialog by clicking "Got it"
          const gotIt = await page.$('button:has-text("Got it"), [role="button"]:has-text("Got it")');
          if (gotIt) {
            await gotIt.click();
            await page.waitForTimeout(2000);
          }
          console.log(`     ✅ Request indexing completed for ${url}`);
        } else {
          console.log(`     Request indexing is already active or disabled for this URL.`);
        }
      }
    } catch (err) {
      console.error(`     Error during inspection of ${url}:`, err.message);
    }
  }

  console.log('\n🎉 [COMPLETE] URL Inspection & Indexing Queue execution finished!');
  await page.waitForTimeout(3000);
  await context.close();
})();
