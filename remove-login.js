const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let filepath = path.join(dir, file);
  let html = fs.readFileSync(filepath, 'utf-8');
  let originalHtml = html;

  // Remove desktop nav links: <a href="login.html">Log In</a>
  // Remove mobile nav links: <a href="login.html" ...>Log In</a>
  // Footer links, etc.
  
  html = html.replace(/<a\s+href="login\.html"[^>]*>.*?<\/a>\s*/gi, '');
  
  if (html !== originalHtml) {
    fs.writeFileSync(filepath, html, 'utf-8');
    console.log('Removed Login link from:', file);
  }
});

// Delete login.html itself if it exists
const loginFile = path.join(dir, 'login.html');
if (fs.existsSync(loginFile)) {
    fs.unlinkSync(loginFile);
    console.log('Deleted login.html');
}
