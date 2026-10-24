/**
 * Automated Verification Suite: Bilingual Classroom & 3D Playful Minimalist Engine
 * Validates:
 * 1. English <-> French i18n translation coverage & visual/text display modes
 * 2. Junayd & Olalekan bilingual neural translation dictionary & Scratch Block Bank
 * 3. DOM Switcher mounts across Admin, Parent, Tutor, and Join-Class dashboards
 * 4. 3D standalone asset file presence and integrity
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTAL_FILES = [
  'admin-dashboard.html',
  'parent-dashboard.html',
  'tutor-dashboard.html',
  'join-class.html'
];

let totalPass = 0;
let totalFail = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    totalPass++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
    totalFail++;
  }
}

console.log('====================================================');
console.log('STEMULUS BILINGUAL & 3D PLAYFUL ENGINE VERIFICATION');
console.log('====================================================\n');

// 1. Verify i18n Dictionary Integrity
console.log('[1/4] Checking i18n Visual Engine Dictionary & Modes...');
const i18nPath = path.join(ROOT_DIR, 'assets', 'js', 'i18n-visual-engine.js');
assert(fs.existsSync(i18nPath), 'i18n-visual-engine.js must exist');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');

it('Contains English (en) and French (fr) dictionaries', () => {
  assert(i18nCode.includes('en: {'), 'Must have en dictionary');
  assert(i18nCode.includes('fr: {'), 'Must have fr dictionary');
});

it('Contains core UI translations across portal sections', () => {
  const coreKeys = ['dashboard_title', 'welcome_sub', 'switch_lang', 'visual_cards', 'compact_text', 'ops_title', 'birthday_title', 'join_class'];
  coreKeys.forEach(k => {
    assert(i18nCode.includes(`"${k}"`) || i18nCode.includes(`'${k}'`) || i18nCode.includes(`${k}:`), `Dictionary missing key: ${k}`);
  });
});

it('Supports 3D Visual Cards vs Compact Text switching', () => {
  assert(i18nCode.includes('switchDisplayMode'), 'Must define switchDisplayMode');
  assert(i18nCode.includes('stemulus-mode-visual'), 'Must support visual mode styling');
});

// 2. Verify Junayd & Olalekan Bilingual Classroom Engine
console.log('\n[2/4] Checking Junayd & Olalekan Classroom Engine...');
const bilingualPath = path.join(ROOT_DIR, 'assets', 'js', 'bilingual-classroom-engine.js');
assert(fs.existsSync(bilingualPath), 'bilingual-classroom-engine.js must exist');
const bilingualCode = fs.readFileSync(bilingualPath, 'utf8');

it('Bilingual engine targets Junayd Kari & Coach Olalekan', () => {
  assert(bilingualCode.includes('Junayd'), 'Must target Junayd');
  assert(bilingualCode.includes('Olalekan'), 'Must target Olalekan');
});

it('Contains Scratch Coding Block Bank with dual audio & translations', () => {
  assert(bilingualCode.includes('SCRATCH_BLOCKS'), 'Must contain SCRATCH_BLOCKS definition');
  assert(bilingualCode.includes('Avancer de 10 pas'), 'Must have Scratch move block');
  assert(bilingualCode.includes('Répéter indéfiniment'), 'Must have Scratch loop block');
  assert(bilingualCode.includes('Quand le drapeau vert est cliqué'), 'Must have Scratch event block');
});

it('Contains bidirectional translation pairs (FR -> EN and EN -> FR)', () => {
  assert(bilingualCode.includes('TRANSLATION_PAIRS'), 'Must have dictionary lookup');
  assert(bilingualCode.includes('Je veux faire bouger le chat'), 'Must translate cat movement');
  assert(bilingualCode.includes('Bravo ! Tu as réussi !'), 'Must translate encouragement');
});

it('Integrates Web Speech API and SpeechSynthesis speech audio', () => {
  assert(bilingualCode.includes('webkitSpeechRecognition') || bilingualCode.includes('SpeechRecognition'), 'Must support Web Speech API');
  assert(bilingualCode.includes('speechSynthesis.speak'), 'Must support voice synthesis');
});

// 3. Verify DOM Switchers & Script Injections in Portals
console.log('\n[3/4] Checking Portal HTML Mounts & Scripts...');
PORTAL_FILES.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  it(`${file} exists and contains required i18n & visual modules`, () => {
    assert(fs.existsSync(filePath), `${file} does not exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert(content.includes('i18n-visual-engine'), `${file} missing i18n-visual-engine script`);
    assert(content.includes('dual-switcher') || content.includes('mount-') || content.includes('stem-lang-btn'), `${file} missing dual switcher markup`);
  });
});

it('join-class.html embeds the dedicated Junayd & Olalekan bilingual companion', () => {
  const joinClassContent = fs.readFileSync(path.join(ROOT_DIR, 'join-class.html'), 'utf8');
  assert(joinClassContent.includes('stem-bilingual-assistant-card') || joinClassContent.includes('bilingual-classroom-engine'), 'Must include bilingual companion');
  assert(joinClassContent.includes('Junayd Kari') || joinClassContent.includes('Bilingual'), 'Must reference bilingual session');
});

// 4. Verify 3D Standalone Asset Presence
console.log('\n[4/4] Checking 3D Minimalist Assets...');
const assetList = [
  'images/portal/standalone/rocket-3d.png',
  'images/portal/standalone/clock-3d.png',
  'images/portal/standalone/gift-3d.png',
  'images/portal/standalone/speech-3d.png',
  'images/portal/standalone/radar-chart-3d.png',
  'images/portal/standalone/tally-counter-3d.png',
  'images/portal/standalone/star-badge-3d.png'
];

assetList.forEach(relPath => {
  const fullPath = path.join(ROOT_DIR, relPath);
  it(`Asset exists: ${relPath}`, () => {
    assert(fs.existsSync(fullPath), `Asset file missing: ${relPath}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 500, `Asset file seems truncated/empty: ${relPath} (${stat.size} bytes)`);
  });
});

console.log('\n----------------------------------------------------');
console.log(`RESULTS: ${totalPass} Passed | ${totalFail} Failed`);
console.log('----------------------------------------------------');

if (totalFail > 0) {
  process.exit(1);
} else {
  console.log('[SUCCESS] All Bilingual & 3D Playful engine checks passed!\n');
}
