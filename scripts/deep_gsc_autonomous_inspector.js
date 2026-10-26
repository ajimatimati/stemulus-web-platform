const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
  const targetUserData = path.join(process.env.USERPROFILE, '.stemulus_chrome_profile8_exact');
  const outDir = path.join(__dirname, '..', 'data', 'gsc_deep_audit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const auditData = {
    timestamp: new Date().toISOString(),
    pagesReport: {},
    notIndexedReasons: [],
    performanceReport: {},
    topQueries: [],
    topPages: [],
    topCountries: [],
    sitemaps: [],
    manualActions: 'Unknown',
    securityIssues: 'Unknown',
    inspectedUrls: []
  };

  console.log('🚀 [GSC Autonomous Inspector] Launching Chrome Profile 8...');
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

  // Helper for taking screenshots
  async function snap(filename) {
    const fullPath = path.join(outDir, filename);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`  📸 Screenshot saved: ${filename}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 1: PAGES / INDEXING REPORT
  // --------------------------------------------------------------------------
  console.log('\n[1/5] 📄 Inspecting Indexing / Pages Report...');
  await page.goto('https://search.google.com/search-console/index?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  await snap('01_pages_overview.png');

  // Extract not indexed reasons table
  try {
    const reasonsData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const cells = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
        return {
          reason: cells[0] || '',
          source: cells[1] || '',
          validation: cells[2] || '',
          trend: cells[3] || '',
          pages: cells[4] || cells[cells.length - 1] || ''
        };
      }).filter(item => item.reason.length > 0);
    });
    auditData.notIndexedReasons = reasonsData;
    console.log(`  Found ${reasonsData.length} reasons why pages are not indexed:`);
    reasonsData.forEach(r => console.log(`   - "${r.reason}": ${r.pages} pages`));
  } catch (err) {
    console.error('  Error extracting not indexed table:', err.message);
  }

  // Click into the top 3 not-indexed reasons to get exact affected URLs
  try {
    const reasonRows = await page.$$('table tbody tr');
    for (let i = 0; i < Math.min(reasonRows.length, 4); i++) {
      const row = (await page.$$('table tbody tr'))[i];
      if (!row) continue;
      const text = await row.innerText();
      const firstCol = text.split('\t')[0] || `reason_${i+1}`;
      console.log(`  🔍 Drilling into reason: ${firstCol.slice(0, 40)}...`);
      await row.click();
      await page.waitForTimeout(4000);

      const sanitized = firstCol.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      await snap(`01_reason_${i+1}_${sanitized}.png`);

      // Extract example URLs
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('table tbody tr td span, table tbody tr td a'));
        return links.map(el => el.innerText.trim()).filter(t => t.startsWith('http'));
      });
      console.log(`     Affected example URLs (${urls.length}):`, urls.slice(0, 5));

      if (auditData.notIndexedReasons[i]) {
        auditData.notIndexedReasons[i].exampleUrls = urls;
      }

      // Go back
      await page.goBack();
      await page.waitForTimeout(4000);
    }
  } catch (err) {
    console.error('  Error drilling into reasons:', err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: PERFORMANCE REPORT
  // --------------------------------------------------------------------------
  console.log('\n[2/5] 📈 Inspecting Search Performance Report...');
  await page.goto('https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);

  // Toggle CTR and Average Position checkboxes if visible
  try {
    const toggles = await page.$$('[role="checkbox"], [aria-checked]');
    for (const toggle of toggles) {
      const checked = await toggle.getAttribute('aria-checked');
      if (checked === 'false') {
        await toggle.click();
        await page.waitForTimeout(500);
      }
    }
    await page.waitForTimeout(2000);
  } catch (e) {}

  await snap('02_performance_overview.png');

  // Extract KPI totals (clicks, impressions, CTR, position)
  try {
    const kpis = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-metric], .goog-inline-block, [role="button"]'));
      return cards.map(c => c.innerText.trim()).filter(t => t.includes('Clicks') || t.includes('Impressions') || t.includes('CTR') || t.includes('Position')).slice(0, 6);
    });
    auditData.performanceReport.kpis = kpis;
  } catch (e) {}

  // Scrape Top Queries
  try {
    const queries = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const cells = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
        return { query: cells[0] || '', clicks: cells[1] || '', impressions: cells[2] || '', ctr: cells[3] || '', position: cells[4] || '' };
      }).filter(q => q.query.length > 0).slice(0, 20);
    });
    auditData.topQueries = queries;
    console.log(`  Top Queries retrieved: ${queries.length}`);
    queries.slice(0, 5).forEach(q => console.log(`   - "${q.query}": ${q.clicks} clicks, ${q.impressions} impr, pos: ${q.position}`));
  } catch (e) {}

  // Click on "PAGES" tab in performance table
  try {
    const tabs = await page.$$('[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.innerText();
      if (text.includes('PAGES') || text.includes('Pages')) {
        await tab.click();
        await page.waitForTimeout(3000);
        await snap('02_performance_pages.png');
        const topPages = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(r => {
            const cells = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
            return { page: cells[0] || '', clicks: cells[1] || '', impressions: cells[2] || '', ctr: cells[3] || '', position: cells[4] || '' };
          }).filter(p => p.page.length > 0).slice(0, 20);
        });
        auditData.topPages = topPages;
        console.log(`  Top Landing Pages in search: ${topPages.length}`);
        topPages.slice(0, 5).forEach(p => console.log(`   - ${p.page}: ${p.clicks} clicks, ${p.impressions} impr`));
        break;
      }
    }
  } catch (e) {}

  // Click on "COUNTRIES" tab in performance table
  try {
    const tabs = await page.$$('[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.innerText();
      if (text.includes('COUNTRIES') || text.includes('Countries')) {
        await tab.click();
        await page.waitForTimeout(3000);
        await snap('02_performance_countries.png');
        const countries = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(r => {
            const cells = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
            return { country: cells[0] || '', clicks: cells[1] || '', impressions: cells[2] || '', ctr: cells[3] || '', position: cells[4] || '' };
          }).filter(p => p.country.length > 0).slice(0, 20);
        });
        auditData.topCountries = countries;
        console.log(`  Top Countries in search: ${countries.length}`);
        countries.slice(0, 5).forEach(c => console.log(`   - ${c.country}: ${c.clicks} clicks, ${c.impressions} impr`));
        break;
      }
    }
  } catch (e) {}

  // --------------------------------------------------------------------------
  // SECTION 3: SITEMAPS REPORT & FRESH SUBMISSION
  // --------------------------------------------------------------------------
  console.log('\n[3/5] 🗺️ Inspecting Sitemaps & Submitting Fresh sitemap.xml...');
  await page.goto('https://search.google.com/search-console/sitemaps?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Submit sitemap.xml
  try {
    const input = await page.$('input[aria-label*="sitemap" i], input[placeholder*="sitemap" i], input[type="text"]');
    if (input) {
      await input.fill('sitemap.xml');
      await page.waitForTimeout(1000);
      const submitBtn = await page.$('button:has-text("Submit"), [role="button"]:has-text("Submit")');
      if (submitBtn) {
        console.log('  Submitting fresh sitemap.xml...');
        await submitBtn.click();
        await page.waitForTimeout(6000);
      }
    }
  } catch (err) {
    console.log('  Notice on sitemap submission:', err.message);
  }

  await snap('03_sitemaps_status.png');

  // Extract sitemaps table
  try {
    const sitemaps = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const cells = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
        return { sitemap: cells[0] || '', type: cells[1] || '', submitted: cells[2] || '', lastRead: cells[3] || '', status: cells[4] || '', discovered: cells[5] || '' };
      }).filter(s => s.sitemap.length > 0);
    });
    auditData.sitemaps = sitemaps;
    console.log(`  Sitemaps in account:`, sitemaps);
  } catch (e) {}

  // --------------------------------------------------------------------------
  // SECTION 4: SECURITY & MANUAL ACTIONS
  // --------------------------------------------------------------------------
  console.log('\n[4/5] 🛡️ Inspecting Security & Manual Actions...');
  await page.goto('https://search.google.com/search-console/manual-actions?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await snap('04_manual_actions.png');
  const manualText = await page.innerText('body');
  auditData.manualActions = manualText.includes('No issues detected') ? 'No issues detected ✅' : 'Review needed ⚠️';
  console.log('  Manual Actions Status:', auditData.manualActions);

  await page.goto('https://search.google.com/search-console/security-issues?resource_id=sc-domain:stemuluskidstech.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  await snap('04_security_issues.png');
  const secText = await page.innerText('body');
  auditData.securityIssues = secText.includes('No issues detected') ? 'No issues detected ✅' : 'Review needed ⚠️';
  console.log('  Security Issues Status:', auditData.securityIssues);

  // --------------------------------------------------------------------------
  // SECTION 5: URL INSPECTION FOR PRIORITY CONVERSION PAGES
  // --------------------------------------------------------------------------
  console.log('\n[5/5] 🔎 Inspecting Priority Landing Pages via URL Inspection API/UI...');
  const targetUrls = [
    'https://stemuluskidstech.com/',
    'https://stemuluskidstech.com/book-class.html',
    'https://stemuluskidstech.com/enroll.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-usa.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-uk.html',
    'https://stemuluskidstech.com/coding-classes-for-kids-nigeria.html'
  ];

  for (let i = 0; i < targetUrls.length; i++) {
    const targetUrl = targetUrls[i];
    console.log(`\n  👉 Inspecting URL ${i+1}/${targetUrls.length}: ${targetUrl}`);
    const inspectUrl = `https://search.google.com/search-console/inspect?resource_id=sc-domain:stemuluskidstech.com&id=${encodeURIComponent(targetUrl)}`;
    await page.goto(inspectUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(7000);

    const safeName = targetUrl.replace('https://stemuluskidstech.com/', '').replace('.html', '').replace(/[^a-zA-Z0-9]/g, '_') || 'homepage';
    await snap(`05_inspect_${safeName}.png`);

    const result = await page.evaluate(() => {
      const body = document.body.innerText;
      const isOnGoogle = body.includes('URL is on Google');
      const isNotOnGoogle = body.includes('URL is not on Google');
      const canBeServed = body.includes('Page is indexed') || body.includes('URL is on Google');
      return {
        status: isOnGoogle ? 'URL is on Google ✅' : (isNotOnGoogle ? 'URL is not on Google ❌' : 'Unknown'),
        rawSnippet: body.slice(0, 500)
      };
    });

    console.log(`     Status: ${result.status}`);

    // If "Request Indexing" button exists, trigger it!
    try {
      const requestBtn = await page.$('button:has-text("Request indexing"), [role="button"]:has-text("Request indexing")');
      if (requestBtn) {
        const disabled = await requestBtn.getAttribute('disabled');
        if (!disabled) {
          console.log(`     🚀 Clicking "Request indexing" for ${targetUrl}...`);
          await requestBtn.click();
          // Wait for Google's live test modal / quota confirmation
          await page.waitForTimeout(12000);
          await snap(`05_requested_${safeName}.png`);
          console.log(`     ✅ Indexing requested for ${targetUrl}`);
          // Close dialog if "Got it" appears
          const gotItBtn = await page.$('button:has-text("Got it"), [role="button"]:has-text("Got it")');
          if (gotItBtn) await gotItBtn.click();
        } else {
          console.log(`     (Request indexing button is currently disabled/already requested)`);
        }
      }
    } catch (e) {
      console.log(`     Could not trigger Request indexing: ${e.message}`);
    }

    auditData.inspectedUrls.push({
      url: targetUrl,
      status: result.status
    });
  }

  // Save complete JSON
  fs.writeFileSync(path.join(outDir, 'gsc_full_audit_results.json'), JSON.stringify(auditData, null, 2), 'utf8');
  console.log(`\n🎉 [COMPLETE] GSC Deep Autonomous Audit saved to: data/gsc_deep_audit/gsc_full_audit_results.json`);

  await page.waitForTimeout(3000);
  await context.close();
})();
