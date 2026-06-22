import os

path = r"c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\programs.html"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# normalize line endings
content = content.replace("\r\n", "\n")

# Find the start of the footer bottom div
start_marker = '<div class="footer-bottom">'
start_idx = content.find(start_marker)

# Find the end of the tabAcademic event listener
end_marker = "if (tabAcademic) tabAcademic.addEventListener('click', () => switchCategory('academic'));"
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We want to replace everything from start_marker up to end_idx + len(end_marker)
    restored_section = """<div class="footer-bottom">
  <p class="footer-legal">©2026 STEMulus Innovations LTD. All rights reserved.</p>
  <p class="footer-legal" style="display:flex;align-items:center;gap:0.5rem;">
  Built with craft, not algorithms
  <i data-lucide="heart" style="width:12px;height:12px;fill:var(--orange);color:var(--orange);display:inline-block;vertical-align:middle;margin:0 2px;"></i>
  <a href="mailto:admin@stemuluskidstech.com" aria-label="Email STEMulus" style="color:currentColor;margin-left:1rem;display:flex;align-items:center;">
  <i data-lucide="mail" style="width:18px;height:18px;"></i>
  </a>
  <a href="https://wa.me/2347052466716" aria-label="WhatsApp STEMulus" style="color:currentColor;margin-left:0.5rem;display:flex;align-items:center;">
  <i data-lucide="message-circle" style="width:18px;height:18px;"></i>
  </a>
  </p>
  </div>
</footer>
<script>
(function(){
  // Cursor FX
  var ring=document.getElementById('cursor-ring'),dot=document.getElementById('cursor-dot');if(!ring||!dot)return;var mx=0,my=0,rx=0,ry=0;document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px';});(function a(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(a);})();document.querySelectorAll('a,button').forEach(function(el){el.addEventListener('mouseenter',function(){document.body.classList.add('cursor-link');});el.addEventListener('mouseleave',function(){document.body.classList.remove('cursor-link');});});

  // Filtering Logic Engine (Desktop)
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-filter]');
  // Filtering Logic Engine (Mobile Drawer)
  const drawerCheckboxes = document.querySelectorAll('input[type="checkbox"][data-drawer-filter]');
  const drawerResultCount = document.getElementById('drawer-result-count');
  const applyDrawerBtn = document.getElementById('apply-drawer-filters');
  const clearDrawerBtn = document.getElementById('clear-drawer-filters');

  const programCards = document.querySelectorAll('.program-card');
  const noResults = document.getElementById('no-results');
  const clearBtn = document.getElementById('clear-filters');

  // Global Category Switching State & Elements
  let currentCategory = 'tech';
  const tabTech = document.getElementById('programs-tab-tech');
  const tabAcademic = document.getElementById('programs-tab-academic');

  const techFiltersGroup = document.getElementById('tech-filters-group');
  const academicFiltersGroup = document.getElementById('academic-filters-group');

  const techDrawerFiltersGroup = document.getElementById('tech-drawer-filters-group');
  const academicDrawerFiltersGroup = document.getElementById('academic-drawer-filters-group');

  function switchCategory(category) {
  currentCategory = category;

  if (category === 'tech') {
  // Update tab styles
  if (tabTech) {
  tabTech.className = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-orange shadow-sm";
  tabTech.setAttribute('aria-selected', 'true');
  }
  if (tabAcademic) {
  tabAcademic.className = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 opacity-70 hover:opacity-100";
  tabAcademic.setAttribute('aria-selected', 'false');
  }

  // Toggle filter groups
  if (techFiltersGroup) techFiltersGroup.classList.remove('hidden');
  if (academicFiltersGroup) academicFiltersGroup.classList.add('hidden');
  if (techDrawerFiltersGroup) techDrawerFiltersGroup.classList.remove('hidden');
  if (academicDrawerFiltersGroup) academicDrawerFiltersGroup.classList.add('hidden');
  } else {
  // Update tab styles
  if (tabAcademic) {
  tabAcademic.className = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-orange shadow-sm";
  tabAcademic.setAttribute('aria-selected', 'true');
  }
  if (tabTech) {
  tabTech.className = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 opacity-70 hover:opacity-100";
  tabTech.setAttribute('aria-selected', 'false');
  }

  // Toggle filter groups
  if (techFiltersGroup) techFiltersGroup.classList.add('hidden');
  if (academicFiltersGroup) academicFiltersGroup.classList.remove('hidden');
  if (techDrawerFiltersGroup) techDrawerFiltersGroup.classList.add('hidden');
  if (academicDrawerFiltersGroup) academicDrawerFiltersGroup.classList.remove('hidden');
  }

  // Uncheck all filters to prevent mixed state
  checkboxes.forEach(cb => cb.checked = false);
  drawerCheckboxes.forEach(cb => cb.checked = false);

  // Apply filters
  applyFilters();
  updateDrawerCount();
  }

  if (tabTech) tabTech.addEventListener('click', () => switchCategory('tech'));
  if (tabAcademic) tabAcademic.addEventListener('click', () => switchCategory('academic'));"""

    patched_content = content[:start_idx] + restored_section + content[end_idx + len(end_marker):]
    with open(path, "w", encoding="utf-8") as f:
        f.write(patched_content)
    print("Success! Patched programs.html using robust index method.")
else:
    print(f"Indices not found. start_idx={start_idx}, end_idx={end_idx}")
