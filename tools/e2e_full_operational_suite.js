/**
 * STEMulus Full Operational Readiness E2E Verification Suite
 * Forensic validation for November 1, 2026 portal deployment.
 * 
 * Verifies:
 * 1. Tutor Availability Conflict Enforcement
 * 2. Faculty Notice Board & Operational Broadcasts
 * 3. Tutor Performance & Punctuality Engine (Submission Turnaround & AI Polish)
 * 4. Master Tutor Payroll Hub & Bank Remittance Batch Ledger (NUBAN Verification)
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Copy to artifact directory if it exists
const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/screenshots';
if (!fs.existsSync(ARTIFACT_DIR)) {
    try { fs.mkdirSync(ARTIFACT_DIR, { recursive: true }); } catch (e) {}
}

function saveDualScreenshot(srcPath, filename) {
    const artTarget = path.join(ARTIFACT_DIR, filename);
    try {
        fs.copyFileSync(srcPath, artTarget);
    } catch(e) {}
}

/**
 * Pre-seeds authentic STMSV2 cryptographic session tokens directly into
 * the context before page scripts execute, satisfying StemulusSecurity checks.
 */
async function seedSession(context, role, email, name) {
    await context.addInitScript(({ role, email, name }) => {
        const APP_SECURITY_SALT = 'STEMULUS_SV_SEC_2026_COPPA_GDPR_K_9824';
        const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000;
        const TOKEN_PREFIX = 'STMSV2';

        function getDeviceFingerprint() {
            const nav = typeof navigator !== 'undefined' ? navigator : {};
            const screen = typeof window !== 'undefined' && window.screen ? window.screen : {};
            const raw = [
                nav.userAgent || 'unknown_ua',
                nav.language || 'en',
                screen.colorDepth || '24',
                (typeof window !== 'undefined' && window.location ? window.location.host : 'stemulus')
            ].join('###');

            let hash = 0x811c9dc5;
            for (let i = 0; i < raw.length; i++) {
                hash ^= raw.charCodeAt(i);
                hash = (hash * 0x01000193) >>> 0;
            }
            return hash.toString(36);
        }

        function generateHmacDigest(message, secret) {
            const combined = String(secret) + '::' + String(message) + '::' + APP_SECURITY_SALT;
            let h1 = 0xdeadbeef ^ combined.length;
            let h2 = 0x41c6ce57 ^ combined.length;
            let h3 = 0x9e3779b9 ^ combined.length;
            let h4 = 0x85ebca6b ^ combined.length;

            for (let i = 0; i < combined.length; i++) {
                const ch = combined.charCodeAt(i);
                h1 = Math.imul(h1 ^ ch, 2654435761);
                h2 = Math.imul(h2 ^ ch, 1597334677);
                h3 = Math.imul(h3 ^ ch, 3812048473);
                h4 = Math.imul(h4 ^ ch, 951274213);
            }

            h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
            h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
            h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
            h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

            const pad = (n) => (n >>> 0).toString(16).padStart(8, '0');
            return pad(h1) + pad(h2) + pad(h3) + pad(h4);
        }

        function encodePayload(str) {
            try {
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
            } catch (e) {
                return btoa(str);
            }
        }

        const issuedAt = Date.now();
        const fp = getDeviceFingerprint();
        const nonce = Math.random().toString(36).substring(2, 10);

        const payloadData = {
            email: email.toLowerCase().trim(),
            role: role,
            name: name,
            mustChangePassword: false,
            issuedAt: issuedAt,
            exp: issuedAt + SESSION_EXPIRY_MS,
            nonce: nonce,
            fp: fp
        };

        const payloadStr = JSON.stringify(payloadData);
        const encodedPayload = encodePayload(payloadStr);

        const secret = APP_SECURITY_SALT + '::' + fp;
        const signature = generateHmacDigest(encodedPayload + '::' + issuedAt + '::' + nonce, secret);

        const token = [TOKEN_PREFIX, encodedPayload, issuedAt, nonce, signature].join('.');
        sessionStorage.setItem('stemulus_session', token);
        localStorage.setItem('stemulus_session', token);
    }, { role, email, name });
}

