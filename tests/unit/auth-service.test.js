import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  isHashed,
  getSession,
  setSession,
  logout,
  login,
  checkAuth,
  requestPasswordReset,
  changePasswordAfterReset,
  getPendingPasswordResets,
  resolvePasswordReset,
  updateUserPassword,
  addUser
} from '../../src/features/auth/auth-service.js';

test('Authentication & User Management Service Suite', async (t) => {
  await t.test('hashPassword and isHashed handle SHA-256 strings accurately', async () => {
    const raw = 'SuperSecret2026!';
    const hashed = await hashPassword(raw);
    assert.equal(typeof hashed, 'string');
    assert.equal(hashed.length, 64);
    assert.equal(isHashed(hashed), true);
    assert.equal(isHashed(raw), false);
    assert.equal(isHashed(123), false);
    assert.equal(isHashed(null), false);
  });

  await t.test('login verifies correct credentials and rejects incorrect passwords', async () => {
    const rawPassword = 'TutorPassword2026!';
    const hashed = await hashPassword(rawPassword);
    const mockDB = {
      users: {
        'tutor@stemulus.com': {
          email: 'tutor@stemulus.com',
          name: 'Sarah Jane',
          role: 'tutor',
          password: hashed
        }
      }
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true, syncDocument: async () => true };

    // Failure case
    const failedRes = await login('tutor@stemulus.com', 'WrongPassword!', mockDB, mockStorage);
    assert.equal(failedRes.success, false);
    assert.equal(failedRes.message, 'Invalid email or password.');

    // Success case
    const successRes = await login('tutor@stemulus.com', rawPassword, mockDB, mockStorage);
    assert.equal(successRes.success, true);
    assert.equal(successRes.user.email, 'tutor@stemulus.com');
    assert.equal(successRes.user.role, 'tutor');
  });

  await t.test('login automatically upgrades legacy plaintext passwords to SHA-256', async () => {
    const plaintext = 'PlainPass123';
    const mockDB = {
      users: {
        'parent@stemulus.com': {
          email: 'parent@stemulus.com',
          name: 'Parent User',
          role: 'parent',
          password: plaintext
        }
      }
    };
    let saved = false;
    const mockStorage = {
      getDB: () => mockDB,
      saveDB: () => { saved = true; return true; },
      syncDocument: async () => true
    };

    const res = await login('parent@stemulus.com', plaintext, mockDB, mockStorage);
    assert.equal(res.success, true);
    assert.equal(saved, true);
    assert.ok(isHashed(mockDB.users['parent@stemulus.com'].password));
  });

  await t.test('session lifecycle works with setSession, getSession, and logout', () => {
    const user = { email: 'admin@stemulus.com', name: 'Director', role: 'admin' };
    const saved = setSession(user);
    assert.equal(saved.email, 'admin@stemulus.com');

    const active = getSession();
    assert.ok(active);
    assert.equal(active.email, 'admin@stemulus.com');

    logout();
    const afterLogout = getSession();
    assert.equal(afterLogout, null);
  });

  await t.test('checkAuth authorizes matching roles and blocks mismatches', () => {
    setSession({ email: 'tutor@stemulus.com', role: 'tutor', name: 'Tutor' });

    const authOk = checkAuth('tutor');
    assert.ok(authOk);
    assert.equal(authOk.role, 'tutor');

    const authAdminMismatch = checkAuth('admin');
    assert.equal(authAdminMismatch, null);

    logout();
    const authLoggedOut = checkAuth('tutor');
    assert.equal(authLoggedOut, null);
  });

  await t.test('requestPasswordReset validates emails, generates temporary password, and logs request', async () => {
    const mockDB = {
      users: {
        'user@test.com': { email: 'user@test.com', name: 'Test User', role: 'parent', password: 'old' }
      },
      passwordResetRequests: []
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true, syncDocument: async () => true };

    const invalid = await requestPasswordReset('invalid-email', 'parent', mockDB, mockStorage);
    assert.equal(invalid.success, false);

    const roleMismatch = await requestPasswordReset('user@test.com', 'tutor', mockDB, mockStorage);
    assert.equal(roleMismatch.success, false);

    const mockFetch = async () => ({ ok: true, status: 200, json: async () => ({ success: true }) });
    const res = await requestPasswordReset('user@test.com', 'parent', mockDB, mockStorage, mockFetch);
    assert.equal(res.success, true);
    assert.ok(res.tempPassword.startsWith('STEM-'));
    assert.equal(mockDB.users['user@test.com'].mustChangePassword, true);
    assert.equal(mockDB.passwordResetRequests.length, 1);
    assert.equal(mockDB.passwordResetRequests[0].status, 'resolved');
  });

  await t.test('changePasswordAfterReset enforces complexity and updates hash', async () => {
    const mockDB = {
      users: {
        'user@test.com': { email: 'user@test.com', mustChangePassword: true, password: 'temp' }
      }
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true, syncDocument: async () => true };

    // Too short (< 8 chars)
    const tooShort = await changePasswordAfterReset('user@test.com', 'Short1!', mockDB, mockStorage);
    assert.equal(tooShort.success, false);

    // Missing numbers
    const noNums = await changePasswordAfterReset('user@test.com', 'LettersOnlyPassword', mockDB, mockStorage);
    assert.equal(noNums.success, false);

    // Valid password
    const valid = await changePasswordAfterReset('user@test.com', 'ValidPass2026!', mockDB, mockStorage);
    assert.equal(valid.success, true);
    assert.equal(mockDB.users['user@test.com'].mustChangePassword, false);
    assert.ok(isHashed(mockDB.users['user@test.com'].password));
  });

  await t.test('getPendingPasswordResets and resolvePasswordReset operate on requests list', () => {
    const mockDB = {
      users: {
        'user@test.com': { email: 'user@test.com', password: 'old' }
      },
      passwordResetRequests: [
        { id: 'pwr-1', email: 'user@test.com', status: 'pending' },
        { id: 'pwr-2', email: 'other@test.com', status: 'resolved' }
      ]
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true };

    const pending = getPendingPasswordResets(mockDB, mockStorage);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 'pwr-1');

    const resolved = resolvePasswordReset('pwr-1', 'NewManualPass2026!', mockDB, mockStorage);
    assert.equal(resolved, true);
    assert.equal(mockDB.passwordResetRequests[0].status, 'resolved');
    assert.equal(mockDB.users['user@test.com'].mustChangePassword, true);
  });

  await t.test('updateUserPassword hashes new password and updates timestamp', async () => {
    const mockDB = {
      users: {
        'user@test.com': { email: 'user@test.com', password: 'old' }
      }
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true, syncDocument: async () => true };

    const updated = await updateUserPassword('user@test.com', 'NewSecurePass2026!', mockDB, mockStorage);
    assert.equal(updated, true);
    assert.ok(isHashed(mockDB.users['user@test.com'].password));
    assert.ok(mockDB.users['user@test.com'].updatedAt);
  });

  await t.test('addUser registers new user and populates role collections', async () => {
    const mockDB = {
      users: {},
      parents: [],
      tutors: []
    };
    const mockStorage = { getDB: () => mockDB, saveDB: () => true, syncDocument: async () => true };

    const parentRes = await addUser({
      name: 'Babatunde Fashola',
      role: 'parent',
      phone: '+2348033221100'
    }, mockDB, mockStorage);

    assert.equal(parentRes.success, true);
    assert.match(parentRes.email, /^babatunde\.fashola[0-9]*@parent\.stemuluskidstech\.com$/);
    assert.ok(mockDB.users[parentRes.email]);
    assert.equal(mockDB.parents.length, 1);
    assert.equal(mockDB.parents[0].name, 'Babatunde Fashola');
  });
});
