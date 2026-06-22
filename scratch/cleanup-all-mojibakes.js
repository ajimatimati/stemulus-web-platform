const fs = require('fs');
const path = require('path');

const DIR = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';

const REPLACEMENTS = [
  { regex: /©/g, replace: '©' },
  { regex: /§/g, replace: '§' },
  { regex: /→/g, replace: '→' },
  { regex: /─/g, replace: '─' },
  { regex: /—/g, replace: '—' },
  { regex: /–/g, replace: '–' },
  { regex: /'/g, replace: "'" },
  { regex: /"/g, replace: '"' },
  { regex: /"/g, replace: '"' },
  { regex: /"/g, replace: '"' },
  { regex: /♥/g, replace: '♥' },
  { regex: /─/g, replace: '─' },
  { regex: /─/g, replace: '─' },
  { regex: /…/g, replace: '…' },
  { regex: / /g, replace: ' ' },
  { regex: /•/g, replace: '•' },
  { regex: /é/g, replace: 'é' },
  { regex: /—/g, replace: '—' },
  { regex: /🎮/g, replace: '🎮' },
  { regex: /🔎/g, replace: '🔎' },
  { regex: /⚡/g, replace: '⚡' },
  { regex: /🌍/g, replace: '🌍' },
  { regex: /✅/g, replace: '✅' },
  { regex: /💡/g, replace: '💡' },
  { regex: /🚀/g, replace: '🚀' },
  { regex: /🧠/g, replace: '🧠' },
  { regex: /🔥/g, replace: '🔥' },
  { regex: /💬/g, replace: '💬' },
  { regex: /📈/g, replace: '📈' },
  { regex: /👌/g, replace: '👌' },
  { regex: /👥/g, replace: '👥' },
  { regex: /🎓/g, replace: '🎓' },
  { regex: /🧪/g, replace: '🧪' },
  { regex: /✨/g, replace: '✨' },
  { regex: /✨/g, replace: '✨' }
];

function cleanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return;
  }
  let original = content;
  
  for (let r of REPLACEMENTS) {
    content = content.replace(r.regex, r.replace);
  }
  
  // Clean double-encoded replacement characters like Â before control characters
  content = content.replace(/Â([©§•–—’“”†‡¶*])/g, '$1');

  if (content !== original) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned: ${path.relative(DIR, filePath)}`);
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  }
}

function traverse(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (let file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.gemini') {
        traverse(fullPath);
      }
    } else if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
      cleanFile(fullPath);
    }
  }
}

traverse(DIR);
console.log('Recursively cleaned all files for mojibakes.');
