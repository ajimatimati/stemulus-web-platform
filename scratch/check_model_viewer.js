const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const match = content.match(/<model-viewer\s+[^>]*src="([^"]+)"/i);
  if (match) {
    console.log(`${file}: ${match[1]}`);
  } else if (content.includes('<footer')) {
    console.log(`${file}: Has footer but NO model-viewer src`);
  }
});
