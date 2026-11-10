/**
 * STEMulus Currency & Monetary Precision Engine
 * Minor-unit (kobo/cents) arithmetic preventing floating-point calculation drift.
 */

export const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  CAD: 'CA$'
};

/**
 * Converts minor currency units (kobo/cents) to major unit string or number.
 * @param {number|bigint} minorAmount 
 * @returns {number}
 */
export function minorToMajor(minorAmount) {
  const numeric = typeof minorAmount === 'bigint' ? Number(minorAmount) : Number(minorAmount || 0);
  return numeric / 100;
}

/**
 * Converts major currency units to minor units (integer kobo/cents).
 * @param {number|string} majorAmount 
 * @returns {bigint}
 */
export function majorToMinor(majorAmount) {
  const clean = typeof majorAmount === 'string' ? majorAmount.replace(/[^0-9.-]+/g, '') : majorAmount;
  const num = Math.round(Number(clean || 0) * 100);
  return BigInt(num);
}

/**
 * Formats a minor-unit integer into a localized currency string.
 * @param {number|bigint} minorAmount - e.g. 4500000 for ₦45,000.00
 * @param {string} currency - 'NGN' | 'USD' | 'GBP' | 'CAD'
 * @param {object} options - { showCents: boolean, compact: boolean }
 * @returns {string} e.g. "₦45,000" or "$150.00"
 */
export function formatCurrency(minorAmount, currency = 'NGN', options = {}) {
  const { showCents = false, compact = false } = options;
  const major = minorToMajor(minorAmount);
  const code = (currency || 'NGN').toUpperCase().trim();
  const symbol = CURRENCY_SYMBOLS[code] || `${code} `;

  if (compact && Math.abs(major) >= 1000000) {
    return `${symbol}${(major / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(major) >= 1000) {
    return `${symbol}${(major / 1000).toFixed(0)}k`;
  }

  const fractionDigits = showCents || (major % 1 !== 0) ? 2 : 0;
  const formattedNumber = major.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });

  return `${symbol}${formattedNumber}`;
}

/**
 * Calculates net pay after applying percentage deductions and flat deductions.
 * @param {bigint|number} grossMinor 
 * @param {bigint|number} deductionMinor 
 * @returns {bigint}
 */
export function calculateNetPay(grossMinor, deductionMinor = 0) {
  const gross = typeof grossMinor === 'bigint' ? grossMinor : BigInt(grossMinor || 0);
  const deductions = typeof deductionMinor === 'bigint' ? deductionMinor : BigInt(deductionMinor || 0);
  const net = gross - deductions;
  return net >= 0n ? net : 0n;
}
