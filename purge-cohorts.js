const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));

files.forEach(file => {
  let filepath = path.join(dir, file);
  if (fs.statSync(filepath).isDirectory() || filepath.includes('node_modules')) return;

  let html = fs.readFileSync(filepath, 'utf-8');
  let originalHtml = html;

  // Replacements for "cohorts"
  html = html.replace(/across all 1-on-1 sessions/gi, 'across all 1-on-1 sessions');
  html = html.replace(/active students/gi, 'active students');
  html = html.replace(/your private sessions/gi, 'your private sessions');
  html = html.replace(/1-on-1 tailored coding/gi, '1-on-1 tailored coding');
  
  // Replacements for "group" (careful not to over-replace technical 'group' classes like in Tailwind)
  // Let's target specific educational phrasing
  html = html.replace(/premium 1-on-1 coding/gi, 'premium 1-on-1 coding');
  html = html.replace(/private 1-on-1 classes/gi, 'private 1-on-1 classes');
  html = html.replace(/a dedicated private session/gi, 'a dedicated private session');
  html = html.replace(/start your private track/gi, 'start your private track');
  html = html.replace(/private mentor sessions/gi, 'private mentor sessions');
  html = html.replace(/small private mentor sessions/gi, 'private sessions');

  if (html !== originalHtml) {
    fs.writeFileSync(filepath, html, 'utf-8');
    console.log('Purged group terminology in:', file);
  }
});
