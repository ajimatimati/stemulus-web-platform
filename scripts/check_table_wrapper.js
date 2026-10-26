const fs = require('fs');
const content = fs.readFileSync('parent-progress.html', 'utf8');
const idx = content.indexOf("<table class='w-full text-left");
console.log(content.slice(idx - 250, idx + 100));
