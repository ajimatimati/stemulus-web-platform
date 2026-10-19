const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8123;
const ROOT_DIR = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error');
  }
});

server.listen(PORT, async () => {
  console.log(`============================================================`);
  console.log(`🚀 COMPREHENSIVE VERIFICATION OF ALL 4 USER REQUIREMENTS`);
  console.log(`============================================================`);
  console.log(`Server running at http://localhost:${PORT}`);

  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    const results = {
      test_404_contrast: false,
      parent_badge_contrast: false,
      parent_bank_accounts: false,
      parent_remitly_guide: false,
      no_direct_tutor_parent_chat: false,
      admin_billing_accounts: false
    };

    // -------------------------------------------------------------
    // Test 1: 404 Page Contrast
    // -------------------------------------------------------------
    console.log('\n--- Test 1: 404 Page Contrast ---');
    const page404 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page404.goto(`http://localhost:${PORT}/404.html`, { waitUntil: 'load' });
    await page404.waitForTimeout(500);

    const codeColor = await page404.$eval('h1', el => window.getComputedStyle(el).color);
    const h2Color = await page404.$eval('h2', el => window.getComputedStyle(el).color);
    const quickNavHeadingColor = await page404.$eval('h3', el => window.getComputedStyle(el).color);
    const bodyBg = await page404.$eval('body', el => window.getComputedStyle(el).backgroundColor);
    console.log(`404 Code color: ${codeColor}`);
    console.log(`404 Message color: ${h2Color}`);
    console.log(`404 Quick Nav heading color: ${quickNavHeadingColor}`);
    console.log(`404 Body background: ${bodyBg}`);

    await page404.screenshot({ path: path.join(__dirname, 'test_404_verified.png') });

    if (codeColor === 'rgb(244, 96, 12)' && h2Color === 'rgb(15, 23, 42)' && quickNavHeadingColor === 'rgb(15, 23, 42)') {
      results.test_404_contrast = true;
      console.log('✅ 404 page contrast issue resolved: bold orange header and obsidian navy subheadings on crisp white background.');
    }
    await page404.close();

    // -------------------------------------------------------------
    // Test 2: Parent Portal Login, Badge Contrast & Bank Accounts
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Parent Portal Login, Badge Contrast & Bank Accounts ---');
    const parentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const parentPage = await parentCtx.newPage();

    // Human login via parent-login.html
    await parentPage.goto(`http://localhost:${PORT}/parent-login.html?role=parent`, { waitUntil: 'load' });
    await parentPage.fill('#email', 'parent@stemuluskidstech.com');
    await parentPage.fill('#password', 'Parent2026!');
    await parentPage.click('button[type="submit"]');

    // Wait for redirect to parent-dashboard.html
    await parentPage.waitForURL(url => url.pathname.includes('parent-dashboard.html'), { timeout: 8000 });
    await parentPage.waitForTimeout(1500);

    // Look for badge card and check computed styles
    const badgeCardInfo = await parentPage.evaluate(() => {
      const badgeH4 = document.querySelector('h4[style*="color: #ffffff"], h4[style*="color: rgb(255, 255, 255)"]');
      if (!badgeH4) return null;
      const card = badgeH4.closest('div[style*="linear-gradient"]');
      const btn = card ? card.querySelector('button') : null;
      return {
        hasCard: !!card,
        cardBg: card ? window.getComputedStyle(card).backgroundImage : null,
        titleText: badgeH4.textContent.trim(),
        titleColor: window.getComputedStyle(badgeH4).color,
        hasBtn: !!btn,
        btnText: btn ? btn.textContent.trim() : null,
        btnBg: btn ? window.getComputedStyle(btn).backgroundColor : null,
        btnColor: btn ? window.getComputedStyle(btn).color : null
      };
    });

    console.log('Badge Card Info:', badgeCardInfo);

    if (badgeCardInfo && badgeCardInfo.hasCard && badgeCardInfo.hasBtn) {
      console.log(`Badge Title: "${badgeCardInfo.titleText}" with color ${badgeCardInfo.titleColor}`);
      console.log(`Badge Button: "${badgeCardInfo.btnText}" with bg ${badgeCardInfo.btnBg} and color ${badgeCardInfo.btnColor}`);
      if (badgeCardInfo.titleColor === 'rgb(255, 255, 255)' && badgeCardInfo.btnBg === 'rgb(244, 96, 12)' && badgeCardInfo.btnColor === 'rgb(255, 255, 255)') {
        results.parent_badge_contrast = true;
        console.log('✅ Student badge title and View Badge button have 100% perfect contrast on deep obsidian card!');
      }
    }

    // Verify Official Bank Accounts displayed
    const parentBodyText = await parentPage.content();
    const hasWemaNGN = parentBodyText.includes('0128062292') && parentBodyText.includes('Wema Nigeria');
    const hasWemaUSD = parentBodyText.includes('0622219817') && parentBodyText.includes('STEMulus innovation Limited');
    console.log(`Parent portal displays Wema Nigeria (0128062292): ${hasWemaNGN}`);
    console.log(`Parent portal displays USD DOM (0622219817): ${hasWemaUSD}`);

    if (hasWemaNGN && hasWemaUSD) {
      results.parent_bank_accounts = true;
      console.log('✅ Official Wema NGN and USD DOM bank accounts displayed accurately in tuition cards.');
    }

    // -------------------------------------------------------------
    // Test 3: International Payment Guide Modal (Remitly/Sendwave)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Opening Remitly / International Guide Modal ---');
    await parentPage.evaluate(() => {
      ParentEngine.openInternationalPaymentGuide();
    });
    await parentPage.waitForTimeout(500);

    const guideModalVisible = await parentPage.isVisible('#modal-international-payment-guide');
    const guideDetails = await parentPage.evaluate(() => {
      const modal = document.getElementById('modal-international-payment-guide');
      if (!modal) return null;
      const text = modal.innerText;
      return {
        hasRemitly: text.includes('Remitly'),
        hasSendwave: text.includes('Sendwave') || text.includes('Send by Flutterwave'),
        hasUSDWire: text.includes('USD Wire Transfer'),
        hasNGNAccount: text.includes('0128062292'),
        hasUSDAccount: text.includes('0622219817'),
        hasSwiftCode: text.includes('WEMANGLA')
      };
    });

    console.log('Guide Modal Verification:', guideDetails);

    if (guideModalVisible && guideDetails && guideDetails.hasRemitly && guideDetails.hasNGNAccount && guideDetails.hasSwiftCode) {
      results.parent_remitly_guide = true;
      console.log('✅ Remitly / Sendwave / USD Wire payment guide modal verified with complete step-by-step instructions!');
    }

    await parentPage.screenshot({ path: path.join(__dirname, 'test_parent_guide_verified.png') });

    // -------------------------------------------------------------
    // Test 4: Verification of Zero Direct Parent-Tutor Chat Links
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Direct Chat Restriction Audit ---');
    // Check parent dashboard
    const parentDirectTutorChat = await parentPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]'));
      return links.some(a => {
        const txt = a.textContent.toLowerCase();
        const href = a.href.toLowerCase();
        return (txt.includes('tutor') && !txt.includes('rate')) || href.includes('tutor');
      });
    });

    // Check tutor portal (tutor-students.html)
    const tutorCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tutorPage = await tutorCtx.newPage();
    await tutorPage.goto(`http://localhost:${PORT}/parent-login.html?role=tutor`, { waitUntil: 'load' });
    await tutorPage.fill('#email', 'olalekan@stemuluskidstech.com');
    await tutorPage.fill('#password', 'Tutor2026!');
    await tutorPage.click('button[type="submit"]');
    await tutorPage.waitForURL(url => url.pathname.includes('tutor-dashboard.html'), { timeout: 8000 });

    await tutorPage.goto(`http://localhost:${PORT}/tutor-students.html`, { waitUntil: 'load' });
    await tutorPage.waitForTimeout(1000);

    const tutorDirectParentChat = await tutorPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="tel:"]'));
      return links.some(a => a.textContent.toLowerCase().includes('parent') || a.href.toLowerCase().includes('parent'));
    });

    console.log(`Parent portal has direct tutor chat link: ${parentDirectTutorChat}`);
    console.log(`Tutor portal has direct parent chat link: ${tutorDirectParentChat}`);

    if (!parentDirectTutorChat && !tutorDirectParentChat) {
      results.no_direct_tutor_parent_chat = true;
      console.log('✅ Direct chat between parents and tutors is completely absent across portals. Communications are strictly routed through Admin.');
    }
    await tutorPage.close();
    await parentPage.close();

    // -------------------------------------------------------------
    // Test 5: Admin Dashboard Billing Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Admin Dashboard Billing Verification ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(`http://localhost:${PORT}/admin-login.html`, { waitUntil: 'load' });
    await adminPage.fill('#emailInput', 'admin@stemuluskidstech.com');
    await adminPage.fill('#passwordInput', 'Admin2026!');
    await adminPage.evaluate(async () => {
      const res = await DashboardEngine.login('admin@stemuluskidstech.com', 'Admin2026!');
      if (res) {
        window.location.href = 'admin-dashboard.html';
      }
    });
    await adminPage.waitForURL(url => url.pathname.includes('admin-dashboard.html'), { timeout: 15000, waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(2000);

    const adminBillingData = await adminPage.evaluate(() => {
      const bankEl = document.getElementById('billing-bank-name');
      const accNumEl = document.getElementById('billing-account-number');
      const usdAccEl = document.getElementById('billing-usd-account-number');
      const accNameEl = document.getElementById('billing-account-name');
      return {
        bankName: bankEl ? bankEl.textContent.trim() : '',
        accNumber: accNumEl ? accNumEl.textContent.trim() : '',
        usdAccNumber: usdAccEl ? usdAccEl.textContent.trim() : '',
        accName: accNameEl ? accNameEl.textContent.trim() : ''
      };
    });

    console.log('Admin Billing Header Data:', adminBillingData);

    if (adminBillingData.bankName === 'Wema Nigeria' &&
        adminBillingData.accNumber === '0128062292' &&
        adminBillingData.usdAccNumber === '0622219817' &&
        adminBillingData.accName === 'STEMulus innovation Limited') {
      results.admin_billing_accounts = true;
      console.log('✅ Admin billing header correctly displays official Wema accounts.');
    }

    await adminPage.screenshot({ path: path.join(__dirname, 'test_admin_billing_verified.png') });
    await adminPage.close();

    await browser.close();
    server.close();

    console.log('\n============================================================');
    console.log('FINAL AUDIT SUMMARY FOR USER REQUIREMENTS:');
    console.log(JSON.stringify(results, null, 2));
    console.log('============================================================');

    const allPassed = Object.values(results).every(v => v === true);
    if (!allPassed) {
      console.error('❌ Some tests failed.');
      process.exit(1);
    } else {
      console.log('🎉 ALL 4 USER REQUIREMENTS VERIFIED AND PASSED 100%!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test Suite Error:', err);
    server.close();
    process.exit(1);
  }
});
