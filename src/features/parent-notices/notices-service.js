/**
 * STEMulus Parent & Faculty Notices Feature Service (ES Module)
 * Authoritative business logic for operational bulletins, school-wide notices,
 * targeted announcements (admin, tutor, parent), read receipt tracking, and notifications.
 */

/**
 * Retrieve operational notices, optionally filtered by target audience role.
 * @param {string|null} filterRole
 * @param {object} db
 * @returns {Array}
 */
export function getNotices(filterRole = null, db = {}) {
  const notices = Array.isArray(db.notices) ? db.notices : [];
  if (!filterRole || filterRole === 'admin') return notices;
  return notices.filter(n => {
    if (!n) return false;
    return !n.targetAudience || n.targetAudience === 'all' || n.targetAudience === filterRole;
  });
}

/**
 * Publish a new official school notice or bulletin.
 * @param {object} rawNotice
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addNotice(rawNotice, db = {}, storageService = null) {
  if (!Array.isArray(db.notices)) db.notices = [];
  const notice = {
    id: rawNotice.id || (`notice-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`),
    title: (rawNotice.title || 'Official Notice').trim(),
    category: rawNotice.category || 'Operational Policy',
    priority: rawNotice.priority || 'normal',
    targetAudience: rawNotice.targetAudience || 'all',
    content: (rawNotice.content || '').trim(),
    author: rawNotice.author || 'Academic Director',
    publishedAt: rawNotice.publishedAt || new Date().toISOString(),
    status: rawNotice.status || 'published'
  };

  db.notices.unshift(notice);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'notices', action: 'add', item: notice } }));
  }

  return notice;
}

/**
 * Update an existing notice bulletin.
 * @param {string} id
 * @param {object} updates
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateNotice(id, updates, db = {}, storageService = null) {
  if (!Array.isArray(db.notices)) return null;
  const idx = db.notices.findIndex(n => n && n.id === id);
  if (idx === -1) return null;

  db.notices[idx] = Object.assign({}, db.notices[idx], updates, { updatedAt: new Date().toISOString() });

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'notices', action: 'update', item: db.notices[idx] } }));
  }

  return db.notices[idx];
}

/**
 * Delete a notice bulletin.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteNotice(id, db = {}, storageService = null) {
  if (!Array.isArray(db.notices)) return false;
  const initialLen = db.notices.length;
  db.notices = db.notices.filter(n => n && n.id !== id);

  if (db.notices.length !== initialLen) {
    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'notices', action: 'delete', id: id } }));
    }
    return true;
  }

  return false;
}

/**
 * Count unread notices for a specific user email.
 * @param {string} userEmail
 * @param {string} filterRole
 * @param {object} db
 * @param {object|null} storageAdapter
 * @returns {number}
 */
export function getUnreadNoticesCount(userEmail, filterRole = 'tutor', db = {}, storageAdapter = null) {
  const notices = getNotices(filterRole, db);
  const key = `stemulus_read_notices_${(userEmail || 'user').toLowerCase().trim()}`;
  let readIds = [];

  const store = storageAdapter || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (store && typeof store.getItem === 'function') {
    try {
      readIds = JSON.parse(store.getItem(key) || '[]');
    } catch (e) {
      readIds = [];
    }
  }

  return notices.filter(n => n && !readIds.includes(n.id)).length;
}

/**
 * Mark a notice as acknowledged/read by a user.
 * @param {string} noticeId
 * @param {string} userEmail
 * @param {object|null} storageAdapter
 * @returns {boolean}
 */
export function markNoticeRead(noticeId, userEmail, storageAdapter = null) {
  const key = `stemulus_read_notices_${(userEmail || 'user').toLowerCase().trim()}`;
  let readIds = [];

  const store = storageAdapter || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (store && typeof store.getItem === 'function') {
    try {
      readIds = JSON.parse(store.getItem(key) || '[]');
    } catch (e) {
      readIds = [];
    }

    if (!readIds.includes(noticeId)) {
      readIds.push(noticeId);
      if (typeof store.setItem === 'function') {
        store.setItem(key, JSON.stringify(readIds));
      }

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('stemulus_notices_read', { detail: { noticeId: noticeId } }));
      }
      return true;
    }
  }

  return false;
}

export const ParentNoticesService = {
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice,
  getUnreadNoticesCount,
  markNoticeRead
};
