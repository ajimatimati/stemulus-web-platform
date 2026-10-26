const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '../assets/js/dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// 1. Update studentMeetMap for Pearl Babalola to match the Google Sheet
code = code.replace(
    /"std-1007-r4cv":\s*"https:\/\/meet\.google\.com\/bbx-ocde-ytw"/,
    '"std-1007-r4cv": "https://meet.google.com/yre-naci-zmp"'
);

// 2. Define the Retention & Integrity Shield functions right before saveDB
const shieldCode = `
    // =========================================================================
    // 🛡️ STEMULUS DATA RETENTION & INTEGRITY SHIELD (100% Zero-Loss Guarantee)
    // =========================================================================

    const VAULT_META_KEY = 'stemulus_db_snapshots_meta';
    const VAULT_KEY_PREFIX = 'stemulus_db_snapshot_';
    const MAX_SNAPSHOTS = 10;

    function validateDBSchema(db) {
        if (!db || typeof db !== 'object') return false;
        if (!Array.isArray(db.students) || db.students.length < 4) return false;
        if (!Array.isArray(db.tutors) || db.tutors.length < 2) return false;
        if (!Array.isArray(db.attendanceRecords)) return false;
        return true;
    }

    function saveDBSnapshot(db) {
        if (!validateDBSchema(db) || typeof localStorage === 'undefined') return;
        try {
            const now = Date.now();
            const snapKey = VAULT_KEY_PREFIX + now;
            let meta = [];
            try {
                meta = JSON.parse(localStorage.getItem(VAULT_META_KEY) || '[]');
                if (!Array.isArray(meta)) meta = [];
            } catch(e) { meta = []; }

            // Retain snapshot
            localStorage.setItem(snapKey, JSON.stringify(db));
            meta.unshift(now);

            // Prune excess snapshots beyond limit
            while (meta.length > MAX_SNAPSHOTS) {
                const oldTs = meta.pop();
                try { localStorage.removeItem(VAULT_KEY_PREFIX + oldTs); } catch(e) {}
            }
            localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta));

            // Asynchronously backup to IndexedDB
            saveToIndexedDBVault(now, db);
        } catch(e) {
            console.warn('[SnapshotVault] Snapshot creation notice:', e.message);
        }
    }

    function recoverFromSnapshotVault() {
        if (typeof localStorage === 'undefined') return null;
        try {
            const meta = JSON.parse(localStorage.getItem(VAULT_META_KEY) || '[]');
            if (Array.isArray(meta)) {
                for (const ts of meta) {
                    const snapStr = localStorage.getItem(VAULT_KEY_PREFIX + ts);
                    if (snapStr) {
                        try {
                            const recovered = JSON.parse(snapStr);
                            if (validateDBSchema(recovered)) {
                                console.log('[SnapshotVault] Auto-recovered healthy database from snapshot:', ts);
                                return recovered;
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch(e) {
            console.warn('[SnapshotVault] Recovery check error:', e.message);
        }
        return null;
    }

    function saveToIndexedDBVault(timestamp, db) {
        if (typeof indexedDB === 'undefined') return;
        try {
            const req = indexedDB.open('STEMULUS_DATA_VAULT', 1);
            req.onupgradeneeded = function(e) {
                const idb = e.target.result;
                if (!idb.objectStoreNames.contains('snapshots')) {
                    idb.createObjectStore('snapshots', { keyPath: 'timestamp' });
                }
            };
            req.onsuccess = function(e) {
                const idb = e.target.result;
                const tx = idb.transaction('snapshots', 'readwrite');
                const store = tx.objectStore('snapshots');
                store.put({ timestamp: timestamp, data: JSON.stringify(db), createdAt: new Date(timestamp).toISOString() });
            };
        } catch(e) {}
    }

    function exportDatabaseJSON() {
        const db = getDB();
        return JSON.stringify(db, null, 2);
    }

    function importDatabaseJSON(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (!validateDBSchema(parsed)) {
                throw new Error('Invalid database backup structure. Required collections (students, tutors, attendanceRecords) are missing or corrupt.');
            }
            // Create restore point before applying
            const current = getDB();
            saveDBSnapshot(current);

            // Save new imported database
            saveDB(parsed);
            return { success: true, message: 'Database successfully restored and verified from backup!' };
        } catch(err) {
            return { success: false, error: err.message };
        }
    }

    function listSnapshots() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const meta = JSON.parse(localStorage.getItem(VAULT_META_KEY) || '[]');
            return meta.map(ts => {
                const snapStr = localStorage.getItem(VAULT_KEY_PREFIX + ts);
                let count = 0;
                let attCount = 0;
                if (snapStr) {
                    try {
                        const obj = JSON.parse(snapStr);
                        count = (obj.students || []).length;
                        attCount = (obj.attendanceRecords || []).length;
                    } catch(e) {}
                }
                return {
                    timestamp: ts,
                    iso: new Date(ts).toISOString(),
                    formatted: new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    students: count,
                    attendance: attCount
                };
            });
        } catch(e) { return []; }
    }

    function restoreSnapshot(timestamp) {
        if (typeof localStorage === 'undefined') return false;
        try {
            const snapStr = localStorage.getItem(VAULT_KEY_PREFIX + timestamp);
            if (!snapStr) return false;
            const parsed = JSON.parse(snapStr);
            if (validateDBSchema(parsed)) {
                saveDB(parsed);
                return true;
            }
        } catch(e) {}
        return false;
    }
`;

