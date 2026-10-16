const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GEO_PAGES = [
  { name: 'USA', file: 'coding-classes-for-kids-usa.html' },
  { name: 'UK', file: 'coding-classes-for-kids-uk.html' },
  { name: 'Canada', file: 'coding-classes-for-kids-canada.html' },
  { name: 'Australia', file: 'coding-classes-for-kids-australia.html' },
  { name: 'Nigeria', file: 'coding-classes-for-kids-nigeria.html' }
];

const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\66a470fd-ed7c-4b64-9669-b95d564bb83e';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  console.log('=== STARTING GEMINI ARGON 3D SVG & ARCHITECTURAL BENTO AUDIT ===\n');
  let allPassed = true;

  for (const geo of GEO_PAGES) {
    const filePath = path.resolve(__dirname, '..', geo.file);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    console.log(`Auditing ${geo.name}: ${geo.file}...`);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    // 1. Assert ZERO rounded-full pills in DOM
    const pillsCount = await page.evaluate(() => {
      return document.querySelectorAll('.rounded-full').length;
    });
    if (pillsCount > 0) {
      console.error(`  [FAIL] ${geo.name} has ${pillsCount} element(s) with .rounded-full!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} has ZERO .rounded-full pills.`);
    }

    // 2. Assert ZERO banned Lucide icons ([data-lucide])
    const lucideCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-lucide]').length;
    });
    if (lucideCount > 0) {
      console.error(`  [FAIL] ${geo.name} still has ${lucideCount} banned [data-lucide] icons!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} has ZERO banned Lucide icons.`);
    }

    // 3. Assert 3D Isometric & Glass-Bezel SVGs are hydrated
    const icons3dStats = await page.evaluate(() => {
      const rendered3d = document.querySelectorAll('.icon-3d svg');
      const flagEl = document.querySelector('.hero-eyebrow-badge-geo .icon-3d svg');
      const statIcons = document.querySelectorAll('.stats-item__3d-icon .icon-3d svg');
      const bentoIcons = document.querySelectorAll('.bento-3d-squircle .icon-3d svg');
      const expandingEmblems = document.querySelectorAll('.expanding-card__3d-emblem .icon-3d svg');
      const pricingBadges = document.querySelectorAll('.pricing-3d-badge .icon-3d svg');
      const safeguardingSeal = document.querySelector('.safeguarding-seal-wrap .icon-3d svg');
      return {
        total3dSvgs: rendered3d.length,
        has3dFlag: !!flagEl,
        statIconsCount: statIcons.length,
        bentoIconsCount: bentoIcons.length,
        expandingEmblemsCount: expandingEmblems.length,
        pricingBadgesCount: pricingBadges.length,
        hasSafeguardingSeal: !!safeguardingSeal
      };
    });

    if (
      icons3dStats.total3dSvgs < 35 ||
      !icons3dStats.has3dFlag ||
      icons3dStats.statIconsCount !== 4 ||
      icons3dStats.bentoIconsCount !== 4 ||
      icons3dStats.expandingEmblemsCount !== 4 ||
      icons3dStats.pricingBadgesCount !== 2 ||
      !icons3dStats.hasSafeguardingSeal
    ) {
      console.error(`  [FAIL] ${geo.name} 3D SVG hydration incomplete:`, icons3dStats);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} hydrated ${icons3dStats.total3dSvgs} multi-layered 3D SVGs (3D Flag, 4 Stats, 4 Bento, 4 Pathway Emblems, 2 Pricing, Safeguarding Seal).`);
    }

    // 4. Assert Asymmetrical 12-Col Bento (.argon-why-bento)
    const bentoAudit = await page.evaluate(() => {
      const bento = document.querySelector('.argon-why-bento');
      return {
        exists: !!bento,
        span7: bento ? bento.querySelectorAll('.bento-span-7').length : 0,
        span5: bento ? bento.querySelectorAll('.bento-span-5').length : 0,
        photos: bento ? bento.querySelectorAll('.bento-photo-shell img').length : 0,
        tzChips: bento ? bento.querySelectorAll('.tz-chip').length : 0
      };
    });
    if (!bentoAudit.exists || bentoAudit.span7 !== 2 || bentoAudit.span5 !== 2 || bentoAudit.photos !== 2) {
      console.error(`  [FAIL] ${geo.name} Asymmetrical 12-Col Bento issue:`, bentoAudit);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} Asymmetrical 12-Col Bento verified (7/5 + 5/7 split, ${bentoAudit.photos} Doppelrand photos, ${bentoAudit.tzChips} localized chips).`);
    }

    // 5. Capture Hero + 3D Flag + 3D Marquee + 3D Stats Screenshot
    const heroScreenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_luxury_preview.png`);
    await page.screenshot({ path: heroScreenshotPath, clip: { x: 0, y: 0, width: 1280, height: 1180 } });
    console.log(`  [SCREENSHOT] Saved hero + 3D marquee + 3D stats to ${heroScreenshotPath}`);

    // 6. Capture Asymmetrical 12-Col Bento Screenshot
    const bentoSection = await page.$('.argon-why-bento');
    if (bentoSection) {
      await bentoSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const bentoScreenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_argon_bento.png`);
      await page.screenshot({ path: bentoScreenshotPath, clip: { x: 0, y: 0, width: 1280, height: 820 } });
      console.log(`  [SCREENSHOT] Saved 12-col Argon Bento to ${bentoScreenshotPath}`);
    }

    // 7. Capture Expanding Cards with 3D Pathway Emblems Screenshot
    const expandingSection = await page.$('section[aria-label="Curriculum Pathways"]');
    if (expandingSection) {
      await expandingSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const cardsScreenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_expanding_cards.png`);
      await page.screenshot({ path: cardsScreenshotPath, clip: { x: 0, y: 0, width: 1280, height: 820 } });
      console.log(`  [SCREENSHOT] Saved 3D Expanding Cards to ${cardsScreenshotPath}`);
    }

    // 8. Capture Doppelrand Pricing + Safeguarding Vault Screenshot (on USA)
    if (geo.name === 'USA') {
      const pricingSection = await page.$('#pricing');
      if (pricingSection) {
        await pricingSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const pricingPath = path.join(artifactDir, 'geo_usa_pricing_vault.png');
        await page.screenshot({ path: pricingPath, clip: { x: 0, y: 0, width: 1280, height: 950 } });
        console.log(`  [SCREENSHOT] Saved Doppelrand Pricing to ${pricingPath}`);
      }
      const vaultSection = await page.$('.safeguarding-vault');
      if (vaultSection) {
        await vaultSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const vaultPath = path.join(artifactDir, 'geo_usa_safeguarding_vault.png');
        await page.screenshot({ path: vaultPath, clip: { x: 0, y: 0, width: 1280, height: 650 } });
        console.log(`  [SCREENSHOT] Saved 3D Safeguarding Vault to ${vaultPath}`);
      }
    }
    console.log('');
  }

  await browser.close();

  if (allPassed) {
    console.log('========================================================================');
    console.log('=== ALL 5 GEO PAGES PASSED 100% GEMINI ARGON 3D SVG & BENTO AUDIT ===');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('=== SOME GEO PAGES FAILED AUDIT ===');
    process.exit(1);
  }
})();
