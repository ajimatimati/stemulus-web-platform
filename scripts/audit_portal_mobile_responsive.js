const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8092;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORTAL_PAGES = [
  { file: 'admin-dashboard.html', role: 'admin', email: 'admin@stemuluskidstech.com' },
  { file: 'parent-dashboard.html', role: 'parent', email: 'parent@example.com' },
  { file: 'tutor-dashboard.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
  { file: 'parent-progress.html', role: 'parent', email: 'parent@example.com' },
  { file: 'tutor-attendance.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
  { file: 'tutor-attendance-create.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
  { file: 'tutor-monthly-report.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
  { file: 'tutor-students.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
  { file: 'join-class.html', role: 'parent', email: 'parent@example.com' },
  { file: 'tutor-evaluation.html', role: 'admin', email: 'admin@stemuluskidstech.com' }
];

const VIEWPORTS = [
  { name: 'iPhone_SE_375', width: 375, height: 667 },
  { name: 'iPhone_14_390', width: 390, height: 844 },
  { name: 'iPhone_Plus_414', width: 414, height: 896 }
];

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\USER\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  });

  const fullAuditReport = [];

  for (const portal of PORTAL_PAGES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });

      const page = await context.newPage();

      // Seed local storage with valid session and mock data
      await page.addInitScript(({ role, email }) => {
        const session = {
          email: email,
          name: role === 'admin' ? 'Admin Director' : role === 'tutor' ? 'Coach Moses' : 'Sarah Parent',
          role: role,
          token: 'mock-test-jwt-token'
        };
        sessionStorage.setItem('stemulus_session', JSON.stringify(session));
        localStorage.setItem('stemulus_session', JSON.stringify(session));
        localStorage.setItem('stemulus_user_email', email);
        localStorage.setItem('stemulus_user_role', role);
      }, { role: portal.role, email: portal.email });

      try {
        await page.goto(`http://localhost:${PORT}/${portal.file}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1500); // Allow dynamic DOM creation and Lucide icons
      } catch (e) {
        console.warn(`Error loading ${portal.file} at ${vp.width}px:`, e.message);
      }

      // Deep inspection of DOM
      const findings = await page.evaluate(({ vpWidth }) => {
        const issues = [];
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;

        // 1. Page-level horizontal scrollbar
        if (scrollWidth > docWidth + 3) {
          // Identify which top-level elements exceed docWidth
          const overflowingElements = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > docWidth + 3 && el.offsetParent !== null) {
              const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').filter(c => c && !c.includes(':')).slice(0, 2).join('.') : '');
              if (!overflowingElements.includes(sel) && overflowingElements.length < 5) {
                overflowingElements.push({ sel, right: Math.round(r.right), width: Math.round(r.width) });
              }
            }
          });

          issues.push({
            category: 'HORIZONTAL_SCROLL',
            severity: 'CRITICAL',
            details: `Page has unwanted horizontal overflow: scrollWidth is ${scrollWidth}px (viewport is ${docWidth}px).`,
            overflowingElements
          });
        }

        // 2. Buttons & Navigation Links
        const buttons = document.querySelectorAll('button, a.btn, .nav-link, nav a, header button, .tab-btn, .action-btn, [role="button"]');
        buttons.forEach(btn => {
          const style = window.getComputedStyle(btn);
          if (style.display === 'none' || style.visibility === 'hidden' || btn.offsetParent === null) return;

          const rect = btn.getBoundingClientRect();
          const text = btn.innerText ? btn.innerText.trim().replace(/\s+/g, ' ') : '';

          // A. Button clipping text (scrollWidth > clientWidth with overflow hidden)
          if (btn.scrollWidth > btn.clientWidth + 2 && (style.overflow === 'hidden' || style.overflowX === 'hidden')) {
            issues.push({
              category: 'BUTTON_TEXT_CLIPPED',
              severity: 'HIGH',
              selector: btn.tagName.toLowerCase() + (btn.id ? '#' + btn.id : '') + (btn.className ? '.' + btn.className.split(' ').filter(c => c && !c.includes(':')).slice(0, 2).join('.') : ''),
              label: text.slice(0, 50),
              details: `Button text is clipped: content width (${btn.scrollWidth}px) exceeds button width (${btn.clientWidth}px).`
            });
          }

          // B. Button extending offscreen (outside horizontal scroll containers)
          const inScrollContainer = btn.closest('.overflow-x-auto, .overflow-auto, [style*="overflow-x: auto"]');
          if (!inScrollContainer && rect.right > vpWidth + 2) {
            issues.push({
              category: 'BUTTON_OFFSCREEN',
              severity: 'HIGH',
              selector: btn.tagName.toLowerCase() + (btn.id ? '#' + btn.id : '') + (btn.className ? '.' + btn.className.split(' ').filter(c => c && !c.includes(':')).slice(0, 2).join('.') : ''),
              label: text.slice(0, 50),
              details: `Button right edge (${Math.round(rect.right)}px) is cut off by viewport (${vpWidth}px).`
            });
          }

          // C. Long label without responsive font/wrap causing awkward multi-line breakage or massive height
          if (text.length > 25 && rect.height > 60 && !btn.closest('table')) {
            issues.push({
              category: 'BUTTON_LABEL_AWKWARD_WRAP',
              severity: 'MEDIUM',
              selector: btn.tagName.toLowerCase() + (btn.id ? '#' + btn.id : '') + (btn.className ? '.' + btn.className.split(' ').filter(c => c && !c.includes(':')).slice(0, 2).join('.') : ''),
              label: text.slice(0, 50),
              details: `Button label wraps awkwardly into ${Math.round(rect.height)}px tall container on mobile.`
            });
          }
        });

        // 3. Navigation Header / Topbars
        const headers = document.querySelectorAll('header, #navbar, #top-bar, .portal-header, #sidebar');
        headers.forEach(h => {
          const rect = h.getBoundingClientRect();
          const inViewport = h.offsetParent !== null;
          if (inViewport && rect.width > vpWidth + 2) {
            issues.push({
              category: 'HEADER_OVERFLOW',
              severity: 'HIGH',
              selector: h.tagName.toLowerCase() + (h.id ? '#' + h.id : ''),
              details: `Navigation header width (${Math.round(rect.width)}px) exceeds viewport width (${vpWidth}px).`
            });
          }
        });

        // 4. Words extending out of containers (text node overflow)
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, td, th').forEach(el => {
          if (el.offsetParent === null) return;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return;

          // If element scrollWidth > clientWidth and text has words that don't fit
          if (el.scrollWidth > el.clientWidth + 4 && style.overflow === 'hidden' && !el.classList.contains('truncate')) {
            const txt = el.innerText ? el.innerText.trim().replace(/\s+/g, ' ') : '';
            if (txt.length > 0 && txt.length < 80) {
              issues.push({
                category: 'TEXT_OVERFLOW_CONTAINER',
                severity: 'MEDIUM',
                selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').filter(c => c && !c.includes(':')).slice(0, 2).join('.') : ''),
                text: txt,
                details: `Text overflows container: scrollWidth (${el.scrollWidth}px) > clientWidth (${el.clientWidth}px).`
              });
            }
          }
        });

        return issues;
      }, { vpWidth: vp.width });

      console.log(`[Audit] ${portal.file} @ ${vp.name}: ${findings.length} findings.`);
      if (findings.length > 0) {
        fullAuditReport.push({
          page: portal.file,
          viewport: vp.name,
          width: vp.width,
          findings
        });
      }

      await context.close();
    }
  }

  await browser.close();
  server.close();

  fs.writeFileSync('data/portal_mobile_deep_audit_results.json', JSON.stringify(fullAuditReport, null, 2));
  console.log('\n--- Deep Mobile Audit Complete. Saved to data/portal_mobile_deep_audit_results.json ---');
});
