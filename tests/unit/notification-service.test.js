import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNotifications,
  addNotification,
  markNotificationsRead,
  triggerBirthdayNtfy
} from '../../src/features/notifications/notification-service.js';

describe('Notifications & NTFY Alerts Feature Service Suite', () => {
  it('getNotifications enforces student-ownership scoping and role authorization', () => {
    const db = {
      tutors: [
        { id: 'tut-1', name: 'Coach Alex', email: 'alex@stemulus.com' }
      ],
      students: [
        { id: 'stu-x', firstName: 'Pearl', lastName: 'Doe', tutorEmail: 'alex@stemulus.com', parentEmail: 'pearl.p@example.com' }
      ],
      notifications: [
        { id: 'n-all', title: 'School Open', userEmail: 'all', timestamp: '2026-10-01T10:00:00Z' },
        { id: 'n-alex', title: 'Attendance Approved for Pearl Doe', studentId: 'stu-x', userEmail: 'alex@stemulus.com', timestamp: '2026-10-02T10:00:00Z' },
        { id: 'n-other', title: 'Class Notice for Other Student', studentId: 'stu-other', userEmail: 'other@stemulus.com', timestamp: '2026-10-03T10:00:00Z' }
      ]
    };

    // Tutor sees broadcast 'all' and their own student notification
    const tutorNotifs = getNotifications('alex@stemulus.com', db, { role: 'tutor' });
    assert.equal(tutorNotifs.length, 2);
    assert.ok(tutorNotifs.some(n => n.id === 'n-all'));
    assert.ok(tutorNotifs.some(n => n.id === 'n-alex'));

    // Admin sees all
    const adminNotifs = getNotifications('admin@stemuluskidstech.com', db, { role: 'admin' });
    assert.equal(adminNotifs.length, 3);
  });

  it('addNotification queues notification and initializes read status to false', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = { notifications: [] };

    const n = addNotification({
      title: 'Tuition Payment Confirmed',
      message: 'Your tuition payment for October 2026 was received.',
      userEmail: 'parent.test@example.com'
    }, db, mockStorage);

    assert.ok(n.id);
    assert.equal(n.read, false);
    assert.equal(db.notifications.length, 1);
    assert.equal(saved, true);
  });

  it('markNotificationsRead marks unread notifications for specified email as read', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      notifications: [
        { id: 'n-1', userEmail: 'user.test@example.com', read: false },
        { id: 'n-2', userEmail: 'user.test@example.com', read: false },
        { id: 'n-3', userEmail: 'different@example.com', read: false }
      ]
    };

    const count = markNotificationsRead('user.test@example.com', db, mockStorage);
    assert.equal(count, 2);
    assert.equal(db.notifications[0].read, true);
    assert.equal(db.notifications[1].read, true);
    assert.equal(db.notifications[2].read, false);
    assert.equal(saved, true);
  });

  it('triggerBirthdayNtfy sends alert and creates local administrative notification', async () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      ntfyTopic: 'test-topic-1234',
      notifications: []
    };

    const student = {
      id: 'stu-bday',
      firstName: 'Kafayat',
      lastName: 'Abdul',
      age: 12,
      birthday: '2014-10-30',
      parentName: 'Mrs. Abdul',
      parentPhone: '08012345678'
    };

    const res = await triggerBirthdayNtfy(student, db, mockStorage);
    assert.equal(res.success, true);
    assert.equal(res.topic, 'test-topic-1234');
    assert.ok(db.notifications.some(n => n.title.includes('Birthday Alert Sent for Kafayat')));
    assert.equal(saved, true);

    // Skipping invalid birthday
    const resSkipped = await triggerBirthdayNtfy({ firstName: 'No', birthday: '' }, db, mockStorage);
    assert.equal(resSkipped.success, false);
  });
});
