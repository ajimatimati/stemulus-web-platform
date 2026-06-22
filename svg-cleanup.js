const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  let html = fs.readFileSync(path.join(dir, file), 'utf-8');
  let originalHtml = html;

  // Cleanup any svg that has multiple xmlns declarations
  html = html.replace(/<svg([^>]+)>/g, (match, content) => {
    let hasXmlns = false;
    // Replace all xmlns attributes
    const newContent = content.replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, () => {
      if (!hasXmlns) {
        hasXmlns = true;
        return ' xmlns="http://www.w3.org/2000/svg"';
      }
      return '';
    });
    return `<svg${newContent}>`;
  });

  if (html !== originalHtml) {
    fs.writeFileSync(path.join(dir, file), html, 'utf-8');
    console.log('Fixed duplicate xmlns in:', file);
  }
});
