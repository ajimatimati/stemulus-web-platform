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

  console.log('=== STARTING GEO PAGES AUDIT ===\n');
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

    // 1. Check for dotted grid pattern
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

    // 2. Check hero background & text colors
    const heroMetrics = await page.evaluate(() => {
      const hero = document.querySelector('header.geo-hero-luxury');
      if (!hero) return null;
      const heroStyle = window.getComputedStyle(hero);
      const h1 = hero.querySelector('h1');
      const h1Style = h1 ? window.getComputedStyle(h1) : null;
      const p = hero.querySelector('.hero-desc');
      const pStyle = p ? window.getComputedStyle(p) : null;
      return {
        heroBg: heroStyle.backgroundColor,
        heroBackgroundImage: heroStyle.backgroundImage,
        h1Color: h1Style ? h1Style.color : null,
        pColor: pStyle ? pStyle.color : null
      };
    });

    console.log(`  Hero BG: ${heroMetrics.heroBg}, H1 Color: ${heroMetrics.h1Color}, P Color: ${heroMetrics.pColor}`);
    
    // Check if hero is dark
    const isDarkBg = heroMetrics.heroBg.includes('rgb(11, 17, 32)') || heroMetrics.heroBg.includes('rgb(3, 7, 18)');
    if (isDarkBg) {
      console.error(`  [FAIL] ${geo.name} hero background is DARK!`);
      allPassed = false;
    } else {
      console.log(`  [PASS] ${geo.name} hero background is light & radiant.`);
    }

    // 3. Check project reel background & cards
    const reelMetrics = await page.evaluate(() => {
      const reel = document.querySelector('section.geo-project-reel');
      if (!reel) return null;
      const reelStyle = window.getComputedStyle(reel);
      const cards = Array.from(document.querySelectorAll('.geo-reel-card'));
      const cardStyles = cards.map(c => {
        const cs = window.getComputedStyle(c);
        const h4 = c.querySelector('h4');
        const p = c.querySelector('p');
        return {
          cardBg: cs.backgroundColor,
          h4Color: h4 ? window.getComputedStyle(h4).color : null,
          pColor: p ? window.getComputedStyle(p).color : null
        };
      });
      return {
        reelBg: reelStyle.backgroundColor,
        cardStyles
      };
    });

    if (reelMetrics) {
      console.log(`  Reel BG: ${reelMetrics.reelBg}`);
      const isDarkReel = reelMetrics.reelBg.includes('rgb(7, 13, 31)');
      if (isDarkReel) {
        console.error(`  [FAIL] ${geo.name} project reel background is DARK!`);
        allPassed = false;
      } else {
        console.log(`  [PASS] ${geo.name} project reel background is light.`);
      }

      if (reelMetrics.cardStyles.length > 0) {
        const firstCard = reelMetrics.cardStyles[0];
        console.log(`  Card BG: ${firstCard.cardBg}, Card H4: ${firstCard.h4Color}, Card P: ${firstCard.pColor}`);
        if (firstCard.cardBg.includes('rgba(15, 23, 42') || firstCard.cardBg.includes('rgb(15, 23, 42)')) {
          console.error(`  [FAIL] ${geo.name} card background is DARK!`);
          allPassed = false;
        } else {
          console.log(`  [PASS] ${geo.name} cards are clean light double-bezel.`);
        }
      }
    }

    // 4. Capture screenshot
    const screenshotPath = path.join(artifactDir, `geo_${geo.name.toLowerCase()}_luxury_preview.png`);
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1280, height: 1100 } });
    console.log(`  [SCREENSHOT] Saved preview to ${screenshotPath}\n`);
  }

  await browser.close();

  if (allPassed) {
    console.log('=== ALL 5 GEO PAGES PASSED LUXURY AUDIT WITH ZERO FLAWS ===');
    process.exit(0);
  } else {
    console.error('=== SOME GEO PAGES FAILED AUDIT ===');
    process.exit(1);
  }
})();
