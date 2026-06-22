const fs = require('fs');
const path = require('path');

const curriculum = [
  {
    id: "creative-coding",
    title: "Creative Coding & Exploration",
    ages: "5-8",
    description: "First contact with code through storytelling, art, and games. Block-based logic lays the foundation.",
    link: "creative-coding.html",
    icon: "🎨",
    bg: "#1d1038",
    cardClass: "card-tall",
    img: "assets/images/space_raiders_game.png",
    lucide: "sparkles",
    dataTech: "gamedev",
    dataAge: "pathfinders",
    color: "purple"
  },
  {
    id: "game-creators",
    title: "Game Creators",
    ages: "5-10",
    description: "Design video games in Scratch. Master logic, loops, and animation through play.",
    link: "scratch-creators.html",
    icon: "🎮",
    bg: "#1a1040",
    cardClass: "card-offset",
    img: "assets/images/scratch_game_creators.png",
    lucide: "gamepad-2",
    dataTech: "gamedev",
    dataAge: "pathfinders",
    color: "circuit-green"
  },
  {
    id: "robotics-lab",
    title: "Robotics & Hardware",
    ages: "8-12",
    description: "Arduino boards, sensors, and servo motors. Build and program physical robots in real-time.",
    link: "arduino-robotics.html",
    icon: "⚙",
    bg: "#012210",
    cardClass: "card-tall",
    img: "assets/images/arduino_robotics_lab.png",
    lucide: "robot",
    dataTech: "robotics",
    dataAge: "adventurers",
    color: "rocket-yellow"
  },
  {
    id: "python-power",
    title: "Python & Logic",
    ages: "10-14",
    description: "Transition to text-based code. Build text adventures, automation scripts, Pygame interfaces, and interactive data apps with Streamlit.",
    link: "python-programming.html",
    icon: "🐍",
    bg: "#0f1f3d",
    cardClass: "card-bleed",
    img: "assets/images/python_game_dev.png",
    lucide: "code",
    dataTech: "python",
    dataAge: "adventurers",
    color: "galaxy-purple"
  },
  {
    id: "web-wizards",
    title: "Web Development",
    ages: "12-16",
    description: "HTML, CSS, and JavaScript from the ground up. Students ship a live URL portfolio before the course ends.",
    link: "web-wizards.html",
    icon: "💻",
    bg: "#2d1000",
    cardClass: "",
    img: "assets/images/weather_app_ui.png",
    lucide: "layout",
    dataTech: "javascript",
    dataAge: "innovators",
    color: "cosmic-blue"
  },
  {
    id: "ai-explorers",
    title: "AI & Full Stack",
    ages: "14-17",
    description: "The advanced frontier. Full-stack applications, machine learning models, and training neural networks.",
    link: "ai-machine-learning.html",
    icon: "🧠",
    bg: "#200020",
    cardClass: "card-offset",
    img: "assets/images/ai_machine_learning.png",
    lucide: "brain-circuit",
    dataTech: "ai",
    dataAge: "innovators",
    color: "supernova-orange"
  }
];

