const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const key = envContent.split('=')[1].trim();

const targetPath = path.join(__dirname, '..', 'assets', 'js', 'gemini-config.js');
const jsCode = `/**
 * STEMulus Gemini Intelligence Client Configuration
 * Provisioned securely from Google AI Studio (stemulusclubs@gmail.com).
 */
(function() {
  window.STEMULUS_CONFIG = window.STEMULUS_CONFIG || {};
  window.STEMULUS_CONFIG.GEMINI_API_KEY = "${key}";

  if (typeof GeminiService !== 'undefined' && typeof GeminiService.setApiKey === 'function') {
    GeminiService.setApiKey(window.STEMULUS_CONFIG.GEMINI_API_KEY);
  }
})();
`;

fs.writeFileSync(targetPath, jsCode, 'utf8');
console.log('[Build] assets/js/gemini-config.js generated successfully.');
