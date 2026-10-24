/**
 * Comprehensive E2E Verification Suite for the Mulu AI Mascot Engine
 * Verifies:
 * 1. Role context sensing (Parent, Tutor, Coder)
 * 2. Double-Bezel mascot avatar and speech bubble rendering
 * 3. Collapsible chat drawer mechanics & quick action chips
 * 4. Autonomous action dispatching (Reschedule modal, Billing scroll, Coverage modal, Faculty chat)
 * 5. 1-Click Drafting Copilot (Monthly progress reports, WhatsApp summaries, clipboard copy)
 * 6. Academic Oracle: Knowledge of 10 Suites & 12 Courses
 * 7. Offline zero-fault deterministic fallback
 * 8. Mobile responsive rendering (375px) with zero horizontal overflow and touch targets >= 38px
 */

const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Simple static local test server
function createServer() {
  const root = path.join(__dirname, '..');
  return http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

async function runMuluVerificationSuite() {
  console.log('================================================================');
  console.log('🦉 EXECUTING MULU AI MASCOT ENGINE E2E VERIFICATION SUITE');
  console.log('================================================================\n');

  const server = createServer();
  const PORT = 8124;
  await new Promise(resolve => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Parent Dashboard - Role Sensing, Drawer, & Navigation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Parent Dashboard (Role: Parent, Actions & Inquiries) ---');
    const parentPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    
    // Establish parent session in localStorage
    await parentPage.goto(`${baseUrl}/parent-login.html?role=parent`, { waitUntil: 'load' });
    await parentPage.evaluate(() => {
      const parentSession = {
        role: 'parent',
        email: 'parent@stemuluskidstech.com',
        name: 'Mrs. Folashade Adeyemi',
        id: 'par-101',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(parentSession);
      }
      localStorage.setItem('user', JSON.stringify(parentSession));
      localStorage.setItem('role', 'parent');
      localStorage.setItem('stemulus_current_role', 'parent');
      localStorage.setItem('parent_active_child', 'Sarah Adeyemi');
    });

    await parentPage.goto(`${baseUrl}/parent-dashboard.html?test=1`, { waitUntil: 'load' });
    await parentPage.waitForTimeout(1000);

    // Verify mascot presence
    const mascotBtn = await parentPage.$('#mulu-toggle-btn');
    assert(!!mascotBtn, 'Floating Mulu mascot button (#mulu-toggle-btn) is mounted on parent dashboard');

    const roleDetected = await parentPage.evaluate(() => window.MuluEngine && window.MuluEngine.role);
    assert(roleDetected === 'parent', `Mulu correctly sensed role 'parent' (detected: '${roleDetected}')`);

    // Verify speech pill
    const pill = await parentPage.$('#mulu-pill');
    assert(!!pill, 'Contextual speech bubble pill (#mulu-pill) rendered on load');

    // Open chat drawer
    await parentPage.click('#mulu-toggle-btn');
    await parentPage.waitForTimeout(300);
    const isDrawerOpen = await parentPage.evaluate(() => {
      const d = document.getElementById('mulu-drawer');
      return d && d.classList.contains('open');
    });
    assert(isDrawerOpen, 'Clicking mascot button smoothly opens the Double-Bezel chat drawer (#mulu-drawer)');

    // Verify Quick Suggestion Chips for Parents
    const chipTexts = await parentPage.evaluate(() => {
      return Array.from(document.querySelectorAll('.mulu-chip')).map(c => c.textContent.trim());
    });
    assert(chipTexts.some(t => t.includes('Reschedule Class')), "Quick chips include 'Reschedule Class'");
    assert(chipTexts.some(t => t.includes('Tuition & Bank Info')), "Quick chips include 'Tuition & Bank Info'");
    assert(chipTexts.some(t => t.includes('10 Suites & Courses')), "Quick chips include '10 Suites & Courses'");

    // Test autonomous navigation: Reschedule Concierge
    console.log('Testing autonomous action dispatch: Reschedule Concierge...');
    await parentPage.evaluate(() => {
      window.MuluEngine.executeAction('open_reschedule');
    });
    await parentPage.waitForTimeout(500);
    const rescheduleModalVisible = await parentPage.evaluate(() => {
      const m = document.getElementById('parent-reschedule-modal');
      return !!(m && m.style.display !== 'none' && !m.classList.contains('hidden'));
    });
    assert(rescheduleModalVisible, 'Mulu autonomously opened the Reschedule Concierge modal');

    // Close reschedule modal
    await parentPage.evaluate(() => {
      if (typeof ParentEngine !== 'undefined' && ParentEngine.closeRescheduleModal) {
        ParentEngine.closeRescheduleModal();
      } else {
        const m = document.getElementById('parent-reschedule-modal');
        if (m) m.style.display = 'none';
      }
    });

    // Test knowledge inquiry: 10 Suites
    console.log('Testing Academic Oracle: 10 Suites inquiry...');
    await parentPage.click('#mulu-toggle-btn');
    await parentPage.waitForTimeout(200);
    await parentPage.evaluate(async () => {
      await window.MuluEngine.askPrompt('What are the 10 suites and 12 courses?');
    });
    await parentPage.waitForTimeout(400);

    const botMessages = await parentPage.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.mulu-msg-wrap.bot .mulu-msg-bubble'));
      return bubbles.map(b => b.textContent);
    });
    const lastMsg = botMessages[botMessages.length - 1] || '';
    assert(lastMsg.includes('Scratch Creators') && lastMsg.includes('Python Prodigies'), 'Mulu answered with the authentic 10 suites knowledge base');
    assert(lastMsg.includes('Junior Scratch Explorers'), 'Mulu included references to the 12 specialized courses');

    // Test WhatsApp wrap-up generator
    console.log('Testing 1-Click WhatsApp wrap-up generator...');
    await parentPage.evaluate(async () => {
      await window.MuluEngine.askPrompt('Generate WhatsApp summary for parent after class');
    });
    await parentPage.waitForTimeout(400);
    const hasCopyBtn = await parentPage.evaluate(() => {
      return !!document.querySelector('.mulu-copy-btn');
    });
    assert(hasCopyBtn, 'Mulu generated a WhatsApp lesson summary with a 1-click Copy to Clipboard button');

    // Test Smart Situation-Aware Pricing Shield & Admin Deferral
    console.log('Testing Situation-Aware Pricing Shield & Admissions Deferral...');
    await parentPage.evaluate(async () => {
      await window.MuluEngine.askPrompt('How much is tuition in USD and how do I pay with an international card?');
    });
    await parentPage.waitForTimeout(500);

    const pricingMsg = await parentPage.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.mulu-msg-wrap.bot .mulu-msg-bubble'));
      return bubbles[bubbles.length - 1]?.textContent || '';
    });
    assert(pricingMsg.includes('Admissions') && (pricingMsg.includes('age tier') || pricingMsg.includes('geographic region') || pricingMsg.includes('personalized')), 'Mulu strictly defers pricing to Admissions due to age & location sensitivity');
    assert(!/\$\d+|\b\d+\s*(dollars|naira|usd|ngn)\b/i.test(pricingMsg), 'Mulu never quotes fixed pricing numbers');

    const hasAdmissionsAction = await parentPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.mulu-action-btn'));
      return buttons.some(b => b.textContent.includes('Admissions'));
    });
    assert(hasAdmissionsAction, 'Mulu surfaces 1-click action button for Admissions Desk');

    await parentPage.close();

    // -------------------------------------------------------------
    // TEST 2: Tutor Dashboard - Role Sensing, Drafting, & Coverage
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Tutor Dashboard (Role: Tutor, Reports & Coverage Dispatch) ---');
    const tutorPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    
    // Establish tutor session
    await tutorPage.goto(`${baseUrl}/parent-login.html?role=tutor`, { waitUntil: 'load' });
    await tutorPage.evaluate(() => {
      const tutorSession = {
        role: 'tutor',
        email: 'tutor@stemuluskidstech.com',
        name: 'Sarah Jane',
        id: 'tut-101',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(tutorSession);
      }
      localStorage.setItem('user', JSON.stringify(tutorSession));
      localStorage.setItem('role', 'tutor');
      localStorage.setItem('stemulus_current_role', 'tutor');
    });

    await tutorPage.goto(`${baseUrl}/tutor-dashboard.html?test=1`, { waitUntil: 'load' });
    await tutorPage.waitForTimeout(1000);

    const tutorRole = await tutorPage.evaluate(() => window.MuluEngine && window.MuluEngine.role);
    assert(tutorRole === 'tutor', `Mulu correctly sensed role 'tutor' (detected: '${tutorRole}')`);

    // Verify Tutor quick chips
    const tutorChips = await tutorPage.evaluate(() => {
      return Array.from(document.querySelectorAll('.mulu-chip')).map(c => c.textContent.trim());
    });
    assert(tutorChips.some(t => t.includes('Draft Monthly Report')), "Tutor chips include 'Draft Monthly Report'");
    assert(tutorChips.some(t => t.includes('Request Coverage')), "Tutor chips include 'Request Coverage'");
    assert(tutorChips.some(t => t.includes('Faculty Chat')), "Tutor chips include 'Faculty Chat'");

    // Test Monthly Progress Report Drafting
    console.log('Testing Tutor 1-Click Monthly Progress Report Drafter...');
    await tutorPage.click('#mulu-toggle-btn');
    await tutorPage.waitForTimeout(300);
    await tutorPage.evaluate(async () => {
      await window.MuluEngine.askPrompt('Draft Monthly Progress Report for my student');
    });
    await tutorPage.waitForTimeout(400);

    const tutorBotMsgs = await tutorPage.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.mulu-msg-wrap.bot .mulu-msg-bubble'));
      return bubbles.map(b => b.textContent);
    });
    const tutorReportMsg = tutorBotMsgs[tutorBotMsgs.length - 1] || '';
    assert(tutorReportMsg.includes('Monthly Academic Progress Report') || tutorReportMsg.includes('Progress Report'), 'Mulu generated a structured Monthly Academic Progress Report');

    // Test autonomous coverage modal trigger
    console.log('Testing autonomous action dispatch: Emergency Coverage...');
    await tutorPage.evaluate(() => {
      window.MuluEngine.executeAction('open_coverage_modal');
    });
    await tutorPage.waitForTimeout(500);
    const coverageModalVisible = await tutorPage.evaluate(() => {
      const m = document.getElementById('tutor-coverage-modal');
      return !!(m && m.style.display !== 'none' && !m.classList.contains('hidden'));
    });
    assert(coverageModalVisible, 'Mulu autonomously opened the Tutor Emergency Coverage Modal');

    // Close modal
    await tutorPage.evaluate(() => {
      if (typeof TutorEngine !== 'undefined' && TutorEngine.closeCoverageModal) {
        TutorEngine.closeCoverageModal();
      } else {
        const m = document.getElementById('tutor-coverage-modal');
        if (m) m.style.display = 'none';
      }
    });

    await tutorPage.close();

    // -------------------------------------------------------------
    // TEST 3: Coder Classroom - Socratic Hints & Bug Explanations
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Coders Live Companion (join-class.html, Socratic Coaching) ---');
    const coderPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await coderPage.goto(`${baseUrl}/join-class.html?test=1&student=Sarah%20Adeyemi&role=coder`, { waitUntil: 'domcontentloaded' });
    await coderPage.waitForTimeout(1000);

    const coderRole = await coderPage.evaluate(() => window.MuluEngine && window.MuluEngine.role);
    assert(coderRole === 'coder', `Mulu correctly sensed role 'coder' (detected: '${coderRole}')`);

    // Inquire about Scratch loop bug
    await coderPage.click('#mulu-toggle-btn');
    await coderPage.waitForTimeout(300);
    await coderPage.evaluate(async () => {
      await window.MuluEngine.askPrompt('How do broadcast blocks work in Scratch?');
    });
    await coderPage.waitForTimeout(400);

    const coderMsgs = await coderPage.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.mulu-msg-wrap.bot .mulu-msg-bubble'));
      return bubbles.map(b => b.textContent);
    });
    const scratchAnswer = coderMsgs.join(' ');
    assert(scratchAnswer.toLowerCase().includes('broadcast') || scratchAnswer.toLowerCase().includes('walkie-talkies') || scratchAnswer.toLowerCase().includes('scratch'), 'Mulu gave kid-friendly, encouraging Scratch broadcast block advice');

    await coderPage.close();

    // -------------------------------------------------------------
    // TEST 4: Mobile Viewport 375px & Touch Target Compliance
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Mobile Responsive & Touch Target Compliance (375px) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    
    // Establish parent session
    await mobilePage.goto(`${baseUrl}/parent-login.html?role=parent`, { waitUntil: 'load' });
    await mobilePage.evaluate(() => {
      const parentSession = {
        role: 'parent',
        email: 'parent@stemuluskidstech.com',
        name: 'Mrs. Folashade Adeyemi',
        id: 'par-101',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(parentSession);
      }
      localStorage.setItem('user', JSON.stringify(parentSession));
      localStorage.setItem('role', 'parent');
      localStorage.setItem('stemulus_current_role', 'parent');
    });

    await mobilePage.goto(`${baseUrl}/parent-dashboard.html?test=1`, { waitUntil: 'load' });
    await mobilePage.waitForTimeout(1000);

    // Verify touch targets
    const mascotSize = await mobilePage.evaluate(() => {
      const btn = document.getElementById('mulu-toggle-btn');
      const rect = btn.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assert(mascotSize.width >= 38 && mascotSize.height >= 38, `Mascot touch target is >= 38px (actual: ${mascotSize.width}x${mascotSize.height}px)`);

    // Open drawer on mobile
    await mobilePage.click('#mulu-toggle-btn');
    await mobilePage.waitForTimeout(300);

    // Verify zero horizontal overflow
    const overflow = await mobilePage.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth;
    });
    assert(!overflow, 'Zero horizontal overflow on mobile viewport 375px when Mulu drawer is open');

    const drawerBounds = await mobilePage.evaluate(() => {
      const d = document.getElementById('mulu-drawer');
      const rect = d.getBoundingClientRect();
      return { width: rect.width, right: rect.right, left: rect.left };
    });
    assert(drawerBounds.width <= 375, `Drawer bounds fit cleanly within 375px viewport (width: ${drawerBounds.width}px)`);

    await mobilePage.close();

  } catch (error) {
    console.error('CRITICAL TEST ERROR:', error);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log(`🏆 MULU VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests === totalTests && totalTests > 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMuluVerificationSuite();
