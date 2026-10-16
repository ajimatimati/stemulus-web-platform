/**
 * STEMulus Portal Error Boundary & Telemetry Tracker
 * Captures unhandled client errors and promise rejections across all portals
 * without impacting UX, providing structured diagnostics for support.
 */

(function() {
  'use strict';

  var MAX_LOGS = 50;
  var STORAGE_KEY = 'stemulus_client_errors';

  function getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveLog(entry) {
    try {
      var logs = getStoredLogs();
      logs.unshift(entry);
      if (logs.length > MAX_LOGS) logs = logs.slice(0, MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      // Storage quota or private browsing safeguard
    }
  }

  function isIgnorableNoise(msg, src) {
    if (!msg) return true;
    var str = String(msg).toLowerCase();
    var srcStr = String(src || '').toLowerCase();

    // Ignore third-party browser extension errors
    if (srcStr.includes('chrome-extension://') || srcStr.includes('moz-extension://')) return true;
    if (str.includes('resizeobserver loop') || str.includes('script error.')) return true;
    if (str.includes('metamask') || str.includes('grammarly')) return true;
    return false;
  }

  function logError(type, message, source, lineno, colno, errorObj) {
    if (isIgnorableNoise(message, source)) return;

    var logEntry = {
      id: 'err-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: type,
      message: String(message),
      source: source || window.location.href,
      line: lineno || null,
      col: colno || null,
      stack: errorObj && errorObj.stack ? String(errorObj.stack).slice(0, 500) : null,
      page: window.location.pathname
    };

    console.warn('[STEMulus Telemetry]', type, logEntry.message, logEntry);
    saveLog(logEntry);
  }

  // 1. Unhandled Global Errors
  window.addEventListener('error', function(event) {
    logError(
      'UNHANDLED_ERROR',
      event.message || 'Unknown runtime error',
      event.filename,
      event.lineno,
      event.colno,
      event.error
    );
  });

  // 2. Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var msg = (reason && (reason.message || reason.statusText)) || String(reason || 'Unhandled Promise Rejection');
    logError(
      'UNHANDLED_REJECTION',
      msg,
      window.location.href,
      null,
      null,
      reason instanceof Error ? reason : null
    );
  });

  // Public diagnostic API
  window.PortalErrorTracker = {
    getRecentErrors: getStoredLogs,
    clearErrors: function() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },
    captureCustomError: function(context, err) {
      logError('CUSTOM_CAPTURED', context + ': ' + (err && err.message ? err.message : String(err)), null, null, null, err);
    }
  };
})();
