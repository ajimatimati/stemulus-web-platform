const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";

// 1. Modify index.html
const indexPath = path.join(rootDir, "index.html");
let indexContent = fs.readFileSync(indexPath, 'utf8');

const heroPanelRegex = /<div id="hero-panel" aria-label="Hero">([\s\S]*?)<\/div><!-- \/hero-panel -->/;
const newHeroPanelHTML = `<div id="hero-panel" aria-label="Hero">

        <div class="hero-left-col">
          <h1 class="hero-headline" style="max-width:720px;">
            Don’t Just Use Tech.<br><span class="accent-word">Build It.</span>
          </h1>

          <p class="hero-body-text" style="max-width:520px;">
            Private 1-on-1 coding classes for kids aged 5 - 17. Python, Scratch, Robotics, AI &amp; more | taught by
            passionate mentors who make learning an adventure.
          </p>
        </div>

        <div class="hero-right-col">
          <div class="hero-cta-group">
            <a href="enroll.html" class="btn-hero-primary" target="_blank" rel="noopener" id="hero-cta-primary">
              Start Learning Today
              <i data-lucide="arrow-right" class="w-4 h-4 inline-block align-middle ml-1"></i>
            </a>
            <a href="https://wa.me/2347052466716?text=Hello%20STEMulus%2C%20I%20am%20interested%20in%20booking%20a%20free%20intro%20class"
              class="btn-hero-secondary" target="_blank" rel="noopener noreferrer" id="hero-cta-secondary">
              Book a Free Class
            </a>
          </div>

          <div class="hero-trust-row">
            <div class="hero-trust-text">
              <strong>First class is free.</strong> No commitment required.<br>
              Trusted by families across 3+ continents.
            </div>
          </div>

          <div class="hero-stats-strip-new" aria-label="Key statistics" style="margin-top:2rem;">
            <div class="hero-stat-item">
              <div class="hero-stat-num">10<span>+</span></div>
              <div class="hero-stat-label">Programs</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-num">500<span>h</span></div>
              <div class="hero-stat-label">Curriculum</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-num">4.9<span>/5</span></div>
              <div class="hero-stat-label">Parent Rating</div>
            </div>
          </div>
        </div>

        <!-- Scroll hint -->
        <div aria-hidden="true" id="scroll-hint">
          <span>Scroll</span>
          <i data-lucide="arrow-down" class="w-4 h-4 inline-block align-middle"></i>
        </div>

      </div><!-- /hero-panel -->`;

indexContent = indexContent.replace(heroPanelRegex, newHeroPanelHTML);
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log("Successfully patched index.html");

// 2. Modify preai-overhaul.css
const cssPath = path.join(rootDir, "preai-overhaul.css");
let cssContent = fs.readFileSync(cssPath, 'utf8');

// A. Centralize background video (remove translateX horizontal offsets)
cssContent = cssContent.replace(
  /translateX\(18%\)/g,
  'translateX(0)'
);
cssContent = cssContent.replace(
  /translateX\(16%\)/g,
  'translateX(0)'
);
cssContent = cssContent.replace(
  /translateX\(12%\)/g,
  'translateX(0)'
);

// B. Append split layout styles to CSS
const splitStyles = `
/* ── Split Hero Columns for PC View ── */
@media (min-width: 1024px) {
  #hero-panel {
    max-width: 100% !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0 8vw !important;
    width: 100% !important;
    height: 100vh !important;
    box-sizing: border-box !important;
  }
  .hero-left-col {
    width: 38% !important;
    max-width: 480px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
    z-index: 5 !important;
  }
  .hero-right-col {
    width: 38% !important;
    max-width: 480px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
    z-index: 5 !important;
    margin-top: 2rem !important;
  }
  
  .hero-cta-group {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }
  .hero-cta-group a {
    width: 100% !important;
    text-align: center !important;
    box-sizing: border-box !important;
  }
  .hero-stats-strip-new {
    width: 100% !important;
    justify-content: space-between !important;
  }
}

@media (max-width: 1023px) {
  .hero-left-col,
  .hero-right-col {
    display: contents !important;
  }
}
`;

cssContent += splitStyles;
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log("Successfully patched preai-overhaul.css");
