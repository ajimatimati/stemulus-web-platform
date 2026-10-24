const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8124;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function run() {
  server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    let browser;
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
    const page = await browser.newPage();

    try {
      // 1. Load parent dashboard and verify DashboardEngine DB state
      await page.goto(`http://localhost:${PORT}/parent-login.html`, { waitUntil: 'domcontentloaded' });

      const auditResults = await page.evaluate(() => {
        const db = window.DashboardEngine ? window.DashboardEngine.getDB() : null;
        if (!db) return { error: 'DashboardEngine not loaded' };

        const EXPECTED_MAPPING = {
          'Pearl Babalola': 'https://meet.google.com/bbx-ocde-ytw',
          'Gbolade Okesanjo': 'https://meet.google.com/qye-ezub-uqi',
          'King Myles Omosuyi': 'https://meet.google.com/miz-dthg-pmt',
          'JUNAYD KARI': 'https://meet.google.com/gyd-fewb-cdh',
          'Joshua Ogba': 'https://meet.google.com/yko-xwce-ugd',
          'Momooreoluwa Sonaike': 'https://meet.google.com/vdp-nmbh-sjj',
          'David Gjoka': 'https://meet.google.com/ckd-ngjs-cth',
          'Farouq': 'https://meet.google.com/mim-qifa-avc'
        };

        const studentChecks = {};
        for (const [name, expectedLink] of Object.entries(EXPECTED_MAPPING)) {
          const tokens = name.toLowerCase().split(/\s+/);
          const student = (db.students || []).find(s => {
            const full = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase();
            return tokens.every(tok => full.includes(tok));
          });
          studentChecks[name] = {
            found: !!student,
            actualMeetLink: student ? student.meetLink : null,
            matches: student ? student.meetLink === expectedLink : false
          };
        }

        const scheduleChecks = (db.schedules || []).map(sch => {
          let expectedLink = null;
          const sName = (sch.studentName || '').toLowerCase();
          for (const [name, link] of Object.entries(EXPECTED_MAPPING)) {
            if (sName.includes(name.toLowerCase()) || name.toLowerCase().includes(sName)) {
              expectedLink = link;
              break;
            }
          }
          const actual = sch.link && sch.link.includes('Physical') ? sch.meetLinkBackup : sch.link;
          return {
            id: sch.id,
            studentName: sch.studentName,
            actualLink: actual,
            expectedLink: expectedLink,
            matches: expectedLink ? actual === expectedLink : true
          };
        });

        return {
          studentChecks,
          allStudentsMatch: Object.values(studentChecks).every(c => c.matches),
          allSchedulesMatch: scheduleChecks.every(s => s.matches),
          scheduleChecks
        };
      });

      console.log('--- Student Meet Link Audit ---');
      console.log(JSON.stringify(auditResults.studentChecks, null, 2));
      console.log('All Students Match Authentic Links:', auditResults.allStudentsMatch);
      console.log('All Active Schedules Match Authentic Links:', auditResults.allSchedulesMatch);

      if (!auditResults.allStudentsMatch || !auditResults.allSchedulesMatch) {
        throw new Error('Some student links or schedules do not match authentic Google Pro links!');
      }

      console.log('🎉 100% OF AUTHENTIC GOOGLE PRO LINKS VERIFIED IN DATABASE AND SCHEDULES!');
    } catch (err) {
      console.error('Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await browser.close();
      server.close();
    }
  });
}

run();
