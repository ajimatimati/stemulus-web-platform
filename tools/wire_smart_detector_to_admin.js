const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const terserBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'terser.cmd' : 'terser');

console.log('--- Step 1: Updating assets/js/admin-engine.js ---');
const adminEnginePath = path.join(rootDir, 'assets', 'js', 'admin-engine.js');
let adminCode = fs.readFileSync(adminEnginePath, 'utf8');

// 1. Extend typeLabels in loadEmailQueue
const oldTypeLabels = `    var typeLabels = { 
      welcome: 'Parent Welcome', 
      'tutor-welcome': 'Tutor Welcome', 
      'tutor_welcome': 'Tutor Welcome',
      'student-enrolled': 'Student Enrolled',
      'certificate-delivery': 'Certificate', 
      'credentials-reset': 'Password Reset', 
      custom: 'Custom Message' 
    };`;

const newTypeLabels = `    var typeLabels = { 
      welcome: 'Parent Welcome', 
      'tutor-welcome': 'Tutor Welcome', 
      'tutor_welcome': 'Tutor Welcome',
      'student-enrolled': 'Student Enrolled',
      'certificate-delivery': 'Certificate', 
      'credentials-reset': 'Password Reset', 
      custom: 'Custom Message',
      billing: 'Tuition Renewal',
      birthday: 'Birthday Greeting',
      schedule: 'Schedule Notice',
      timezone: 'Timezone Advisory'
    };`;

if (adminCode.includes(oldTypeLabels)) {
  adminCode = adminCode.replace(oldTypeLabels, newTypeLabels);
  console.log('Updated typeLabels in admin-engine.js');
} else if (!adminCode.includes('billing: \'Tuition Renewal\'')) {
  // Try regex replacement
  adminCode = adminCode.replace(/var typeLabels = \{[\s\S]*?custom: 'Custom Message'\s*\};/, newTypeLabels.trim());
  console.log('Updated typeLabels via regex in admin-engine.js');
}

// 2. Extend typeColor in loadEmailQueue
const oldTypeColor = `var typeColor = (item.type === 'welcome' || item.type === 'tutor-welcome' || item.type === 'tutor_welcome' || item.type === 'student-enrolled') ? 'bg-blue-100 text-blue-700' : item.type === 'certificate-delivery' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';`;

const newTypeColor = `var typeColor = (item.type === 'welcome' || item.type === 'tutor-welcome' || item.type === 'tutor_welcome' || item.type === 'student-enrolled') ? 'bg-blue-100 text-blue-700' : 
                      item.type === 'certificate-delivery' ? 'bg-green-100 text-green-700' : 
                      item.type === 'billing' ? 'bg-amber-100 text-amber-800' : 
                      item.type === 'birthday' ? 'bg-pink-100 text-pink-700' : 
                      item.type === 'schedule' ? 'bg-purple-100 text-purple-700' : 
                      item.type === 'timezone' ? 'bg-cyan-100 text-cyan-800' : 
                      'bg-orange-100 text-orange-700';`;

if (adminCode.includes(oldTypeColor)) {
  adminCode = adminCode.replace(oldTypeColor, newTypeColor);
  console.log('Updated typeColor in admin-engine.js');
}

// 3. Add AdminSmartDetector.init() in loadDashboardData()
if (!adminCode.includes('AdminSmartDetector.init()')) {
  const targetLoadDash = `if (document.getElementById('email-queue-list')) loadEmailQueue();`;
  const replacementLoadDash = `if (document.getElementById('email-queue-list')) loadEmailQueue();\n    if (typeof AdminSmartDetector !== 'undefined' && AdminSmartDetector.init) AdminSmartDetector.init();`;
  adminCode = adminCode.replace(targetLoadDash, replacementLoadDash);
  console.log('Wired AdminSmartDetector.init() to loadDashboardData()');
}

fs.writeFileSync(adminEnginePath, adminCode, 'utf8');

console.log('--- Step 2: Updating admin-dashboard.html ---');
const adminHtmlPath = path.join(rootDir, 'admin-dashboard.html');
let htmlCode = fs.readFileSync(adminHtmlPath, 'utf8');

const targetScript = `<script src="assets/js/admin-engine.min.js?v=20261017d" defer></script>`;
const smartDetectorScript = `<script src="assets/js/admin-smart-detector.min.js?v=20261026" defer></script>`;

if (!htmlCode.includes('admin-smart-detector.min.js')) {
  htmlCode = htmlCode.replace(targetScript, `${targetScript}\n  ${smartDetectorScript}`);
  fs.writeFileSync(adminHtmlPath, htmlCode, 'utf8');
  console.log('Added admin-smart-detector.min.js script tag to admin-dashboard.html');
} else {
  console.log('admin-smart-detector.min.js script tag already present');
}

console.log('--- Step 3: Minifying Files ---');
// Minify admin-smart-detector.js
const smartSrc = path.join(rootDir, 'assets', 'js', 'admin-smart-detector.js');
const smartMin = path.join(rootDir, 'assets', 'js', 'admin-smart-detector.min.js');
execSync(`"${terserBin}" "${smartSrc}" -o "${smartMin}" --compress --mangle`);
console.log('Generated assets/js/admin-smart-detector.min.js (' + fs.statSync(smartMin).size + ' bytes)');

// Minify admin-engine.js
const adminSrc = path.join(rootDir, 'assets', 'js', 'admin-engine.js');
const adminMin = path.join(rootDir, 'assets', 'js', 'admin-engine.min.js');
execSync(`"${terserBin}" "${adminSrc}" -o "${adminMin}" --compress --mangle`);
console.log('Generated assets/js/admin-engine.min.js (' + fs.statSync(adminMin).size + ' bytes)');

// Minify dashboard-engine.js
const dashSrc = path.join(rootDir, 'assets', 'js', 'dashboard-engine.js');
const dashMin = path.join(rootDir, 'assets', 'js', 'dashboard-engine.min.js');
execSync(`"${terserBin}" "${dashSrc}" -o "${dashMin}" --compress --mangle`);
console.log('Generated assets/js/dashboard-engine.min.js (' + fs.statSync(dashMin).size + ' bytes)');

console.log('--- All components wired and minified successfully! ---');
