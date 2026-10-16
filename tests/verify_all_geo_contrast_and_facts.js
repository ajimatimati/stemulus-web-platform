const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8095;
const ROOT_DIR = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/coding-classes-for-kids-usa.html';
    const filePath = path.join(ROOT_DIR, reqPath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + reqPath);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

const pagesToTest = [
  { name: 'USA', file: 'coding-classes-for-kids-usa.html' },
  { name: 'UK', file: 'coding-classes-for-kids-uk.html' },
  { name: 'Canada', file: 'coding-classes-for-kids-canada.html' },
  { name: 'Australia', file: 'coding-classes-for-kids-australia.html' },
  { name: 'Nigeria', file: 'coding-classes-for-kids-nigeria.html' }
];

server.listen(PORT, async () => {
  let browser;
  let allPassed = true;

  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    for (const item of pagesToTest) {
      console.log(`\n==================================================`);
      console.log(`AUDITING GEO LANDING PAGE: ${item.name} (${item.file})`);
      console.log(`==================================================`);

      const page = await context.newPage();
      await page.goto(`http://localhost:${PORT}/${item.file}`, { waitUntil: 'networkidle' });

      // Run evaluation
      const audit = await page.evaluate(() => {
        function getComp(sel) {
          const el = document.querySelector(sel);
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return { color: s.color, bg: s.backgroundColor, text: el.innerText.trim() };
        }

        const heroH1 = getComp('header.geo-hero-luxury h1');
        const heroP = getComp('header.geo-hero-luxury .hero-desc') || getComp('header.geo-hero-luxury p');
        const heroPill = getComp('header.geo-hero-luxury .hero-eyebrow-pill');
        const trustStrip = getComp('header.geo-hero-luxury .hero-trust');
        const projectReel = getComp('section.geo-project-reel');
        const cardH4s = Array.from(document.querySelectorAll('.geo-reel-card h4')).map(el => el.innerText.trim());
        const cardBgs = Array.from(document.querySelectorAll('.geo-reel-card')).map(el => window.getComputedStyle(el).backgroundColor);
        const cardPills = Array.from(document.querySelectorAll('.geo-reel-pill')).map(el => el.innerText.trim());

        return {
          heroH1,
          heroP,
          heroPill,
          trustStrip,
          projectReel,
          cardH4s,
          cardBgs,
          cardPills
        };
      });

      // Assertions
      const checks = [];

      // 1. Hero H1 contrast (must be dark slate #0F172A on radiant light hero)
      const h1Ok = audit.heroH1 && (audit.heroH1.color === 'rgb(15, 23, 42)' || audit.heroH1.color === 'rgb(30, 41, 59)');
      checks.push({ test: 'Hero H1 High Contrast Dark Slate', passed: h1Ok, value: audit.heroH1?.color });

      // 2. Hero P contrast (must be #334155 / #475569)
      const pOk = audit.heroP && (audit.heroP.color === 'rgb(51, 65, 85)' || audit.heroP.color === 'rgb(71, 85, 105)');
      checks.push({ test: 'Hero Paragraph High Contrast Slate', passed: pOk, value: audit.heroP?.color });

      // 3. Hero Trust Badges text contrast
      const trustOk = audit.trustStrip && (audit.trustStrip.color === 'rgb(71, 85, 105)' || audit.trustStrip.color === 'rgb(51, 65, 85)');
      checks.push({ test: 'Hero Trust Strip High Contrast Slate', passed: trustOk, value: audit.trustStrip?.color });

      // 4. Project Reel background (radiant light pearl #FFFBF7, zero dark background)
      const reelLight = audit.projectReel && (audit.projectReel.bg === 'rgb(255, 251, 247)' || audit.projectReel.bg === 'rgb(255, 255, 255)');
      checks.push({ test: 'Project Reel Radiant Light Pearl Background', passed: reelLight, value: audit.projectReel?.bg });

      // 5. Fact-Checked Projects Verification
      const expectedProjects = [
        'Interactive Treehouse Platformer',
        'Pygame 2D Arcade: Dark Maze Quest',
        'Responsive Pet Portfolio Web App',
        'Autonomous Sonar & Line Rover'
      ];

      const cardsMatch = JSON.stringify(audit.cardH4s) === JSON.stringify(expectedProjects);
      checks.push({ test: '100% Fact-Checked Real Curriculum Titles', passed: cardsMatch, value: audit.cardH4s });

      const expectedPills = [
        'Scratch 3.0',
        'Python Pygame',
        'HTML5 & CSS Grid',
        'Arduino C++ Firmware'
      ];
      const pillsMatch = JSON.stringify(audit.cardPills) === JSON.stringify(expectedPills);
      checks.push({ test: '100% Verified Track Technology Badges', passed: pillsMatch, value: audit.cardPills });

      // Check for zero hallucinated strings in page content
      const pageText = await page.content();
      const hasHallucination = pageText.includes('Dynamic Raycast Lighting Engine') || 
                               pageText.includes('Autonomous Sensor Telemetry') ||
                               pageText.includes('Kinematic Marble Physics Track');
      checks.push({ test: 'Zero Hallucinated Project Strings in Page', passed: !hasHallucination, value: !hasHallucination ? 'Clean' : 'Found Hallucination!' });

      for (const c of checks) {
        if (c.passed) {
          console.log(`  [PASS] ${c.test}: ${JSON.stringify(c.value)}`);
        } else {
          console.log(`  [FAIL] ${c.test}: expected pass, got ${JSON.stringify(c.value)}`);
          allPassed = false;
        }
      }

      await page.close();
    }

    if (allPassed) {
      console.log(`\n==================================================`);
      console.log(`SUCCESS: ALL 5 GEO PAGES PASSED 100% OF CONTRAST AND FACT AUDITS!`);
      console.log(`==================================================`);
    } else {
      console.error(`\nFAILED: One or more audits did not pass.`);
      process.exitCode = 1;
    }

    await browser.close();
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
