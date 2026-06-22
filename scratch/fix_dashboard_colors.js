const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = ["parent-dashboard.html", "tutor-dashboard.html", "admin-dashboard.html"];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("#22c5-5e")) {
      content = content.replace(/#22c5-5e/g, '#22c55e');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully fixed success color typo in ${file}`);
    } else {
      console.log(`${file} does not contain the typo "#22c5-5e"`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
