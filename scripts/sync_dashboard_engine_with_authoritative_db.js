const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const dePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
let deContent = fs.readFileSync(dePath, 'utf8');

// Replace DEFAULT_DATA in dashboard-engine.js
const defaultDataMarkerStart = 'const DEFAULT_DATA = {';
const defaultDataIndex = deContent.indexOf(defaultDataMarkerStart);

if (defaultDataIndex === -1) {
  console.error('Could not locate DEFAULT_DATA in dashboard-engine.js');
  process.exit(1);
}

// Find the end of DEFAULT_DATA
const helperRetrievalMarker = '// Helper to retrieve data from localStorage (Web Crypto Vault Protected)';
const helperIndex = deContent.indexOf(helperRetrievalMarker);

if (helperIndex === -1) {
  console.error('Could not locate helperRetrievalMarker in dashboard-engine.js');
  process.exit(1);
}

// Build serialized DEFAULT_DATA from authoritative db
const serializedDefaultData = `const DEFAULT_DATA = ${JSON.stringify(db, null, 4)};\n\n    `;

const before = deContent.substring(0, defaultDataIndex);
const after = deContent.substring(helperIndex);

let newDeContent = before + serializedDefaultData + after;

// Now let's update getDB() to automatically hydrate if _syncVersion is missing or outdated
const syncVersionMarker = "const DB_SYNC_VERSION = '2026.10.17.v5';";

// Find parsed = JSON.parse(dbStr);
const parseTarget = `            try {
                parsed = JSON.parse(dbStr);`;

const parseReplacement = `            try {
                parsed = JSON.parse(dbStr);
                const DB_SYNC_VERSION = '2026.10.17.v5';
                if (!parsed || parsed._syncVersion !== DB_SYNC_VERSION || !parsed.schedules || parsed.schedules.length < 20 || !parsed.students || parsed.students.length < 13) {
                    parsed = Object.assign({}, DEFAULT_DATA, parsed || {});
                    parsed.students = DEFAULT_DATA.students || [];
                    parsed.tutors = DEFAULT_DATA.tutors || [];
                    parsed.schedules = DEFAULT_DATA.schedules || [];
                    parsed.users = Object.assign({}, DEFAULT_DATA.users || {}, parsed.users || {});
                    parsed._syncVersion = DB_SYNC_VERSION;
                    saveDB(parsed);
                }`;

if (newDeContent.includes(parseTarget)) {
  newDeContent = newDeContent.replace(parseTarget, parseReplacement);
  console.log('Successfully added auto-hydration to getDB()!');
} else {
  console.warn('parseTarget not found, checking if already modified');
}

fs.writeFileSync(dePath, newDeContent, 'utf8');
console.log('Successfully updated assets/js/dashboard-engine.js with authoritative db!');
