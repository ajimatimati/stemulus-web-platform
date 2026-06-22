const fs = require('fs');
const path = require('path');

const filepath = "c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus/programs.html";

if (!fs.existsSync(filepath)) {
  console.error("Error: file not found: " + filepath);
  process.exit(1);
}

let content = fs.readFileSync(filepath, 'utf8');

// Split header and footer using simple tokens
const startToken = "<!-- Timeline Road Content Wrapper -->";
const endToken = "<!-- Academic Tutoring Section (Targeted separate section) -->";

const startIdx = content.indexOf(startToken);
const endIdx = content.indexOf(endToken);

if (startIdx === -1 || endIdx === -1) {
  console.error("Error: could not find boundary tokens in programs.html");
  process.exit(1);
}

const header = content.substring(0, startIdx);
const footer = content.substring(endIdx);

const courses = [
  {
    num: 1,
    ages: "5-9",
    tracks: "software,robotics",
    label: "Course 1 · Ages 5-7",
    name: "Pre-Coding Literacy",
    desc: "Master mouse clicks, coordinate drag-and-drop navigation, and basic folder directory file structures.",
    tools: "Keyboard Trainer, paint tools, browser directories, OS files.",
    outcomes: "Coordinates navigation, posture, saving files correctly.",
    linkUrl: "enroll.html",
    linkText: "Book Assessment",
    previewName: "Pre-Coding",
    image: "assets/images/paint_messy_child.jpg"
  },
  {
    num: 2,
    ages: "5-9",
    tracks: "software",
    label: "Course 2 · Ages 5-7",
    name: "Keyboard Basics & Safety",
    desc: "Develop touch-typing accuracy. Learn safe internet browsing rules, posture coordinates, and healthy screen habits.",
    tools: "Typing tools, Chrome secure navigation systems.",
    outcomes: "Typing speed > 15 WPM with correct hand positions.",
    linkUrl: "enroll.html",
    linkText: "Book Assessment",
    previewName: "Typing & Safety",
    image: "assets/images/mom_son_laptop.jpg"
  },
  {
    num: 3,
    ages: "5-9",
    tracks: "software",
    label: "Course 3 · Ages 7-10",
    name: "Scratch Game Creators",
    desc: "Command visual coding block assembly. Program sequential loops, conditionals, parameters, variables, and events.",
    tools: "Scratch blocks canvas, Scratch sprite editor, coordinates grids.",
    outcomes: "Build multi-level games. Understand loops, variables, and condition logic.",
    linkUrl: "scratch-creators.html",
    linkText: "View Program",
    previewName: "Scratch Creators",
    image: "assets/images/scratch_game_creators.png"
  },
  {
    num: 4,
    ages: "5-9,10-13",
    tracks: "robotics",
    label: "Course 4 · Ages 8-12",
    name: "Junior Robotics",
    desc: "Connect coding scripts to mechanical hardware. Integrate motors, triggers, gears, and sensors to power automated bots.",
    tools: "LEGO Boost hardware hubs, Scratch connection engines, sensor registers.",
    outcomes: "Map inputs to outputs. Program motor direction, angle loops, and obstacle triggers.",
    linkUrl: "junior-robotics.html",
    linkText: "View Program",
    previewName: "Junior Robotics",
    image: "assets/images/junior_robotics_playful.png"
  },
  {
    num: 5,
    ages: "10-13",
    tracks: "software",
    label: "Course 5 · Ages 9-12",
    name: "Creative Coding",
    desc: "Blend coding blocks with mathematics, geometry, and design coordinates. Render custom vector shapes and games on HTML Canvas.",
    tools: "HTML Canvas context API, JavaScript variables, vector loops.",
    outcomes: "Draw coordinates mathematically, create animated sprites and vector shapes.",
    linkUrl: "creative-coding.html",
    linkText: "View Program",
    previewName: "Creative Coding",
    image: "assets/images/space_raiders_game.png"
  },
  {
    num: 6,
    ages: "10-13",
    tracks: "software",
    label: "Course 6 · Ages 9-13",
    name: "Digital Art & Design",
    desc: "Learn digital layouts, vectors, and color design systems in Figma. Export custom assets for frontend games and page UI structures.",
    tools: "Figma vector tool, asset layout systems, colors grids, wireframe components.",
    outcomes: "Build complete game assets libraries, layout UI web headers, and wireframe pages.",
    linkUrl: "digital-art.html",
    linkText: "View Program",
    previewName: "Digital Art",
    image: "assets/images/anansi_story_scratch.png"
  },
  {
    num: 7,
    ages: "10-13,14-17",
    tracks: "software",
    label: "Course 7 · Ages 10-16",
    name: "Python Programming",
    desc: "Ditch visual blocks for text syntax. Code Python variables, conditional scopes, functions, data lists, and loops.",
    tools: "VS Code console terminal, Python Interpreter, basic syntax debug tools.",
    outcomes: "Build arithmetic utilities, text RPG terminal games, and write loops scripts.",
    linkUrl: "python-programming.html",
    linkText: "View Program",
    previewName: "Python Power",
    image: "assets/images/python_game_dev.png"
  },
  {
    num: 8,
    ages: "10-13,14-17",
    tracks: "robotics",
    label: "Course 8 · Ages 11-15",
    name: "Robotics Lab (Arduino)",
    desc: "Wire physical circuits. Program Arduino C++ loops to read distance sensors, coordinate breadboards, and output signals.",
    tools: "Arduino IDE, breadboards, resistors, light sensors, registers indicators, servos.",
    outcomes: "Wire circuits, execute analog signal logic loops, configure physical outputs.",
    linkUrl: "arduino-robotics.html",
    linkText: "View Program",
    previewName: "Arduino Lab",
    image: "assets/images/arduino_robotics_lab.png"
  },
  {
    num: 9,
    ages: "10-13,14-17",
    tracks: "software",
    label: "Course 9 · Ages 11-15",
    name: "Web Wizards (Frontend)",
    desc: "Structure semantic HTML5 markup. Style pages with CSS Flex/Grid properties, and program DOM logic in JavaScript ES6.",
    tools: "HTML5 tags, CSS margin grids, JS DOM elements selectors, Netlify hosting.",
    outcomes: "Build responsive layouts, wire interactive calculators, and host static webpages.",
    linkUrl: "web-wizards.html",
    linkText: "View Program",
    previewName: "Frontend Web",
    image: "assets/images/weather_app_ui.png"
  },
  {
    num: 10,
    ages: "14-17",
    tracks: "software",
    label: "Course 10 · Ages 14-18",
    name: "Full-Stack Web Architectures",
    desc: "Master backend REST APIs with Node.js & Express. Setup relational schemas, queries, and store data securely in database Tables.",
    tools: "Node.js express APIs, Git terminal branches, MongoDB databases configurations, Render hosting.",
    outcomes: "Write backend API routes, query database documents securely, manage Git branches.",
    linkUrl: "fullstack-web-dev.html",
    linkText: "View Program",
    previewName: "Full-Stack Web",
    image: "assets/images/fullstack_restaurant_analogy.jpg"
  },
  {
    num: 11,
    ages: "13-17",
    tracks: "software",
    label: "Course 11 · Ages 13-17",
    name: "AI & Machine Learning",
    desc: "Analyze data patterns. Model decision trees, linear regression margins, and train neural network text classifiers in Python.",
    tools: "Jupyter Notebooks, Pandas data frames, TensorFlow / Keras modules, scikit-learn.",
    outcomes: "Process CSV data files, plot accuracy margins, train neural classifiers.",
    linkUrl: "ai-machine-learning.html",
    linkText: "View Program",
    previewName: "Machine Learning",
    image: "assets/images/ai_machine_learning.png"
  },
  {
    num: 12,
    ages: "14-17",
    tracks: "software",
    label: "Course 12 · Ages 14-17+",
    name: "Systems & Shell Scripting",
    desc: "Interfacing directly with OS kernel. Program Bash shell variables, pipeline command scripts, and configure automation tasks.",
    tools: "Linux Terminal (Bash), SSH utilities, custom cron jobs, system pipelines.",
    outcomes: "Automate server directories backups, pipe shell scripts logs, configure user permissions.",
    linkUrl: "enroll.html",
    linkText: "Book Assessment",
    previewName: "Systems Linux",
    image: "assets/images/stemulus_mastery_kids.png"
  }
];

