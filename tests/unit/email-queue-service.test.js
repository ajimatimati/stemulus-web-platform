import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueEmail,
  getPendingQueue,
  getSentHistory,
  updateQueuedEmail,
  cancelQueuedEmail,
  dispatchEmail,
  dispatchBatch
} from '../../src/features/email-queue/email-queue-service.js';

test('Email Queue & Dispatch Feature Service Suite', async (t) => {
  await t.test('enqueueEmail inserts draft into queue with unique timestamped ID', () => {
    const mockDB = { emailQueue: [] };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const id = enqueueEmail({
      to: 'parent@test.com',
      recipientName: 'Test Parent',
      subject: 'Welcome to STEMulus',
      htmlPreview: '<p>Welcome</p>'
    }, mockDB, mockStorage);

    assert.ok(id.startsWith('eq-'));
    assert.equal(mockDB.emailQueue.length, 1);
    assert.equal(mockDB.emailQueue[0].status, 'draft');
    assert.equal(mockDB.emailQueue[0].to, 'parent@test.com');
  });

  await t.test('getPendingQueue filters only draft status records', () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-1', status: 'draft' },
        { id: 'eq-2', status: 'sent' },
        { id: 'eq-3', status: 'draft' },
        { id: 'eq-4', status: 'cancelled' }
      ]
    };
    const pending = getPendingQueue(mockDB);
    assert.equal(pending.length, 2);
    assert.equal(pending[0].id, 'eq-1');
    assert.equal(pending[1].id, 'eq-3');
  });

  await t.test('getSentHistory aggregates and deduplicates dispatched records', () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-sent-1', status: 'sent', sentAt: '2026-10-30T10:00:00Z' },
        { id: 'eq-draft', status: 'draft' }
      ],
      emailHistory: [
        { id: 'eq-sent-1', status: 'sent', sentAt: '2026-10-30T10:00:00Z' }, // Duplicate
        { id: 'eq-sent-2', status: 'sent', sentAt: '2026-10-30T11:00:00Z' }
      ]
    };
    const history = getSentHistory(mockDB);
    assert.equal(history.length, 2);
    assert.equal(history[0].id, 'eq-sent-2', 'Should sort most recent first');
    assert.equal(history[1].id, 'eq-sent-1');
  });

  await t.test('updateQueuedEmail persists edits to subject and body', () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-100', status: 'draft', subject: 'Original Subject', htmlPreview: '<p>Old</p>' }
      ]
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const success = updateQueuedEmail('eq-100', {
      editedSubject: 'New Custom Subject',
      editedBody: '<p>New Custom Content</p>'
    }, mockDB, mockStorage);

    assert.equal(success, true);
    assert.equal(mockDB.emailQueue[0].editedSubject, 'New Custom Subject');
    assert.equal(mockDB.emailQueue[0].editedBody, '<p>New Custom Content</p>');
    assert.ok(mockDB.emailQueue[0].updatedAt);
  });

  await t.test('cancelQueuedEmail flags draft as cancelled', () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-200', status: 'draft' }
      ]
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const success = cancelQueuedEmail('eq-200', mockDB, mockStorage);
    assert.equal(success, true);
    assert.equal(mockDB.emailQueue[0].status, 'cancelled');
    assert.ok(mockDB.emailQueue[0].cancelledAt);
  });

  await t.test('dispatchEmail sends via serverless API and records sent status', async () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-300', status: 'draft', to: 'recipient@test.com', subject: 'Test' }
      ],
      emailHistory: []
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const mockFetch = async (url, options) => {
      assert.equal(url, '/.netlify/functions/send-email');
      const body = JSON.parse(options.body);
      assert.equal(body.to, 'recipient@test.com');
      assert.equal(body.adminApproved, true);
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, messageId: 'msg-resend-test-123' })
      };
    };

    const res = await dispatchEmail('eq-300', mockDB, mockStorage, mockFetch);
    assert.equal(res.success, true);
    assert.equal(res.messageId, 'msg-resend-test-123');
    assert.equal(mockDB.emailQueue[0].status, 'sent');
    assert.equal(mockDB.emailQueue[0].messageId, 'msg-resend-test-123');
    assert.equal(mockDB.emailHistory.length, 1);
  });

  await t.test('dispatchBatch processes queued emails sequentially', async () => {
    const mockDB = {
      emailQueue: [
        { id: 'eq-b1', status: 'draft', to: 'batch1@test.com', subject: 'B1' },
        { id: 'eq-b2', status: 'draft', to: 'batch2@test.com', subject: 'B2' }
      ],
      emailHistory: []
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, messageId: 'msg-batch' })
    });

    const summary = await dispatchBatch(['eq-b1', 'eq-b2'], mockDB, mockStorage, mockFetch);
    assert.equal(summary.total, 2);
    assert.equal(summary.dispatched, 2);
    assert.equal(summary.failed, 0);
  });
});
