const fs = require('fs');
const filepath = "c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus/programs.html";

if (!fs.existsSync(filepath)) {
  console.error("Error: file does not exist: " + filepath);
  process.exit(1);
}

let content = fs.readFileSync(filepath, 'utf8');

const startMarker = "<!-- ═══════════════════════════════════════════ ROADMAP TIMELINE & FILTERS ══ -->";
const endMarker = "<!-- ═══════════════════════════════════════════ PRICING & FAQ ══ -->";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Error: Start or End markers not found in HTML!");
  process.exit(1);
}

const newHtml = `<!-- ═══════════════════════════════════════════ ROADMAP TIMELINE & FILTERS ══ -->
  <section class="roadmap-light-mode py-32" id="cs-roadmap-section">
    <div class="max-w-7xl mx-auto px-6">
      
      <!-- Filters Container -->
      <div class="mb-24 text-center relative z-10">
        <span class="inline-block bg-slate-100 text-slate-600 text-[10px] tracking-[0.2em] font-bold uppercase px-4 py-1.5 rounded-full border border-slate-200 mb-5">Path Finder</span>
        <h2 class="text-4xl font-black text-slate-800 font-outfit tracking-tight mb-5">Chart Your Technology Journey</h2>
        <p class="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">Select your child's age or track preference to project their custom pathway from first touch to systems operator.</p>
        
        <div class="flex flex-wrap justify-center gap-6 mt-8">
          <!-- Age filter pills -->
          <div class="bg-slate-100/80 p-1 rounded-2xl border border-slate-200 inline-flex flex-wrap gap-1">
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-800 shadow-md" data-filter-type="age" data-value="all">All Ages</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="age" data-value="5-9">Ages 5 - 9</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="age" data-value="10-13">Ages 10 - 13</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="age" data-value="14-17">Ages 14 - 17</button>
          </div>

          <!-- Track filter pills -->
          <div class="bg-slate-100/80 p-1 rounded-2xl border border-slate-200 inline-flex flex-wrap gap-1">
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-800 shadow-md" data-filter-type="track" data-value="all">All Tracks</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="track" data-value="software">Software Dev</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="track" data-value="robotics">Robotics &amp; Hardware</button>
            <button class="roadmap-filter-btn px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 hover:text-slate-800 opacity-85" data-filter-type="track" data-value="academic">Academic Tutoring</button>
          </div>
        </div>
      </div>

      <!-- Timeline Road Content Wrapper -->
      <div class="space-y-16">
        
        <!-- Q1 (Foundations Phase) -->
        <div class="roadmap-section-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-5 space-y-6">
            <div class="mb-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase 1</span>
              <h3 class="text-3xl font-black text-slate-800 font-outfit">Q1 · Digital Foundations</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">Getting started with interaction, keyboard posture, and visual game development logic.</p>
            </div>
            
            <!-- Course 1 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="1" data-ages="5-9" data-tracks="software,robotics">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">01</div>
                <img src="assets/images/paint_messy_child.jpg" alt="Pre-Coding Literacy screenshot" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 1 · Ages 5-7</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Pre-Coding Literacy</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Master mouse clicks, coordinate drag-and-drop navigation, and basic folder directory file structures.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="enroll.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      Book Assessment
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Keyboard Trainer, paint tools, browser directories, OS files.</p>
                      <p><strong>Outcomes:</strong> Coordinates navigation, posture, saving files correctly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 2 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="2" data-ages="5-9" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">02</div>
                <img src="assets/images/mom_son_laptop.jpg" alt="Typing and safety basics" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 2 · Ages 5-7</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Keyboard Basics &amp; Safety</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Develop touch-typing accuracy. Learn safe internet browsing rules, posture coordinates, and healthy screen habits.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="enroll.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      Book Assessment
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Typing tools, Chrome secure navigation systems.</p>
                      <p><strong>Outcomes:</strong> Typing speed > 15 WPM with correct hand positions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 3 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="3" data-ages="5-9" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">03</div>
                <img src="assets/images/scratch_game_creators.png" alt="Scratch Game Creators screenshot" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 3 · Ages 7-10</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Scratch Game Creators</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Command visual coding block assembly. Program sequential loops, conditionals, parameters, variables, and events.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="scratch-creators.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Scratch blocks canvas, Scratch sprite editor, coordinates grids.</p>
                      <p><strong>Outcomes:</strong> Build multi-level games. Understand loops, variables, and condition logic.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <!-- Road SVG (Curve Right) -->
          <div class="lg:col-span-7 relative h-[700px] w-full flex items-center justify-center">
            <div class="roadmap-svg-wrap">
              <svg viewBox="0 0 1000 700" class="w-full h-full roadmap-svg-road">
                <!-- Underlay road path (border lines) -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#d1d5db" stroke-width="96" fill="none" stroke-linecap="round" />
                <!-- Main road path -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="round" />
                <!-- Center lane dashes -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            
            <!-- 3D Porcelain Nodes on Road -->
            <div class="road-node-container">
              <div class="road-node" style="left: 62%; top: 25%;" data-course-target="1">
                C1
                <span class="road-node-label">Pre-Coding</span>
              </div>
              <div class="road-node" style="left: 85%; top: 50%;" data-course-target="2">
                C2
                <span class="road-node-label">Typing</span>
              </div>
              <div class="road-node" style="left: 62%; top: 75%;" data-course-target="3">
                C3
                <span class="road-node-label">Scratch</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Q2 (Logic & Creative Phase) -->
        <div class="roadmap-section-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Road SVG (Curve Left) -->
          <div class="lg:col-span-7 relative h-[700px] w-full flex items-center justify-center order-2 lg:order-1">
            <div class="roadmap-svg-wrap">
              <svg viewBox="0 0 1000 700" class="w-full h-full roadmap-svg-road">
                <!-- Underlay road path (border lines) -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#d1d5db" stroke-width="96" fill="none" stroke-linecap="round" />
                <!-- Main road path -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="round" />
                <!-- Center lane dashes -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            
            <!-- 3D Porcelain Nodes on Road -->
            <div class="road-node-container">
              <div class="road-node" style="left: 38%; top: 25%;" data-course-target="4">
                C4
                <span class="road-node-label">Robotics</span>
              </div>
              <div class="road-node" style="left: 15%; top: 50%;" data-course-target="5">
                C5
                <span class="road-node-label">Creative JS</span>
              </div>
              <div class="road-node" style="left: 38%; top: 75%;" data-course-target="6">
                C6
                <span class="road-node-label">Figma</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-6 order-1 lg:order-2">
            <div class="mb-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase 2</span>
              <h3 class="text-3xl font-black text-slate-800 font-outfit">Q2 · Logic &amp; Creative</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">Bridges the gap between virtual visual blocks, graphics vectors, and hardware movement command.</p>
            </div>
            
            <!-- Course 4 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="4" data-ages="5-9,10-13" data-tracks="robotics">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">04</div>
                <img src="assets/images/junior_robotics_playful.png" alt="Junior robotics project screenshot" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 4 · Ages 8-12</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Junior Robotics</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Connect coding scripts to mechanical hardware. Integrate motors, triggers, gears, and sensors to power automated bots.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="junior-robotics.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> LEGO Boost hardware hubs, Scratch connection engines, sensor registers.</p>
                      <p><strong>Outcomes:</strong> Map inputs to outputs. Program motor direction, angle loops, and obstacle triggers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 5 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="5" data-ages="10-13" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">05</div>
                <img src="assets/images/space_raiders_game.png" alt="Creative coding Javascript visual" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 5 · Ages 9-12</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Creative Coding</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Blend coding blocks with mathematics, geometry, and design coordinates. Render custom vector shapes and games on HTML Canvas.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="creative-coding.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> HTML Canvas context API, JavaScript variables, vector loops.</p>
                      <p><strong>Outcomes:</strong> Draw coordinates mathematically, create animated sprites and vector shapes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 6 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="6" data-ages="10-13" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">06</div>
                <img src="assets/images/anansi_story_scratch.png" alt="Digital art and design graphics" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 6 · Ages 9-13</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Digital Art &amp; Design</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Learn digital layouts, vectors, and color design systems in Figma. Export custom assets for frontend games and page UI structures.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="digital-art.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Figma vector tool, asset layout systems, colors grids, wireframe components.</p>
                      <p><strong>Outcomes:</strong> Build complete game assets libraries, layout UI web headers, and wireframe pages.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Q3 (Syntax & Electronics Phase) -->
        <div class="roadmap-section-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-5 space-y-6">
            <div class="mb-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase 3</span>
              <h3 class="text-3xl font-black text-slate-800 font-outfit">Q3 · Syntax &amp; Hardware</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">Transition into text-based syntactic code structure and wire physical electronics circuits.</p>
            </div>
            
            <!-- Course 7 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="7" data-ages="10-13,14-17" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">07</div>
                <img src="assets/images/python_game_dev.png" alt="Python game development terminal" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 7 · Ages 10-16</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Python Programming</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Ditch visual blocks for text syntax. Code Python variables, conditional scopes, functions, data lists, and loops.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="python-programming.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> VS Code console terminal, Python Interpreter, basic syntax debug tools.</p>
                      <p><strong>Outcomes:</strong> Build arithmetic utilities, text RPG terminal games, and write loops scripts.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 8 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="8" data-ages="10-13,14-17" data-tracks="robotics">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">08</div>
                <img src="assets/images/arduino_robotics_lab.png" alt="Arduino electronics setup" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 8 · Ages 11-15</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Robotics Lab (Arduino)</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Wire physical circuits. Program Arduino C++ loops to read distance sensors, coordinate breadboards, and output signals.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="arduino-robotics.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Arduino IDE, breadboards, resistors, light sensors, registers indicators, servos.</p>
                      <p><strong>Outcomes:</strong> Wire circuits, execute analog signal logic loops, configure physical outputs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 9 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="9" data-ages="10-13,14-17" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">09</div>
                <img src="assets/images/weather_app_ui.png" alt="Frontend web app interfaces" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 9 · Ages 11-15</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Web Wizards (Frontend)</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Structure semantic HTML5 markup. Style pages with CSS Flex/Grid properties, and program DOM logic in JavaScript ES6.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="web-wizards.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> HTML5 tags, CSS margin grids, JS DOM elements selectors, Netlify hosting.</p>
                      <p><strong>Outcomes:</strong> Build responsive layouts, wire interactive calculators, and host static webpages.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <!-- Road SVG (Curve Right) -->
          <div class="lg:col-span-7 relative h-[700px] w-full flex items-center justify-center">
            <div class="roadmap-svg-wrap">
              <svg viewBox="0 0 1000 700" class="w-full h-full roadmap-svg-road">
                <!-- Underlay road path (border lines) -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#d1d5db" stroke-width="96" fill="none" stroke-linecap="round" />
                <!-- Main road path -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="round" />
                <!-- Center lane dashes -->
                <path d="M 500,0 C 500,180 850,180 850,350 C 850,520 500,520 500,700" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            
            <!-- 3D Porcelain Nodes on Road -->
            <div class="road-node-container">
              <div class="road-node" style="left: 62%; top: 25%;" data-course-target="7">
                C7
                <span class="road-node-label">Python</span>
              </div>
              <div class="road-node" style="left: 85%; top: 50%;" data-course-target="8">
                C8
                <span class="road-node-label">Arduino Lab</span>
              </div>
              <div class="road-node" style="left: 62%; top: 75%;" data-course-target="9">
                C9
                <span class="road-node-label">Web Dev</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Q4 (Full-Stack & Systems Phase) -->
        <div class="roadmap-section-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Road SVG (Curve Left) -->
          <div class="lg:col-span-7 relative h-[700px] w-full flex items-center justify-center order-2 lg:order-1">
            <div class="roadmap-svg-wrap">
              <svg viewBox="0 0 1000 700" class="w-full h-full roadmap-svg-road">
                <!-- Underlay road path (border lines) -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#d1d5db" stroke-width="96" fill="none" stroke-linecap="round" />
                <!-- Main road path -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#475569" stroke-width="84" fill="none" stroke-linecap="round" />
                <!-- Center lane dashes -->
                <path d="M 500,0 C 500,180 150,180 150,350 C 150,520 500,520 500,700" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            
            <!-- 3D Porcelain Nodes on Road -->
            <div class="road-node-container">
              <div class="road-node" style="left: 38%; top: 25%;" data-course-target="10">
                C10
                <span class="road-node-label">Full-Stack</span>
              </div>
              <div class="road-node" style="left: 15%; top: 50%;" data-course-target="11">
                C11
                <span class="road-node-label">Machine Learning</span>
              </div>
              <div class="road-node" style="left: 38%; top: 75%;" data-course-target="12">
                C12
                <span class="road-node-label">Systems Linux</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-6 order-1 lg:order-2">
            <div class="mb-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase 4</span>
              <h3 class="text-3xl font-black text-slate-800 font-outfit">Q4 · Advanced &amp; Systems</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">Operate at system core. Build deployable database endpoints, train models, and manage shell environments.</p>
            </div>
            
            <!-- Course 10 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="10" data-ages="14-17" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">10</div>
                <img src="assets/images/fullstack_restaurant_analogy.jpg" alt="Backend server database charts" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 10 · Ages 14-18</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Full-Stack Web Architectures</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Master backend REST APIs with Node.js &amp; Express. Setup relational schemas, queries, and store data securely in database Tables.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="fullstack-web-dev.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Node.js express APIs, Git terminal branches, MongoDB databases configurations, Render hosting.</p>
                      <p><strong>Outcomes:</strong> Write backend API routes, query database documents securely, manage Git branches.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 11 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="11" data-ages="14-17" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">11</div>
                <img src="assets/images/ai_machine_learning.png" alt="AI and Machine learning neural nets representation" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 11 · Ages 13-17</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">AI &amp; Machine Learning</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Clean dataset tables using Pandas. Train neural networks classifiers, run computer vision parameters, and build evaluation scripts.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="ai-machine-learning.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      View Program
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Jupyter Notebooks, Pandas data frames, TensorFlow / Keras modules, scikit-learn.</p>
                      <p><strong>Outcomes:</strong> Process CSV data files, plot accuracy margins, train neural classifiers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course 12 -->
            <div class="roadmap-card-outer card-3d-tilt roadmap-stage" data-course-num="12" data-ages="14-17" data-tracks="software">
              <div class="roadmap-card-inner">
                <div class="roadmap-card-bg-num">12</div>
                <img src="assets/images/stemulus_mastery_kids.png" alt="Systems mastery and Linux terminal" class="roadmap-card-img">
                <div class="roadmap-card-content">
                  <span class="inline-block bg-slate-100 text-slate-600 text-[9px] tracking-[0.15em] font-semibold uppercase px-2.5 py-1 rounded mb-3">Course 12 · Ages 14-17+</span>
                  <h4 class="text-lg font-black text-slate-800 font-outfit mb-1">Systems &amp; Shell Scripting</h4>
                  <p class="text-xs text-slate-500 leading-relaxed mb-4">Interfacing directly with OS kernel. Program Bash shell variables, pipeline command scripts, and configure automation tasks.</p>
                  
                  <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button class="text-[10px] text-slate-600 font-bold uppercase tracking-wider roadmap-drawer-trigger flex items-center gap-1.5 group">
                      Explore Syllabus
                      <span class="roadmap-button-trail">
                        <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-300"></i>
                      </span>
                    </button>
                    <a href="enroll.html" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 group hover:text-slate-800 transition-colors">
                      Book Assessment
                      <span class="roadmap-button-trail">
                        <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                      </span>
                    </a>
                  </div>
                  <div class="roadmap-drawer">
                    <div class="space-y-3 text-xs text-slate-500 pt-3">
                      <p><strong>Tools Mastered:</strong> Linux Terminal (Bash), SSH utilities, custom cron jobs, system pipelines.</p>
                      <p><strong>Outcomes:</strong> Automate server directories backups, pipe shell scripts logs, configure user permissions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Academic Tutoring Section (Targeted separate section) -->
      <div class="mt-40 pt-32 border-t border-slate-200" id="academic-tutoring-section" style="transition: opacity 0.7s ease;">
        <div class="text-center mb-20">
          <span class="inline-block bg-slate-100 text-slate-600 text-[10px] tracking-[0.2em] font-bold uppercase px-3 py-1 rounded-full border border-slate-200 mb-4">Academic Division</span>
          <h2 class="text-4xl font-black text-slate-800 font-outfit tracking-tight mb-4">1-on-1 Academic Tutoring</h2>
          <p class="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">Targeted study tracks led by top-grade academic mentors. Fully customized to the student's syllabus, school curriculum, and GCSE exam preparations.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          <!-- Mathematics Card -->
          <div class="roadmap-card-outer card-3d-tilt group" data-category="academic">
            <div class="roadmap-card-inner flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-center mb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Mathematics</span>
                  <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">Ages 7-16</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 font-outfit mb-3 group-hover:text-slate-900 transition-colors">Mathematics Mastery</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                  Arithmetic, algebra, geometry, and statistics. Structured progressively from foundations up to advanced calculus and GCSE prep.
                </p>
              </div>
              <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">Custom Syllabus</span>
                <a href="enroll.html" class="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2 group hover:text-slate-900 transition-colors">
                  Enroll Now
                  <span class="roadmap-button-trail">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <!-- Science Card -->
          <div class="roadmap-card-outer card-3d-tilt group" data-category="academic">
            <div class="roadmap-card-inner flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-center mb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Science</span>
                  <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">Ages 7-14</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 font-outfit mb-3 group-hover:text-slate-900 transition-colors">Science Explorers</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                  Biology, Chemistry, and Physics. Build scientific vocabulary and conceptual understanding through interactive modules and core experiments.
                </p>
              </div>
              <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">Custom Syllabus</span>
                <a href="enroll.html" class="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2 group hover:text-slate-900 transition-colors">
                  Enroll Now
                  <span class="roadmap-button-trail">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <!-- Triple Science Card -->
          <div class="roadmap-card-outer card-3d-tilt group" data-category="academic">
            <div class="roadmap-card-inner flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-center mb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Science</span>
                  <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">Ages 14-16</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 font-outfit mb-3 group-hover:text-slate-900 transition-colors">Triple Science (GCSE)</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                  Comprehensive separate Biology, Chemistry, and Physics. Core focus on GCSE exam papers, practical marks, and mark scheme walkthroughs.
                </p>
              </div>
              <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">GCSE Prep</span>
                <a href="enroll.html" class="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2 group hover:text-slate-900 transition-colors">
                  Enroll Now
                  <span class="roadmap-button-trail">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <!-- English Language Card -->
          <div class="roadmap-card-outer card-3d-tilt group" data-category="academic">
            <div class="roadmap-card-inner flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-center mb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">English</span>
                  <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">Ages 7-16</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 font-outfit mb-3 group-hover:text-slate-900 transition-colors">English Language</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                  Reading comprehension, creative writing, syntax rules, grammar mastery, and literature reviews. Focus on logical fluency and expression.
                </p>
              </div>
              <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">Custom Syllabus</span>
                <a href="enroll.html" class="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2 group hover:text-slate-900 transition-colors">
                  Enroll Now
                  <span class="roadmap-button-trail">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <!-- GCSE Past Papers Card -->
          <div class="roadmap-card-outer card-3d-tilt group" data-category="academic">
            <div class="roadmap-card-inner flex flex-col justify-between h-full">
              <div>
                <div class="flex justify-between items-center mb-4">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Exam Prep</span>
                  <span class="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">Ages 14-16</span>
                </div>
                <h3 class="text-xl font-extrabold text-slate-800 font-outfit mb-3 group-hover:text-slate-900 transition-colors">GCSE Past Papers Prep</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-6">
                  Direct practice under timed settings. Walkthrough markings schemes, identify key error trends, and refine answers for max points.
                </p>
              </div>
              <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">Exam Practice</span>
                <a href="enroll.html" class="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2 group hover:text-slate-900 transition-colors">
                  Enroll Now
                  <span class="roadmap-button-trail">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

const updatedContent = content.slice(0, startIdx) + newHtml + content.slice(endIdx);
fs.writeFileSync(filepath, updatedContent, 'utf8');
console.log("Successfully overhauled programs.html into light-mode winding 3D road timeline!");
