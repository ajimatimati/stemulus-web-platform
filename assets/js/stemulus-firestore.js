/**
 * STEMulus Normalized Firestore Engine (v2.0)
 * ============================================
 * Provides high-performance, modular, collection-level persistence replacing
 * the legacy monolithic `state/current` Firestore document.
 * 
 * Features:
 * - Granular collections: users, students, schedules, attendance, tutors,
 *   parents, certificates, monthly_reports, progress_reports, reschedules,
 *   coverage_requests, leads, system_settings.
 * - Atomic shallow merges (`{ merge: true }`) preventing cross-user race conditions.
 * - Chunked batch writes (max 400 operations per Firestore batch).
 * - Automatic zero-downtime decomposition & migration of legacy `state/current`.
 * - Real-time collection snapshot listeners with deduplicated local writes.
 * - Non-blocking, debounced dual-write mirror for backwards compatibility.
 */

(function(global) {
    'use strict';

    const SCHEMA_VERSION = '2.0.0-normalized';
    const pendingDocWrites = new Set();
    let isDecomposing = false;
    let dualWriteTimeout = null;
    let activeListeners = [];

    function isAvailable() {
        return typeof firebase !== 'undefined' && 
               firebase.apps && 
               firebase.apps.length > 0 && 
               typeof firebase.firestore === 'function';
    }

    function getFirestoreDb() {
        return isAvailable() ? firebase.firestore() : null;
    }

    /**
     * Atomic write to a discrete collection document with shallow merge
     */
    async function syncDoc(collectionName, docId, data, options = { merge: true }) {
        if (!isAvailable() || !collectionName || !docId || !data) return false;
        const docKey = `${collectionName}/${String(docId)}`;
        pendingDocWrites.add(docKey);

        try {
            const fsDb = getFirestoreDb();
            const sanitized = JSON.parse(JSON.stringify(data));
            sanitized._lastUpdated = new Date().toISOString();
            sanitized._syncSource = 'normalized-engine';

            await fsDb.collection(collectionName).doc(String(docId)).set(sanitized, options);
            console.log(`[STEMulus Cloud] Normalized sync OK: ${docKey}`);
            setTimeout(() => pendingDocWrites.delete(docKey), 2000);
            return true;
        } catch (err) {
            pendingDocWrites.delete(docKey);
            console.warn(`[STEMulus Cloud] Normalized sync failed (${docKey}):`, err.message || err);
            return false;
        }
    }

    /**
     * Atomic delete from a discrete collection document
     */
    async function deleteDoc(collectionName, docId) {
        if (!isAvailable() || !collectionName || !docId) return false;
        const docKey = `${collectionName}/${String(docId)}`;
        pendingDocWrites.add(docKey);

        try {
            const fsDb = getFirestoreDb();
            await fsDb.collection(collectionName).doc(String(docId)).delete();
            console.log(`[STEMulus Cloud] Normalized delete OK: ${docKey}`);
            setTimeout(() => pendingDocWrites.delete(docKey), 2000);
            return true;
        } catch (err) {
            pendingDocWrites.delete(docKey);
            console.warn(`[STEMulus Cloud] Normalized delete failed (${docKey}):`, err.message || err);
            return false;
        }
    }

    /**
     * Batch writes with chunking (Firestore limit is 500 ops; we safely use 400)
     */
    async function batchWriteEntities(collectionName, items, getIdFn) {
        if (!isAvailable() || !Array.isArray(items) || items.length === 0) return 0;
        const fsDb = getFirestoreDb();
        const CHUNK_SIZE = 400;
        let written = 0;

        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const batch = fsDb.batch();

            chunk.forEach(item => {
                if (!item) return;
                const id = getIdFn ? getIdFn(item) : (item.id || item.credential_id || (item.email ? item.email.toLowerCase().trim() : null));
                if (!id) return;
                const ref = fsDb.collection(collectionName).doc(String(id));
                const sanitized = JSON.parse(JSON.stringify(item));
                sanitized._lastUpdated = new Date().toISOString();
                batch.set(ref, sanitized, { merge: true });
                written++;
            });

            await batch.commit();
        }
        return written;
    }

    /**
     * Non-blocking, debounced mirror write to legacy `state/current`
     * for seamless backwards compatibility with older clients.
     */
    function scheduleDualWriteMirror(db) {
        if (!isAvailable() || !db) return;
        if (dualWriteTimeout) clearTimeout(dualWriteTimeout);

        dualWriteTimeout = setTimeout(async () => {
            try {
                const fsDb = getFirestoreDb();
                const mirrorState = Object.assign({}, db, {
                    _syncVersion: '2026.10.23.v1',
                    _schemaVersion: SCHEMA_VERSION,
                    _mirroredAt: new Date().toISOString()
                });
                await fsDb.collection('state').doc('current').set(mirrorState);
                console.log('[STEMulus Cloud] Dual-write mirror updated: state/current');
            } catch (e) {
                console.warn('[STEMulus Cloud] Dual-write mirror error:', e.message || e);
            }
        }, 500);
    }

    /**
     * Automated decomposition of monolithic state into normalized Firestore collections
     */
    async function decomposeMonolith(sourceDb) {
        if (!isAvailable() || isDecomposing || !sourceDb) return false;
        isDecomposing = true;
        console.log('[STEMulus Cloud] Starting autonomous decomposition of monolithic state into normalized Firestore collections...');

        try {
            const fsDb = getFirestoreDb();

            // 1. Users (map or array)
            const usersList = [];
            if (sourceDb.users) {
                if (Array.isArray(sourceDb.users)) {
                    sourceDb.users.forEach(u => { if (u && u.email) usersList.push(u); });
                } else if (typeof sourceDb.users === 'object') {
                    Object.keys(sourceDb.users).forEach(em => {
                        const u = sourceDb.users[em];
                        if (u) {
                            if (!u.email) u.email = em;
                            usersList.push(u);
                        }
                    });
                }
            }
            if (usersList.length) {
                await batchWriteEntities('users', usersList, u => u.email.toLowerCase().trim());
                console.log(`[STEMulus Cloud] Decomposed ${usersList.length} users into users collection`);
            }

            // 2. Students
            if (Array.isArray(sourceDb.students) && sourceDb.students.length) {
                await batchWriteEntities('students', sourceDb.students, s => s.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.students.length} students into students collection`);
            }

            // 3. Schedules
            if (Array.isArray(sourceDb.schedules) && sourceDb.schedules.length) {
                await batchWriteEntities('schedules', sourceDb.schedules, s => s.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.schedules.length} schedules into schedules collection`);
            }

            // 4. Attendance
            if (Array.isArray(sourceDb.attendanceRecords) && sourceDb.attendanceRecords.length) {
                await batchWriteEntities('attendance', sourceDb.attendanceRecords, a => a.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.attendanceRecords.length} attendance records into attendance collection`);
            }

            // 5. Tutors
            if (Array.isArray(sourceDb.tutors) && sourceDb.tutors.length) {
                await batchWriteEntities('tutors', sourceDb.tutors, t => t.id || (t.email ? t.email.toLowerCase().trim() : null));
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.tutors.length} tutors into tutors collection`);
            }

            // 6. Parents
            if (Array.isArray(sourceDb.parents) && sourceDb.parents.length) {
                await batchWriteEntities('parents', sourceDb.parents, p => p.id || (p.email ? p.email.toLowerCase().trim() : null));
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.parents.length} parents into parents collection`);
            }

            // 7. Certificates
            if (Array.isArray(sourceDb.certificates) && sourceDb.certificates.length) {
                await batchWriteEntities('certificates', sourceDb.certificates, c => c.credential_id || c.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.certificates.length} certificates into certificates collection`);
            }

            // 8. Monthly Reports
            if (Array.isArray(sourceDb.monthlyReports) && sourceDb.monthlyReports.length) {
                await batchWriteEntities('monthly_reports', sourceDb.monthlyReports, r => r.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.monthlyReports.length} monthly reports into monthly_reports collection`);
            }

            // 9. Reschedules
            if (Array.isArray(sourceDb.rescheduleRequests) && sourceDb.rescheduleRequests.length) {
                await batchWriteEntities('reschedules', sourceDb.rescheduleRequests, r => r.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.rescheduleRequests.length} reschedules into reschedules collection`);
            }

            // 10. Coverage Requests
            if (Array.isArray(sourceDb.coverageRequests) && sourceDb.coverageRequests.length) {
                await batchWriteEntities('coverage_requests', sourceDb.coverageRequests, c => c.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.coverageRequests.length} coverage requests into coverage_requests collection`);
            }

            // 11. Leads / Pending Enrollments
            if (Array.isArray(sourceDb.enrollments) && sourceDb.enrollments.length) {
                await batchWriteEntities('leads', sourceDb.enrollments, e => e.id);
                console.log(`[STEMulus Cloud] Decomposed ${sourceDb.enrollments.length} enrollments into leads collection`);
            }

            // 12. System Settings (Billing, Onboarding, Metadata)
            if (sourceDb.billingSettings) {
                await syncDoc('system_settings', 'billing', sourceDb.billingSettings);
            }
            if (sourceDb.onboarding) {
                await syncDoc('system_settings', 'onboarding', sourceDb.onboarding);
            }

            // Write metadata marking migration complete
            await fsDb.collection('system_settings').doc('metadata').set({
                schemaVersion: SCHEMA_VERSION,
                migratedAt: new Date().toISOString(),
                collections: ['users', 'students', 'schedules', 'attendance', 'tutors', 'parents', 'certificates', 'monthly_reports', 'reschedules', 'coverage_requests', 'leads', 'system_settings']
            }, { merge: true });

            console.log('[STEMulus Cloud] [COMPLETE] Monolith successfully decomposed into normalized collections!');
            isDecomposing = false;
            return true;
        } catch (err) {
            isDecomposing = false;
            console.error('[STEMulus Cloud] Decomposition failed:', err);
            return false;
        }
    }

    /**
     * Initializes real-time listeners for discrete normalized collections.
     * Only collection deltas are synchronized over the network.
     */
    function initNormalizedListeners(getDbFn, saveLocalDbFn, onUpdateCallback) {
        if (!isAvailable()) return;
        const fsDb = getFirestoreDb();

        // Clear any prior listeners
        activeListeners.forEach(unsub => { try { unsub(); } catch(e){} });
        activeListeners = [];

        let debounceTimer = null;
        function triggerUpdate() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (typeof onUpdateCallback === 'function') onUpdateCallback();
            }, 100);
        }

        const collectionsToSubscribe = [
            { name: 'students', dbKey: 'students', isArray: true, idField: 'id' },
            { name: 'schedules', dbKey: 'schedules', isArray: true, idField: 'id' },
            { name: 'attendance', dbKey: 'attendanceRecords', isArray: true, idField: 'id' },
            { name: 'users', dbKey: 'users', isArray: false, keyField: 'email' },
            { name: 'tutors', dbKey: 'tutors', isArray: true, idField: 'id' },
            { name: 'parents', dbKey: 'parents', isArray: true, idField: 'id' },
            { name: 'certificates', dbKey: 'certificates', isArray: true, idField: 'credential_id' },
            { name: 'monthly_reports', dbKey: 'monthlyReports', isArray: true, idField: 'id' },
            { name: 'reschedules', dbKey: 'rescheduleRequests', isArray: true, idField: 'id' },
            { name: 'coverage_requests', dbKey: 'coverageRequests', isArray: true, idField: 'id' },
            { name: 'leads', dbKey: 'enrollments', isArray: true, idField: 'id' }
        ];

        collectionsToSubscribe.forEach(cfg => {
            try {
                const unsub = fsDb.collection(cfg.name).onSnapshot(snapshot => {
                    const localDb = getDbFn ? getDbFn() : {};
                    let hasChanges = false;

                    snapshot.docChanges().forEach(change => {
                        const doc = change.doc;
                        const docData = doc.data();
                        const docId = doc.id;
                        const fullKey = `${cfg.name}/${docId}`;

                        // Prevent local writes echoed back from firing redundant saves
                        if (pendingDocWrites.has(fullKey)) {
                            return;
                        }

                        if (cfg.isArray) {
                            localDb[cfg.dbKey] = localDb[cfg.dbKey] || [];
                            const idProp = cfg.idField || 'id';
                            const itemTargetId = docData[idProp] || docId;

                            // Respect permanent deletion tombstones for students and tutors
                            if (cfg.dbKey === 'students') {
                                const delStudents = Array.isArray(localDb.deletedStudentIds) ? localDb.deletedStudentIds : [];
                                if (docData.isDeleted === true || delStudents.includes(itemTargetId)) {
                                    localDb.students = localDb.students.filter(s => s && s.id !== itemTargetId);
                                    hasChanges = true;
                                    return;
                                }
                            }
                            if (cfg.dbKey === 'tutors') {
                                const delTutIds = (localDb.deletedTutorIds || []).map(x => String(x).toLowerCase().trim());
                                const delTutEmails = (localDb.deletedTutorEmails || []).map(x => String(x).toLowerCase().trim());
                                const tIdLow = String(itemTargetId || '').toLowerCase().trim();
                                const tEmLow = String(docData.email || '').toLowerCase().trim();
                                if (docData.isDeleted === true || (tIdLow && delTutIds.includes(tIdLow)) || (tEmLow && delTutEmails.includes(tEmLow))) {
                                    localDb.tutors = localDb.tutors.filter(t => t && String(t.id || '').toLowerCase().trim() !== tIdLow && String(t.email || '').toLowerCase().trim() !== tEmLow);
                                    hasChanges = true;
                                    return;
                                }
                            }
                            if (cfg.dbKey === 'schedules') {
                                if (itemTargetId === 'sch-2001' || itemTargetId === 'sch-2002' || (docData.date && (docData.date.startsWith('2026-05') || docData.date.startsWith('2026-06')))) {
                                    return;
                                }
                            }

                            const idx = localDb[cfg.dbKey].findIndex(item => {
                                if (!item) return false;
                                if (item[idProp] === itemTargetId || item.id === itemTargetId) return true;
                                // Semantic deduplication by entity type
                                if ((cfg.dbKey === 'tutors' || cfg.dbKey === 'parents') && docData.email && item.email) {
                                    return String(item.email).toLowerCase().trim() === String(docData.email).toLowerCase().trim();
                                }
                                if (cfg.dbKey === 'students' && docData.firstName && docData.parentEmail && item.firstName && item.parentEmail) {
                                    const sameFirst = String(item.firstName).toLowerCase().trim() === String(docData.firstName).toLowerCase().trim();
                                    const sameLast = String(item.lastName || '').toLowerCase().trim() === String(docData.lastName || '').toLowerCase().trim();
                                    const sameParent = String(item.parentEmail).toLowerCase().trim() === String(docData.parentEmail).toLowerCase().trim();
                                    return sameFirst && sameLast && sameParent;
                                }
                                if (cfg.dbKey === 'schedules' && docData.studentId && docData.date && docData.time) {
                                    return item.studentId === docData.studentId && item.date === docData.date && item.time === docData.time;
                                }
                                return false;
                            });

                            if (change.type === 'removed') {
                                if (idx !== -1) {
                                    localDb[cfg.dbKey].splice(idx, 1);
                                    hasChanges = true;
                                }
                            } else {
                                // added or modified
                                if (idx !== -1) {
                                    localDb[cfg.dbKey][idx] = Object.assign({}, localDb[cfg.dbKey][idx], docData);
                                } else {
                                    localDb[cfg.dbKey].push(docData);
                                }
                                hasChanges = true;
                            }
                        } else {
                            // Object map (e.g. users)
                            localDb[cfg.dbKey] = localDb[cfg.dbKey] || {};
                            const userEmail = (docData.email || docId).toLowerCase().trim();
                            const delTutEmails = (localDb.deletedTutorEmails || []).map(x => String(x).toLowerCase().trim());
                            if (change.type === 'removed' || delTutEmails.includes(userEmail)) {
                                if (localDb[cfg.dbKey][userEmail]) {
                                    delete localDb[cfg.dbKey][userEmail];
                                    hasChanges = true;
                                }
                            } else {
                                localDb[cfg.dbKey][userEmail] = Object.assign({}, localDb[cfg.dbKey][userEmail] || {}, docData);
                                hasChanges = true;
                            }
                        }
                    });

                    if (hasChanges) {
                        if (typeof saveLocalDbFn === 'function') {
                            saveLocalDbFn(localDb);
                        }
                        triggerUpdate();
                    }
                }, err => {
                    console.warn(`[STEMulus Cloud] Snapshot listener for ${cfg.name} notice:`, err.message || err);
                });

                activeListeners.push(unsub);
            } catch (e) {
                console.warn(`[STEMulus Cloud] Could not attach listener for ${cfg.name}:`, e.message || e);
            }
        });

        // System Settings - Billing listener
        try {
            const unsubBilling = fsDb.collection('system_settings').doc('billing').onSnapshot(doc => {
                if (doc.exists) {
                    const localDb = getDbFn ? getDbFn() : {};
                    localDb.billingSettings = Object.assign({}, localDb.billingSettings || {}, doc.data());
                    if (typeof saveLocalDbFn === 'function') {
                        saveLocalDbFn(localDb);
                    }
                    triggerUpdate();
                }
            }, err => console.warn('[STEMulus Cloud] Billing settings listener notice:', err.message || err));
            activeListeners.push(unsubBilling);
        } catch(e) {}

        // Live Class Presence listener (cross-device active classroom monitoring)
        try {
            const unsubPresence = fsDb.collection('live_presence').onSnapshot(snapshot => {
                let presenceStore = {};
                try {
                    presenceStore = JSON.parse(localStorage.getItem('stemulus_live_presence') || '{}');
                } catch(e) { presenceStore = {}; }

                let changed = false;
                snapshot.docChanges().forEach(change => {
                    const doc = change.doc;
                    const docId = doc.id;
                    const docData = doc.data();
                    if (change.type === 'removed') {
                        if (presenceStore[docId]) {
                            delete presenceStore[docId];
                            changed = true;
                        }
                    } else if (docData) {
                        const existing = presenceStore[docId];
                        const incomingTs = Number(docData.lastHeartbeat) || 0;
                        const existingTs = existing ? (Number(existing.lastHeartbeat) || 0) : 0;
                        if (!existing || incomingTs >= existingTs) {
                            presenceStore[docId] = Object.assign({}, existing || {}, docData);
                            if (docData.scheduleId && docData.scheduleId !== docId) {
                                presenceStore[docData.scheduleId] = Object.assign({}, presenceStore[docData.scheduleId] || {}, docData);
                            }
                            changed = true;
                        }
                    }
                });

                if (changed) {
                    try {
                        localStorage.setItem('stemulus_live_presence', JSON.stringify(presenceStore));
                        if (typeof window !== 'undefined' && window.dispatchEvent) {
                            window.dispatchEvent(new CustomEvent('stemulus_presence_updated', { detail: presenceStore }));
                        }
                    } catch(e) {}
                    triggerUpdate();
                }
            }, err => console.warn('[STEMulus Cloud] Live presence listener notice:', err.message || err));
            activeListeners.push(unsubPresence);
        } catch(e) {}
    }

    const StemulusFirestore = {
        isAvailable,
        getFirestoreDb,
        syncDoc,
        deleteDoc,
        batchWriteEntities,
        scheduleDualWriteMirror,
        decomposeMonolith,
        initNormalizedListeners,
        SCHEMA_VERSION
    };

    // Export globally for browser & module environments
    if (typeof window !== 'undefined') {
        window.StemulusFirestore = StemulusFirestore;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.StemulusFirestore = StemulusFirestore;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StemulusFirestore;
    }
})(typeof window !== 'undefined' ? window : globalThis);
