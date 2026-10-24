const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');

  const context = await chromium.launchPersistentContext(targetUserData, {
    executablePath: chromePath,
    headless: true,
    args: ['--profile-directory=Profile 8']
  });

  const page = await context.newPage();
  
  // Go to default calendar view (today)
  await page.goto('https://calendar.google.com/calendar/u/0/r', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const currentUrl = page.url();
  console.log('Current calendar view URL:', currentUrl);

  // Search "Myles"
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=Myles', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const mylesSearch = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div, tr, span'))
      .map(el => el.innerText.trim())
      .filter(t => t.includes("Myles"))
      .slice(0, 5);
  });
  console.log('Myles search results:', mylesSearch);

  // Search "Pearl"
  await page.goto('https://calendar.google.com/calendar/u/0/r/search?q=Pearl', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const pearlSearch = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div, tr, span'))
      .map(el => el.innerText.trim())
      .filter(t => t.includes("Pearl"))
      .slice(0, 5);
  });
  console.log('Pearl search results:', pearlSearch);

  // Look for any links or dates
  const searchRowText = await page.evaluate(() => {
    const main = document.querySelector('[role="main"]');
    return main ? main.innerText : document.body.innerText.substring(0, 500);
  });
  console.log('Search page main text:\n', searchRowText);

  await context.close();
})();