const phases = [
  {
    startCourse: 1,
    phaseNum: "01",
    name: "Digital Foundations",
    desc: "Getting started with interaction, keyboard posture, and visual game development logic."
  },
  {
    startCourse: 4,
    phaseNum: "02",
    name: "Logic & Creative",
    desc: "Bridges the gap between virtual visual blocks, graphics vectors, and hardware movement command."
  },
  {
    startCourse: 7,
    phaseNum: "03",
    name: "Syntax & Hardware",
    desc: "Transition into text-based syntactic code structure and wire physical electronics circuits."
  },
  {
    startCourse: 10,
    phaseNum: "04",
    name: "Advanced & Systems",
    desc: "Operate at system core. Build deployable database endpoints, train models, and manage shell environments."
  }
];

let generatedHtml = `<!-- Timeline Road Content Wrapper -->
      <div class="space-y-0 relative">`;

courses.forEach((c) => {
  // Check if a phase intro needs to be injected before this course
  const phase = phases.find(p => p.startCourse === c.num);
  if (phase) {
    generatedHtml += `
        
        <!-- Phase ${phase.phaseNum} Intro Row -->
        <div class="roadmap-phase-intro grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:items-stretch py-12 relative z-10">
          <div class="col-span-12 lg:col-span-5 text-center lg:text-right lg:pr-12 lg:flex lg:flex-col lg:justify-center">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase ${phase.phaseNum}</span>
            <h3 class="text-3xl font-black text-slate-800 font-outfit mt-1">${phase.name}</h3>
          </div>
          <div class="hidden lg:flex lg:col-span-2 justify-center h-full relative">
            <div class="roadmap-svg-wrap w-full h-full">
              <svg viewBox="0 0 200 100" class="w-full h-full roadmap-svg-road" preserveAspectRatio="none" style="overflow: visible !important;">
                <defs>
                  <mask id="dash-mask-phase-${phase.phaseNum}">
                    <path d="M 100,-15 L 100,115" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="butt" class="road-mask-path" />
                  </mask>
                </defs>
                <!-- Underlay road path (border lines) -->
                <path d="M 100,-15 L 100,115" stroke="#cbd5e1" stroke-width="96" fill="none" stroke-linecap="butt" class="road-path" />
                <!-- Main road path -->
                <path d="M 100,-15 L 100,115" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="butt" class="road-path" />
                <!-- Center lane dashes -->
                <path d="M 100,-15 L 100,115" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="butt" mask="url(#dash-mask-phase-${phase.phaseNum})" />
              </svg>
            </div>
          </div>
          <div class="col-span-12 lg:col-span-5 text-center lg:text-left lg:pl-12 lg:flex lg:flex-col lg:justify-center">
            <p class="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto lg:mx-0">${phase.desc}</p>
          </div>
        </div>`;
  }

  // S-Curve alternates direction: Left Card (odd courses) / Right Card (even courses)
  const isLeftCard = c.num % 2 !== 0;
  const numStr = c.num < 10 ? '0' + c.num : c.num;

  if (isLeftCard) {
    // Left Card layout
    generatedHtml += `
        
        <!-- Course Row: Course ${c.num} -->
        <div class="roadmap-row roadmap-section-wrap roadmap-stage grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:items-stretch min-h-[350px] relative z-10" data-course-num="${c.num}" data-ages="${c.ages}" data-tracks="${c.tracks}">
          <!-- Card Column -->
          <div class="col-span-12 lg:col-span-5 lg:flex lg:items-center">
            <div class="roadmap-card-outer card-3d-tilt w-full">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">${numStr}</div>
                <img src="${c.image}" alt="${c.name} screenshot" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">${c.label}</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">${c.name}</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">${c.desc}</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="${c.linkUrl}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      ${c.linkText}
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> ${c.tools}</p>
                      <p><strong>Outcomes:</strong> ${c.outcomes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Road SVG Column (Left Curve) -->
          <div class="hidden lg:flex lg:col-span-2 justify-center h-full relative min-h-[350px]">
            <div class="roadmap-svg-wrap w-full h-full">
              <svg viewBox="0 0 200 350" class="w-full h-full roadmap-svg-road" preserveAspectRatio="none" style="overflow: visible !important;">
                <defs>
                  <filter id="road-shadow-${c.num}" x="-25%" y="-25%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#475569" flood-opacity="0.12"/>
                  </filter>
                  <mask id="dash-mask-${c.num}">
                    <path d="M 100,-15 C 100,75 55,75 55,175 C 55,275 100,275 100,365" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="butt" class="road-mask-path" />
                  </mask>
                </defs>
                <!-- Underlay road path (3D shadow + border) -->
                <path d="M 100,-15 C 100,75 55,75 55,175 C 55,275 100,275 100,365" stroke="#cbd5e1" stroke-width="96" fill="none" stroke-linecap="butt" filter="url(#road-shadow-${c.num})" class="road-path" />
                <!-- Main road path -->
                <path d="M 100,-15 C 100,75 55,75 55,175 C 55,275 100,275 100,365" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="butt" class="road-path" />
                <!-- Center lane dashes -->
                <path d="M 100,-15 C 100,75 55,75 55,175 C 55,275 100,275 100,365" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="butt" mask="url(#dash-mask-${c.num})" />
                <!-- Connector Line to Card on the Left -->
                <line x1="-48" y1="175" x2="55" y2="175" class="road-connector-line" data-line-num="${c.num}" />
              </svg>
            </div>
            
            <!-- Road Node container -->
            <div class="road-node-container">
              <div class="road-node" style="left: 27.5%; top: 50%;" data-course-target="${c.num}">
                C${c.num}
                <div class="road-node-preview">
                  <img src="${c.image}" alt="Preview">
                  <p>${c.previewName}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty Column to maintain symmetry -->
          <div class="hidden lg:block lg:col-span-5"></div>
        </div>`;
  } else {
    // Right Card layout
    generatedHtml += `
        
        <!-- Course Row: Course ${c.num} -->
        <div class="roadmap-row roadmap-section-wrap roadmap-stage grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:items-stretch min-h-[350px] relative z-10" data-course-num="${c.num}" data-ages="${c.ages}" data-tracks="${c.tracks}">
          <!-- Empty Column to maintain symmetry -->
          <div class="hidden lg:block lg:col-span-5"></div>
          
          <!-- Road SVG Column (Right Curve) -->
          <div class="hidden lg:flex lg:col-span-2 justify-center h-full relative min-h-[350px]">
            <div class="roadmap-svg-wrap w-full h-full">
              <svg viewBox="0 0 200 350" class="w-full h-full roadmap-svg-road" preserveAspectRatio="none" style="overflow: visible !important;">
                <defs>
                  <filter id="road-shadow-${c.num}" x="-25%" y="-25%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#475569" flood-opacity="0.12"/>
                  </filter>
                  <mask id="dash-mask-${c.num}">
                    <path d="M 100,-15 C 100,75 145,75 145,175 C 145,275 100,275 100,365" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="butt" class="road-mask-path" />
                  </mask>
                </defs>
                <!-- Underlay road path (3D shadow + border) -->
                <path d="M 100,-15 C 100,75 145,75 145,175 C 145,275 100,275 100,365" stroke="#cbd5e1" stroke-width="96" fill="none" stroke-linecap="butt" filter="url(#road-shadow-${c.num})" class="road-path" />
                <!-- Main road path -->
                <path d="M 100,-15 C 100,75 145,75 145,175 C 145,275 100,275 100,365" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="butt" class="road-path" />
                <!-- Center lane dashes -->
                <path d="M 100,-15 C 100,75 145,75 145,175 C 145,275 100,275 100,365" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="butt" mask="url(#dash-mask-${c.num})" />
                <!-- Connector Line to Card on the Right -->
                <line x1="145" y1="175" x2="248" y2="175" class="road-connector-line" data-line-num="${c.num}" />
              </svg>
            </div>
            
            <!-- Road Node container -->
            <div class="road-node-container">
              <div class="road-node" style="left: 72.5%; top: 50%;" data-course-target="${c.num}">
                C${c.num}
                <div class="road-node-preview">
                  <img src="${c.image}" alt="Preview">
                  <p>${c.previewName}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Card Column -->
          <div class="col-span-12 lg:col-span-5 lg:flex lg:items-center">
            <div class="roadmap-card-outer card-3d-tilt w-full">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">${numStr}</div>
                <img src="${c.image}" alt="${c.name} screenshot" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">${c.label}</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">${c.name}</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">${c.desc}</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="${c.linkUrl}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      ${c.linkText}
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> ${c.tools}</p>
                      <p><strong>Outcomes:</strong> ${c.outcomes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
  }
});

generatedHtml += `
      </div>\n\n      `;

// Modify the JS script block at the end to select .road-path, .road-mask-path, and .road-connector-line
let finalFooter = footer.replace(
  `document.querySelectorAll('.roadmap-svg-road path, .roadmap-svg-road line')`,
  `document.querySelectorAll('.roadmap-svg-road .road-path, .roadmap-svg-road .road-mask-path, .roadmap-svg-road .road-connector-line')`
);

finalFooter = finalFooter.replace(
  `trigger: el.closest('.roadmap-section-wrap'),`,
  `trigger: el.closest('.roadmap-row, .roadmap-phase-intro'),`
);

const finalContent = header + generatedHtml + finalFooter;
fs.writeFileSync(filepath, finalContent, 'utf8');
console.log("Successfully generated and refactored programs.html into centered timeline S-curves with masks and custom triggers!");
