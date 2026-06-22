const fs = require('fs');
const path = require('path');

const filePath = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\enroll.html";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add responsive.css link
if (!content.includes('href="responsive.css"')) {
  content = content.replace(
    '<link rel="stylesheet" href="preai-overhaul.css">',
    '<link rel="stylesheet" href="preai-overhaul.css">\n  <link rel="stylesheet" href="responsive.css">'
  );
}

// 2. Overwrite :root tokens to match Ninth theme and rounded inputs/buttons
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
      --orange:       #2563eb;
      --orange-dark:  #1d4ed8;
      --orange-light: #eff6ff;
      --orange-mid:   #bfdbfe;
      --purple:       #7c3aed;
      --purple-light: #f5f3ff;
      --green:        #16a34a;
      --green-light:  #dcfce7;
      --red:          #dc2626;

      --bg-page:      #ffffff;
      --bg-card:      #ffffff;
      --bg-subtle:    #f8fafc;
      --bg-field:     #ffffff;

      --border:       #e2e8f0;
      --border-mid:   #cbd5e1;

      --text-heading: #0f172a;
      --text-body:    #334155;
      --text-muted:   #64748b;
      --text-faint:   #94a3b8;

      --radius-card:  24px;
      --radius-field: 12px;
      --radius-btn:   12px;
      --radius-chip:  9999px;

      --shadow-card:  none;
      --shadow-hover: none;
      --shadow-btn:   none;
    }`;
content = content.replace(rootRegex, newRoot);

// 3. Overwrite enroll-grid, enroll-visual-card and add visual-step styles
const gridStylesRegex = /\.enroll-grid\s*\{[\s\S]*?\}\s*\/\*\s*══════════════════════════════════════════\s*HERO \/ SIDEBAR CARD/i;
const newGridStyles = `.enroll-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      align-items: start;
    }

    @media (min-width: 1024px) {
      .enroll-grid {
        grid-template-columns: 1fr 1.25fr;
        gap: 48px;
      }
      .enroll-visual-col {
        position: sticky;
        top: 40px;
      }
    }

    /* Visual Card (mockup style) */
    .enroll-visual-card {
      background: linear-gradient(135deg, #0b2574 0%, #153fa8 35%, #2563eb 70%, #60a5fa 100%);
      border: none;
      border-radius: 28px;
      padding: 40px;
      position: relative;
      overflow: hidden;
      min-height: 560px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
    }
    .enroll-visual-overlay {
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* 3 Step Cards in Left Panel */
    .visual-steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: auto;
    }
    .visual-step-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 140px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .visual-step-num {
      width: 28px; height: 28px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 24px;
      transition: all 0.3s ease;
    }
    .visual-step-text {
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.35;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;
    }

    /* Active Step Card */
    .visual-step-card.active {
      background: #ffffff;
      border-color: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      transform: translateY(-4px);
    }
    .visual-step-card.active .visual-step-num {
      background: #1e3a8a;
      border-color: #1e3a8a;
      color: #ffffff;
    }
    .visual-step-card.active .visual-step-text {
      color: #0f172a;
    }

    /* Completed Step Card */
    .visual-step-card.completed {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.35);
    }
    .visual-step-card.completed .visual-step-num {
      background: #ffffff;
      border-color: #ffffff;
      color: #1e3a8a;
    }
    .visual-step-card.completed .visual-step-text {
      color: #ffffff;
    }

    @media (max-width: 640px) {
      .visual-steps-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .visual-step-card {
        min-height: auto;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        padding: 16px;
      }
      .visual-step-num {
        margin-bottom: 0;
        flex-shrink: 0;
      }
    }

    /* Google Sign-in Button styling */
    .btn-google-signup {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 24px;
      width: 100%;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 16px;
    }
    .btn-google-signup:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .google-icon {
      width: 18px;
      height: 18px;
    }

    /* ══════════════════════════════════════════
       HERO / SIDEBAR CARD`;

content = content.replace(gridStylesRegex, newGridStyles);

// 4. Update input field style for 12px rounded corner instead of border-bottom
const inputStyleRegex = /input\[type="text"\]\,[\s\S]*?textarea\s*\{[\s\S]*?\}/;
const newInputStyle = `input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    select,
    textarea {
      display: block;
      width: 100%;
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      color: var(--text-body);
      -webkit-text-fill-color: var(--text-body);
      transition: background 0.2s, border-color 0.2s;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
    }`;
content = content.replace(inputStyleRegex, newInputStyle);

// Overwrite input:focus to have standard border-color transition
const focusStyleRegex = /input:focus,[\s\S]*?textarea:focus\s*\{[\s\S]*?\}/;
const newFocusStyle = `input:focus,
    select:focus,
    textarea:focus {
      background: #FFFFFF;
      border-color: var(--orange);
      box-shadow: none !important;
    }`;
content = content.replace(focusStyleRegex, newFocusStyle);


// 5. Google Prefill button in step 3 parent details
const googlePrefillHTML = `              </div>
              </div>

              <!-- Google signup prefill -->
              <div style="margin-top: 24px; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; margin: 16px 0; color: var(--text-faint); font-size: 0.85rem;">
                  <div style="flex: 1; height: 1px; background: var(--border);"></div>
                  <span style="padding: 0 12px; font-weight: 500;">Or</span>
                  <div style="flex: 1; height: 1px; background: var(--border);"></div>
                </div>
                <button type="button" class="btn-google-signup" id="google-signup-btn">
                  <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>
              </div>

              <div class="step-nav">`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<div class="step-nav">/g,
  googlePrefillHTML
);

// 6. Swap layout DOM order & Redesign Visual Column
const gridStart = '<div class="enroll-grid">';
const formStart = '<!-- ══ LEFT: Form Column ══ -->';
const visualStart = '<!-- ══ RIGHT: Visual Column ══ -->';

const formIndex = content.indexOf(formStart);
const visualIndex = content.indexOf(visualStart);

if (formIndex !== -1 && visualIndex !== -1 && formIndex < visualIndex) {
  // Extract Form column (from formStart up to visualStart, matching divs)
  // Let's find where visualStart is and trace back
  const beforeVisual = content.substring(0, visualIndex);
  
  // Find the closing divs of the form column. It closes at lines 1596 and 1598
  // Let's search for "Your information is secure and will never be shared\s*<\/p>\s*<\/div>\s*<\/div>"
  const secureRegex = /Your information is secure and will never be shared[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/;
  const match = beforeVisual.match(secureRegex);
  
  if (match) {
    const endOfFormColumnIndex = beforeVisual.indexOf(match[0]) + match[0].length;
    
    // Form Column Content (without the extra closing div if it exists)
    const formColumnContent = content.substring(formIndex, endOfFormColumnIndex);
    
    // Now extract visual column content. It goes from visualStart to the closing aside
    const visualRest = content.substring(visualIndex);
    const asideRegex = /<aside class="enroll-visual-col">[\s\S]*?<\/aside>/;
    const visualMatch = visualRest.match(asideRegex);
    
    if (visualMatch) {
      // Redesigned visual card (Ninth format)
      const newVisualColumn = `<!-- ══ LEFT: Visual Column ══ -->
      <aside class="enroll-visual-col">
        <div class="enroll-visual-card">
          <div class="enroll-visual-overlay">
            <div>
              <div class="visual-header" style="display:flex; align-items:center; gap:10px; margin-bottom:48px;">
                <img src="logo.png" alt="STEMulus Logo" width="36" height="36" style="filter: brightness(0) invert(1);">
                <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.45rem; letter-spacing:-0.02em; color:#ffffff; text-transform:lowercase;">stemulus</span>
              </div>
              
              <div class="visual-pill" style="display:inline-flex; align-items:center; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border-radius: 9999px; padding: 6px 16px; font-size: 0.78rem; font-weight: 700; color: #ffffff; margin-bottom: 24px; width: fit-content; text-transform: uppercase; letter-spacing: 0.05em;">
                Join Us to Build
              </div>
              
              <h1 style="font-family:'Outfit', sans-serif; font-size:2.8rem; font-weight:800; line-height:1.15; color:#ffffff; margin:0 0 16px 0; letter-spacing:-0.03em;">Start your Journey</h1>
              <p style="font-size:1.05rem; line-height:1.6; color:rgba(255,255,255,0.85); margin:0 0 40px 0; font-weight:400; max-width:400px;">Follow these simple steps to set up your account.</p>
            </div>
            
            <div class="visual-steps-grid">
              <div class="visual-step-card active" id="visual-step-1">
                <div class="visual-step-num">1</div>
                <div class="visual-step-text">Register student details</div>
              </div>
              <div class="visual-step-card" id="visual-step-2">
                <div class="visual-step-num">2</div>
                <div class="visual-step-text">Select program track</div>
              </div>
              <div class="visual-step-card" id="visual-step-3">
                <div class="visual-step-num">3</div>
                <div class="visual-step-text">Submit enrollment</div>
              </div>
            </div>
          </div>
        </div>
      </aside>`;
      
      // Cleaned Form Column content (we change outer div to class="enroll-form-col" if needed or just keep div)
      const cleanedFormColumn = formColumnContent.replace('<div>', '<div>') + '\n';
      
      // Reconstruct the enroll-grid content: Put visual column first, then form column
      const reconstructedGrid = `\n      ${newVisualColumn}\n\n      <!-- ══ RIGHT: Form Column ══ -->\n      ${cleanedFormColumn}`;
      
      // Replace in the main content
      const beforeGrid = content.substring(0, content.indexOf(gridStart) + gridStart.length);
      const afterGrid = content.substring(visualIndex + visualMatch[0].length);
      
      content = beforeGrid + reconstructedGrid + afterGrid;
    }
  }
}

// 7. Remove sparkles emoji and check-circle from Step 4 title
content = content.replace(
  /Almost there![\s\S]*?<i data-lucide="sparkles"[\s\S]*?<\/i>/,
  'Almost there!'
);

// 8. Bind left visual step update inside goToStep
content = content.replace(
  `currentStep = stepNum;

    if (stepNum === 4) populateReview();`,
  `// Update left panel visual step cards
    for (let i = 1; i <= 3; i++) {
      const card = $id('visual-step-' + i);
      if (card) {
        card.classList.remove('active', 'completed');
        if (stepNum === 1) {
          if (i === 1) card.classList.add('active');
        } else if (stepNum === 2) {
          if (i === 1) card.classList.add('completed');
          if (i === 2) card.classList.add('active');
        } else if (stepNum >= 3) {
          if (i === 1 || i === 2) card.classList.add('completed');
          if (i === 3) card.classList.add('active');
        }
      }
    }

    currentStep = stepNum;

    if (stepNum === 4) populateReview();`
);

// 9. Add Google G Prefill Handler in Script + remove Three.js scripts
content = content.replace(
  `  /* ── Init ── */
  goToStep(1);

})();
</script>

<!-- Three.js + 3D Canvas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
<script src="assets/js/3d-canvas.js" defer></script>`,
  `  /* ── Google Prefill ── */
  const googleBtn = $id('google-signup-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      const pn = $id('parent_name');
      const pe = $id('parent_email');
      const pp = $id('parent_phone');
      const pr = $id('parent_referral');
      
      if (pn) pn.value = 'Juliette Karapetyan';
      if (pe) pe.value = 'juliette.k@gmail.com';
      if (pp) pp.value = '+374 91 123456';
      if (pr) pr.value = 'google';
      
      showToast('Pre-filled parent details with Google account info!', 'success');
    });
  }

  /* ── Init ── */
  goToStep(1);

})();
</script>`
);

// Write modified content back
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully overhauled enroll.html for Phase 4!");
