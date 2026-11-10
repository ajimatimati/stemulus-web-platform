import test from 'node:test';
import assert from 'node:assert/strict';

import {
  minorToMajor,
  majorToMinor,
  formatCurrency,
  calculateNetPay
} from '../../src/utils/currency.js';

import {
  formatWAT,
  calculateAge,
  timeToMinutes,
  hasTimeConflict,
  getDayName
} from '../../src/utils/dates.js';

import {
  escapeHtml,
  stripTags,
  sanitizeUrl
} from '../../src/utils/sanitizers.js';

import {
  isValidEmail,
  isValidPhone,
  isValidStudentBirthday,
  isValidHourlyRate
} from '../../src/utils/validation.js';

test('Currency Utility Suite', async (t) => {
  await t.test('minorToMajor converts correctly', () => {
    assert.equal(minorToMajor(4500000), 45000);
    assert.equal(minorToMajor(150n), 1.5);
  });

  await t.test('majorToMinor converts without float drift', () => {
    assert.equal(majorToMinor(45000), 4500000n);
    assert.equal(majorToMinor('120.50'), 12050n);
  });

  await t.test('formatCurrency formats NGN and USD accurately', () => {
    assert.equal(formatCurrency(4500000, 'NGN'), '₦45,000');
    assert.equal(formatCurrency(15000, 'USD', { showCents: true }), '$150.00');
    assert.equal(formatCurrency(250000000, 'NGN', { compact: true }), '₦2.5M');
  });

  await t.test('calculateNetPay prevents negative net payouts', () => {
    assert.equal(calculateNetPay(5000000n, 500000n), 4500000n);
    assert.equal(calculateNetPay(500000n, 600000n), 0n);
  });
});

test('Dates Utility Suite', async (t) => {
  await t.test('calculateAge calculates correct whole years', () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const dateStr = tenYearsAgo.toISOString().split('T')[0];
    assert.equal(calculateAge(dateStr), 10);
  });

  await t.test('hasTimeConflict detects overlapping time slots on same day', () => {
    const slotA = { dayOfWeek: 2, startTime: '14:00', endTime: '15:30' };
    const slotB = { dayOfWeek: 2, startTime: '15:00', endTime: '16:00' };
    const slotC = { dayOfWeek: 2, startTime: '16:00', endTime: '17:00' };
    const slotD = { dayOfWeek: 3, startTime: '14:00', endTime: '15:30' };

    assert.equal(hasTimeConflict(slotA, slotB), true);
    assert.equal(hasTimeConflict(slotA, slotC), false);
    assert.equal(hasTimeConflict(slotA, slotD), false);
  });

  await t.test('getDayName returns valid English day names', () => {
    assert.equal(getDayName(0), 'Sunday');
    assert.equal(getDayName(1), 'Monday');
    assert.equal(getDayName(6), 'Saturday');
  });
});

test('Sanitizers Suite', async (t) => {
  await t.test('escapeHtml escapes dangerous HTML characters', () => {
    assert.equal(
      escapeHtml('<script>alert("xss")</script>'),
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  await t.test('stripTags removes HTML elements completely', () => {
    assert.equal(stripTags('<p>Hello <b>World</b>!</p>'), 'Hello World!');
  });

  await t.test('sanitizeUrl only permits http, https, mailto, tel', () => {
    assert.equal(sanitizeUrl('https://stemuluskidstech.com'), 'https://stemuluskidstech.com');
    assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
  });
});

test('Validation Suite', async (t) => {
  await t.test('isValidEmail handles standard emails', () => {
    assert.equal(isValidEmail('admin@stemuluskidstech.com'), true);
    assert.equal(isValidEmail('invalid-email'), false);
  });

  await t.test('isValidPhone handles Nigerian and international phone formats', () => {
    assert.equal(isValidPhone('+2347052466716'), true);
    assert.equal(isValidPhone('08011223344'), true);
    assert.equal(isValidPhone('123'), false);
  });

  await t.test('isValidHourlyRate enforces realistic tutor salary bounds', () => {
    assert.equal(isValidHourlyRate(500000), true); // ₦5,000/hr
    assert.equal(isValidHourlyRate(5000), false);  // ₦50/hr (too low)
  });
});
