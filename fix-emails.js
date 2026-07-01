const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  let filepath = path.join(dir, file);
  let html = fs.readFileSync(filepath, 'utf-8');
  let originalHtml = html;

  // We are targeting the text "admin@stemuluskidstech.com" where it is NOT inside an href or input attribute.
  // The safest way is to target the specific markup structures we see in the grep output.
  
  // Replace the unwrapped admin email in the "Why STEMulus" contact block (and similar blocks)
  // The grep showed it sitting naked like: >\n                    admin@stemuluskidstech.com\n                </a>
  // Actually, wait, the grep output showed it IS frequently inside an anchor tag already, but maybe the href is wrong.
  
  // Let's globally ensure that ANY loose "admin@stemuluskidstech.com" that is just text, or inside a generic <a href="some-wrong-link">, is forced to a proper mailto.
  
  // Case 1: The index.html / why-stemulus.html has a block with:
  // <a href="mailto:admin@stemuluskidstech.com" ...>admin@stemuluskidstech.com</a>
  // We need to fix the href to match the text.
  html = html.replace(/href="mailto:admin@stemuluskidstech.com"([^>]*)>\s*admin@stemuluskidstech.com/gi, 'href="mailto:admin@stemuluskidstech.com"$1>admin@stemuluskidstech.com');
  
  // Case 2: In index.html line 456 (and similar) where it's just raw text or the cta block
  // <p class="cta-contact-line">Direct Line</p> ...
  
  if (html !== originalHtml) {
    fs.writeFileSync(filepath, html, 'utf-8');
    console.log('Fixed mailto link in:', file);
  }
});
