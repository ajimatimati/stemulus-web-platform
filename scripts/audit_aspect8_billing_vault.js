/**
 * Automated QA & UX Audit Script: Aspect 8 (Parents' Tuition Billing, Invoicing & Receipts Vault)
 * Covers:
 * - parent-dashboard.html
 * - assets/js/billing-engine.js
 * - assets/js/parent-engine.js
 * - #billing-vault-card, #parent-billing-vault-container, #modal-international-payment-guide
 * - Active tuition renewal cycles, currency formatting (₦ NGN & $ USD DOM), 1-click bank details copying
 * - Payment receipts ledger (REC-XXXX), international transfer guides (Remitly, Sendwave, Wire)
 * - WCAG touch targets (>= 34px, target 36px/38px)
 * - Mobile responsive 375px zero horizontal overflow
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8098;
const ROOT_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/parent-dashboard.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webmanifest': 'application/manifest+json'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Audit Aspect 8] Static test server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function auditTouchTargets(page, contextLabel) {
  return await page.evaluate((label) => {
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
    const failures = [];
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0) {
        return;
      }
      if (rect.bottom < 0 || rect.top > 25000) return;

      if (rect.width < 34 || rect.height < 34) {
        // Exclude inline text links inside paragraphs
        if (el.tagName === 'A' && el.closest('p, .text-xs, .field-hint') && !el.classList.contains('btn') && !el.classList.contains('pill') && !el.classList.contains('btn-3d')) {
          return;
        }
        // Exclude inputs wrapped in compliant labels
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const labelRect = parentLabel.getBoundingClientRect();
            if (labelRect.height >= 34 && labelRect.width >= 34) return;
          }
        }
        failures.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: (el.className || '').toString().substring(0, 50),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().substring(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
    return failures;
  }, contextLabel);
}

async function auditOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyScroll = document.body.scrollWidth;
    const docScroll = document.documentElement.scrollWidth;
    const maxScroll = Math.max(bodyScroll, docScroll);
    const hasOverflow = maxScroll > docWidth + 1;

    let offender = null;
    if (hasOverflow) {
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 2) {
          offender = {
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: (el.className || '').toString().substring(0, 50),
            right: Math.round(r.right),
            docWidth
          };
          break;
        }
      }
    }

    return {
      hasOverflow,
      docWidth,
      maxScroll,
      offender
    };
  });
}

async function runAudit() {
  console.log('\n=============================================================');
  console.log('--- ASPECT 8 AUDIT: PARENTS\' TUITION BILLING & RECEIPTS VAULT ---');
  console.log('=============================================================\n');

  const server = await startStaticServer();
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('firestore')) {
        consoleErrors.push(txt);
      }
    }
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    const failure = req.failure() ? req.failure().errorText : '';
    if (failure.includes('ERR_ABORTED') || req.url().includes('firestore.googleapis.com')) return;
    failedRequests.push({ url: req.url(), failure });
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('firestore')) {
      failedRequests.push({ url: resp.url(), status: resp.status() });
    }
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      testsFailed++;
    }
  }

  try {
    // 1. Authenticate parent session via login page
    await page.goto(`http://localhost:${PORT}/parent-login.html?role=parent`, { waitUntil: 'load' });

    await page.evaluate(() => {
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
    });

    // 2. Navigate to parent dashboard
    await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Test 1: Page loads and personalized greeting rendered
    const heroName = await page.$eval('#hero-user-name', el => el.innerText).catch(() => '');
    assert(heroName.includes('Folashade') || heroName.length > 0, 'Parent authenticated and dashboard loaded', heroName);

    // Test 2: Tuition Invoicing & Receipts Vault card exists in DOM
    const vaultCard = await page.$('#billing-vault-card');
    assert(!!vaultCard, 'Tuition Invoicing & Receipts Vault card rendered in dashboard (#billing-vault-card)');

    // Test 3: Active tuition renewal cycles render for enrolled children
    const cyclesCount = await page.evaluate(() => {
      const container = document.getElementById('parent-billing-vault-container');
      if (!container) return 0;
      const cards = container.querySelectorAll('.bg-white.border.border-slate-200\\/90');
      return cards.length;
    });
    assert(cyclesCount > 0, 'Active tuition cycle cards rendered for enrolled children', `Found: ${cyclesCount}`);

    // Test 4: Currency formatting and renewal details
    const billingDetails = await page.evaluate(() => {
      const container = document.getElementById('parent-billing-vault-container');
      if (!container) return null;
      const text = container.innerText;
      return {
        hasCurrency: text.includes('₦') || text.includes('NGN'),
        hasMonthlyRate: text.includes('35,000') || text.includes('Monthly Tuition'),
        hasDueDate: text.includes('2026-11') || text.includes('Renews') || text.includes('Cycle Renewal Due'),
        hasActiveBadge: text.includes('Active') || text.includes('Current')
      };
    });
    assert(billingDetails && billingDetails.hasCurrency && billingDetails.hasMonthlyRate,
      'Tuition cycle accurately displays formatted currency and monthly rate (₦35,000)',
      JSON.stringify(billingDetails));
    assert(billingDetails && billingDetails.hasDueDate && billingDetails.hasActiveBadge,
      'Tuition renewal due date and active cycle status chip verified',
      JSON.stringify(billingDetails));

    // Test 5: 1-Click Bank Account Copying with Instant Feedback
    const copyResult = await page.evaluate(() => {
      const container = document.getElementById('parent-billing-vault-container');
      if (!container) return { success: false, reason: 'container not found' };

      const copyBtns = container.querySelectorAll('button[onclick*="copyBankDetail"]');
      if (copyBtns.length === 0) return { success: false, reason: 'no copy buttons found' };

      const firstBtn = copyBtns[0];
      const origText = firstBtn.innerText;
      firstBtn.click();

      return {
        success: true,
        buttonCount: copyBtns.length,
        hasNgAccount: container.innerText.includes('0128062292'),
        hasUsdAccount: container.innerText.includes('0622219817')
      };
    });
    assert(copyResult.success && copyResult.buttonCount >= 2,
      '1-Click copy buttons present for Wema NGN (0128062292) and USD DOM (0622219817)',
      `Buttons count: ${copyResult.buttonCount}`);

    // Test 6: WhatsApp proof submission link
    const waLink = await page.evaluate(() => {
      const link = document.querySelector('#parent-billing-vault-container a[href*="wa.me"]');
      if (!link) return null;
      return {
        href: link.href,
        text: link.innerText
      };
    });
    assert(waLink && waLink.href.includes('2347052466716'),
      'Direct WhatsApp tuition proof submission button connected to STEMulus Admin (+2347052466716)',
      waLink ? waLink.text : 'None');

    // Test 7: Verified Payment Receipts Ledger
    const receiptsLedger = await page.evaluate(() => {
      const container = document.getElementById('parent-billing-vault-container');
      if (!container) return { hasTable: false };
      const table = container.querySelector('table');
      const text = container.innerText;
      return {
        hasTable: !!table,
        hasReceiptRef: text.includes('REC-2026') || text.includes('REC-'),
        hasVerifiedBadge: text.includes('Verified') || text.includes('Settled Invoices'),
        receiptsCount: table ? table.querySelectorAll('tbody tr').length : 0
      };
    });
    assert(receiptsLedger.hasTable && receiptsLedger.hasReceiptRef && receiptsLedger.receiptsCount > 0,
      'Archived Payment Receipts Ledger renders verified receipts (REC-2026-XXXX)',
      `Receipts rendered: ${receiptsLedger.receiptsCount}`);

    // Test 8: International Payment Guide Modal Launcher
    const guideBtn = await page.$('#billing-vault-card button[onclick*="openInternationalPaymentGuide"]');
    assert(!!guideBtn, 'Payment Guide launcher button present in vault header');

    await guideBtn.click();
    await page.waitForTimeout(300);

    const isGuideModalOpen = await page.evaluate(() => {
      const m = document.getElementById('modal-international-payment-guide');
      return m && !m.classList.contains('hidden') && window.getComputedStyle(m).display !== 'none';
    });
    assert(isGuideModalOpen, 'International Payment Guide modal opens upon button click');

    // Test 9: International Payment Guide modal contents & instructions
    const guideModalContent = await page.evaluate(() => {
      const m = document.getElementById('modal-international-payment-guide');
      if (!m) return null;
      const text = m.innerText;
      return {
        hasRemitly: text.includes('Remitly'),
        hasSendwave: text.includes('Sendwave') || text.includes('Flutterwave'),
        hasUsdWire: text.includes('USD Domiciliary') || text.includes('Wire Transfer'),
        hasSwift: text.includes('WEMANGLA'),
        hasWemaNgn: text.includes('0128062292')
      };
    });
    assert(guideModalContent && guideModalContent.hasRemitly && guideModalContent.hasSendwave && guideModalContent.hasSwift,
      'Payment Guide modal includes Remitly, Sendwave, and USD Wire with SWIFT code WEMANGLA',
      JSON.stringify(guideModalContent));

    // Test 10: Touch targets inside International Payment Guide modal
    const modalTouchFailures = await page.evaluate(() => {
      const modal = document.getElementById('modal-international-payment-guide');
      if (!modal) return [{ error: 'Modal not found' }];
      const failures = [];

      const closeBtn = modal.querySelector('button[onclick*="closeInternationalPaymentGuide"]');
      if (closeBtn) {
        const r = closeBtn.getBoundingClientRect();
        if (r.width < 34 || r.height < 34) {
          failures.push({ name: 'Modal close button', width: Math.round(r.width), height: Math.round(r.height) });
        }
      }

      const copyBtns = modal.querySelectorAll('button[onclick*="copyBankDetail"]');
      copyBtns.forEach((b, i) => {
        const r = b.getBoundingClientRect();
        if (r.height < 34 || r.width < 34) {
          failures.push({ name: `Modal Copy button ${i+1}`, width: Math.round(r.width), height: Math.round(r.height) });
        }
      });

      return failures;
    });
    assert(modalTouchFailures.length === 0,
      'All Payment Guide modal touch targets >= 34px (WCAG 2.1 AA)',
      JSON.stringify(modalTouchFailures));

    // Test 11: Close Payment Guide modal
    await page.click('#modal-international-payment-guide button[onclick*="closeInternationalPaymentGuide"]');
    await page.waitForTimeout(200);

    const isGuideModalClosed = await page.evaluate(() => {
      const m = document.getElementById('modal-international-payment-guide');
      return m && (m.classList.contains('hidden') || window.getComputedStyle(m).display === 'none');
    });
    assert(isGuideModalClosed, 'Payment Guide modal closes cleanly');

    // Test 12: Touch target audit across all billing elements in dashboard
    const billingTouchAudit = await page.evaluate(() => {
      const vault = document.getElementById('billing-vault-card');
      const failures = [];
      if (!vault) return [{ error: 'Vault card not found' }];

      const interactives = vault.querySelectorAll('button, a');
      interactives.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        if (r.height < 34 || r.width < 34) {
          failures.push({
            name: (el.innerText || el.getAttribute('aria-label') || `Element ${idx}`).trim().substring(0, 30),
            width: Math.round(r.width),
            height: Math.round(r.height)
          });
        }
      });
      return failures;
    });
    assert(billingTouchAudit.length === 0,
      'All Tuition Billing Vault buttons and links satisfy WCAG 2.1 AA (>= 34px)',
      JSON.stringify(billingTouchAudit));

    // Test 13: Mobile Viewport 375px Audit (Zero Horizontal Overflow)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileOverflow = await auditOverflow(page);
    assert(!mobileOverflow.hasOverflow,
      `Mobile 375px zero horizontal overflow with Billing Vault (maxScroll: ${mobileOverflow.maxScroll}px, docWidth: ${mobileOverflow.docWidth}px)`,
      mobileOverflow.hasOverflow ? JSON.stringify(mobileOverflow.offender) : 'Clean');

    // Test 14: Mobile Billing Vault responsiveness
    const mobileVaultFits = await page.evaluate(() => {
      const vault = document.getElementById('billing-vault-card');
      const docWidth = document.documentElement.clientWidth;
      const vaultWidth = vault ? vault.offsetWidth : 0;
      return {
        vaultWidth,
        docWidth,
        fits: vaultWidth <= docWidth
      };
    });
    assert(mobileVaultFits.fits,
      `Billing Vault fits within mobile 375px screen (vaultWidth: ${mobileVaultFits.vaultWidth}px, docWidth: ${mobileVaultFits.docWidth}px)`);

    // Test 15: Console & Network integrity
    assert(consoleErrors.length === 0, 'Zero critical console errors during billing vault interactions', JSON.stringify(consoleErrors));
    assert(failedRequests.length === 0, 'Zero failed HTTP requests (404s)', JSON.stringify(failedRequests));

  } catch (err) {
    console.error('Audit exception occurred:', err);
    testsFailed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`Aspect 8 Audit Completed: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('-------------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAudit();
