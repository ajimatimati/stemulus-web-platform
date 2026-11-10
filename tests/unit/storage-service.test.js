import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDBSchema,
  saveDBSnapshot,
  getDB,
  saveDB,
  syncDocument
} from '../../src/services/storage-service.js';

test('Storage Service Architecture Suite', async (t) => {
  await t.test('validateDBSchema accurately enforces root collection contracts', () => {
    assert.equal(validateDBSchema(null), false);
    assert.equal(validateDBSchema('corrupted string'), false);
    assert.equal(validateDBSchema({}), false);
    assert.equal(validateDBSchema({ users: null, students: [] }), false);
    assert.equal(validateDBSchema({ users: {}, students: 'not an array' }), false);
    assert.equal(validateDBSchema({ users: {}, students: [] }), true);
  });

  await t.test('saveDB rejects corrupted database states to prevent data loss', () => {
    const invalidState = { corrupted: true };
    const saved = saveDB(invalidState);
    assert.equal(saved, false);
  });

  await t.test('saveDB successfully persists valid schema and initializes collections', () => {
    const validDB = {
      users: {
        'admin@stemulus.com': { role: 'admin', name: 'Admin' }
      },
      students: [
        { id: 'std-1', name: 'Alex' }
      ]
    };

    const saved = saveDB(validDB);
    assert.equal(saved, true);
    assert.ok(Array.isArray(validDB.emailQueue), 'emailQueue should be auto-initialized');
    assert.ok(Array.isArray(validDB.emailHistory), 'emailHistory should be auto-initialized');

    const retrieved = getDB();
    assert.ok(retrieved.users['admin@stemulus.com']);
  });

  await t.test('syncDocument resolves safely without unhandled rejections', async () => {
    const synced = await syncDocument('users', 'usr-test', { status: 'active' });
    assert.equal(synced, false);
  });
});
