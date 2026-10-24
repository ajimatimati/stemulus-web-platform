const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to admin-login to get into the domain context
  const loginPath = path.resolve(__dirname, '..', 'admin-login.html');
  await page.goto('file:///' + loginPath.replace(/\\/g, '/'));

  // Use StemulusSecurity to save a valid signed session
  await page.evaluate(() => {
    if (typeof StemulusSecurity !== 'undefined') {
      StemulusSecurity.saveSecureSession({
        role: 'admin',
        email: 'admin@stemuluskidstech.com',
        name: 'Super Admin'
      });
      console.log('Secure session saved successfully!');
    } else {
      console.error('StemulusSecurity not loaded on login page!');
    }
  });

  // Now navigate to admin-dashboard.html
  const adminPath = path.resolve(__dirname, '..', 'admin-dashboard.html');
  await page.goto('file:///' + adminPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForTimeout(600);

  console.log('Final Page URL:', page.url());
  const checks = await page.evaluate(() => {
    return {
      hasOpsMount: !!document.getElementById('mount-operations-suite'),
      hasBdayMount: !!document.getElementById('mount-birthday-headquarters'),
      hasModal: !!document.getElementById('modal-transcript-analysis'),
      hasDualSwitcher: !!document.getElementById('mount-admin-dual-switcher'),
      hasLangToggleFr: !!document.getElementById('lang-toggle-fr'),
      hasModeToggleCompact: !!document.getElementById('mode-toggle-compact'),
      hasGeminiTrigger: typeof window.triggerGeminiParentReport === 'function'
    };
  });
  console.log('Checks:', checks);

  await browser.close();
})();
