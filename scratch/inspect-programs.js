const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\programs.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('<h2') || line.includes('<h1') || line.includes('pricing') || line.includes('Pricing') || line.includes('faq') || line.includes('FAQ')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