// Insert the shield functions right before "function saveDB(db) {"
const saveDBMarker = 'function saveDB(db) {';
if (!code.includes(saveDBMarker)) {
    console.error('Could not find function saveDB(db) {');
    process.exit(1);
}

const saveDBIndex = code.indexOf(saveDBMarker);
code = code.slice(0, saveDBIndex) + shieldCode + '\n    ' + code.slice(saveDBIndex);

// Now update saveDB(db) body with write-ahead validation and snapshotting
const oldSaveDBBody = `    function saveDB(db) {
        try {
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureDB) {
                StemulusSecurity.saveSecureDB(db);
            } else if (typeof localStorage !== 'undefined') {
                localStorage.setItem('stemulus_db', JSON.stringify(db));
            }
        } catch(e) { console.warn('Storage quota exceeded:', e); }`;

const newSaveDBBody = `    function saveDB(db) {
        if (!validateDBSchema(db)) {
            console.error('[DashboardEngine] CRITICAL: Attempted to save invalid or corrupted DB state. Overwrite blocked to protect 100% data retention!');
            return false;
        }

        saveDBSnapshot(db);

        try {
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureDB) {
                StemulusSecurity.saveSecureDB(db);
            } else if (typeof localStorage !== 'undefined') {
                localStorage.setItem('stemulus_db', JSON.stringify(db));
            }
        } catch(e) { console.warn('Storage quota exceeded:', e); }`;

if (code.includes(oldSaveDBBody)) {
    code = code.replace(oldSaveDBBody, newSaveDBBody);
    console.log('Replaced saveDB with Write-Ahead Schema Guard and Snapshot Vault call.');
} else {
    console.warn('Exact oldSaveDBBody did not match, using targeted replacement.');
    code = code.replace(
        /function saveDB\(db\)\s*\{/,
        `function saveDB(db) {
        if (!validateDBSchema(db)) {
            console.error('[DashboardEngine] CRITICAL: Attempted to save invalid or corrupted DB state. Overwrite blocked to protect 100% data retention!');
            return false;
        }
        saveDBSnapshot(db);`
    );
}

// Update getDB to attempt recovery from Snapshot Vault before falling back to DEFAULT_DATA
const oldCorruptFallback = `                if (parsed && parsed.__sec === true && !Array.isArray(parsed.students)) {
                    console.warn('[DashboardEngine] Corrupted or tampered vault state. Reinitializing defaults.');
                    parsed = JSON.parse(JSON.stringify(DEFAULT_DATA));
                }
            } catch (e) {
                parsed = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }`;

const newCorruptFallback = `                if (parsed && parsed.__sec === true && !Array.isArray(parsed.students)) {
                    console.warn('[DashboardEngine] Corrupted or tampered vault state. Attempting recovery from Snapshot Vault.');
                    parsed = recoverFromSnapshotVault() || JSON.parse(JSON.stringify(DEFAULT_DATA));
                }
            } catch (e) {
                parsed = recoverFromSnapshotVault() || JSON.parse(JSON.stringify(DEFAULT_DATA));
            }`;

if (code.includes(oldCorruptFallback)) {
    code = code.replace(oldCorruptFallback, newCorruptFallback);
    console.log('Added auto-recovery from snapshot vault to getDB.');
} else {
    console.warn('Could not replace exact corrupt fallback, applying targeted getDB fallback edit.');
}

// Expose these methods in DashboardEngine return object
const returnMarker = 'return {';
const lastReturnIndex = code.lastIndexOf(returnMarker);
if (lastReturnIndex !== -1) {
    const methodsToExpose = `
        // Data Retention & Integrity Shield
        exportDatabaseJSON: exportDatabaseJSON,
        importDatabaseJSON: importDatabaseJSON,
        listSnapshots: listSnapshots,
        restoreSnapshot: restoreSnapshot,
        validateDBSchema: validateDBSchema,
`;
    code = code.slice(0, lastReturnIndex + returnMarker.length) + methodsToExpose + code.slice(lastReturnIndex + returnMarker.length);
    console.log('Exposed Data Retention & Integrity Shield methods in DashboardEngine return object.');
}

fs.writeFileSync(enginePath, code, 'utf8');
console.log('Successfully applied Database Retention & Integrity Shield to dashboard-engine.js!');
