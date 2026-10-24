const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AUDIT_DIR = path.join(__dirname, '..', 'tests', 'autorecord_audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

const LINKS = [
  { name: 'David', url: 'https://meet.google.com/ckd-ngjs-cth' },
  { name: 'Junayd', url: 'https://meet.google.com/gyd-fewb-cdh' },
  { name: 'Momoreoluwa', url: 'https://meet.google.com/vdp-nmbh-sjj' },
  { name: 'Joshua', url: 'https://meet.google.com/yko-xwce-ugd' },
  { name: 'Myles', url: 'https://meet.google.com/miz-dthg-pmt' },
  { name: 'Pearl', url: 'https://meet.google.com/bbx-ocde-ytw' }
];

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  console.log('[Lobby-Audit] Launching clean Chrome instance (no auth) to audit Meet lobbies...');
  
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--incognito', '--disable-blink-features=AutomationControlled']
  });

  const results = [];

  for (const item of LINKS) {
    console.log(`\n[Lobby-Audit] Testing ${item.name}: ${item.url}`);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: []
    });
    const page = await context.newPage();

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(4000);

      const bodyText = await page.innerText('body');
      const hasWaitingForHost = bodyText.toLowerCase().includes('waiting for host') || bodyText.toLowerCase().includes('waiting for the host');
      const hasGettingReady = bodyText.toLowerCase().includes('getting ready') || bodyText.toLowerCase().includes('ready to join') || bodyText.toLowerCase().includes("what's your name") || bodyText.toLowerCase().includes('sign in');
      
      const screenshotPath = path.join(AUDIT_DIR, `${item.name.toLowerCase()}_unauth_lobby.png`);
      await page.screenshot({ path: screenshotPath });

      console.log(`[Lobby-Audit] ${item.name} -> WaitingForHost: ${hasWaitingForHost}, Ready/Lobby: ${hasGettingReady}`);
      results.push({
        name: item.name,
        url: item.url,
        hasWaitingForHost,
        hasGettingReady,
        accessibleWithoutHost: !hasWaitingForHost
      });
    } catch (err) {
      console.error(`[Lobby-Audit] Error testing ${item.name}:`, err.message);
      results.push({ name: item.name, url: item.url, error: err.message, accessibleWithoutHost: false });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n[Lobby-Audit] FINAL AUDIT SUMMARY:');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(path.join(AUDIT_DIR, 'all_coders_lobby_audit.json'), JSON.stringify(results, null, 2));
})();
