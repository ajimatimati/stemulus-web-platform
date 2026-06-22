const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = [
  "enroll.html",
  "index.html",
  "preai-overhaul.css",
  "parent-dashboard.html",
  "tutor-dashboard.html",
  "admin-dashboard.html"
];

let allOk = true;

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${file} does not exist`);
    allOk = false;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Check CSS braces balance
  if (file.endsWith('.css')) {
    let openBraces = (content.match(/\{/g) || []).length;
    let closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      console.error(`FAIL: ${file} has unbalanced braces: { is ${openBraces}, } is ${closeBraces}`);
      allOk = false;
    } else {
      console.log(`PASS: ${file} has balanced braces (${openBraces} rules).`);
    }
  }

  // Check script tags balance in HTML
  if (file.endsWith('.html')) {
    let openScripts = (content.match(/<script\b/g) || []).length;
    let closeScripts = (content.match(/<\/script>/g) || []).length;
    if (openScripts !== closeScripts) {
      console.error(`FAIL: ${file} has unbalanced script tags: <script is ${openScripts}, </script> is ${closeScripts}`);
      allOk = false;
    } else {
      console.log(`PASS: ${file} has balanced script tags (${openScripts} scripts).`);
    }

    // Check basic HTML balance for crucial tags
    const tags = ['div', 'aside', 'main', 'form'];
    tags.forEach(tag => {
      const openCount = (content.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;
      const closeCount = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (openCount !== closeCount) {
        console.warn(`WARNING: ${file} has unbalanced <${tag}> tags: <${tag}> is ${openCount}, </${tag}> is ${closeCount}`);
      }
    });
  }
});

if (allOk) {
  console.log("\nALL SYNTAX SANITY CHECKS COMPLETED SUCCESSFULLY!");
} else {
  console.error("\nSYNTAX SANITY CHECKS DETECTED PROBLEMS!");
}
