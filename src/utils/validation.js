/**
 * STEMulus Form & Data Validation Utility
 * Pure validation functions for email, phone, passwords, and dates.
 */

/**
 * Validates standard email address format.
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validates phone numbers (supports local Nigerian numbers and international E.164 format).
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/[^0-9+]/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 16;
}

/**
 * Validates student birthday falls within academy age bracket (5 to 17 years old).
 * @param {string} birthdayStr - YYYY-MM-DD
 * @param {number} minAge - Default 5
 * @param {number} maxAge - Default 17
 * @returns {boolean}
 */
export function isValidStudentBirthday(birthdayStr, minAge = 5, maxAge = 17) {
  if (!birthdayStr) return false;
  const d = new Date(birthdayStr);
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }

  return age >= minAge && age <= maxAge;
}

/**
 * Validates that an hourly rate in kobo is within reasonable boundaries.
 * @param {number|bigint} rateKobo 
 * @returns {boolean}
 */
export function isValidHourlyRate(rateKobo) {
  const num = typeof rateKobo === 'bigint' ? Number(rateKobo) : Number(rateKobo);
  return Number.isFinite(num) && num >= 100000 && num <= 5000000; // ₦1,000 to ₦50,000/hr
}
