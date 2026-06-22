const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";

function checkEnroll() {
  console.log("Checking enroll.html...");
  const enrollPath = path.join(rootDir, "enroll.html");
  if (!fs.existsSync(enrollPath)) {
    console.error("FAIL: enroll.html does not exist");
    return false;
  }
  const content = fs.readFileSync(enrollPath, "utf8");

  // Check responsive.css import
  if (!content.includes('href="responsive.css"')) {
    console.error("FAIL: enroll.html does not import responsive.css");
    return false;
  }

  // Check Three.js script removal
  if (content.includes("three.min.js") || content.includes("3d-canvas.js")) {
    console.error("FAIL: enroll.html still contains Three.js or 3d-canvas.js scripts");
    return false;
  }

  // Check columns swap (aside comes before form-card)
  const asideIdx = content.indexOf('<aside class="enroll-visual-col">');
  const formIdx = content.indexOf('class="form-card"');
  if (asideIdx === -1) {
    console.error("FAIL: enroll.html does not contain enroll-visual-col");
    return false;
  }
  if (formIdx === -1) {
    console.error("FAIL: enroll.html does not contain form-card");
    return false;
  }
  if (asideIdx > formIdx) {
    console.error("FAIL: enroll.html columns are not swapped. Form comes before visual column.");
    return false;
  }

  // Check step card logic inside JS
  if (!content.includes('visual-step-') || !content.includes('google-signup-btn')) {
    console.error("FAIL: enroll.html missing step card toggle logic or google prefill button ID");
    return false;
  }

  // Check no emojis in enroll-visual-card
  const visualCardBlock = content.substring(asideIdx, content.indexOf('</aside>', asideIdx));
  if (visualCardBlock.match(/[\uD800-\uDFFF]./g)) {
    console.error("FAIL: enroll-visual-card contains emojis, but emojis are banned there.");
    return false;
  }

  console.log("PASS: enroll.html looks correct!");
  return true;
}

function checkHomepage() {
  console.log("Checking index.html & preai-overhaul.css...");
  const indexPath = path.join(rootDir, "index.html");
  const cssPath = path.join(rootDir, "preai-overhaul.css");

  if (!fs.existsSync(indexPath) || !fs.existsSync(cssPath)) {
    console.error("FAIL: index.html or preai-overhaul.css does not exist");
    return false;
  }

  const indexContent = fs.readFileSync(indexPath, "utf8");
  const cssContent = fs.readFileSync(cssPath, "utf8");

  // Check for split columns in index.html
  if (!indexContent.includes("hero-left-col") || !indexContent.includes("hero-right-col")) {
    console.error("FAIL: index.html does not have hero-left-col or hero-right-col");
    return false;
  }

  // Check for translateX(0) or centered transforms on scrub-video in css
  if (!cssContent.includes("translateX(0) !important") && !cssContent.includes("translateX(0px) !important")) {
    console.warn("WARNING: preai-overhaul.css might not have reset translateX on scrub-video to 0.");
  }

  console.log("PASS: Homepage checks finished.");
  return true;
}

function check3DBackgrounds() {
  console.log("Checking 3D Model Gradient Backgrounds...");
  const pages = ["for-parents.html", "programs.html", "contact.html", "blog.html"];
  let allPass = true;

  for (const page of pages) {
    const pagePath = path.join(rootDir, page);
    if (!fs.existsSync(pagePath)) {
      console.error(`FAIL: ${page} does not exist`);
      allPass = false;
      continue;
    }
    const content = fs.readFileSync(pagePath, "utf8");

    // Check for inline background radial-gradient removal
    if (page === "for-parents.html" || page === "programs.html") {
      if (content.includes("radial-gradient(circle") && content.includes("style=")) {
        console.error(`FAIL: ${page} still contains radial-gradient inline styles on visual cards`);
        allPass = false;
      }
    }

    // Check for overlay gradients in contact/blog
    if (page === "contact.html" || page === "blog.html") {
      if (content.includes("preai-hero-img-overlay")) {
        console.warn(`WARNING: ${page} contains preai-hero-img-overlay - make sure it does not apply gradient masks`);
      }
    }
  }

  if (allPass) {
    console.log("PASS: 3D pages check finished successfully!");
  }
  return allPass;
}

function checkPortals() {
  console.log("Checking Dashboard Portals...");
  const portals = ["parent-dashboard.html", "tutor-dashboard.html", "admin-dashboard.html"];
  let allPass = true;

  for (const portal of portals) {
    const portalPath = path.join(rootDir, portal);
    if (!fs.existsSync(portalPath)) {
      console.error(`FAIL: ${portal} does not exist`);
      allPass = false;
      continue;
    }
    const content = fs.readFileSync(portalPath, "utf8");

    // Check for the typo "#22c5-5e"
    if (content.includes("#22c5-5e")) {
      console.error(`FAIL: ${portal} still contains success color typo "#22c5-5e"`);
      allPass = false;
    } else if (!content.includes("#22c55e")) {
      console.warn(`WARNING: ${portal} does not seem to contain success color "#22c55e"`);
    } else {
      console.log(`PASS: ${portal} success color hex is correct!`);
    }
  }

  return allPass;
}

const p1 = checkEnroll();
const p2 = checkHomepage();
const p3 = check3DBackgrounds();
const p4 = checkPortals();

if (p1 && p2 && p3 && p4) {
  console.log("\nALL PHASE 4 CHECKS COMPLETED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\nSOME PHASE 4 CHECKS FAILED!");
  process.exit(1);
}
