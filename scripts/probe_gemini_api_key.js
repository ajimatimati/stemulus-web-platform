/**
 * Retrieve Gemini API Key from Google AI Studio on Chrome Profile 8
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  console.log('[Probe] Launching Chrome Profile 8...');
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
  
  try {
    console.log('[Probe] Navigating to https://aistudio.google.com/app/api-keys ...');
    await page.goto('https://aistudio.google.com/app/api-keys', { waitUntil: 'networkidle', timeout: 45000 });
    
    // Wait for either the keys table or create key button
    await page.waitForTimeout(8000);

    const screenshotPath = path.join(__dirname, '..', 'tests', 'aistudio_apikey_loaded.png');
    await page.screenshot({ path: screenshotPath });
    console.log('[Probe] Loaded screenshot saved to:', screenshotPath);

    // Evaluate rows or buttons
    const keyInfo = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr, [role="row"], div[class*="key"], div[class*="row"]'));
      const textAll = document.body.innerText;
      
      // Look for any text matching Gemini key format: AIzaSy...
      const matches = textAll.match(/AIzaSy[0-9A-Za-z-_]{33}/g) || [];

      // Check if there are copy buttons or key links
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a')).map(b => ({
        text: (b.innerText || '').trim(),
        ariaLabel: b.getAttribute('aria-label') || '',
        title: b.getAttribute('title') || ''
      })).filter(b => b.text || b.ariaLabel || b.title);

      return {
        keyCount: matches.length,
        hasMatches: matches.length > 0,
        buttonCount: buttons.length,
        buttonsSample: buttons.slice(0, 15)
      };
    });

    console.log('[Probe] Key Info:', keyInfo);

    // If key not rendered in plaintext, let's see if clicking "Copy key" icon or inspecting the row reveals it
    const copyBtns = page.locator('button[aria-label*="Copy"], button:has-text("Copy"), [data-tooltip*="Copy"]');
    const copyCount = await copyBtns.count();
    console.log('[Probe] Found Copy buttons count:', copyCount);

    if (copyCount > 0) {
      console.log('[Probe] Clicking first Copy key button...');
      await copyBtns.first().click();
      await page.waitForTimeout(2000);
      
      const { execSync } = require('child_process');
      let clip = '';
      try {
        clip = execSync('powershell.exe -NoProfile -Command "Get-Clipboard"').toString().trim();
      } catch(e) {
        console.error('[Probe] Error reading clipboard via PowerShell:', e.message);
      }

      console.log('[Probe] Clipboard key length:', clip ? clip.length : 0);
      if (clip && clip.startsWith('AIzaSy')) {
        console.log('[Probe] Successfully copied authentic Gemini API Key: ' + clip.slice(0, 8) + '...' + clip.slice(-4));
        const envPath = path.join(__dirname, '..', '.env');
        fs.writeFileSync(envPath, `GEMINI_API_KEY=${clip}\n`, 'utf8');
        console.log('[Probe] Saved to project .env file securely!');
      } else {
        console.log('[Probe] Clipboard did not contain expected AIzaSy prefix. Content sample:', clip.slice(0, 50));
      }
    }

  } catch (err) {
    console.error('[Probe] Error:', err.message);
  } finally {
    await context.close();
    console.log('[Probe] Context closed.');
  }
})();