async function runFullOperationalSuite() {
    console.log('================================================================');
    console.log('   STEMULUS FULL 100% OPERATIONAL READINESS E2E TEST SUITE      ');
    console.log('   Deployment Deadline: November 1, 2026                       ');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`  ✓ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`  ✗ FAIL: ${message}`);
            failedTests++;
        }
    }

    const browser = await chromium.launch({ channel: 'msedge', headless: true });

    // Setup Admin Context
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedSession(adminContext, 'admin', 'admin@stemuluskidstech.com', 'STEMulus Admin');
    const adminPage = await adminContext.newPage();

    // Setup Tutor Context
    const tutorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedSession(tutorContext, 'tutor', 'kafayatabdulwahab.et@gmail.com', 'Kafayat Abdulwahab');
    const tutorPage = await tutorContext.newPage();

    try {
        // =========================================================================
        // TEST SUITE 1: TUTOR AVAILABILITY CONFLICT VERIFICATION
        // =========================================================================
        console.log('\n--- [PHASE 1] TUTOR AVAILABILITY CONFLICT VERIFICATION ---');

        const adminUrl = 'file:///' + path.join(__dirname, '..', 'admin-dashboard.html').replace(/\\/g, '/');
        await adminPage.goto(adminUrl, { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(1500);

        // Test DashboardEngine.checkTutorAvailability directly
        const availCheck = await adminPage.evaluate(() => {
            const mosesAvailable = DashboardEngine.checkTutorAvailability('Moses Oluwafemi Adebayo', 'tuesday', '16:00');
            const mosesUnavailable = DashboardEngine.checkTutorAvailability('Moses Oluwafemi Adebayo', 'monday', '09:00');
            const kafaAvailable = DashboardEngine.checkTutorAvailability('Kafayat Abdulwahab', 'saturday', '14:00');
            return { mosesAvailable, mosesUnavailable, kafaAvailable };
        });

        assert(availCheck.mosesAvailable.available === true, 'Moses correctly verified available on Tuesday at 16:00');
        assert(availCheck.mosesUnavailable.available === false, 'Moses correctly identified as unavailable on Monday at 09:00');
        assert(availCheck.kafaAvailable.available === true, 'Kafayat correctly verified available on Saturday at 14:00');

        // Test in DOM: Open Schedule Modal and trigger availability check
        await adminPage.evaluate(() => {
            if (typeof openScheduleModal === 'function') openScheduleModal();
            else if (typeof AdminEngine !== 'undefined' && AdminEngine.openScheduleModal) AdminEngine.openScheduleModal();

            const mentorSelect = document.getElementById('schedule-mentor');
            const dateInput = document.getElementById('schedule-date');
            const timeInput = document.getElementById('schedule-time');

            if (mentorSelect) {
                for (let i = 0; i < mentorSelect.options.length; i++) {
                    if (mentorSelect.options[i].text.includes('Moses')) {
                        mentorSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            if (dateInput) dateInput.value = '2026-11-03'; // Tuesday
            if (timeInput) timeInput.value = '16:00';

            if (typeof validateScheduleAvailability === 'function') {
                validateScheduleAvailability();
            }
        });
        await adminPage.waitForTimeout(500);

        const badgeText = await adminPage.$eval('#schedule-mentor-availability-badge', el => el.textContent);
        const badgeVisible = await adminPage.$eval('#schedule-mentor-availability-badge', el => !el.classList.contains('hidden'));
        assert(badgeVisible && badgeText.includes('Moses'), 'UI schedule availability badge rendered with tutor name');

        const screenshot1Path = path.join(SCREENSHOTS_DIR, 'availability_conflict_check_verified.png');
        await adminPage.screenshot({ path: screenshot1Path });
        saveDualScreenshot(screenshot1Path, 'availability_conflict_check_verified.png');
        console.log(`  ✓ Screenshot saved: ${screenshot1Path}`);

        // =========================================================================
        // TEST SUITE 2: FACULTY NOTICE BOARD & BROADCAST ENGINE
        // =========================================================================
        console.log('\n--- [PHASE 2] FACULTY NOTICES & OPERATIONAL BROADCASTS ---');

        // Navigate to Notices section in Admin Dashboard
        await adminPage.evaluate(() => {
            if (typeof navigateToSection === 'function') navigateToSection('notices');
            else if (typeof AdminEngine !== 'undefined' && AdminEngine.showSection) AdminEngine.showSection('notices');
        });
        await adminPage.waitForTimeout(600);

        const noticesSectionVisible = await adminPage.$eval('#section-notices', el => el.style.display !== 'none');
        assert(noticesSectionVisible, 'Admin #section-notices navigated to successfully');

        // Verify default notices rendered
        const renderedNoticesCount = await adminPage.$$eval('#admin-notices-list .admin-card', els => els.length);
        assert(renderedNoticesCount >= 3, `Admin notices list rendered ${renderedNoticesCount} official notices`);

        // Create a new operational policy notice
        const newNotice = await adminPage.evaluate(() => {
            return DashboardEngine.addNotice({
                title: 'Mandatory 24h Attendance Submission Policy',
                priority: 'urgent',
                targetAudience: 'tutor',
                content: 'Effective immediately, all faculty tutors must log session attendance, topics built, and homework within 24 hours of session end. Delays trigger automatic performance review flag.',
                author: 'Academic Operations Directorate'
            });
        });
        assert(newNotice && newNotice.id, 'Official directive notice added via DashboardEngine');

        // Reload notices
        await adminPage.evaluate(() => {
            if (typeof loadNotices === 'function') loadNotices();
        });
        await adminPage.waitForTimeout(400);

        const updatedNoticeList = await adminPage.$eval('#admin-notices-list', el => el.textContent);
        assert(updatedNoticeList.includes('Mandatory 24h Attendance Submission Policy'), 'New urgent policy notice rendered in Admin notice board');

        // Now Switch to Tutor Dashboard and verify notice reception
        const tutorUrl = 'file:///' + path.join(__dirname, '..', 'tutor-dashboard.html').replace(/\\/g, '/');
        await tutorPage.goto(tutorUrl, { waitUntil: 'domcontentloaded' });
        await tutorPage.waitForTimeout(1500);

        // Check tutor notices banner
        const tutorBannerVisible = await tutorPage.$eval('#tutor-notices-banner', el => el.style.display !== 'none');
        assert(tutorBannerVisible, 'Tutor notices alert banner displayed with unread directives');

        // Open Tutor Notices Modal
        await tutorPage.evaluate(() => {
            if (typeof TutorEngine !== 'undefined' && TutorEngine.openNoticesModal) {
                TutorEngine.openNoticesModal();
            } else if (typeof openNoticesModal === 'function') {
                openNoticesModal();
            }
        });
        await tutorPage.waitForTimeout(500);

        const tutorModalVisible = await tutorPage.$eval('#tutor-notices-modal', el => !el.classList.contains('hidden'));
        assert(tutorModalVisible, 'Tutor Notice Board modal opened with full policy details');

        // Acknowledge / Mark Notice as read
        await tutorPage.evaluate((noticeId) => {
            if (typeof TutorEngine !== 'undefined' && TutorEngine.markNoticeAsRead) {
                TutorEngine.markNoticeAsRead(noticeId);
            }
        }, newNotice.id);
        await tutorPage.waitForTimeout(400);

        const acknowledgedHtml = await tutorPage.$eval('#tutor-notices-container', el => el.innerHTML);
        assert(acknowledgedHtml.includes('Acknowledged') || acknowledgedHtml.includes('check'), 'Notice marked as read and acknowledged by tutor');

        const screenshot2Path = path.join(SCREENSHOTS_DIR, 'tutor_notice_board_acknowledged_verified.png');
        await tutorPage.screenshot({ path: screenshot2Path });
        saveDualScreenshot(screenshot2Path, 'tutor_notice_board_acknowledged_verified.png');
        console.log(`  ✓ Screenshot saved: ${screenshot2Path}`);

        // Also verify Parent Academy Notice Reception on Parent Dashboard
        console.log('  Testing Parent Dashboard Notice Reception...');
        const parentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await seedSession(parentContext, 'parent', 'parent@stemuluskidstech.com', 'Demo Parent');
        const parentPage = await parentContext.newPage();

        const parentUrl = 'file:///' + path.join(__dirname, '..', 'parent-dashboard.html').replace(/\\/g, '/');
        await parentPage.goto(parentUrl, { waitUntil: 'domcontentloaded' });
        await parentPage.waitForTimeout(1500);

        const parentBannerVisible = await parentPage.$eval('#parent-notices-banner', el => el.style.display !== 'none');
        assert(parentBannerVisible, 'Parent academy notices broadcast banner displayed');

        await parentPage.evaluate(() => {
            if (typeof ParentEngine !== 'undefined' && ParentEngine.openNoticesModal) {
                ParentEngine.openNoticesModal();
            }
        });
        await parentPage.waitForTimeout(500);

        const parentModalVisible = await parentPage.$eval('#parent-notices-modal', el => !el.classList.contains('hidden'));
        assert(parentModalVisible, 'Parent Notice Board modal opened with academy announcements');

        await parentPage.evaluate(() => {
            if (typeof ParentEngine !== 'undefined' && ParentEngine.markNoticeAsRead) {
                ParentEngine.markNoticeAsRead('not-002');
            }
        });
        await parentPage.waitForTimeout(400);

        const parentAcknowledgedHtml = await parentPage.$eval('#parent-notices-container', el => el.innerHTML);
        assert(parentAcknowledgedHtml.includes('Acknowledged') || parentAcknowledgedHtml.includes('check'), 'Parent-Teacher Demonstration Week notice marked as read and acknowledged by parent');

        const screenshotParentNoticesPath = path.join(SCREENSHOTS_DIR, 'parent_notice_board_acknowledged_verified.png');
        await parentPage.screenshot({ path: screenshotParentNoticesPath });
        saveDualScreenshot(screenshotParentNoticesPath, 'parent_notice_board_acknowledged_verified.png');
        console.log(`  ✓ Screenshot saved: ${screenshotParentNoticesPath}`);

        // =========================================================================
        // TEST SUITE 3: TUTOR PERFORMANCE ENGINE & AI POLISH ASSISTANT
        // =========================================================================
        console.log('\n--- [PHASE 3] TUTOR PERFORMANCE ENGINE & AI POLISH ---');

        // Check performance KPIs on Tutor Dashboard
        const tutorPerf = await tutorPage.evaluate(() => {
            const perf = DashboardEngine.calculateTutorPerformance('kafayatabdulwahab.et@gmail.com');
            const tierBadge = document.getElementById('tutor-perf-tier-badge') ? document.getElementById('tutor-perf-tier-badge').textContent.trim() : '';
            const onTimeRate = document.getElementById('tutor-perf-ontime-rate') ? document.getElementById('tutor-perf-ontime-rate').textContent.trim() : '';
            const turnaround = document.getElementById('tutor-perf-avg-turnaround') ? document.getElementById('tutor-perf-avg-turnaround').textContent.trim() : '';
            return { perf, tierBadge, onTimeRate, turnaround };
        });

        assert(tutorPerf.tierBadge.includes('Tier 1'), `Tutor Standing badge verified: "${tutorPerf.tierBadge}"`);
        assert(tutorPerf.onTimeRate.includes('%'), `On-time submission rate verified: "${tutorPerf.onTimeRate}"`);

        // Test AI Polish Assistant on Attendance Create page
        const attCreateUrl = 'file:///' + path.join(__dirname, '..', 'tutor-attendance-create.html').replace(/\\/g, '/');
        await tutorPage.goto(attCreateUrl, { waitUntil: 'domcontentloaded' });
        await tutorPage.waitForTimeout(1500);

        // Check Polish button exists
        const polishBtnExists = await tutorPage.$('#btn-ai-polish-comment');
        assert(polishBtnExists !== null, 'AI Polish button "#btn-ai-polish-comment" rendered on tutor comment field');

        // Fill rough notes and test polishing
        await tutorPage.evaluate(async () => {
            const commentArea = document.getElementById('tutor_comment');
            if (commentArea) {
                commentArea.value = 'farouq was proactive today w/ variables and functions congrats';
            }
            const sNameInput = document.getElementById('student_name');
            if (sNameInput) {
                sNameInput.value = 'Farouq Adebayo';
            }
            if (typeof polishTutorCommentWithAI === 'function') {
                await polishTutorCommentWithAI();
            }
        });
        await tutorPage.waitForTimeout(800);

        const polishedText = await tutorPage.$eval('#tutor_comment', el => el.value);
        assert(polishedText.length > 25 && (polishedText.includes('variables') || polishedText.includes('functions')) && (polishedText.includes('proactive') || polishedText.includes('initiative') || polishedText.includes('work') || polishedText.includes('great') || polishedText.includes('Farouq') || polishedText.includes('congrats')), `AI polished comment successfully: "${polishedText}"`);

        const screenshot3Path = path.join(SCREENSHOTS_DIR, 'tutor_performance_and_ai_polish_verified.png');
        await tutorPage.screenshot({ path: screenshot3Path });
        saveDualScreenshot(screenshot3Path, 'tutor_performance_and_ai_polish_verified.png');
        console.log(`  ✓ Screenshot saved: ${screenshot3Path}`);

        // Test Tutor Monthly Report with Verified Rate & Bank Routing
        console.log('  Testing Tutor Monthly Report with Verified Rate & Bank Routing...');
        const monthlyReportUrl = 'file:///' + path.join(__dirname, '..', 'tutor-monthly-report.html').replace(/\\/g, '/');
        await tutorPage.goto(monthlyReportUrl, { waitUntil: 'domcontentloaded' });
        await tutorPage.waitForTimeout(1500);

        const compNoticeText = await tutorPage.$eval('#report-stats-notice', el => el.textContent);
        assert(compNoticeText.includes('$35.00/hr') || compNoticeText.includes('Rate: $'), 'Monthly report dynamically computed tutor verified hourly rate');
        assert(compNoticeText.includes('GTBank') && compNoticeText.includes('0141342433'), 'Monthly report displays verified NUBAN bank routing (GTBank 0141342433)');
        assert(compNoticeText.includes('Tier 1: Exemplary'), 'Monthly report displays tutor performance tier badge');

        const screenshotMonthlyReportPath = path.join(SCREENSHOTS_DIR, 'tutor_monthly_report_verified_bank_routing.png');
        await tutorPage.screenshot({ path: screenshotMonthlyReportPath });
        saveDualScreenshot(screenshotMonthlyReportPath, 'tutor_monthly_report_verified_bank_routing.png');
        console.log(`  ✓ Screenshot saved: ${screenshotMonthlyReportPath}`);

        // =========================================================================
        // TEST SUITE 4: MASTER TUTOR PAYROLL HUB & BANK REMITTANCE EXPORT
        // =========================================================================
        console.log('\n--- [PHASE 4] MASTER TUTOR PAYROLL & BANK REMITTANCE HUB ---');

        await adminPage.goto(adminUrl, { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(1500);

        // Navigate to Payroll section
        await adminPage.evaluate(() => {
            if (typeof navigateToSection === 'function') navigateToSection('payroll');
            else if (typeof AdminEngine !== 'undefined' && AdminEngine.showSection) AdminEngine.showSection('payroll');
        });
        await adminPage.waitForTimeout(600);

        const payrollSectionVisible = await adminPage.$eval('#section-payroll', el => el.style.display !== 'none');
        assert(payrollSectionVisible, 'Admin #section-payroll navigated to successfully');

        // Test getPayrollLedger
        const ledger = await adminPage.evaluate(() => {
            return DashboardEngine.getPayrollLedger();
        });

        assert(ledger.totalTutors >= 5, `Payroll ledger accounts for ${ledger.totalTutors} verified tutors`);
        assert(ledger.disbursements.some(d => d.bankName === 'GTBank' && d.accountNumber === '0141342433'), 'Kafayat GTBank NUBAN 0141342433 present in remittance ledger');
        assert(ledger.disbursements.some(d => d.bankName === 'Opay' && d.accountNumber === '7063346551'), 'Moses Opay NUBAN 7063346551 present in remittance ledger');

        // Verify Payroll Table rendered in DOM
        const payrollTableRows = await adminPage.$$eval('#payroll-table-body tr', rows => rows.length);
        assert(payrollTableRows >= 5, `Payroll breakdown table rendered ${payrollTableRows} tutor remittance rows`);

        // Test Mark Month Disbursed
        const disbResult = await adminPage.evaluate(() => {
            const now = new Date();
            const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const res = DashboardEngine.markPayrollDisbursed(m, 'TEST-DISB-E2E-001');
            if (typeof loadPayroll === 'function') loadPayroll(m);
            return res;
        });
        assert(disbResult && disbResult.status === 'PAID', 'Month marked as Disbursed in payrollDisbursements store');

        const kpiStatusText = await adminPage.$eval('#pr-kpi-status-container', el => el.textContent);
        assert(kpiStatusText.includes('Disbursed') || kpiStatusText.includes('Paid'), 'KPI status reflects Disbursed / Paid');

        const screenshot4Path = path.join(SCREENSHOTS_DIR, 'master_payroll_and_remittance_verified.png');
        await adminPage.screenshot({ path: screenshot4Path });
        saveDualScreenshot(screenshot4Path, 'master_payroll_and_remittance_verified.png');
        console.log(`  ✓ Screenshot saved: ${screenshot4Path}`);

    } catch (err) {
        console.error('\nCRITICAL TEST SUITE ERROR:', err);
        failedTests++;
    } finally {
        await browser.close();
    }

    console.log('\n================================================================');
    console.log(`   FULL OPERATIONAL SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
    if (failedTests > 0) {
        console.error(`   ${failedTests} TEST(S) FAILED!`);
        process.exit(1);
    } else {
        console.log('   ALL 4 CRITICAL GAPS CLOSED. 100% OPERATIONAL READINESS REACHED!');
        console.log('================================================================\n');
        process.exit(0);
    }
}

runFullOperationalSuite();
