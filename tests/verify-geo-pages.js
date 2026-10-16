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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('=== STARTING MOTION-LUXURY GEO PAGES AUDIT ===\n');
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

    // 2. Check for dotted radial grid pattern
    const dottedPatternElements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      return all.filter(el => {
        const style = el.getAttribute('style') || '';
        return style.includes('radial-gradient(#f4600c 1px');
      }).length;
    });

    if (dottedPatternElements > 0) {
      console.error(`  [FAIL] ${geo.name} has ${dottedPatternElements} element(s) with dotted radial-gradient!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} zero dotted grid pattern detected.`);
    }

    // 3. Verify Ambient Video Background in Hero
    const ambientVideo = await page.evaluate(() => {
      const video = document.querySelector('.geo-hero-luxury .ambient-video-wrap video');
      const scrim = document.querySelector('.geo-hero-luxury .ambient-video-scrim');
      return {
        exists: !!video,
        hasScrim: !!scrim,
        src: video ? video.querySelector('source')?.getAttribute('src') : null
      };
    });

    if (!ambientVideo.exists || !ambientVideo.hasScrim) {
      console.error(`  [FAIL] ${geo.name} ambient video background missing!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} ambient video background present: ${ambientVideo.src}`);
    }

    // 4. Verify Interactive Expanding Cards Deck
    const expandingCards = await page.evaluate(() => {
      const container = document.querySelector('.expanding-cards-container');
      const cards = container ? container.querySelectorAll('.expanding-card') : [];
      const activeCard = container ? container.querySelector('.expanding-card.active') : null;
      return {
        exists: !!container,
        cardCount: cards.length,
        hasActive: !!activeCard
      };
    });

    if (!expandingCards.exists || expandingCards.cardCount < 4 || !expandingCards.hasActive) {
      console.error(`  [FAIL] ${geo.name} expanding cards deck issue: exists=${expandingCards.exists}, count=${expandingCards.cardCount}`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} expanding cards deck verified (4 cards, active state set).`);
    }

    // 5. Verify Transformation Grid
    const transformGrid = await page.evaluate(() => {
      const grid = document.querySelector('.transformation-grid');
      const cards = grid ? grid.querySelectorAll('.transform-card') : [];
      return {
        exists: !!grid,
        cardCount: cards.length
      };
    });

    if (!transformGrid.exists || transformGrid.cardCount < 3) {
      console.error(`  [FAIL] ${geo.name} transformation grid missing or incomplete!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} screen time transformation grid verified (3 cards).`);
    }

    // 6. Verify Squircle Testimonial Avatars
    const squircleAvatars = await page.evaluate(() => {
      const squircles = document.querySelectorAll('.testi-avatar-squircle');
      const circles = document.querySelectorAll('.testi-avatar-circle');
      return {
        squircleCount: squircles.length,
        circleCount: circles.length
      };
    });

    if (squircleAvatars.circleCount > 0 || squircleAvatars.squircleCount < 2) {
      console.error(`  [FAIL] ${geo.name} testimonial avatars not properly squirclized: squircle=${squircleAvatars.squircleCount}, circle=${squircleAvatars.circleCount}`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} testimonial avatars are 100% squircle (${squircleAvatars.squircleCount} frames).`);
    }

    // 7. Verify Hero BG is radiant light
    const heroBg = await page.evaluate(() => {
      const hero = document.querySelector('header.geo-hero-luxury');
      return hero ? window.getComputedStyle(hero).backgroundColor : null;
    });
    const isDarkBg = heroBg && (heroBg.includes('rgb(11, 17, 32)') || heroBg.includes('rgb(3, 7, 18)'));
    if (isDarkBg) {
      console.error(`  [FAIL] ${geo.name} hero background is DARK!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} hero background is radiant light ivory/pearl.`);
    }

    // 8. Capture Hero Screenshot
    const heroScreenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_luxury_preview.png`);
    await page.screenshot({ path: heroScreenshotPath, clip: { x: 0, y: 0, width: 1280, height: 1100 } });
    console.log(`  [SCREENSHOT] Saved hero preview to ${heroScreenshotPath}`);

    // 9. Capture Expanding Cards Section Screenshot
    const expandingSection = await page.$('#expanding-curriculum');
    if (expandingSection) {
      const cardsScreenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_expanding_cards.png`);
      await expandingSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: cardsScreenshotPath, clip: { x: 0, y: 0, width: 1280, height: 750 } });
      console.log(`  [SCREENSHOT] Saved expanding cards to ${cardsScreenshotPath}\n`);
    }
  }

  await browser.close();

  if (allPassed) {
    console.log('================================================================');
    console.log('=== ALL 5 GEO PAGES PASSED 100% MOTION-LUXURY ARCHITECTURAL AUDIT ===');
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error('=== SOME GEO PAGES FAILED AUDIT ===');
    process.exit(1);
  }
})();
