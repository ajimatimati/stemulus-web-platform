/**
 * STEMulus Gemini Intelligence Client Configuration
 * ===================================================
 * Configured with live Edge Serverless Proxy on Cloudflare Workers.
 * The Google Gemini API key is securely encrypted on the edge and never exposed to client browsers.
 */
(function() {
  window.STEMULUS_CONFIG = window.STEMULUS_CONFIG || {};

  // 1. Live Cloudflare Edge Serverless Proxy Endpoint
  window.STEMULUS_CONFIG.GEMINI_PROXY_URL = "https://stemulus-gemini-proxy.stemulus-portal-v1.workers.dev";

  // 2. Client API Key is securely omitted from client distribution
  window.STEMULUS_CONFIG.GEMINI_API_KEY = "";

  // 3. Initialize GeminiService if present
  if (typeof GeminiService !== 'undefined') {
    if (typeof GeminiService.setProxyUrl === 'function' && window.STEMULUS_CONFIG.GEMINI_PROXY_URL) {
      GeminiService.setProxyUrl(window.STEMULUS_CONFIG.GEMINI_PROXY_URL);
    }
    if (typeof GeminiService.setApiKey === 'function' && window.STEMULUS_CONFIG.GEMINI_API_KEY) {
      GeminiService.setApiKey(window.STEMULUS_CONFIG.GEMINI_API_KEY);
    }
  }
})();
