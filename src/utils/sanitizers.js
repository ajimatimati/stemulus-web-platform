/**
 * STEMulus Sanitizer & XSS Prevention Utility
 * Safe encoding for dynamic HTML rendering across portal components.
 */

/**
 * Escapes characters that could lead to HTML injection.
 * @param {any} input 
 * @returns {string}
 */
export function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips HTML tags from input string.
 * @param {string} html 
 * @returns {string}
 */
export function stripTags(html) {
  if (!html) return '';
  return String(html).replace(/<\/?[^>]+(>|$)/g, '').trim();
}

/**
 * Verifies that a URL is a valid http, https, or mailto link.
 * @param {string} url 
 * @returns {string} sanitized URL or '#' fallback
 */
export function sanitizeUrl(url) {
  if (!url) return '#';
  const clean = String(url).trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(clean)) {
    return clean;
  }
  return '#';
}
