const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const srcUserData = 'C:\\Users\\USER\\AppData\\Local\\Google\\Chrome\\User Data';

async function tryProfile(profileName) {
  const tempDir = path.join(os.tmpdir(), 'chrome_scrape_' + profileName.replace(' ', '_') + '_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  fs.copyFileSync(path.join(srcUserData, 'Local State'), path.join(tempDir, 'Local State'));

  function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      try {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          if (item === 'Cache' || item === 'Code Cache' || item === 'GPUCache' || item === 'DawnGraphiteCache') continue;
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch(e) {}
    }
  }

  console.log(`\n========================================`);
  console.log(`Trying ${profileName}...`);
  console.log(`========================================`);
  copyDir(path.join(srcUserData, profileName), path.join(tempDir, profileName));

  try {
    const context = await chromium.launchPersistentContext(tempDir, {
      channel: 'chrome',
      headless: true,
      args: [`--profile-directory=${profileName}`, '--no-first-run', '--no-default-browser-check']
    });
    const page = await context.newPage();
    console.log('Navigating with domcontentloaded...');
    await page.goto('https://docs.google.com/spreadsheets/d/1_k6f2Ze6XcRgyWh05Lmz6dnFY9JjDg1eKcrArJDGCmk/edit?usp=sharing', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('DOM Content Loaded. Waiting 5s for UI hydration...');
    await page.waitForTimeout(6000);
    
    console.log('Page Title:', await page.title());
    console.log('Current URL:', page.url());
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Text preview (300 chars):', text.substring(0, 300).replace(/\n/g, ' '));
    
    if (!text.includes('You need access') && !page.url().includes('signin') && !page.url().includes('accounts.google.com')) {
      console.log('>>> SUCCESS! SPREADSHEET OPENED! Fetching CSV export within authenticated session... <<<');
      
      const csvData = await page.evaluate(async () => {
        const res = await fetch('https://docs.google.com/spreadsheets/d/1_k6f2Ze6XcRgyWh05Lmz6dnFY9JjDg1eKcrArJDGCmk/export?format=csv&gid=1390153901');
        return await res.text();
      });
      
      fs.writeFileSync(path.join(__dirname, '..', 'data', 'tutor_onboarding_responses.csv'), csvData, 'utf8');
      console.log('Successfully saved CSV export to data/tutor_onboarding_responses.csv!');
      console.log('CSV Preview:\n', csvData.substring(0, 1000));
      
      await context.close();
      return true;
    }
    await context.close();
  } catch(e) {
    console.error(`Error with ${profileName}:`, e.message);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
  }
  return false;
}

(async () => {
  const profiles = ['Profile 2', 'Default', 'Profile 8', 'Profile 7', 'Profile 5'];
  for (const p of profiles) {
    const success = await tryProfile(p);
    if (success) {
      console.log(`\nSuccessfully fetched sheet with ${p}!`);
      break;
    }
  }
  process.exit(0);
})();
