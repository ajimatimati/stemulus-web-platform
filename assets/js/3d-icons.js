/**
 * STEMulus Kids Tech: 3D SVG Motion System & Vector Registry
 * Ultra-high-fidelity isometric, gradient-depth 3D SVGs with micro-motion.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Stemulus3DIcons = factory();
  }
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';

  // SVG Definitions & Linear/Radial Gradients
  const SVG_DEFS = `
    <defs>
      <!-- Gold Gradient -->
      <linearGradient id="gradGold3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFE57F"/>
        <stop offset="45%" stop-color="#FFC107"/>
        <stop offset="85%" stop-color="#FF8F00"/>
        <stop offset="100%" stop-color="#E65100"/>
      </linearGradient>
      <!-- STEMulus Orange Gradient -->
      <linearGradient id="gradOrange3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF9E80"/>
        <stop offset="40%" stop-color="#F4600C"/>
        <stop offset="100%" stop-color="#BF360C"/>
      </linearGradient>
      <!-- Deep Blue / Navy Gradient -->
      <linearGradient id="gradNavy3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5C6BC0"/>
        <stop offset="50%" stop-color="#1A237E"/>
        <stop offset="100%" stop-color="#0D1338"/>
      </linearGradient>
      <!-- Emerald Green Gradient -->
      <linearGradient id="gradEmerald3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6EE7B7"/>
        <stop offset="45%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
      <!-- Ruby Red Gradient -->
      <linearGradient id="gradRuby3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCA5A5"/>
        <stop offset="45%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#B91C1C"/>
      </linearGradient>
      <!-- Cyan / Azure Gradient -->
      <linearGradient id="gradCyan3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#67E8F9"/>
        <stop offset="45%" stop-color="#06B6D4"/>
        <stop offset="100%" stop-color="#0E7490"/>
      </linearGradient>
      <!-- Purple / Violet Gradient -->
      <linearGradient id="gradPurple3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C084FC"/>
        <stop offset="50%" stop-color="#8B5CF6"/>
        <stop offset="100%" stop-color="#5B21B6"/>
      </linearGradient>
      <!-- Titanium Steel Gradient -->
      <linearGradient id="gradSteel3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="35%" stop-color="#E2E8F0"/>
        <stop offset="70%" stop-color="#94A3B8"/>
        <stop offset="100%" stop-color="#475569"/>
      </linearGradient>
      <!-- Specular Highlight Glass -->
      <linearGradient id="gradGlass3D" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
        <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
      <!-- Flame Core Radial -->
      <radialGradient id="gradFlameCore" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#FFF9C4"/>
        <stop offset="40%" stop-color="#FF9800"/>
        <stop offset="100%" stop-color="#E65100"/>
      </radialGradient>
      <!-- Shadow Filter -->
      <filter id="shadow3D" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.2"/>
      </filter>
    </defs>
  `;

  // 3D Vector Geometries (ViewBox 0 0 64 64)
  const ICON_TEMPLATES = {
    // 1. 3D Aerospace Rocket
    'rocket': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Flame Exhaust with Animation -->
        <g class="anim-flame">
          <path d="M28 48L32 62L36 48Z" fill="url(#gradOrange3D)"/>
          <path d="M30 48L32 58L34 48Z" fill="url(#gradFlameCore)"/>
        </g>
        <!-- Left Fin -->
        <path d="M22 36L12 48L24 45L25 38Z" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <!-- Right Fin -->
        <path d="M42 36L52 48L40 45L39 38Z" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <!-- Main Fuselage 3D Extrusion -->
        <path d="M32 6C23 16 23 38 25 46H39C41 38 41 16 32 6Z" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <!-- Specular Highlight Layer -->
        <path d="M32 6C26 16 26 38 27 46H32V6Z" fill="url(#gradGlass3D)"/>
        <!-- Nose Cone Accent -->
        <path d="M32 6C27 14 27 20 32 20C37 20 37 14 32 6Z" fill="url(#gradOrange3D)"/>
        <!-- Glass Porthole Window with Bezel -->
        <circle cx="32" cy="26" r="6.5" fill="url(#gradNavy3D)" stroke="#CBD5E1" stroke-width="1.5"/>
        <circle cx="32" cy="26" r="4.5" fill="url(#gradCyan3D)"/>
        <ellipse cx="30.5" cy="24.5" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.85"/>
        <!-- Base Ring -->
        <rect x="25" y="44" width="14" height="3" rx="1.5" fill="#334155"/>
      </svg>
    `,

    // 2. 3D Archery Target / Bullseye
    'target': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Stand Shadow -->
        <ellipse cx="32" cy="58" rx="22" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Outer Base Ring (3D Extrusion) -->
        <ellipse cx="32" cy="34" rx="26" ry="24" fill="#334155"/>
        <ellipse cx="32" cy="31" rx="26" ry="24" fill="url(#gradRuby3D)" filter="url(#shadow3D)"/>
        <!-- Ring 2 (White) -->
        <ellipse cx="32" cy="31" rx="20" ry="18.5" fill="#F8FAFC"/>
        <!-- Ring 3 (Ruby) -->
        <ellipse cx="32" cy="31" rx="14" ry="13" fill="url(#gradRuby3D)"/>
        <!-- Ring 4 (Gold Center) -->
        <ellipse cx="32" cy="31" rx="8" ry="7.5" fill="url(#gradGold3D)"/>
        <ellipse cx="32" cy="31" rx="3.5" ry="3.2" fill="#FFF9C4"/>
        <!-- High-contrast Arrow Embedded -->
        <path d="M46 14L34 29L33 30L36 33L48 18Z" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <path d="M46 14L54 8L50 16L56 12L46 14Z" fill="url(#gradOrange3D)"/>
      </svg>
    `,

    // 3. 3D Faceted Gold Star
    'star': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Star Base Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Faceted 3D Star Polygons -->
        <g filter="url(#shadow3D)">
          <!-- Top facet left -->
          <polygon points="32,6 32,32 20,24" fill="#FFC107"/>
          <!-- Top facet right -->
          <polygon points="32,6 44,24 32,32" fill="#FFE57F"/>
          <!-- Right arm top -->
          <polygon points="58,24 32,32 44,24" fill="#FFB300"/>
          <!-- Right arm bottom -->
          <polygon points="58,24 44,38 32,32" fill="#FFA000"/>
          <!-- Bottom right leg -->
          <polygon points="48,56 32,32 44,38" fill="#FF8F00"/>
          <polygon points="48,56 32,44 32,32" fill="#E65100"/>
          <!-- Bottom left leg -->
          <polygon points="16,56 32,44 32,32" fill="#FF8F00"/>
          <polygon points="16,56 20,38 32,32" fill="#FFA000"/>
          <!-- Left arm bottom -->
          <polygon points="6,24 32,32 20,38" fill="#FFB300"/>
          <!-- Left arm top -->
          <polygon points="6,24 20,24 32,32" fill="#FFC107"/>
        </g>
        <!-- Center Sparkle Glint -->
        <circle cx="32" cy="32" r="3" fill="#FFFFFF" opacity="0.9"/>
      </svg>
    `,

    // 4. 3D Diamond / Sparkle
    'sparkle': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Ambient Glow -->
        <circle cx="32" cy="32" r="16" fill="url(#gradGold3D)" opacity="0.25" filter="blur(6px)"/>
        <!-- 4-Point Specular Star -->
        <path d="M32 6C32 20 20 32 6 32C20 32 32 44 32 58C32 44 44 32 58 32C44 32 32 20 32 6Z" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <path d="M32 12C32 22 24 32 14 32C24 32 32 42 32 52C32 42 40 32 50 32C40 32 32 22 32 12Z" fill="#FFF9C4"/>
        <circle cx="32" cy="32" r="4" fill="#FFFFFF"/>
        <!-- Tiny Secondary Sparkle -->
        <circle cx="48" cy="14" r="2.5" fill="#FFE082"/>
        <circle cx="16" cy="46" r="2" fill="#FFE082"/>
      </svg>
    `,

    // 5. 3D Graduation Cap / Mortarboard
    'graduation-cap': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Base Shadow -->
        <ellipse cx="32" cy="56" rx="20" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Skull Cap Base -->
        <path d="M22 33V42C22 47 32 50 42 47V33C38 35 34 36 32 36C30 36 26 35 22 33Z" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <path d="M22 33V39C24 43 32 46 42 43V33" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <!-- Isometric Diamond Top Plate (3D Slab) -->
        <polygon points="32,14 58,26 32,38 6,26" fill="#111827"/>
        <polygon points="32,12 58,24 32,36 6,24" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <!-- Top Plate Specular Facet -->
        <polygon points="32,12 6,24 32,36 32,24" fill="url(#gradGlass3D)"/>
        <!-- Center Button Pin -->
        <ellipse cx="32" cy="24" rx="3.5" ry="2.5" fill="url(#gradGold3D)"/>
        <!-- Dangling Gold Tassel with Sway Animation -->
        <g class="anim-tassel">
          <path d="M32 24Q38 27 46 32T48 44" stroke="url(#gradGold3D)" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M46 42L49 43L50 52L46 51Z" fill="url(#gradGold3D)"/>
          <circle cx="48" cy="43" r="2.5" fill="#FFE57F"/>
        </g>
      </svg>
    `,

    // 6. 3D Golden Trophy Cup
    'trophy': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Base Plinth -->
        <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#0F172A" opacity="0.25"/>
        <rect x="22" y="50" width="20" height="7" rx="2" fill="#1E293B"/>
        <rect x="24" y="48" width="16" height="4" rx="1.5" fill="url(#gradGold3D)"/>
        <!-- Stem -->
        <path d="M28 38H36V48H28Z" fill="url(#gradGold3D)"/>
        <!-- Handles -->
        <path d="M16 18C12 18 10 26 16 32C19 35 24 36 24 36" stroke="url(#gradGold3D)" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M48 18C52 18 54 26 48 32C45 35 40 36 40 36" stroke="url(#gradGold3D)" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Cup Bowl -->
        <path d="M20 12H44V26C44 34 38 39 32 39C26 39 20 34 20 26V12Z" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <!-- Specular Sheen -->
        <path d="M20 12H32V39C26 39 20 34 20 26V12Z" fill="url(#gradGlass3D)"/>
        <!-- Rim -->
        <ellipse cx="32" cy="12" rx="12" ry="3.5" fill="#FFF9C4"/>
        <ellipse cx="32" cy="12" rx="10" ry="2.5" fill="#FF8F00"/>
        <!-- Star Insignia on Cup -->
        <path d="M32 20L33.5 24.5H38L34.5 27L36 31.5L32 29L28 31.5L29.5 27L26 24.5H30.5L32 20Z" fill="#FFFFFF"/>
      </svg>
    `,

    // 7. 3D Glassmorphic Clock / Timer
    'clock': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Chrome Bezel Outer Ring -->
        <circle cx="32" cy="32" r="26" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <circle cx="32" cy="32" r="23" fill="#0F172A"/>
        <circle cx="32" cy="32" r="22" fill="url(#gradNavy3D)"/>
        <!-- Glass Gradient Reflection -->
        <circle cx="32" cy="32" r="21" fill="url(#gradGlass3D)"/>
        <!-- Dial Ticks -->
        <circle cx="32" cy="14" r="1.5" fill="#94A3B8"/>
        <circle cx="50" cy="32" r="1.5" fill="#94A3B8"/>
        <circle cx="32" cy="50" r="1.5" fill="#94A3B8"/>
        <circle cx="14" cy="32" r="1.5" fill="#94A3B8"/>
        <!-- Hour Hand (pointing 10) -->
        <line x1="32" y1="32" x2="22" y2="24" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
        <!-- Minute Hand (pointing 2) -->
        <line x1="32" y1="32" x2="44" y2="20" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Second Hand with Ticking Motion -->
        <g class="anim-second-hand">
          <line x1="32" y1="36" x2="32" y2="15" stroke="#F4600C" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="32" cy="32" r="3" fill="#F4600C"/>
        </g>
        <circle cx="32" cy="32" r="1.5" fill="#FFFFFF"/>
      </svg>
    `,

    // 8. 3D Isometric Calendar Pad
    'calendar': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Back Plate 3D Base -->
        <rect x="10" y="16" width="44" height="40" rx="8" fill="#334155"/>
        <rect x="10" y="13" width="44" height="40" rx="8" fill="#FFFFFF" filter="url(#shadow3D)"/>
        <!-- Header Banner (STEMulus Orange) -->
        <path d="M10 21C10 16.5 13.5 13 18 13H46C50.5 13 54 16.5 54 21V25H10V21Z" fill="url(#gradOrange3D)"/>
        <!-- Spiral Binder Rings -->
        <rect x="18" y="9" width="4" height="8" rx="2" fill="url(#gradSteel3D)"/>
        <rect x="30" y="9" width="4" height="8" rx="2" fill="url(#gradSteel3D)"/>
        <rect x="42" y="9" width="4" height="8" rx="2" fill="url(#gradSteel3D)"/>
        <!-- Calendar Grid / Big Date Number -->
        <rect x="16" y="31" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
        <rect x="25" y="31" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
        <rect x="34" y="31" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
        <rect x="43" y="31" width="6" height="5" rx="1.5" fill="url(#gradNavy3D)"/>
        <!-- Row 2 -->
        <rect x="16" y="39" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
        <rect x="25" y="39" width="6" height="5" rx="1.5" fill="url(#gradOrange3D)"/>
        <rect x="34" y="39" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
        <rect x="43" y="39" width="6" height="5" rx="1.5" fill="#E2E8F0"/>
      </svg>
    `,

    // 9. 3D Holographic Academic Document / Report
    'document': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Document Under-layer -->
        <path d="M14 16H42L52 26V54C52 56 50 58 48 58H14C12 58 10 56 10 54V20C10 18 12 16 14 16Z" fill="#CBD5E1"/>
        <!-- Top Document Sheet -->
        <path d="M14 13H42L50 21V51C50 53 48 55 46 55H14C12 55 10 53 10 51V17C10 15 12 13 14 13Z" fill="#FFFFFF" filter="url(#shadow3D)"/>
        <!-- Folded Corner 3D -->
        <path d="M42 13V21H50L42 13Z" fill="#94A3B8"/>
        <!-- Lines of Text Content -->
        <rect x="16" y="22" width="18" height="3.5" rx="1.7" fill="url(#gradNavy3D)"/>
        <rect x="16" y="29" width="28" height="2.5" rx="1.2" fill="#94A3B8"/>
        <rect x="16" y="34" width="24" height="2.5" rx="1.2" fill="#CBD5E1"/>
        <rect x="16" y="39" width="20" height="2.5" rx="1.2" fill="#CBD5E1"/>
        <!-- Gold Official Stamp / Seal -->
        <circle cx="40" cy="45" r="5.5" fill="url(#gradGold3D)"/>
        <circle cx="40" cy="45" r="3.5" fill="#FFF9C4"/>
      </svg>
    `,

    // 10. 3D Glossy Speech Bubble / Chat
    'chat': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="56" rx="20" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Main Bubble Body -->
        <path d="M12 14C12 9.5 15.5 6 20 6H44C48.5 6 52 9.5 52 14V36C52 40.5 48.5 44 44 44H26L16 52V44H20C15.5 44 12 40.5 12 36V14Z" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <!-- Specular Highlight Curve -->
        <path d="M14 14C14 10.5 16.5 8 20 8H44C47.5 8 50 10.5 50 14V24H14V14Z" fill="url(#gradGlass3D)"/>
        <!-- 3 Animated Chat Dots -->
        <circle cx="24" cy="25" r="3.5" fill="url(#gradOrange3D)"/>
        <circle cx="32" cy="25" r="3.5" fill="#FFFFFF"/>
        <circle cx="40" cy="25" r="3.5" fill="url(#gradCyan3D)"/>
      </svg>
    `,

    // 11. 3D Cybernetic Bot Head / AI
    'robot': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Antenna -->
        <rect x="30.5" y="6" width="3" height="8" rx="1.5" fill="url(#gradSteel3D)"/>
        <circle cx="32" cy="6" r="4.5" fill="url(#gradOrange3D)" class="anim-flame"/>
        <circle cx="32" cy="6" r="2" fill="#FFF9C4"/>
        <!-- Ear Sensors -->
        <rect x="8" y="24" width="4" height="14" rx="2" fill="url(#gradOrange3D)"/>
        <rect x="52" y="24" width="4" height="14" rx="2" fill="url(#gradOrange3D)"/>
        <!-- Head Chassis (3D) -->
        <rect x="12" y="14" width="40" height="34" rx="10" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <!-- Visor Screen -->
        <rect x="16" y="20" width="32" height="14" rx="6" fill="#0F172A"/>
        <!-- Glowing Ocular Eyes -->
        <circle cx="24" cy="27" r="3.5" fill="url(#gradCyan3D)"/>
        <circle cx="40" cy="27" r="3.5" fill="url(#gradCyan3D)"/>
        <ellipse cx="23" cy="26" rx="1" ry="1.2" fill="#FFFFFF"/>
        <ellipse cx="39" cy="26" rx="1" ry="1.2" fill="#FFFFFF"/>
        <!-- Smile Speaker Grid -->
        <rect x="24" y="38" width="16" height="3" rx="1.5" fill="#475569"/>
      </svg>
    `,

    // 12. 3D Emerald Shield Checkmark
    'check': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Shield Body Base -->
        <circle cx="32" cy="34" r="24" fill="#065F46"/>
        <circle cx="32" cy="31" r="24" fill="url(#gradEmerald3D)" filter="url(#shadow3D)"/>
        <!-- Specular Highlight Arc -->
        <path d="M12 26C14 18 22 10 32 10C42 10 50 18 52 26C44 23 38 22 32 22C26 22 20 23 12 26Z" fill="url(#gradGlass3D)"/>
        <!-- Checkmark with 3D Emboss -->
        <path d="M22 32L29 39L44 24" stroke="#065F46" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 30L29 37L44 22" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // 13. 3D Ruby Cancel / Cross
    'cross': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Circle Base -->
        <circle cx="32" cy="34" r="24" fill="#991B1B"/>
        <circle cx="32" cy="31" r="24" fill="url(#gradRuby3D)" filter="url(#shadow3D)"/>
        <path d="M12 26C14 18 22 10 32 10C42 10 50 18 52 26C44 23 38 22 32 22C26 22 20 23 12 26Z" fill="url(#gradGlass3D)"/>
        <!-- Embossed Cross -->
        <path d="M22 23L42 43M42 23L22 43" stroke="#991B1B" stroke-width="6" stroke-linecap="round"/>
        <path d="M22 21L42 41M42 21L22 41" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `,

    // 14. 3D Cyan Orbital Refresh / Sync
    'refresh': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <g class="anim-spin-part">
          <!-- Arc 1 -->
          <path d="M32 12C43.0457 12 52 20.9543 52 32C52 36.5 50.5 40.5 48 44" stroke="url(#gradCyan3D)" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#shadow3D)"/>
          <path d="M46 38L52 46L42 48" fill="url(#gradCyan3D)"/>
          <!-- Arc 2 -->
          <path d="M32 52C20.9543 52 12 43.0457 12 32C12 27.5 13.5 23.5 16 20" stroke="url(#gradCyan3D)" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#shadow3D)"/>
          <path d="M18 26L12 18L22 16" fill="url(#gradCyan3D)"/>
        </g>
        <circle cx="32" cy="32" r="6" fill="url(#gradNavy3D)"/>
        <circle cx="32" cy="32" r="3" fill="#FFFFFF"/>
      </svg>
    `,

    // 15. 3D Electric Lightning Bolt
    'lightning': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Base Shadow -->
        <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Bolt Extrusion -->
        <polygon points="36,4 16,34 32,34 26,60 50,26 34,26" fill="#D97706"/>
        <!-- Top Facet -->
        <polygon points="36,6 18,34 33,34 28,56 48,27 34,27" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <polygon points="36,6 24,34 34,27" fill="#FFF9C4"/>
        <circle cx="34" cy="27" r="2.5" fill="#FFFFFF"/>
      </svg>
    `,

    // 16. 3D Titanium Padlock
    'lock': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Hardened Brass Shackle -->
        <path d="M22 28V18C22 12.5 26.5 8 32 8C37.5 8 42 12.5 42 18V28" stroke="url(#gradSteel3D)" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#shadow3D)"/>
        <!-- Body (3D Extrusion) -->
        <rect x="16" y="29" width="32" height="26" rx="6" fill="#D97706"/>
        <rect x="16" y="26" width="32" height="26" rx="6" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <!-- Keyhole -->
        <circle cx="32" cy="37" r="3.5" fill="#1E293B"/>
        <path d="M30.5 38L33.5 38L34 45L30 45Z" fill="#1E293B"/>
        <circle cx="32" cy="37" r="1.5" fill="#94A3B8"/>
      </svg>
    `,

    // 17. 3D Mail Envelope
    'mail': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Envelope Body -->
        <rect x="10" y="20" width="44" height="32" rx="6" fill="#CBD5E1"/>
        <rect x="10" y="17" width="44" height="32" rx="6" fill="#F8FAFC" filter="url(#shadow3D)"/>
        <!-- Letter Peek -->
        <rect x="14" y="12" width="36" height="16" rx="3" fill="#FFFFFF"/>
        <line x1="20" y1="16" x2="34" y2="16" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="20" x2="40" y2="20" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
        <!-- Front Flaps -->
        <path d="M10 18L32 34L54 18" stroke="#94A3B8" stroke-width="2" fill="none"/>
        <path d="M10 48L28 32" stroke="#CBD5E1" stroke-width="2"/>
        <path d="M54 48L36 32" stroke="#CBD5E1" stroke-width="2"/>
        <!-- Wax Seal (STEMulus Orange) -->
        <circle cx="32" cy="34" r="6" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <circle cx="32" cy="34" r="3" fill="#FFF9C4"/>
      </svg>
    `,

    // 18. 3D Smartphone
    'phone': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Body Chassis -->
        <rect x="18" y="9" width="28" height="46" rx="6" fill="#1E293B"/>
        <rect x="18" y="7" width="28" height="46" rx="6" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <!-- Screen Bezel -->
        <rect x="20" y="10" width="24" height="40" rx="4" fill="#0F172A"/>
        <!-- OLED Content Gradient -->
        <rect x="21" y="12" width="22" height="36" rx="3" fill="url(#gradNavy3D)"/>
        <!-- Dynamic Island / Speaker Notch -->
        <rect x="27" y="12" width="10" height="2.5" rx="1.2" fill="#000000"/>
        <!-- Home Indicator Pill -->
        <rect x="28" y="45" width="8" height="1.5" rx="0.75" fill="#FFFFFF" opacity="0.75"/>
      </svg>
    `,

    // 19. 3D Currency / Money Stack
    'money': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Coin 3 (Bottom) -->
        <ellipse cx="32" cy="46" rx="18" ry="7" fill="#065F46"/>
        <ellipse cx="32" cy="44" rx="18" ry="7" fill="url(#gradEmerald3D)"/>
        <!-- Coin 2 (Middle) -->
        <ellipse cx="32" cy="38" rx="18" ry="7" fill="#065F46"/>
        <ellipse cx="32" cy="36" rx="18" ry="7" fill="url(#gradEmerald3D)"/>
        <!-- Coin 1 (Top Gold) -->
        <ellipse cx="32" cy="28" rx="18" ry="7" fill="#B45309"/>
        <ellipse cx="32" cy="24" rx="18" ry="7" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <!-- Coin Face Emblem -->
        <ellipse cx="32" cy="24" rx="14" ry="5" fill="#FFF9C4"/>
        <text x="32" y="27" font-size="9" font-family="Arial, sans-serif" font-weight="900" fill="#B45309" text-anchor="middle">₦</text>
      </svg>
    `,

    // 20. 3D Birthday Cake
    'cake': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Platter Shadow -->
        <ellipse cx="32" cy="58" rx="22" ry="4" fill="#0F172A" opacity="0.2"/>
        <ellipse cx="32" cy="54" rx="22" ry="5" fill="url(#gradSteel3D)"/>
        <!-- Cake Tier 1 Base -->
        <path d="M14 42V49C14 53 22 55 32 55C42 55 50 53 50 49V42C50 46 42 48 32 48C22 48 14 46 14 42Z" fill="#BE185D"/>
        <path d="M14 36V43C14 47 22 49 32 49C42 49 50 47 50 43V36C50 40 42 42 32 42C22 42 14 40 14 36Z" fill="#F472B6"/>
        <!-- Top Frosting -->
        <ellipse cx="32" cy="36" rx="18" ry="6" fill="#FDF2F8"/>
        <!-- Candle -->
        <rect x="30.5" y="20" width="3" height="14" rx="1" fill="url(#gradGold3D)"/>
        <!-- Flickering Candle Flame -->
        <g class="anim-candle">
          <path d="M32 10C34 14 36 17 32 20C28 17 30 14 32 10Z" fill="url(#gradOrange3D)"/>
          <ellipse cx="32" cy="16" rx="1.5" ry="2.5" fill="#FFF9C4"/>
        </g>
      </svg>
    `,

    // 21. 3D Stack of Hardcover Books / Curriculum
    'books': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Book 1 (Bottom - Navy) -->
        <path d="M12 44L48 40L52 48L16 52Z" fill="#0F172A"/>
        <path d="M12 42L48 38L52 46L16 50Z" fill="url(#gradNavy3D)"/>
        <!-- Page Block -->
        <path d="M16 46L49 42L51 46L18 50Z" fill="#F8FAFC"/>
        <!-- Book 2 (Middle - Orange) -->
        <path d="M14 34L46 30L50 38L18 42Z" fill="#7C2D12"/>
        <path d="M14 32L46 28L50 36L18 40Z" fill="url(#gradOrange3D)"/>
        <!-- Book 3 (Top - Emerald) -->
        <path d="M16 22L44 18L48 26L20 30Z" fill="#065F46"/>
        <path d="M16 20L44 16L48 24L20 28Z" fill="url(#gradEmerald3D)" filter="url(#shadow3D)"/>
        <path d="M20 24L45 20L47 24L22 28Z" fill="#F8FAFC"/>
      </svg>
    `,

    // 22. 3D Python / Code Ribbon
    'code': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Pythonic Blue Loop -->
        <path d="M30 10C21 10 20 14 20 18V24H32V26H16C12 26 8 28 8 36C8 44 12 46 16 46H20V40C20 36 23 33 27 33H39C43 33 46 30 46 26V18C46 14 43 10 30 10Z" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <circle cx="25" cy="16" r="2" fill="#FFFFFF"/>
        <!-- Pythonic Yellow / Gold Loop -->
        <path d="M34 54C43 54 44 50 44 46V40H32V38H48C52 38 56 36 56 28C56 20 52 18 48 18H44V24C44 28 41 31 37 31H25C21 31 18 34 18 38V46C18 50 21 54 34 54Z" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <circle cx="39" cy="48" r="2" fill="#1E293B"/>
      </svg>
    `,

    // 23. 3D Glowing Globe
    'globe': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Sphere Outer Body -->
        <circle cx="32" cy="32" r="24" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <!-- Continents / Meridians (Glowing Cyan & Emerald) -->
        <ellipse cx="32" cy="32" rx="14" ry="24" stroke="url(#gradCyan3D)" stroke-width="2.5" fill="none"/>
        <ellipse cx="32" cy="32" rx="24" ry="10" stroke="url(#gradCyan3D)" stroke-width="2" fill="none"/>
        <line x1="8" y1="32" x2="56" y2="32" stroke="url(#gradCyan3D)" stroke-width="2.5"/>
        <line x1="32" y1="8" x2="32" y2="56" stroke="url(#gradCyan3D)" stroke-width="2.5"/>
        <!-- Specular Highlight Curve -->
        <path d="M12 24C15 16 22 10 32 10C42 10 49 16 52 24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
      </svg>
    `,

    // 24. 3D Glassmorphic User Bust
    'user': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Head Sphere -->
        <circle cx="32" cy="22" r="11" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <circle cx="30" cy="19" r="9" fill="url(#gradGlass3D)"/>
        <!-- Shoulders / Torso -->
        <path d="M14 52C14 43 21 39 32 39C43 39 50 43 50 52C50 54 48 56 46 56H18C16 56 14 54 14 52Z" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <path d="M22 41C25 39.5 28 39 32 39C36 39 39 39.5 42 41" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `,

    // 25. 3D Isometric Laptop / Terminal
    'laptop': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="22" ry="4" fill="#0F172A" opacity="0.2"/>
        <!-- Screen Shell -->
        <rect x="14" y="12" width="36" height="26" rx="4" fill="#334155"/>
        <rect x="16" y="14" width="32" height="22" rx="2" fill="#0F172A"/>
        <!-- Code on Screen -->
        <text x="20" y="24" font-size="6" font-family="monospace" fill="url(#gradCyan3D)">&gt; stem.run()</text>
        <rect x="20" y="28" width="12" height="2" rx="1" fill="url(#gradOrange3D)"/>
        <rect x="20" y="32" width="18" height="2" rx="1" fill="#64748B"/>
        <!-- Keyboard Base Plate -->
        <path d="M8 44L14 38H50L56 44C57 45 56 47 54 47H10C8 47 7 45 8 44Z" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <!-- Trackpad -->
        <rect x="27" y="42" width="10" height="3" rx="1" fill="#475569"/>
      </svg>
    `,

    // 26. 3D Friendly Hand Wave
    'wave': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Hand Palm & Fingers -->
        <path d="M22 34V20C22 18.5 23.5 17 25 17C26.5 17 28 18.5 28 20V30H29V16C29 14.5 30.5 13 32 13C33.5 13 35 14.5 35 16V30H36V18C36 16.5 37.5 15 39 15C40.5 15 42 16.5 42 18V32H43V22C43 20.5 44.5 19 46 19C47.5 19 49 20.5 49 22V36C49 46 41 54 31 54H27C21 54 16 49 16 43V38C16 35 18 33 21 33L22 34Z" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <path d="M28 22V30" stroke="#E65100" stroke-width="1"/>
        <path d="M35 22V30" stroke="#E65100" stroke-width="1"/>
        <path d="M42 24V32" stroke="#E65100" stroke-width="1"/>
      </svg>
    `,

    // 27. 3D Glowing Idea Lightbulb
    'bulb': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Screw Base -->
        <rect x="26" y="44" width="12" height="4" rx="2" fill="url(#gradSteel3D)"/>
        <rect x="28" y="48" width="8" height="3" rx="1.5" fill="#475569"/>
        <!-- Glass Bulb Body -->
        <path d="M20 22C20 15.3726 25.3726 10 32 10C38.6274 10 44 15.3726 44 22C44 27 41 31 38 35V42H26V35C23 31 20 27 20 22Z" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <!-- Inner Filament -->
        <path d="M29 32L32 24L35 32" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Highlight -->
        <ellipse cx="26" cy="18" rx="4" ry="7" transform="rotate(-30 26 18)" fill="#FFF9C4" opacity="0.75"/>
      </svg>
    `,

    // 28. 3D Chemistry Beaker / Lab
    'test-tube': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <!-- Shadow -->
        <ellipse cx="32" cy="58" rx="16" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Glass Beaker Rim & Neck -->
        <path d="M26 10H38V22L48 44C50 48 48 53 43 53H21C16 53 14 48 16 44L26 22V10Z" fill="url(#gradGlass3D)" stroke="#94A3B8" stroke-width="2" filter="url(#shadow3D)"/>
        <!-- Liquid (Cyan / Emerald) -->
        <path d="M20 44L24 35H40L44 44C46 48 44 51 40 51H24C20 51 18 48 20 44Z" fill="url(#gradCyan3D)"/>
        <!-- Bubbles in Liquid -->
        <circle cx="28" cy="42" r="2.5" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="36" cy="45" r="1.8" fill="#FFFFFF" opacity="0.8"/>
      </svg>
    `,

    // 29. 3D Scratch Interlocking Logic Puzzle Block
    'puzzle': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- 3D Extruded Base -->
        <path d="M14 20H24V15C24 12.2 26.2 10 29 10H35C37.8 10 40 12.2 40 15V20H50C52.2 20 54 21.8 54 24V48C54 50.2 52.2 52 50 52H39V47C39 44.2 36.8 42 34 42H30C27.2 42 25 44.2 25 47V52H14C11.8 52 10 50.2 10 48V24C10 21.8 11.8 20 14 20Z" fill="#9A3412"/>
        <!-- Top Surface -->
        <path d="M14 16H24V11C24 8.2 26.2 6 29 6H35C37.8 6 40 8.2 40 11V16H50C52.2 16 54 17.8 54 20V44C54 46.2 52.2 48 50 48H39V43C39 40.2 36.8 38 34 38H30C27.2 38 25 40.2 25 43V48H14C11.8 48 10 46.2 10 44V20C10 17.8 11.8 16 14 16Z" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <!-- Specular Glass Highlight -->
        <path d="M14 16H50C52.2 16 54 17.8 54 20V30H10V20C10 17.8 11.8 16 14 16Z" fill="url(#gradGlass3D)"/>
        <rect x="18" y="25" width="16" height="4" rx="2" fill="#FFF9C4"/>
        <circle cx="42" cy="27" r="3" fill="url(#gradGold3D)"/>
      </svg>
    `,

    // 30. 3D Command Terminal Console
    'terminal': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <rect x="8" y="15" width="48" height="38" rx="9" fill="#0F172A"/>
        <rect x="8" y="11" width="48" height="38" rx="9" fill="url(#gradNavy3D)" filter="url(#shadow3D)" stroke="#475569" stroke-width="1.5"/>
        <path d="M8 20C8 15 12 11 17 11H47C52 11 56 15 56 20V22H8V20Z" fill="#1E293B"/>
        <circle cx="15" cy="16.5" r="2" fill="#EF4444"/>
        <circle cx="21" cy="16.5" r="2" fill="#F59E0B"/>
        <circle cx="27" cy="16.5" r="2" fill="#10B981"/>
        <path d="M18 29L25 34L18 39" stroke="url(#gradCyan3D)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="29" y1="39" x2="40" y2="39" stroke="url(#gradOrange3D)" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
    `,

    // 31. 3D JavaScript Syntax Braces
    'braces': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <rect x="10" y="13" width="44" height="40" rx="10" fill="#B45309"/>
        <rect x="10" y="10" width="44" height="40" rx="10" fill="url(#gradGold3D)" filter="url(#shadow3D)"/>
        <path d="M10 20C10 14.5 14.5 10 20 10H44C49.5 10 54 14.5 54 20V28H10V20Z" fill="url(#gradGlass3D)"/>
        <path d="M26 20C22 20 22 23 22 26V28C22 30 19 30 19 30C19 30 22 30 22 32V34C22 37 22 40 26 40" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M38 20C42 20 42 23 42 26V28C42 30 45 30 45 30C45 30 42 30 42 32V34C42 37 42 40 38 40" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // 32. 3D Isometric Web Layout Bento
    'layout': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <rect x="10" y="14" width="44" height="38" rx="8" fill="#334155"/>
        <rect x="10" y="11" width="44" height="38" rx="8" fill="#F8FAFC" filter="url(#shadow3D)"/>
        <path d="M10 19C10 14.6 13.6 11 18 11H46C50.4 11 54 14.6 54 19V23H10V19Z" fill="url(#gradRuby3D)"/>
        <rect x="15" y="27" width="14" height="17" rx="3" fill="url(#gradOrange3D)"/>
        <rect x="33" y="27" width="16" height="7" rx="2.5" fill="url(#gradNavy3D)"/>
        <rect x="33" y="37" width="16" height="7" rx="2.5" fill="url(#gradCyan3D)"/>
      </svg>
    `,

    // 33. 3D AI Neural Network Core
    'brain': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <circle cx="32" cy="31" r="22" fill="url(#gradPurple3D)" filter="url(#shadow3D)"/>
        <circle cx="32" cy="31" r="19" fill="url(#gradGlass3D)"/>
        <!-- Synaptic Links -->
        <path d="M22 23L32 18L42 23L42 37L32 43L22 37Z" stroke="#67E8F9" stroke-width="2" fill="none"/>
        <line x1="22" y1="23" x2="42" y2="37" stroke="#FFF9C4" stroke-width="1.5" opacity="0.8"/>
        <line x1="42" y1="23" x2="22" y2="37" stroke="#FFF9C4" stroke-width="1.5" opacity="0.8"/>
        <!-- Glowing Nodes -->
        <circle cx="32" cy="18" r="3.5" fill="#FFFFFF"/>
        <circle cx="22" cy="23" r="3.5" fill="url(#gradCyan3D)"/>
        <circle cx="42" cy="23" r="3.5" fill="url(#gradCyan3D)"/>
        <circle cx="32" cy="31" r="4.5" fill="url(#gradGold3D)"/>
        <circle cx="22" cy="37" r="3.5" fill="url(#gradOrange3D)"/>
        <circle cx="42" cy="37" r="3.5" fill="url(#gradOrange3D)"/>
        <circle cx="32" cy="43" r="3.5" fill="#FFFFFF"/>
      </svg>
    `,

    // 34. 3D Silicon Microcontroller / Arduino CPU
    'cpu': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <!-- Gold Pins -->
        <rect x="20" y="8" width="4" height="46" rx="2" fill="url(#gradGold3D)"/>
        <rect x="30" y="8" width="4" height="46" rx="2" fill="url(#gradGold3D)"/>
        <rect x="40" y="8" width="4" height="46" rx="2" fill="url(#gradGold3D)"/>
        <rect x="9" y="19" width="46" height="4" rx="2" fill="url(#gradGold3D)"/>
        <rect x="9" y="29" width="46" height="4" rx="2" fill="url(#gradGold3D)"/>
        <rect x="9" y="39" width="46" height="4" rx="2" fill="url(#gradGold3D)"/>
        <!-- Silicon Package -->
        <rect x="14" y="15" width="36" height="34" rx="7" fill="#047857"/>
        <rect x="14" y="13" width="36" height="34" rx="7" fill="url(#gradEmerald3D)" filter="url(#shadow3D)"/>
        <!-- Inner Die -->
        <rect x="21" y="20" width="22" height="20" rx="4" fill="#0F172A"/>
        <rect x="24" y="23" width="16" height="14" rx="2" fill="url(#gradCyan3D)"/>
        <circle cx="28" cy="27" r="2" fill="#FFFFFF"/>
      </svg>
    `,

    // 35. 3D Isometric Cube / Unity 3D Engine
    'box': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <g filter="url(#shadow3D)">
          <!-- Top Diamond Facet -->
          <polygon points="32,10 52,21 32,32 12,21" fill="url(#gradCyan3D)"/>
          <!-- Left Facet -->
          <polygon points="12,21 32,32 32,53 12,42" fill="url(#gradNavy3D)"/>
          <!-- Right Facet -->
          <polygon points="52,21 32,32 32,53 52,42" fill="#0E7490"/>
          <!-- Specular Wireframe Edges -->
          <polyline points="12,21 32,32 52,21" stroke="#FFFFFF" stroke-width="1.5" opacity="0.8"/>
          <line x1="32" y1="32" x2="32" y2="53" stroke="#FFFFFF" stroke-width="1.5" opacity="0.8"/>
        </g>
      </svg>
    `,

    // 36. 3D Gamepad Controller / Roblox & Game Dev
    'gamepad': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="56" rx="22" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <path d="M16 20H48C53 20 57 26 55 38L53 45C52 49 47 50 44 46L39 40H25L20 46C17 50 12 49 11 45L9 38C7 26 11 20 16 20Z" fill="#0F172A"/>
        <path d="M16 17H48C53 17 57 23 55 35L53 42C52 46 47 47 44 43L39 37H25L20 43C17 47 12 46 11 42L9 35C7 23 11 17 16 17Z" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <!-- D-Pad -->
        <path d="M19 24H23V28H27V32H23V36H19V32H15V28H19V24Z" fill="url(#gradSteel3D)"/>
        <!-- Action Buttons -->
        <circle cx="46" cy="26" r="2.8" fill="url(#gradOrange3D)"/>
        <circle cx="40" cy="31" r="2.8" fill="url(#gradCyan3D)"/>
        <circle cx="46" cy="35" r="2.8" fill="url(#gradEmerald3D)"/>
        <circle cx="51" cy="31" r="2.8" fill="url(#gradGold3D)"/>
      </svg>
    `,

    // 37. 3D Play Prism / Pygame Arcade
    'play': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <circle cx="32" cy="31" r="23" fill="url(#gradEmerald3D)" filter="url(#shadow3D)"/>
        <path d="M12 25C15 16 22 10 32 10C42 10 49 16 52 25" fill="url(#gradGlass3D)"/>
        <polygon points="26,20 45,31 26,42" fill="#FFFFFF" filter="url(#shadow3D)"/>
      </svg>
    `,

    // 38. 3D Cryptographic Safeguarding Crest Shield
    'shield': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.22"/>
        <!-- Outer Titanium Bezel Shield -->
        <path d="M32 6L10 15V31C10 45.5 19.4 55.8 32 59C44.6 55.8 54 45.5 54 31V15L32 6Z" fill="url(#gradSteel3D)" filter="url(#shadow3D)"/>
        <!-- Inner Emerald Core Shield -->
        <path d="M32 10L14 17.5V31C14 43 21.7 51.8 32 54.6C42.3 51.8 50 43 50 31V17.5L32 10Z" fill="url(#gradEmerald3D)"/>
        <!-- Left Facet Specular Highlight -->
        <path d="M32 10L14 17.5V31C14 43 21.7 51.8 32 54.6V10Z" fill="url(#gradGlass3D)"/>
        <!-- 3D Embossed Checkmark -->
        <path d="M23 32L29 38L42 25" stroke="#064E3B" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 30.5L29 36.5L42 23.5" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // 39. 3D Live Broadcast Camera
    'video': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="56" rx="20" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <path d="M44 26L56 19V43L44 36V26Z" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <rect x="8" y="18" width="36" height="26" rx="7" fill="url(#gradNavy3D)" filter="url(#shadow3D)"/>
        <circle cx="22" cy="31" r="7" fill="url(#gradCyan3D)"/>
        <circle cx="20" cy="29" r="2.5" fill="#FFFFFF"/>
        <circle cx="37" cy="24" r="2.5" fill="#10B981" class="anim-flame"/>
      </svg>
    `,

    // 40. 3D Tuition / Pricing Tag Emblem
    'tag': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#0F172A" opacity="0.2"/>
        <path d="M12 12H32L52 32L32 52L12 32V12Z" fill="url(#gradOrange3D)" filter="url(#shadow3D)"/>
        <path d="M12 12H32L42 22H12V12Z" fill="url(#gradGlass3D)"/>
        <circle cx="22" cy="22" r="4" fill="#FFF9C4"/>
      </svg>
    `,

    // 41. 3D Glass-Bezel Flag: United States (USA)
    'flag-us': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <clipPath id="clipFlagUS"><rect x="6" y="12" width="52" height="38" rx="9"/></clipPath>
        <rect x="6" y="15" width="52" height="38" rx="9" fill="#1E293B"/>
        <g clip-path="url(#clipFlagUS)" filter="url(#shadow3D)">
          <rect x="6" y="12" width="52" height="38" fill="#FFFFFF"/>
          <rect x="6" y="12" width="52" height="5.5" fill="#DC2626"/>
          <rect x="6" y="23" width="52" height="5.5" fill="#DC2626"/>
          <rect x="6" y="34" width="52" height="5.5" fill="#DC2626"/>
          <rect x="6" y="44.5" width="52" height="5.5" fill="#DC2626"/>
          <rect x="6" y="12" width="26" height="22" fill="#1E3A8A"/>
          <circle cx="13" cy="18" r="1.6" fill="#FFFFFF"/>
          <circle cx="20" cy="18" r="1.6" fill="#FFFFFF"/>
          <circle cx="27" cy="18" r="1.6" fill="#FFFFFF"/>
          <circle cx="16.5" cy="23" r="1.6" fill="#FFFFFF"/>
          <circle cx="23.5" cy="23" r="1.6" fill="#FFFFFF"/>
          <circle cx="13" cy="28" r="1.6" fill="#FFFFFF"/>
          <circle cx="20" cy="28" r="1.6" fill="#FFFFFF"/>
          <circle cx="27" cy="28" r="1.6" fill="#FFFFFF"/>
          <rect x="6" y="12" width="52" height="20" fill="url(#gradGlass3D)"/>
        </g>
        <rect x="6" y="12" width="52" height="38" rx="9" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
      </svg>
    `,

    // 42. 3D Glass-Bezel Flag: United Kingdom (UK)
    'flag-uk': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <clipPath id="clipFlagUK"><rect x="6" y="12" width="52" height="38" rx="9"/></clipPath>
        <rect x="6" y="15" width="52" height="38" rx="9" fill="#1E293B"/>
        <g clip-path="url(#clipFlagUK)" filter="url(#shadow3D)">
          <rect x="6" y="12" width="52" height="38" fill="#1E3A8A"/>
          <path d="M6 12L58 50M58 12L6 50" stroke="#FFFFFF" stroke-width="7"/>
          <path d="M6 12L58 50M58 12L6 50" stroke="#DC2626" stroke-width="3.5"/>
          <path d="M32 12V50M6 31H58" stroke="#FFFFFF" stroke-width="11"/>
          <path d="M32 12V50M6 31H58" stroke="#DC2626" stroke-width="6.5"/>
          <rect x="6" y="12" width="52" height="20" fill="url(#gradGlass3D)"/>
        </g>
        <rect x="6" y="12" width="52" height="38" rx="9" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
      </svg>
    `,

    // 43. 3D Glass-Bezel Flag: Canada (CA)
    'flag-ca': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <clipPath id="clipFlagCA"><rect x="6" y="12" width="52" height="38" rx="9"/></clipPath>
        <rect x="6" y="15" width="52" height="38" rx="9" fill="#1E293B"/>
        <g clip-path="url(#clipFlagCA)" filter="url(#shadow3D)">
          <rect x="6" y="12" width="52" height="38" fill="#FFFFFF"/>
          <rect x="6" y="12" width="14" height="38" fill="#DC2626"/>
          <rect x="44" y="12" width="14" height="38" fill="#DC2626"/>
          <!-- Iconic Maple Leaf Silhouette -->
          <path d="M32 18L34.5 23.5L39 22.5L36.5 27.5L40 29.5L34 34H30L24 29.5L27.5 27.5L25 22.5L29.5 23.5L32 18Z" fill="#DC2626"/>
          <rect x="31" y="33" width="2" height="7" fill="#DC2626"/>
          <rect x="6" y="12" width="52" height="20" fill="url(#gradGlass3D)"/>
        </g>
        <rect x="6" y="12" width="52" height="38" rx="9" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
      </svg>
    `,

    // 44. 3D Glass-Bezel Flag: Australia (AU)
    'flag-au': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <clipPath id="clipFlagAU"><rect x="6" y="12" width="52" height="38" rx="9"/></clipPath>
        <rect x="6" y="15" width="52" height="38" rx="9" fill="#1E293B"/>
        <g clip-path="url(#clipFlagAU)" filter="url(#shadow3D)">
          <rect x="6" y="12" width="52" height="38" fill="#1E3A8A"/>
          <!-- Union Jack Canton -->
          <path d="M6 12L32 30M32 12L6 30" stroke="#FFFFFF" stroke-width="4"/>
          <path d="M19 12V30M6 21H32" stroke="#FFFFFF" stroke-width="6"/>
          <path d="M19 12V30M6 21H32" stroke="#DC2626" stroke-width="3.5"/>
          <!-- Commonwealth & Southern Cross Stars -->
          <circle cx="19" cy="40" r="3.5" fill="#FFFFFF"/>
          <circle cx="45" cy="20" r="2" fill="#FFFFFF"/>
          <circle cx="51" cy="27" r="2" fill="#FFFFFF"/>
          <circle cx="39" cy="29" r="2" fill="#FFFFFF"/>
          <circle cx="45" cy="41" r="2.2" fill="#FFFFFF"/>
          <rect x="6" y="12" width="52" height="20" fill="url(#gradGlass3D)"/>
        </g>
        <rect x="6" y="12" width="52" height="38" rx="9" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
      </svg>
    `,

    // 45. 3D Glass-Bezel Flag: Nigeria (NG)
    'flag-ng': `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${SVG_DEFS}
        <clipPath id="clipFlagNG"><rect x="6" y="12" width="52" height="38" rx="9"/></clipPath>
        <rect x="6" y="15" width="52" height="38" rx="9" fill="#1E293B"/>
        <g clip-path="url(#clipFlagNG)" filter="url(#shadow3D)">
          <rect x="6" y="12" width="52" height="38" fill="#FFFFFF"/>
          <rect x="6" y="12" width="17.5" height="38" fill="#008751"/>
          <rect x="40.5" y="12" width="17.5" height="38" fill="#008751"/>
          <rect x="6" y="12" width="52" height="20" fill="url(#gradGlass3D)"/>
        </g>
        <rect x="6" y="12" width="52" height="38" rx="9" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>
      </svg>
    `
  };

  // Map alias names to registered keys
  const ALIAS_MAP = {
    'launch': 'rocket',
    'fast': 'rocket',
    'goal': 'target',
    'focus': 'target',
    'award': 'trophy',
    'winner': 'trophy',
    'cup': 'trophy',
    'grad': 'graduation-cap',
    'certificate': 'graduation-cap',
    'tutor': 'graduation-cap',
    'timer': 'clock',
    'time': 'clock',
    'schedule': 'calendar',
    'date': 'calendar',
    'report': 'document',
    'file': 'document',
    'page': 'document',
    'clipboard': 'document',
    'message': 'chat',
    'comment': 'chat',
    'ai': 'robot',
    'bot': 'robot',
    'assistant': 'robot',
    'success': 'check',
    'ok': 'check',
    'verified': 'check',
    'shield-check': 'shield',
    'error': 'cross',
    'cancel': 'cross',
    'close': 'cross',
    'sync': 'refresh',
    'loop': 'refresh',
    'bolt': 'lightning',
    'zap': 'lightning',
    'power': 'lightning',
    'padlock': 'lock',
    'secure': 'lock',
    'email': 'mail',
    'envelope': 'mail',
    'smartphone': 'phone',
    'call': 'phone',
    'cash': 'money',
    'price': 'money',
    'birthday': 'cake',
    'bday': 'cake',
    'curriculum': 'books',
    'courses': 'books',
    'python': 'code',
    'dev': 'code',
    'earth': 'globe',
    'world': 'globe',
    'profile': 'user',
    'avatar': 'user',
    'screen': 'laptop',
    'computer': 'laptop',
    'hand': 'wave',
    'hello': 'wave',
    'idea': 'bulb',
    'light': 'bulb',
    'lab': 'test-tube',
    'brain-circuit': 'brain',
    'scratch': 'puzzle'
  };

  // Motion map: defaults motion classes based on icon type
  const DEFAULT_MOTIONS = {
    'rocket': 'motion-float',
    'target': 'motion-pulse',
    'star': 'motion-twinkle',
    'sparkle': 'motion-twinkle',
    'trophy': 'motion-pulse',
    'check': 'motion-pop',
    'shield': 'motion-pulse',
    'cross': 'motion-pop',
    'refresh': '',
    'lightning': 'motion-voltage',
    'cake': 'motion-float',
    'wave': 'motion-float',
    'bulb': 'motion-pulse',
    'robot': 'motion-float',
    'brain': 'motion-pulse',
    'cpu': 'motion-pulse'
  };

  function normalizeName(name) {
    if (!name) return 'rocket';
    const clean = String(name).toLowerCase().trim().replace(/^(icon-3d-|icon-)/, '');
    return ALIAS_MAP[clean] || clean;
  }

  function getSvg(name, options = {}) {
    const key = normalizeName(name);
    const template = ICON_TEMPLATES[key] || ICON_TEMPLATES['rocket'];
    const size = options.size || 24;
    const motion = options.motion !== false;
    const defaultMotionClass = DEFAULT_MOTIONS[key] || '';
    const customClass = options.className || '';
    const motionClass = motion ? defaultMotionClass : '';

    return `
      <span class="icon-3d ${motionClass} ${customClass}" style="width:${size}px; height:${size}px;" data-icon-name="${key}" aria-hidden="true">
        ${template.trim()}
      </span>
    `.trim();
  }

  function render(name, options = {}) {
    return getSvg(name, options);
  }

  // Hydrate all [data-icon-3d] or <i class="icon-3d-..."> elements in a container
  function hydrate(container = (typeof document !== 'undefined' ? document : null)) {
    if (!container || typeof container.querySelectorAll !== 'function') return;

    // 1. Elements with data-icon-3d="name"
    const dataEls = container.querySelectorAll('[data-icon-3d]');
    dataEls.forEach(el => {
      const name = el.getAttribute('data-icon-3d');
      const size = parseInt(el.getAttribute('data-icon-size') || '24', 10);
      const motion = el.getAttribute('data-icon-motion') !== 'false';
      el.innerHTML = getSvg(name, { size, motion });
    });

    // 2. <i> tags or spans with class like .icon-3d-[name] that don't already have an SVG
    const classEls = container.querySelectorAll('i[class*="icon-3d-"], span[class*="icon-3d-"]');
    classEls.forEach(el => {
      if (el.querySelector('svg')) return; // already rendered
      const match = el.className.match(/icon-3d-([a-z0-9-]+)/);
      if (match && match[1] && !['xs','sm','md','lg','xl','2xl','hero','badge'].includes(match[1])) {
        const name = match[1];
        const size = el.classList.contains('icon-3d-lg') ? 32 :
                     el.classList.contains('icon-3d-xl') ? 48 :
                     el.classList.contains('icon-3d-2xl') ? 64 :
                     el.classList.contains('icon-3d-sm') ? 18 :
                     el.classList.contains('icon-3d-xs') ? 14 : 24;
        el.innerHTML = getSvg(name, { size });
      }
    });
  }

  // Auto-init in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => hydrate(document));
    } else {
      hydrate(document);
    }

    // MutationObserver to auto-hydrate dynamically injected nodes
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              hydrate(node);
            }
          });
        });
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  }

  return {
    getSvg,
    render,
    hydrate,
    normalizeName,
    availableIcons: Object.keys(ICON_TEMPLATES)
  };
});
