/**
 * STEMulus Dates and Timezone Calculation Engine
 * Dedicated helpers for West Africa Time (WAT, UTC+1) and schedule conflict detection.
 */

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * Returns formatted date in West Africa Time (UTC+1).
 * @param {Date|string|number} dateInput 
 * @param {Intl.DateTimeFormatOptions} options 
 * @returns {string}
 */
export function formatWAT(dateInput, options = {}) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const defaultOptions = {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(d);
}

/**
 * Formats time string in WAT.
 * @param {Date|string|number} dateInput 
 * @returns {string} e.g. "04:30 PM"
 */
export function formatTimeWAT(dateInput) {
  return formatWAT(dateInput, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculates current age from a birthday string (YYYY-MM-DD).
 * @param {string} birthdayStr 
 * @returns {number} age in whole years
 */
export function calculateAge(birthdayStr) {
  if (!birthdayStr) return 0;
  const birth = new Date(birthdayStr);
  if (isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

/**
 * Converts a time string "HH:MM" or "HH:MM:SS" to minutes from midnight.
 * @param {string} timeStr 
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Checks if two schedule time intervals overlap on the same day.
 * @param {object} slotA - { dayOfWeek: number, startTime: string, endTime: string }
 * @param {object} slotB - { dayOfWeek: number, startTime: string, endTime: string }
 * @returns {boolean}
 */
export function hasTimeConflict(slotA, slotB) {
  if (Number(slotA.dayOfWeek) !== Number(slotB.dayOfWeek)) {
    return false;
  }

  const startA = timeToMinutes(slotA.startTime);
  const endA = timeToMinutes(slotA.endTime);
  const startB = timeToMinutes(slotB.startTime);
  const endB = timeToMinutes(slotB.endTime);

  // Overlap condition: startA < endB && startB < endA
  return startA < endB && startB < endA;
}

/**
 * Returns the standard English day name from 0-6 index.
 * @param {number} dayIndex - 0 for Sunday, 1 for Monday, etc.
 * @returns {string}
 */
export function getDayName(dayIndex) {
  return DAY_NAMES[Number(dayIndex) % 7] || '';
}
