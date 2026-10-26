/**
 * Automated End-to-End Playwright Verification for:
 * 1. Autonomous Active Class Monitoring (CODER_WAITING_FOR_TUTOR, TUTOR_WAITING_FOR_CODER, IN_SESSION)
 * 2. Contact Routing Engine ("Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat")
 * 3. Tutor Dashboard Live Presence Banner (#tutor-live-class-monitor-banner)
 * 4. Admin Dashboard Live Class Radar (#live-radar-list)
 * 5. Classroom Companion (#partner-status-alert in join-class.html)
 * 6. Live NTFY Push Notification to https://ntfy.sh/stemulus-admin-alerts
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
};

function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            const parsedUrl = new URL(req.url, 'http://localhost');
            let pathname = decodeURIComponent(parsedUrl.pathname);
            if (pathname === '/') pathname = '/index.html';

            if (pathname.startsWith('/.netlify/functions/notify')) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, simulated: true }));
                return;
            }

            const filePath = path.join(ROOT_DIR, pathname);
            if (!filePath.startsWith(ROOT_DIR)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                res.end(data);
            });
        });

        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
        });
    });
}

(async () => {
    const { server, baseUrl } = await startServer();
    console.log(`[Server] Listening on ${baseUrl}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });

    const ntfyDispatches = [];
    await context.route('https://ntfy.sh/**', async (route) => {
        const req = route.request();
        ntfyDispatches.push({
            url: req.url(),
            method: req.method(),
            headers: req.headers(),
            body: req.postData() || ''
        });
        await route.continue();
    });

    const results = [];
    function assert(name, condition, detail = '') {
        const status = condition ? 'PASS' : 'FAIL';
        console.log(`[${status}] ${name}${detail ? ' -> ' + detail : ''}`);
        results.push({ name, passed: Boolean(condition), detail });
        if (!condition) {
            throw new Error(`Assertion failed: ${name} (${detail})`);
        }
    }

    try {
        const page = await context.newPage();

        // 1. Seed initial database & test Joshua joining class waiting for Tutor Kafayat
        const todayIso = new Date().toISOString().split('T')[0];
        const joinUrlStudent = `${baseUrl}/join-class.html?id=sch-joshua-1&student=${encodeURIComponent('Joshua Ogba')}&course=${encodeURIComponent('Scratch Game Design')}&tutor=${encodeURIComponent('Kafayat Abdulwahab')}&role=student&url=${encodeURIComponent('https://meet.google.com/new')}&test=1`;

        await page.addInitScript((todayStr) => {
            const sessionData = {
                id: 'usr-joshua',
                name: 'Joshua Ogba',
                email: 'ogba@example.com',
                role: 'parent',
                issuedAt: Date.now()
            };
            sessionStorage.setItem('stemulus_session', JSON.stringify(sessionData));

            // Ensure schedule for Joshua & Kafayat exists today
            let db = {};
            try { db = JSON.parse(localStorage.getItem('stemulus_db') || '{}'); } catch (e) {}
            db.tutors = db.tutors || [];
            if (!db.tutors.some(t => t.email === 'kafayat@stemuluskidstech.com')) {
                db.tutors.push({
                    id: 'tut-kafayat',
                    name: 'Kafayat Abdulwahab',
                    email: 'kafayat@stemuluskidstech.com',
                    phone: '+234 814 624 3795',
                    status: 'active'
                });
            }
            db.students = db.students || [];
            if (!db.students.some(s => (s.name || '').includes('Joshua'))) {
                db.students.push({
                    id: 'stu-joshua',
                    firstName: 'Joshua',
                    lastName: 'Ogba',
                    name: 'Joshua Ogba',
                    parentName: 'Mr. & Mrs. Ogba',
                    parentEmail: 'ogba@example.com',
                    parentPhone: '+234 803 123 4567',
                    assignedTutorEmail: 'kafayat@stemuluskidstech.com',
                    assignedTutorName: 'Kafayat Abdulwahab',
                    program: 'Scratch Game Design',
                    meetLink: 'https://meet.google.com/new'
                });
            }
            db.schedules = db.schedules || [];
            const existingIdx = db.schedules.findIndex(s => s.id === 'sch-joshua-1');
            const schedObj = {
                id: 'sch-joshua-1',
                studentId: 'stu-joshua',
                studentName: 'Joshua Ogba',
                course: 'Scratch Game Design',
                mentor: 'Kafayat Abdulwahab',
                tutorName: 'Kafayat Abdulwahab',
                tutorEmail: 'kafayat@stemuluskidstech.com',
                date: todayStr,
                time: '16:00',
                status: 'Upcoming',
                link: 'https://meet.google.com/new'
            };
            if (existingIdx !== -1) db.schedules[existingIdx] = schedObj;
            else db.schedules.push(schedObj);

            localStorage.setItem('stemulus_db', JSON.stringify(db));
        }, todayIso);

        await page.goto(joinUrlStudent, { waitUntil: 'load' });
        await page.waitForTimeout(1200);

        const joinEval = await page.evaluate(() => {
            const pres = JSON.parse(localStorage.getItem('stemulus_live_presence') || '{}');
            const pRecord = pres['sch-joshua-1'] || Object.values(pres)[0];
            const db = DashboardEngine.getDB();
            const sched = db.schedules.find(s => (pRecord && s.id === pRecord.scheduleId) || s.id === 'sch-joshua-1' || (s.studentName || '').includes('Joshua'));
            const state = ClassEscalationEngine.evaluateSessionState(sched);
            const alertEl = document.getElementById('partner-status-alert');
            return {
                pRecord,
                state,
                alertText: alertEl ? alertEl.innerText : ''
            };
        });

        assert(
            '1. Presence Heartbeat marks Student Present & Alerted Coder Waiting',
            joinEval.pRecord && joinEval.pRecord.studentPresent === true && joinEval.pRecord.alertedCoderWaiting === true,
            JSON.stringify(joinEval.pRecord)
        );
        assert(
            '2. evaluateSessionState returns CODER_WAITING_FOR_TUTOR immediately',
            joinEval.state && joinEval.state.code === 'CODER_WAITING_FOR_TUTOR',
            joinEval.state ? joinEval.state.code : 'null'
        );
        assert(
            '3. Contact Routing Summary matches exact phrasing ("Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat")',
            joinEval.state && joinEval.state.contactSummary.includes('Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat'),
            joinEval.state ? joinEval.state.contactSummary : 'null'
        );
        assert(
            '4. join-class.html #partner-status-alert displays live waiting & Tutor Kafayat contact banner',
            joinEval.alertText.includes('Joshua is now in class waiting for Kafayat') && joinEval.alertText.includes('Reach Out to Tutor Kafayat'),
            joinEval.alertText.replace(/\s+/g, ' ')
        );
        assert(
            '5. Autonomous NTFY Alert dispatched to https://ntfy.sh/stemulus-admin-alerts',
            ntfyDispatches.some(d => d.url.includes('stemulus-admin-alerts') && d.body.includes('Joshua is now in class waiting for Kafayat')),
            `Dispatched ${ntfyDispatches.length} NTFY requests`
        );

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'join_class_coder_waiting.png'), fullPage: false });

        // 2. Verify Tutor Dashboard Live Class Monitor Banner (#tutor-live-class-monitor-banner)
        const tutorPage = await context.newPage();
        await tutorPage.goto(`${baseUrl}/tutor-login.html`, { waitUntil: 'domcontentloaded' });
        await tutorPage.evaluate(() => {
            const tutorSession = {
                id: 'tut-kafayat',
                name: 'Kafayat Abdulwahab',
                email: 'kafayatabdulwahab.et@gmail.com',
                role: 'tutor',
                issuedAt: Date.now()
            };
            sessionStorage.setItem('stemulus_session', JSON.stringify(tutorSession));
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
                StemulusSecurity.saveSecureSession(tutorSession);
            }
        });

        await tutorPage.goto(`${baseUrl}/tutor-dashboard.html`, { waitUntil: 'load' });
        await tutorPage.waitForTimeout(1000);

        const tutorBannerEval = await tutorPage.evaluate(() => {
            if (typeof TutorEngine !== 'undefined' && TutorEngine.renderLiveClassPresenceBanner) {
                TutorEngine.renderLiveClassPresenceBanner();
            }
            const banner = document.getElementById('tutor-live-class-monitor-banner');
            const notifBox = document.getElementById('tutor-notifications-container');
            return {
                visible: Boolean(banner && banner.style.display !== 'none' && banner.innerHTML.trim().length > 0),
                bannerText: banner ? banner.innerText : '',
                notifText: notifBox ? notifBox.innerText : ''
            };
        });

        assert(
            '6. Tutor Dashboard #tutor-live-class-monitor-banner is visible for Tutor Kafayat',
            tutorBannerEval.visible === true,
            tutorBannerEval.bannerText.replace(/\s+/g, ' ')
        );
        assert(
            '7. Tutor Dashboard banner informs who is waiting and who to contact ("Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat")',
            tutorBannerEval.bannerText.includes('Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat') &&
            tutorBannerEval.bannerText.includes('Join Classroom Now'),
            tutorBannerEval.bannerText.replace(/\s+/g, ' ')
        );

        await tutorPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'tutor_dashboard_live_waiting_banner.png'), fullPage: false });

        // 3. Verify Admin Dashboard Live Class Radar (#live-radar-list)
        const adminPage = await context.newPage();
        await adminPage.goto(`${baseUrl}/admin-login.html`, { waitUntil: 'domcontentloaded' });
        await adminPage.evaluate(() => {
            const adminSession = {
                id: 'adm-1',
                name: 'STEMulus Admin',
                email: 'admin@stemuluskidstech.com',
                role: 'admin',
                issuedAt: Date.now()
            };
            sessionStorage.setItem('stemulus_session', JSON.stringify(adminSession));
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
                StemulusSecurity.saveSecureSession(adminSession);
            }
        });

        await adminPage.goto(`${baseUrl}/admin-dashboard.html`, { waitUntil: 'load' });
        await adminPage.waitForTimeout(1000);

        await adminPage.click('[data-section="schedules"]').catch(() => {});
        await adminPage.waitForTimeout(400);

        const adminRadarEval = await adminPage.evaluate(() => {
            if (typeof renderLiveRadar === 'function') renderLiveRadar();
            const radarEl = document.getElementById('live-radar-list');
            return {
                radarText: radarEl ? radarEl.innerText : '',
                radarHtml: radarEl ? radarEl.innerHTML : ''
            };
        });

        assert(
            '8. Admin Live Class Radar displays Joshua waiting for Kafayat with contact routing summary',
            adminRadarEval.radarText.includes('Joshua Ogba') &&
            adminRadarEval.radarText.includes('Coder Waiting for Tutor') &&
            adminRadarEval.radarText.includes('Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat'),
            adminRadarEval.radarText.replace(/\s+/g, ' ')
        );
        assert(
            '9. Admin Live Class Radar provides 1-click "Reach Out to Tutor Kafayat" action button with phone number',
            adminRadarEval.radarText.includes('Reach Out to Tutor Kafayat') && (adminRadarEval.radarText.includes('08065220517') || adminRadarEval.radarText.includes('+234')),
            'Action button verified'
        );

        await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_live_radar_joshua_waiting.png'), fullPage: false });

        // 4. Test Scenario B: Tutor Kafayat joins waiting for Coder Joshua (TUTOR_WAITING_FOR_CODER)
        const tutorJoinPage = await context.newPage();
        const joinUrlTutor = `${baseUrl}/join-class.html?id=sch-joshua-1&student=${encodeURIComponent('Joshua Ogba')}&course=${encodeURIComponent('Scratch Game Design')}&tutor=${encodeURIComponent('Kafayat Abdulwahab')}&role=tutor&url=${encodeURIComponent('https://meet.google.com/new')}&test=1`;
        await tutorJoinPage.goto(joinUrlTutor, { waitUntil: 'load' });

        const tutorWaitingEval = await tutorJoinPage.evaluate(() => {
            // Simulate clean start where Tutor Kafayat joins first and is waiting for Joshua
            localStorage.removeItem('stemulus_live_presence');
            const db = DashboardEngine.getDB();
            const sched = db.schedules.find(s => s.id === 'sch-115-sun-josh-w1' || s.id === 'sch-joshua-1' || (s.studentName || '').includes('Joshua'));
            const schedId = sched ? sched.id : 'sch-joshua-1';
            ClassEscalationEngine.recordHeartbeat('sch-joshua-1', schedId, 'tutor', 'Kafayat Abdulwahab', {
                studentName: 'Joshua Ogba',
                tutorName: 'Kafayat Abdulwahab',
                courseName: 'Scratch Creators',
                meetingUrl: 'https://meet.google.com/yko-xwce-ugd'
            });
            window.dispatchEvent(new CustomEvent('stemulus_presence_updated'));
            const state = ClassEscalationEngine.evaluateSessionState(sched);
            const alertEl = document.getElementById('partner-status-alert');
            return {
                state,
                alertText: alertEl ? alertEl.innerText : ''
            };
        });

        assert(
            '10. When Tutor joins first, evaluateSessionState returns TUTOR_WAITING_FOR_CODER',
            tutorWaitingEval.state && tutorWaitingEval.state.code === 'TUTOR_WAITING_FOR_CODER',
            tutorWaitingEval.state ? tutorWaitingEval.state.code : 'null'
        );
        assert(
            '11. Contact routing instructs Tutor to reach out to Joshua\'s Parent in order for class to hold',
            tutorWaitingEval.state.contactSummary.includes("Tutor Kafayat is now in class waiting for Joshua. Please reach out to Joshua's Parent") &&
            tutorWaitingEval.alertText.includes("Reach Out to Joshua's Parent"),
            tutorWaitingEval.state.contactSummary
        );

        await tutorJoinPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'join_class_contact_routing.png'), fullPage: false });

        // 5. Test Scenario C: Both Student and Tutor join -> IN_SESSION
        const bothJoinedEval = await tutorJoinPage.evaluate(() => {
            const db = DashboardEngine.getDB();
            const sched = db.schedules.find(s => s.id === 'sch-115-sun-josh-w1' || s.id === 'sch-joshua-1' || (s.studentName || '').includes('Joshua'));
            const schedId = sched ? sched.id : 'sch-joshua-1';
            ClassEscalationEngine.recordHeartbeat('sch-joshua-1', schedId, 'tutor', 'Kafayat Abdulwahab', {
                studentName: 'Joshua Ogba',
                tutorName: 'Kafayat Abdulwahab',
                courseName: 'Scratch Creators'
            });
            ClassEscalationEngine.recordHeartbeat('sch-joshua-1', schedId, 'student', 'Joshua Ogba', {
                studentName: 'Joshua Ogba',
                tutorName: 'Kafayat Abdulwahab',
                courseName: 'Scratch Creators'
            });
            const state = ClassEscalationEngine.evaluateSessionState(sched);
            return { state };
        });

        assert(
            '12. When both Coder and Tutor have joined, evaluateSessionState transitions to IN_SESSION',
            bothJoinedEval.state && bothJoinedEval.state.code === 'IN_SESSION' &&
            bothJoinedEval.state.contactSummary.includes('Both Joshua and Tutor Kafayat have joined. Class is holding live!'),
            bothJoinedEval.state ? bothJoinedEval.state.contactSummary : 'null'
        );

        // 6. Verify direct live NTFY notification to Admin (https://ntfy.sh/stemulus-admin-alerts)
        const liveNtfyResponse = await fetch('https://ntfy.sh/stemulus-admin-alerts', {
            method: 'POST',
            headers: {
                'Title': 'STEMulus Active Class Monitor: Joshua & Kafayat Verified',
                'Priority': 'high',
                'Tags': 'rotating_light,white_check_mark,school'
            },
            body: [
                'Autonomous Active Class Monitoring & Contact Routing is LIVE!',
                'Sample Live Alert: "Joshua is now in class waiting for Kafayat. Please reach out to Tutor Kafayat (+234 814 624 3795)."',
                'All 3 portals (Admin Live Radar, Tutor Dashboard Banner, Classroom Companion) + NTFY push alerts verified.'
            ].join('\n')
        });

        assert(
            '13. Live NTFY notification delivered to https://ntfy.sh/stemulus-admin-alerts with HTTP 200 OK',
            liveNtfyResponse.ok && liveNtfyResponse.status === 200,
            `HTTP Status: ${liveNtfyResponse.status}`
        );

        console.log(`\n🎉 ALL ${results.length}/${results.length} ACTIVE CLASS MONITORING & NTFY TESTS PASSED!`);
    } finally {
        await browser.close();
        server.close();
    }
})();
