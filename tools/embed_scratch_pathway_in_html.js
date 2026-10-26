const fs = require('fs');

const pathway = JSON.parse(fs.readFileSync('data/scratch_curriculum_pathway.json', 'utf8'));

let html = fs.readFileSync('scratch-creators.html', 'utf8');

// Align pricing from $50 to official Nigerian ₦48k / International £80 parallel anchor
const oldPricing = `<p class="text-5xl font-black text-slate-900 font-outfit my-4">$50<span class="text-lg font-semibold text-slate-600">/month</span></p>`;
const newPricing = `<div class="my-4">
        <p class="text-4xl md:text-5xl font-black text-slate-900 font-outfit">₦48,000<span class="text-lg font-semibold text-slate-600">/month</span></p>
        <p class="text-xs font-bold uppercase tracking-wider text-indigo-600 mt-1">International Admissions: £80 parallel monthly anchor</p>
      </div>`;

if (html.includes(oldPricing)) {
    html = html.replace(oldPricing, newPricing);
}

// Generate the 36-project showcase HTML
const showcaseHtml = `
  <!-- 36-PROJECT CURATED SCRATCH MASTERY SHOWCASE -->
  <section id="scratch-36-projects" class="py-24 bg-white border-t border-slate-200/80" data-reveal>
    <div class="max-w-6xl mx-auto px-6">
      
      <div class="text-center max-w-3xl mx-auto mb-14">
        <div class="inline-flex items-center gap-2 badge-stem badge-stem-accent mb-4">
          <i data-stem-icon="scratch" data-size="14"></i>
          <span>Curated 36-Project Progressive Pathway</span>
        </div>
        <h2 class="text-3xl md:text-5xl font-black font-outfit text-slate-900 tracking-tight leading-tight">
          36 Projects. 8 Mastery Levels.<br>
          <span class="text-[#F4600C]">100% Native Scratch Assets.</span>
        </h2>
        <p class="text-slate-600 text-sm md:text-base mt-4 leading-relaxed">
          From first-touch cause-and-effect to authentic Mario-style platformers and 3D Subway Surfers arcade runners. Every project uses built-in Scratch library assets for zero file clutter, zero broken links, and 100% kid-friendly creative joy.
        </p>

        <!-- Studio Verification Badge Strip -->
        <div class="mt-6 inline-flex flex-wrap items-center justify-center gap-3 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-700 font-medium">
          <span class="inline-flex items-center gap-1.5 font-bold text-slate-900">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Official Educator Account:
          </span>
          <span class="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-indigo-700 font-bold">@STEMulusKids-Tech</span>
          <span class="text-slate-300">|</span>
          <span class="inline-flex items-center gap-1.5 font-bold text-slate-900">Live Studio:</span>
          <span class="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">Showcase Studio (ID: 52032160)</span>
        </div>
      </div>

      <!-- Level Filter Navigation -->
      <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none justify-start lg:justify-center">
        ${pathway.levels.map((lvl, i) => `
          <button type="button" class="scratch-lvl-btn px-4 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all shrink-0 ${i === 0 ? 'bg-[#0B1120] text-white border-[#0B1120] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}" data-level="${lvl.level}">
            L${lvl.level}: ${lvl.name.split(':')[0]}
          </button>
        `).join('')}
      </div>

      <!-- Level Content Containers -->
      <div id="scratch-levels-container">
        ${pathway.levels.map((lvl, i) => `
          <div class="scratch-level-pane ${i === 0 ? '' : 'hidden'}" id="pane-level-${lvl.level}">
            <div class="bg-gradient-to-r from-slate-900 to-[#1e1b4b] rounded-2xl p-6 md:p-8 text-white mb-8 shadow-xl">
              <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">Level ${lvl.level} of 8</span>
                <span class="text-xs text-slate-300 font-mono">${lvl.complexity}</span>
              </div>
              <h3 class="text-2xl md:text-3xl font-black font-outfit mb-2">${lvl.name}</h3>
              <p class="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">${lvl.description}</p>
              <div class="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <i data-stem-icon="target" data-size="14" class="text-amber-400"></i>
                <span>Target Learners: ${lvl.target}</span>
              </div>
            </div>

            <!-- Projects Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              ${lvl.projects.map(proj => `
                <div class="stem-card p-6 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
                      <span class="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">Step ${proj.step} · ${proj.code}</span>
                      <span class="text-[#F4600C] font-semibold">Native Library</span>
                    </div>
                    <h4 class="text-xl font-bold font-outfit text-slate-900 mb-2">${proj.title}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4">${proj.outcome}</p>
                    
                    <div class="space-y-2 mb-4">
                      <div class="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span class="font-bold text-slate-700">Assets:</span>
                        <span class="text-slate-600 font-mono ml-1">${proj.assets}</span>
                      </div>
                      <div class="text-[11px] bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                        <span class="font-bold text-indigo-900">Key Blocks:</span>
                        <code class="text-indigo-700 font-mono block mt-1">${proj.blocks}</code>
                      </div>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">✓ Playable Capstone</span>
                    <a href="book-class.html" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors">
                      Build This in Free Class →
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  </section>

  <!-- Interactive script for Level Tabs -->
  <script>
  (function() {
    document.addEventListener('DOMContentLoaded', function() {
      const btns = document.querySelectorAll('.scratch-lvl-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', function() {
          const lvl = this.getAttribute('data-level');
          btns.forEach(b => {
            b.className = 'scratch-lvl-btn px-4 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all shrink-0 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
          });
          this.className = 'scratch-lvl-btn px-4 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all shrink-0 bg-[#0B1120] text-white border-[#0B1120] shadow-md';
          
          document.querySelectorAll('.scratch-level-pane').forEach(p => p.classList.add('hidden'));
          const target = document.getElementById('pane-level-' + lvl);
          if (target) target.classList.remove('hidden');
        });
      });
    });
  })();
  </script>
`;

// Insert the showcase right before the pricing section
const marker = '<!-- TUITION & MENTORSHIP INCLUSIONS -->';
if (html.includes(marker)) {
    html = html.replace(marker, showcaseHtml + '\n  ' + marker);
    fs.writeFileSync('scratch-creators.html', html, 'utf8');
    console.log('Successfully embedded 36-project showcase into scratch-creators.html!');
} else {
    console.error('Marker not found in scratch-creators.html');
    process.exit(1);
}
