/**
 * Verify Gemini API Key against Google Gemini API endpoint securely without leaking secret to stdout.
 */
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read clipboard
let apiKey = '';
try {
  apiKey = execSync('powershell.exe -NoProfile -Command "Get-Clipboard"').toString().trim();
} catch (e) {
  console.error('[Verify] Error reading clipboard:', e.message);
}

if (!apiKey) {
  console.error('[Verify] No key found in clipboard.');
  process.exit(1);
}

console.log('[Verify] Retrieved key from clipboard. Length:', apiKey.length, 'Prefix:', apiKey.slice(0, 3) + '...');

// Securely write to .env
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, `GEMINI_API_KEY=${apiKey}\n`, 'utf8');
console.log('[Verify] Saved GEMINI_API_KEY into .env');

// Test with Gemini REST API endpoint
const testPayload = JSON.stringify({
  contents: [
    {
      parts: [
        { text: "Respond in exactly three words: 'STEMulus AI Online'" }
      ]
    }
  ],
  generationConfig: {
    maxOutputTokens: 20
  }
});

const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`);

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testPayload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('[Verify] HTTP Status Code:', res.statusCode);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        const reply = json.candidates[0].content.parts[0].text.trim();
        console.log('[Verify] SUCCESS! Gemini API responded with live model output:');
        console.log(`         "${reply}"`);
      } catch (err) {
        console.log('[Verify] Received 200 OK but parse error:', err.message);
      }
    } else {
      console.error('[Verify] FAILED with status ' + res.statusCode);
      try {
        const errJson = JSON.parse(data);
        console.error('[Verify] API Error Message:', errJson.error ? errJson.error.message : data);
      } catch(e) {
        console.error('[Verify] Raw response:', data);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('[Verify] Request error:', e.message);
});

req.write(testPayload);
req.end();