// Global Footer
const FOOTER_HTML = `
<footer class="footer-editorial" role="contentinfo">
    <div class="footer-grid">
        <!-- Brand column -->
        <div>
            <p class="footer-brand-name">STEMulus</p>
            <p class="footer-brand-tag">Global Coding Academy · Est. 2025</p>
            <p style="font-family:'DM Sans',sans-serif;font-size:0.78rem;line-height:1.75;color:rgba(255,255,255,0.7);max-width:320px;">
                Turning screen time into build time for kids aged 5–17, across three continents. Expert mentors. Real projects. Permanent skills.
            </p>
        </div>

        <!-- Programs -->
        <div class="footer-col">
            <p class="footer-col-title">Programs</p>
            <a href="scratch-creators.html">Game Creators</a>
            <a href="python-programming.html">Python Power</a>
            <a href="web-wizards.html">Web Wizards</a>
            <a href="arduino-robotics.html">Robotics Lab</a>
            <a href="creative-coding.html">Creative Coding</a>
            <a href="ai-machine-learning.html">AI Explorers</a>
        </div>

        <!-- Company -->
        <div class="footer-col">
            <p class="footer-col-title">Company</p>
            <a href="why-stemulus.html">Why STEMulus</a>
            <a href="for-parents.html">For Parents</a>
            <a href="join-as-tutor.html">Join as a Tutor</a>
            <a href="hall-of-fame.html">Hall of Fame</a>
            <a href="blog.html">Blog</a>
            <a href="contact.html">Contact</a>
        </div>

        <!-- Account -->
        <div class="footer-col">
            <p class="footer-col-title">Account</p>
            <a href="login.html">Log In</a>
            <a href="enroll.html" target="_blank" rel="noopener">Enroll Now</a>
            <a href="pricing.html">Pricing</a>
            <a href="privacy-policy.html">Privacy Policy</a>
        </div>
    </div>

    <div class="footer-bottom">
        <p class="footer-legal">© ${new Date().getFullYear()} STEMulus Innovations LTD. All rights reserved.</p>
        <p class="footer-legal" style="display:flex;align-items:center;gap:0.5rem;">
            Built with craft, not algorithms
            <i data-lucide="heart" style="width:12px;height:12px;fill:var(--orange);color:var(--orange);display:inline-block;vertical-align:middle;margin:0 2px;"></i>
            <a href="mailto:admin@stemuluskidstech.com" aria-label="Email STEMulus" style="color:currentColor;margin-left:1rem;display:flex;align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            </a>
            <a href="https://wa.me/2347052466716" aria-label="WhatsApp STEMulus" style="color:currentColor;margin-left:0.5rem;display:flex;align-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
            </a>
        </p>
    </div>
</footer>`;

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  let html = fs.readFileSync(path.join(dir, file), 'utf-8');
  let originalHtml = html;
  
  // Replace footer
  let startIndex = html.indexOf('<footer class="footer-editorial"');
  if (startIndex === -1 && html.indexOf('<footer') > -1) {
    startIndex = html.indexOf('<footer');
  }
  if (startIndex !== -1) {
    let endIndex = html.indexOf('</footer>', startIndex);
    if (endIndex !== -1) {
       html = html.substring(0, startIndex) + FOOTER_HTML + html.substring(endIndex + 9);
    }
  }
  
  // Age change references (5-17)
  if (html.includes('5-17')) html = html.split('5-17').join('5–17');
  if (html.includes('5-17')) html = html.split('5-17').join('5-17');
  
  if (html !== originalHtml) {
    fs.writeFileSync(path.join(dir, file), html, 'utf-8');
    console.log('Fixed footer and age refs in', file);
  }
});

// index.html specific update
let indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');

// index.html - Cards
const cardsHtml = curriculum.map((c, i) => `
        <div class="prog-card ${c.cardClass} card-3d-tilt" style="background:${c.bg};">
            <div class="icon-3d"><div class="icon-3d-inner">
                <div class="face face-front icon-game">${c.icon}</div>
                <div class="face face-top   icon-game"></div>
                <div class="face face-right icon-game"></div>
            </div></div>
            <p class="prog-card-num">0${i+1} / 06</p>
            <h3 class="prog-card-title">${c.title.replace(' & ', '<br>&amp; ')}</h3>
            <p class="prog-card-ages">Ages ${c.ages}</p>
            <p class="prog-card-desc">${c.description}</p>
            <a href="${c.link}" class="prog-card-link">Explore Program <span>→</span></a>
        </div>`).join('');

let sInd = indexHtml.indexOf('<div class="curriculum-grid"');
if (sInd !== -1) {
   let startDiv = indexHtml.indexOf('>', sInd) + 1;
   let endDiv = indexHtml.indexOf('</section>', startDiv);
   let lastDivIdx = indexHtml.lastIndexOf('</div>', endDiv);
   if (lastDivIdx !== -1) {
       indexHtml = indexHtml.substring(0, startDiv) + '\n' + cardsHtml + '\n    ' + indexHtml.substring(lastDivIdx);
   }
}

// index.html - Timeline
const timelineHtml = curriculum.map((c, i) => `
            <div class="timeline-step">
                <div class="timeline-step-num">0${i+1}</div>
                <p class="timeline-step-age">Ages ${c.ages}</p>
                <h3 class="timeline-step-title">${c.title}</h3>
                <p class="timeline-step-desc">${c.description}</p>
            </div>`).join('');

let tInd = indexHtml.indexOf('<div class="timeline-scroll-track"');
if (tInd !== -1) {
   let startDiv = indexHtml.indexOf('>', tInd) + 1;
   let endDiv = indexHtml.indexOf('</section>', startDiv);
   let veryLastDiv = indexHtml.lastIndexOf('</div>', endDiv);
   
   if (veryLastDiv !== -1) {
       indexHtml = indexHtml.substring(0, startDiv) + '\n' + timelineHtml + '\n        ' + indexHtml.substring(veryLastDiv);
   }
}

