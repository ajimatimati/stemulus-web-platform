/**
 * STEMulus Kids Tech — Proprietary Geometric Icon System
 * 1.25px precision stroke SVG icons representing core computer science & STEM primitives.
 * Replaces cartoon 3D isometric icons and generic thick icon sets.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.STEMulusIcons = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var icons = {
    // 1. Terminal / Command Line Interface
    'terminal': '<path d="M4 17l6-5-6-5M12 19h8M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',

    // 2. Python / Syntax Brackets
    'python': '<path d="M12 2v6m0 8v6M5 8h14M5 16h14M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 11h.01M15 13h.01"/>',

    // 3. Scratch / Algorithmic Block Logic
    'scratch': '<path d="M4 5h5v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',

    // 4. Web Development / DOM Tree & Layout
    'web': '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20M7 3v5M12 13h7M12 17h4M6 13h2v4H6z"/>',

    // 5. Robotics / Articulated Joint & Actuator
    'robot': '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 3v5M9 1v2M15 1v2M9 13h.01M15 13h.01M9 16h6M2 12h3M19 12h3"/>',

    // 6. Arduino / Microcontroller & Silicon Bus
    'arduino': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8zM1 9h3M1 12h3M1 15h3M20 9h3M20 12h3M20 15h3M9 1v3M15 1v3M9 20v3M15 20v3"/>',

    // 7. Artificial Intelligence / Neural Graph Network
    'ai': '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 7.5l2.5 3M16 7.5l-2.5 3M8 16.5l2.5-3M16 16.5l-2.5-3M6 8.5v7M18 8.5v7"/>',

    // 8. Digital Art / Vector Coordinate Plane & Bezier Anchor
    'art': '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><rect x="11" y="11" width="3" height="3"/><path d="M8 7.5C12 10 12 14 16 16.5M6 8.5v9a2 2 0 0 0 2 2h9"/>',

    // 9. Creative Coding / Generative Waveform
    'creative': '<path d="M2 12c3-8 5-8 8 0s5 8 8 0 3-8 4-4M2 17c3-5 5-5 8 0s5 5 8 0 3-5 4-2M2 7c3-3 5-3 8 0s5 3 8 0 3-3 4-1"/>',

    // 10. Safeguarding Shield / Security Cryptographic Seal
    'shield': '<path d="M12 2L4 5.5v6.2c0 5.4 3.4 10.5 8 11.8 4.6-1.3 8-6.4 8-11.8V5.5L12 2z"/><path d="M9 12l2 2 4-4"/>',

    // 11. 1-on-1 Mentorship Vector Pairing
    'mentorship': '<circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><path d="M3 19v-2a4 4 0 0 1 7-2.6M14 14.4A4 4 0 0 1 21 17v2M12 11v6M10 14h4"/>',

    // 12. Checkmark (Verification)
    'check': '<path d="M20 6L9 17l-5-5"/>',

    // 13. Arrow Right (Directional Vector)
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',

    // 14. Code Branch (Git / Version Control)
    'code-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M18 8.5A6 6 0 0 1 6 14"/>',

    // 15. Calendar / Schedule
    'calendar': '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',

    // 16. Clock / Session Duration
    'clock': '<circle cx="12" cy="12" r="9.5"/><polyline points="12 6 12 12 16 14"/>',

    // 17. Chevron Down (Accordion / Select)
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',

    // 18. Spark / Innovation Asterisk
    'spark': '<path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/>',

    // 19. Lock / Privacy
    'lock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>',

    // 20. Users / Faculty
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',

    // 21. Wallet / Earnings
    'wallet': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h4M2 9h20"/>',

    // 22. Globe / International Timezone
    'globe': '<circle cx="12" cy="12" r="9.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/><path d="M12 2.5a15.3 15.3 0 0 1 4 9.5 15.3 15.3 0 0 1-4 9.5 15.3 15.3 0 0 1-4-9.5 15.3 15.3 0 0 1 4-9.5z"/>'
  };

  function svg(name, size, cls, extraAttr) {
    var path = icons[name] || icons['spark'];
    var s = size || 20;
    var c = cls ? ' ' + cls : '';
    var attrs = extraAttr || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="stem-icon' + c + '" ' + attrs + ' aria-hidden="true">' + path + '</svg>';
  }

  function renderAll() {
    // 1. Replace [data-stem-icon]
    var customElements = document.querySelectorAll('[data-stem-icon]');
    customElements.forEach(function (el) {
      var name = el.getAttribute('data-stem-icon');
      var size = parseInt(el.getAttribute('data-size'), 10) || 20;
      var cls = el.getAttribute('data-class') || '';
      el.innerHTML = svg(name, size, cls);
    });

    // 2. Safely replace legacy 3D icon containers [data-icon-3d] with clean geometric icons
    var legacy3d = document.querySelectorAll('[data-icon-3d]');
    legacy3d.forEach(function (el) {
      var iconKey = el.getAttribute('data-icon-3d');
      var map = {
        'rocket': 'terminal',
        'atom': 'ai',
        'shield': 'shield',
        'cube': 'scratch',
        'target': 'art',
        'code': 'python',
        'laptop': 'web',
        'robot': 'robot',
        'chart': 'creative',
        'globe': 'globe',
        'users': 'mentorship'
      };
      var target = map[iconKey] || 'terminal';
      el.removeAttribute('data-icon-3d');
      el.classList.remove('icon-3d-active', 'icon-3d-enhanced');
      el.classList.add('stem-icon-badge');
      el.innerHTML = svg(target, 24, 'text-slate-700');
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderAll);
    } else {
      renderAll();
    }
  }

  return {
    svg: svg,
    renderAll: renderAll,
    icons: icons
  };
});
