const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.join(__dirname, '..');
const indexNowKey = '9c4f1e7b2a6d8305c482e01b3d7a59f1';
const keyFileName = `${indexNowKey}.txt`;
const keyFilePath = path.join(rootDir, keyFileName);

// 1. Create IndexNow Key verification file
fs.writeFileSync(keyFilePath, indexNowKey, 'utf8');
console.log(`[IndexNow] Key file written: ${keyFileName}`);

// 2. Extract all URLs from sitemap.xml
const sitemapPath = path.join(rootDir, 'sitemap.xml');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const urlMatches = sitemapContent.match(/<loc>(https:\/\/stemuluskidstech\.com\/[^<]*)<\/loc>/g) || [];
const urlList = urlMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

console.log(`[IndexNow] Extracted ${urlList.length} unique URLs from sitemap.xml.`);

// 3. Dispatch to IndexNow API (Bing, Yandex, Seznam, Naver)
const payload = JSON.stringify({
  host: 'stemuluskidstech.com',
  key: indexNowKey,
  keyLocation: `https://stemuluskidstech.com/${keyFileName}`,
  urlList: urlList
});

function postIndexNow() {
  return new Promise((resolve) => {
    console.log('[IndexNow] Dispatching payload to https://api.indexnow.org/indexnow ...');
    const req = https.request('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      console.log(`[IndexNow] Response Code: ${res.statusCode} ${res.statusMessage}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) console.log(`[IndexNow] Body: ${data}`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.warn(`[IndexNow] Error dispatching: ${err.message}`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// 4. Ping Google & Bing sitemaps
function pingSearchEngine(name, pingUrl) {
  return new Promise((resolve) => {
    https.get(pingUrl, (res) => {
      console.log(`[Ping] ${name} sitemap ping: HTTP ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.warn(`[Ping] ${name} ping notice: ${err.message}`);
      resolve();
    });
  });
}

(async () => {
  await postIndexNow();
  await pingSearchEngine('Google', 'https://www.google.com/ping?sitemap=https://stemuluskidstech.com/sitemap.xml');
  await pingSearchEngine('Bing', 'https://www.bing.com/ping?sitemap=https://stemuluskidstech.com/sitemap.xml');
  console.log('[Done] Fast-crawl discovery dispatch complete!');
})();
