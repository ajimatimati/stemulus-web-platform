const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8099;
const ROOT_DIR = path.resolve(__dirname, '..');

function startServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.webmanifest': 'application/manifest+json'
    };

    const server = http.createServer((req, res) => {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(ROOT_DIR, reqPath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });

    return new Promise((resolve) => {
        server.listen(PORT, () => resolve(server));
    });
}

(async () => {
    console.log('\n=============================================================');
    console.log('   SILICON VALLEY SECURITY & PRIVACY DEFENSE E2E AUDIT');
    console.log('   Standards: COPPA, GDPR-K, FERPA, OWASP ASVS');
    console.log('=============================================================\n');

    const server = await startServer();
    const baseUrl = `http://localhost:${PORT}`;

    const browser = await chromium.launch({
        headless: true,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    function assert(testName, condition, detail = '') {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName} - ${detail}`);
            failed++;
        }
    }

    try {
        // -------------------------------------------------------------
        // TEST 1: Console Developer Role-Spoofing Attack Prevention
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Console Developer Role-Spoofing Block ---');
        await page.goto(`${baseUrl}/admin-login.html`);

        // Inject forged unauthenticated admin session into sessionStorage
        await page.evaluate(() => {
            sessionStorage.setItem('stemulus_session', JSON.stringify({
                email: 'admin@stemuluskidstech.com',
                role: 'admin',
                name: 'Console Hacker',
                issuedAt: Date.now()
            }));
        });

        // Attempt unauthorized entry into admin dashboard
        await page.goto(`${baseUrl}/admin-dashboard.html`);
        await page.waitForTimeout(700);

        const currentUrl = page.url();
        assert(
            'Console Developer cannot bypass auth via raw JSON role injection',
            currentUrl.includes('admin-login.html'),
            `Expected redirect to admin-login.html, but stayed at: ${currentUrl}`
        );

        // Clear forged storage before next tests
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        // -------------------------------------------------------------
        // TEST 2: Tampered Token & Forged JWT Envelope Rejection
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Cryptographic Token Tampering & Replay ---');
        const tamperResult = await page.evaluate(() => {
            if (typeof StemulusSecurity === 'undefined') return { loaded: false };
            
            // Legitimately mint parent token
            const legitParentToken = StemulusSecurity.signSession({
                email: 'parent@stemuluskidstech.com',
                role: 'parent',
                name: 'Legit Parent'
            });

            // Tamper: hacker tries to elevate privilege to admin inside payload
            const parts = legitParentToken.split('.');
            let payloadStr = atob(parts[1]);
            let payload = JSON.parse(payloadStr);
            payload.role = 'admin';
            parts[1] = btoa(JSON.stringify(payload));
            const forgedAdminToken = parts.join('.');

            const verifiedForged = StemulusSecurity.verifySession(forgedAdminToken);
            return {
                loaded: true,
                legitValid: !!StemulusSecurity.verifySession(legitParentToken),
                forgedRejected: verifiedForged === null
            };
        });

        assert('StemulusSecurity engine loaded', tamperResult.loaded);
        assert('Legitimate session token verifies correctly', tamperResult.legitValid);
        assert('Tampered/privilege-escalated token rejected with null', tamperResult.forgedRejected);

        // -------------------------------------------------------------
        // TEST 3: Encrypted Web Crypto Storage Vault (Zero Plaintext DB)
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Web Crypto Vault Protection ---');
        const vaultCheck = await page.evaluate(() => {
            const sampleDB = {
                students: [{ id: 's-1', name: 'Confidential Child', parentEmail: 'parent@gmail.com' }],
                parents: [{ name: 'Confidential Parent', phone: '+1 555-0199' }]
            };
            StemulusSecurity.saveSecureDB(sampleDB);
            const rawStored = localStorage.getItem('stemulus_db');
            
            // Raw storage must NOT contain plaintext sensitive strings
            const containsPlaintextChild = rawStored.includes('Confidential Child');
            const containsPlaintextPhone = rawStored.includes('+1 555-0199');
            const isEncryptedEnvelope = rawStored.includes('__sec":true');

            // Decryption check
            const decrypted = StemulusSecurity.getSecureDB();
            const decryptedMatch = decrypted && decrypted.students && decrypted.students[0].name === 'Confidential Child';

            return {
                containsPlaintextChild,
                containsPlaintextPhone,
                isEncryptedEnvelope,
                decryptedMatch
            };
        });

        assert('Raw storage hides child PII (no plaintext in localStorage)', !vaultCheck.containsPlaintextChild);
        assert('Raw storage hides parent phone numbers', !vaultCheck.containsPlaintextPhone);
        assert('Encrypted vault envelope active (__sec: true)', vaultCheck.isEncryptedEnvelope);
        assert('Authorized in-memory decrypt restores data perfectly', vaultCheck.decryptedMatch);

        // -------------------------------------------------------------
        // TEST 4: Anti-Scraper Honeypot Trapping
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing Anti-Scraper Honeypot Defense ---');
        await page.goto(`${baseUrl}/parent-login.html`);

        // Check if anti-scraper honeypot shield is present
        const hpExists = await page.evaluate(() => {
            return !!document.getElementById('__stemulus_hp_shield');
        });
        assert('Anti-scraper honeypot shield injected into DOM', hpExists);

        // -------------------------------------------------------------
        // TEST 5: Legitimate Login & PII Masking Verification
        // -------------------------------------------------------------
        console.log('\n--- 5. Testing Legitimate Login & PII Masking Under COPPA ---');
        await page.goto(`${baseUrl}/admin-login.html`);
        await page.waitForSelector('#emailInput', { timeout: 10000 });
        await page.fill('#emailInput', 'admin@stemuluskidstech.com');
        await page.fill('#passwordInput', 'STEMulus2026!');
        await page.click('#submitBtn');
        await page.waitForTimeout(1000);

        const authedUrl = page.url();
        assert('Admin login succeeds with legitimate credentials', authedUrl.includes('admin-dashboard.html'));

        // Check that session token is cryptographically signed
        const sessionTokenIsSigned = await page.evaluate(() => {
            const rawSession = sessionStorage.getItem('stemulus_session') || localStorage.getItem('stemulus_session');
            return rawSession && rawSession.startsWith('STMSV2.');
        });
        assert('Authenticated session stored as signed STMSV2 cryptographic envelope', sessionTokenIsSigned);

        // Navigate to Parents directory in Admin Dashboard
        await page.evaluate(() => {
            if (typeof AdminEngine !== 'undefined') {
                AdminEngine.navigateToSection('students');
                AdminEngine.switchRosterTab('parents');
            }
        });
        await page.waitForTimeout(600);

        // Verify PII is masked by default
        const piiMasked = await page.evaluate(() => {
            const parentTable = document.getElementById('parents-table-body');
            if (!parentTable) return false;
            const text = parentTable.innerText;
            // Phone numbers should contain '•••' and emails should contain '***'
            return text.includes('•••') || text.includes('***');
        });
        assert('Parent PII (emails/phones) masked by default (COPPA/GDPR-K Compliance)', piiMasked);

        // Test Unmasking toggle
        await page.click('.privacy-shield-toggle');
        await page.waitForTimeout(400);
        const unmaskedText = await page.evaluate(() => {
            const parentTable = document.getElementById('parents-table-body');
            return parentTable ? parentTable.innerText : '';
        });
        const unmaskedConfirmed = unmaskedText.includes('@') && !unmaskedText.includes('***');
        assert('Admin can toggle unmasking with verified session', unmaskedConfirmed);

    } catch (err) {
        console.error('Audit exception:', err);
        failed++;
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n=============================================================');
    console.log(` AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
})();
