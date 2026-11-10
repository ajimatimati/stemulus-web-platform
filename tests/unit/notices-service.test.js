import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice,
  getUnreadNoticesCount,
  markNoticeRead
} from '../../src/features/parent-notices/notices-service.js';

describe('Parent & Faculty Notices Feature Service Suite', () => {
  it('getNotices filters by audience role correctly', () => {
    const db = {
      notices: [
        { id: 'n-1', title: 'Director Message', targetAudience: 'all' },
        { id: 'n-2', title: 'Tutor Guidelines', targetAudience: 'tutor' },
        { id: 'n-3', title: 'Parent Portal Upgrade', targetAudience: 'parent' }
      ]
    };

    // Admin sees all
    assert.equal(getNotices('admin', db).length, 3);
    assert.equal(getNotices(null, db).length, 3);

    // Tutor sees 'all' and 'tutor'
    const tutorNotices = getNotices('tutor', db);
    assert.equal(tutorNotices.length, 2);
    assert.ok(tutorNotices.some(n => n.id === 'n-1'));
    assert.ok(tutorNotices.some(n => n.id === 'n-2'));

    // Parent sees 'all' and 'parent'
    const parentNotices = getNotices('parent', db);
    assert.equal(parentNotices.length, 2);
    assert.ok(parentNotices.some(n => n.id === 'n-1'));
    assert.ok(parentNotices.some(n => n.id === 'n-3'));
  });

  it('addNotice unshifts notice to list and persists to storage', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = { notices: [] };

    const notice = addNotice({
      title: 'Academy Midterm Review Schedule',
      category: 'Curriculum',
      priority: 'high',
      targetAudience: 'all',
      content: 'All tutors please submit your midterm assessments.'
    }, db, mockStorage);

    assert.ok(notice.id);
    assert.equal(notice.title, 'Academy Midterm Review Schedule');
    assert.equal(notice.author, 'Academic Director');
    assert.equal(notice.status, 'published');
    assert.equal(db.notices.length, 1);
    assert.equal(saved, true);
  });

  it('updateNotice modifies fields and refreshes updatedAt', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      notices: [
        { id: 'not-edit-1', title: 'Old Title', priority: 'normal', content: 'Old Content' }
      ]
    };

    const updated = updateNotice('not-edit-1', {
      title: 'Updated Policy Title',
      priority: 'high'
    }, db, mockStorage);

    assert.ok(updated);
    assert.equal(updated.title, 'Updated Policy Title');
    assert.equal(updated.priority, 'high');
    assert.ok(updated.updatedAt);
    assert.equal(saved, true);

    const nonExistent = updateNotice('missing-id', {}, db, mockStorage);
    assert.equal(nonExistent, null);
  });

  it('deleteNotice removes notice from database', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      notices: [
        { id: 'not-del-1', title: 'To Delete' },
        { id: 'not-del-2', title: 'To Keep' }
      ]
    };

    const res = deleteNotice('not-del-1', db, mockStorage);
    assert.equal(res, true);
    assert.equal(db.notices.length, 1);
    assert.equal(db.notices[0].id, 'not-del-2');
    assert.equal(saved, true);

    const resFalse = deleteNotice('not-del-1', db, mockStorage);
    assert.equal(resFalse, false);
  });

  it('getUnreadNoticesCount and markNoticeRead manage read receipts cleanly', () => {
    const memoryStore = {};
    const mockAdapter = {
      getItem: (key) => memoryStore[key] || null,
      setItem: (key, val) => { memoryStore[key] = String(val); }
    };

    const db = {
      notices: [
        { id: 'n-u1', targetAudience: 'tutor' },
        { id: 'n-u2', targetAudience: 'tutor' }
      ]
    };

    // Initially 2 unread
    const countInitial = getUnreadNoticesCount('coach.test@stemulus.com', 'tutor', db, mockAdapter);
    assert.equal(countInitial, 2);

    // Mark one as read
    const marked = markNoticeRead('n-u1', 'coach.test@stemulus.com', mockAdapter);
    assert.equal(marked, true);

    // Now 1 unread
    const countAfter = getUnreadNoticesCount('coach.test@stemulus.com', 'tutor', db, mockAdapter);
    assert.equal(countAfter, 1);

    // Marking same notice again returns false (already marked)
    const markedAgain = markNoticeRead('n-u1', 'coach.test@stemulus.com', mockAdapter);
    assert.equal(markedAgain, false);
  });
});
