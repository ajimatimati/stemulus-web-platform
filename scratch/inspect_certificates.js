const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = ["verify-certificate.html", "issue-certificate.html"];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    console.log(`\n=== ${file} ===`);
    lines.forEach((line, index) => {
      if (line.includes('cert') || line.includes('verify') || line.includes('qr') || line.includes('generate') || line.includes('Supabase') || line.includes('firebase')) {
        if (line.includes('script') || line.includes('function') || line.includes('id=') || line.includes('class=')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