// Stats & UX Fixes
indexHtml = indexHtml.replace('3<span style="color:var(--orange);">★</span>', '3<span style="color:var(--orange);">+</span>');
// Regex replacement to handle whitespace differences gracefully:
indexHtml = indexHtml.replace(/50<span class="stat-unit">\+<\/span><\/span>\s*<p class="stat-label">Student Projects<br>shipped to production<\/p>/, '50<span class="stat-unit">+</span></span>\n            <p class="stat-label">Real Projects<br>published live to the web.</p>');

// Wait, the CTA is used twice in index.html, let's replace all:
const updatedCTA = `class="btn-ghost-raw" style="display:flex;align-items:center;gap:0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                Book a Free Class
            </a>`;
indexHtml = indexHtml.replace(/class="btn-ghost-raw">\s*Book a Free Class\s*<\/a>/g, updatedCTA);
indexHtml = indexHtml.replace(/class="btn-ghost-raw" style="color:rgba\(255,255,255,0\.5\);border-color:rgba\(255,255,255,0\.2\);">\s*Book a Free Class\s*<\/a>/g, updatedCTA.replace('class="btn-ghost-raw"', 'class="btn-ghost-raw" style="display:flex;align-items:center;gap:0.5rem;color:rgba(255,255,255,0.5);border-color:rgba(255,255,255,0.2);"'));

fs.writeFileSync(path.join(dir, 'index.html'), indexHtml, 'utf-8');
console.log('Fixed index.html metrics and timelines');

// programs.html specific update
let programsHtml = fs.readFileSync(path.join(dir, 'programs.html'), 'utf-8');
const programsCardsHtml = curriculum.map(c => `
                        <div id="${c.id}" class="program-card bg-white rounded-2xl shadow-md overflow-hidden group border border-slate-200/80" data-age="${c.dataAge}" data-tech="${c.dataTech}" data-format="online">
                            <div class="h-48 relative overflow-hidden">
                                <img src="${c.img}" 
                                    alt="${c.title}" 
                                    class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    decoding="async">
                                <div class="absolute inset-0 bg-gradient-to-t from-${c.color}/80 to-${c.color}/20 group-hover:from-${c.color}/60 transition-colors"></div>
                                <i data-lucide="${c.lucide}" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white/80 z-10"></i>
                            </div>
                            <div class="p-6 relative">
                                <div class="absolute -top-6 right-6 bg-white p-2 rounded-xl shadow-md border border-slate-200/80">
                                    <i data-lucide="${c.lucide}" class="w-6 h-6 text-${c.color}"></i>
                                </div>
                                <h3 class="text-xl font-bold font-nunito text-slate-800 mb-1">${c.title}</h3>
                                <p class="text-xs font-bold text-supernova-orange uppercase tracking-wide mb-3">Ages ${c.ages}</p>
                                <p class="text-slate-600 mb-6 text-sm leading-relaxed">${c.description}</p>
                                <a href="${c.link}" class="flex items-center justify-center w-full bg-slate-50 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-200/80">
                                    Learn More <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i>
                                </a>
                            </div>
                        </div>`).join('') + `
                         <div id="no-results" class="hidden sm:col-span-2 xl:col-span-3 text-center py-12">
                            <div class="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                                <i data-lucide="search-x" class="w-10 h-10 text-slate-400"></i>
                            </div>
                            <h3 class="text-2xl font-bold font-nunito text-slate-800">No Programs Found</h3>
                            <p class="text-slate-500 mt-2">Try adjusting your filters to find the perfect program!</p>
                        </div>`;

let pgGrid = programsHtml.indexOf('<div id="programs-grid"');
if (pgGrid !== -1) {
    let startGrid = programsHtml.indexOf('>', pgGrid) + 1;
    let endGrid = programsHtml.indexOf('</div>\n                </div>\n            </div>\n        </section>', startGrid);
    if (endGrid !== -1) {
        programsHtml = programsHtml.substring(0, startGrid) + '\n' + programsCardsHtml + '\n                    ' + programsHtml.substring(endGrid);
    }
}
fs.writeFileSync(path.join(dir, 'programs.html'), programsHtml, 'utf-8');
console.log('Fixed programs.html');

let styleCss = fs.readFileSync(path.join(dir, 'style.css'), 'utf-8');
if (!styleCss.includes('honeypot_human_check')) {
    styleCss += "\n/* Honeypot Security CSS Patch for Form Fields */\n.sr-only, input[name=\"honeypot_human_check\"], .honeypot-field-container, label:has(+ input[name=\"honeypot_human_check\"]) {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border-width: 0;\n    opacity: 0;\n    pointer-events: none;\n    tab-index: -1;\n}\n";
    fs.writeFileSync(path.join(dir, 'style.css'), styleCss, 'utf-8');
    console.log('Fixed style.css honeypot config');
}
