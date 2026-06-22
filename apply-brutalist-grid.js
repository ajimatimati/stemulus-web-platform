const fs = require('fs');
const path = require('path');

const dir = __dirname;
const targetHtml = path.join(dir, 'programs.html');

let html = fs.readFileSync(targetHtml, 'utf-8');

// The goal: 
// 1. Change rounded-2xl / rounded-3xl / rounded-xl to sharp or minimal rounding (rounded-sm or rounded-none).
// 2. Change background colors to darker slate/IDE colors and remove heavy gradients.
// 3. Update fonts to DM Sans in strategic places.
// 4. Add subtle techy/grid borders.

// We will replace specific block strings related to the program cards injected previously.

html = html.replace(/bg-slate-900\/60 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden group border border-white\/10/g, 'bg-[#0a0a0f] rounded-none border border-white/20 hover:border-supernova-orange/50 transition-colors group relative overflow-hidden shadow-2xl');

// Remove border-radius on images and headers
html = html.replace(/<div class="h-48 relative overflow-hidden">/g, '<div class="h-48 relative overflow-hidden border-b border-white/10">');
// Change gradient overlays to flat dark tints for a more serious tone
html = html.replace(/bg-gradient-to-t from-([a-z-]+)\/80 to-\1\/20/g, 'bg-[#0a0a0f]/60');
html = html.replace(/group-hover:from-([a-z-]+)\/60/g, 'group-hover:bg-[#0a0a0f]/40');

// Typography: change titles to Monospace or keep Nunito but make them sharper. The prompt suggested monospace for data/labels.
// Let's change the "Ages X-Y" to strict monospace.
html = html.replace(/text-xs font-bold text-supernova-orange uppercase tracking-wide mb-3/g, 'text-xs font-mono font-bold text-supernova-orange tracking-widest uppercase mb-3 border border-supernova-orange/30 inline-block px-2 py-1 bg-supernova-orange/5');

// Change "Learn More" buttons to terminal-like buttons
html = html.replace(/flex items-center justify-center w-full bg-white\/5 text-white font-bold py-3 rounded-xl hover:bg-([a-z-]+) hover:text-white transition-all group-hover:shadow-lg border border-white\/10/g, 'flex items-center justify-between w-full bg-transparent text-white/70 font-mono font-bold py-3 px-4 rounded-none hover:bg-white/5 hover:text-white transition-all border border-white/20 group-hover:border-$1/50');

// Icon wrappers: from rounded-xl to square
html = html.replace(/rounded-xl shadow-md border border-white\/10/g, 'rounded-none shadow-none border border-white/20 bg-[#0a0a0f]');

// Programs Grid wrap
html = html.replace(/gap-8/g, 'gap-6');

// Sidebar filters
html = html.replace(/glass-panel p-6 rounded-2xl shadow-xl sticky top-28 backdrop-blur-md border border-white\/10 bg-slate-900\/60/g, 'p-6 rounded-none border border-white/20 bg-[#0a0a0f] sticky top-28 font-mono');
html = html.replace(/rounded border-white\/20/g, 'rounded-none border-white/30 bg-transparent');

fs.writeFileSync(targetHtml, html, 'utf-8');
console.log('Fixed programs.html brutalist theme');
