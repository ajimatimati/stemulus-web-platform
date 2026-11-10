/**
 * STEMulus Unified Storage & Persistence Service
 * Authoritative single point of storage truth with schema validation,
 * snapshot vault backups, Web Crypto encryption, and Firestore cloud sync.
 */

import { enforceDatabaseIntegrity } from './data-integrity-service.js';

let memoryFallbackDB = null;

/**
 * Validates the core schema of the database to protect against data truncation.
 * @param {object} db 
 * @returns {boolean}
 */
export function validateDBSchema(db) {
  if (!db || typeof db !== 'object') return false;
  if (typeof db.users !== 'object' || db.users === null) return false;
  if (!Array.isArray(db.students)) return false;
  return true;
}

/**
 * Creates a rolling snapshot backup prior to mutating persistent storage.
 * @param {object} db 
 */
export function saveDBSnapshot(db) {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = 'stemulus_db_snapshots';
    const raw = localStorage.getItem(key);
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.unshift({
      timestamp: Date.now(),
      snapshot: db
    });
    // Keep at most 5 rolling backups
    if (list.length > 5) {
      list = list.slice(0, 5);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // Non-blocking snapshot failure
  }
}

/**
 * Retrieves the database from secure storage or local storage.
 * @returns {object}
 */
export function getDB() {
  if (typeof window !== 'undefined' && window.DashboardEngine && typeof window.DashboardEngine.getDB === 'function') {
    return window.DashboardEngine.getDB();
  }

  if (typeof localStorage !== 'undefined') {
    try {
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.getSecureDB) {
        const secure = StemulusSecurity.getSecureDB();
        if (secure && validateDBSchema(secure)) return secure;
      }
      const raw = localStorage.getItem('stemulus_db');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validateDBSchema(parsed)) return parsed;
      }
    } catch (e) {
      // Recovery or fallback
    }
  }

  if (memoryFallbackDB && validateDBSchema(memoryFallbackDB)) {
    return memoryFallbackDB;
  }

  const initial = {
    users: {},
    students: [],
    tutors: [],
    parents: [],
    schedules: [],
    emailQueue: [],
    emailHistory: []
  };
  memoryFallbackDB = initial;
  return initial;
}

let isDispatchingStorageEvent = false;

/**
 * Authoritative save method enforcing schema validation, encryption, snapshotting, and cloud sync.
 * @param {object} db 
 * @returns {boolean}
 */
export function saveDB(db) {
  if (!validateDBSchema(db)) {
    console.error('[StorageService] Schema validation failed. Write rejected to prevent database corruption.');
    return false;
  }

  // Enforce referential integrity and clean duplicates prior to write
  enforceDatabaseIntegrity(db);

  // Ensure mandatory collections exist
  if (!Array.isArray(db.emailQueue)) db.emailQueue = [];
  if (!Array.isArray(db.emailHistory)) db.emailHistory = [];

  memoryFallbackDB = db;
  saveDBSnapshot(db);

  try {
    if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureDB) {
      StemulusSecurity.saveSecureDB(db);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem('stemulus_db', JSON.stringify(db));
    }
  } catch (err) {
    console.warn('[StorageService] Storage quota error:', err);
  }

  // Reactive UI update notification
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    if (!isDispatchingStorageEvent) {
      isDispatchingStorageEvent = true;
      try {
        window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { timestamp: Date.now() } }));
      } finally {
        isDispatchingStorageEvent = false;
      }
    }
  }

  // Debounced cloud synchronization
  if (typeof StemulusFirestore !== 'undefined' && StemulusFirestore && typeof StemulusFirestore.isAvailable === 'function' && StemulusFirestore.isAvailable()) {
    StemulusFirestore.scheduleDualWriteMirror(db);
  }

  return true;
}

/**
 * Synchronizes an individual document to Firestore.
 * @param {string} collectionName 
 * @param {string} docId 
 * @param {object} data 
 * @param {object} options 
 * @returns {Promise<boolean>}
 */
export async function syncDocument(collectionName, docId, data, options = { merge: true }) {
  if (typeof StemulusFirestore !== 'undefined' && StemulusFirestore && typeof StemulusFirestore.isAvailable === 'function' && StemulusFirestore.isAvailable()) {
    return StemulusFirestore.syncDoc(collectionName, docId, data, options);
  }
  return false;
}

// Global browser window bridge
if (typeof window !== 'undefined') {
  window.STEMulus = window.STEMulus || {};
  window.STEMulus.Storage = {
    validateDBSchema,
    saveDBSnapshot,
    getDB,
    saveDB,
    save: saveDB,
    syncDocument,
    enforceDatabaseIntegrity
  };
}
