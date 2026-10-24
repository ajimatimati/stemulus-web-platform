const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 INITIATING COMPREHENSIVE CODEBASE & INTEGRITY AUDIT...\n');

let issues = [];
let passed = 0;

function recordPass(msg) {
    passed++;
    console.log(`  [PASS] ${msg}`);
}

function recordIssue(category, msg, severity = 'WARNING') {
    issues.push({ category, msg, severity });
    console.log(`  [${severity}] ${category}: ${msg}`);
}

const rootDir = path.join(__dirname, '..');

// 1. Audit Database
console.log('=== STEP 1: DATABASE INTEGRITY ===');
try {
    const dbPath = path.join(rootDir, 'data', 'stemulus_db_latest.json');
    if (!fs.existsSync(dbPath)) {
        recordIssue('Database', 'data/stemulus_db_latest.json missing', 'CRITICAL');
    } else {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        recordPass('data/stemulus_db_latest.json is valid JSON');
        
        const reqKeys = ['students', 'tutors', 'schedules'];
        reqKeys.forEach(k => {
            if (Array.isArray(db[k])) {
                recordPass(`Database table '${k}' present with ${db[k].length} records`);
            } else {
                recordIssue('Database', `Missing or invalid table: ${k}`, 'CRITICAL');
            }
        });

        // Verify required student presence
        const expectedStudents = ['David Gjoka', 'Junayd Kari', 'Joshua Ogba', 'King Myles Omosuyi', 'Babalola Oluwadunmininu Pearl', 'Momooreoluwa Sonaike'];
        expectedStudents.forEach(name => {
            const found = db.students.find(s => ((s.firstName || '') + ' ' + (s.lastName || '') + ' ' + (s.name || '')).toLowerCase().includes(name.toLowerCase().split(' ')[0]));
            if (found) {
                recordPass(`Student record verified: ${name}`);
            } else {
                recordIssue('Database Students', `Missing expected student: ${name}`, 'CRITICAL');
            }
        });

        // Verify hostNotRequired on schedules
        const invalidSchedules = db.schedules.filter(s => s.hostNotRequired !== true);
        if (invalidSchedules.length === 0) {
            recordPass(`All ${db.schedules.length} schedules have hostNotRequired = true`);
        } else {
            recordIssue('Schedules', `${invalidSchedules.length} schedules missing hostNotRequired=true`, 'WARNING');
        }
    }
} catch (e) {
    recordIssue('Database Exception', e.message, 'CRITICAL');
}

// 2. Audit JavaScript Syntax in assets/js
console.log('\n=== STEP 2: JS ASSET SYNTAX CHECK ===');
const jsDir = path.join(rootDir, 'assets', 'js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));

jsFiles.forEach(file => {
    const fullPath = path.join(jsDir, file);
    try {
        execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
        recordPass(`Syntax OK: assets/js/${file}`);
    } catch (e) {
        recordIssue('Syntax Error', `Syntax failure in assets/js/${file}: ${e.message}`, 'CRITICAL');
    }
});

// 3. Audit HTML Script & Link References
console.log('\n=== STEP 3: HTML SCRIPT & STYLESHEET INTEGRITY ===');
const htmlFiles = [
    'admin-dashboard.html',
    'tutor-dashboard.html',
    'parent-dashboard.html',
    'join-class.html',
    'tutor-attendance.html',
    'tutor-attendance-create.html',
    'tutor-monthly-report.html',
    'tutor-students.html'
];

htmlFiles.forEach(htmlFile => {
    const fullHtmlPath = path.join(rootDir, htmlFile);
    if (!fs.existsSync(fullHtmlPath)) {
        recordIssue('HTML Missing', `${htmlFile} does not exist`, 'CRITICAL');
        return;
    }

    const content = fs.readFileSync(fullHtmlPath, 'utf8');

    // Find script tags
    const scriptMatches = content.match(/<script\s+[^>]*src=["']([^"']+)["']/gi) || [];
    scriptMatches.forEach(tag => {
        const srcMatch = tag.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            let src = srcMatch[1].split('?')[0];
            if (!src.startsWith('http://') && !src.startsWith('https://')) {
                const assetPath = path.join(rootDir, src.replace(/\//g, path.sep));
                if (fs.existsSync(assetPath)) {
                    recordPass(`${htmlFile} -> script exists: ${src}`);
                } else {
                    recordIssue('Broken Script', `${htmlFile} references missing script: ${src}`, 'CRITICAL');
                }
            }
        }
    });

    // Find stylesheet links
    const linkMatches = content.match(/<link\s+[^>]*href=["']([^"']+)["']/gi) || [];
    linkMatches.forEach(tag => {
        if (/rel=["']stylesheet["']/i.test(tag)) {
            const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
            if (hrefMatch && hrefMatch[1]) {
                let href = hrefMatch[1].split('?')[0];
                if (!href.startsWith('http://') && !href.startsWith('https://')) {
                    const cssPath = path.join(rootDir, href.replace(/\//g, path.sep));
                    if (fs.existsSync(cssPath)) {
                        recordPass(`${htmlFile} -> stylesheet exists: ${href}`);
                    } else {
                        recordIssue('Broken Stylesheet', `${htmlFile} references missing stylesheet: ${href}`, 'CRITICAL');
                    }
                }
            }
        }
    });
});

// Summary
console.log('\n========================================');
console.log(`AUDIT RESULTS: ${passed} Passed | ${issues.length} Issues`);
console.log('========================================\n');

if (issues.length > 0) {
    console.log('Identified Issues:');
    issues.forEach((iss, idx) => {
        console.log(` ${idx + 1}. [${iss.severity}] ${iss.category}: ${iss.msg}`);
    });
    process.exit(1);
} else {
    console.log('🌟 ALL CODEBASE AND ASSET AUDITS PASSED WITH ZERO ISSUES!');
    process.exit(0);
}
