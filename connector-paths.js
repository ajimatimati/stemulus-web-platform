/**
 * STEMulus v2.0 — Connector Paths
 * Dynamically draws an SVG dotted path weaving between grid items
 * in the .flow-grid layout. Calculates coordinates on load and resize.
 */
(function() {
  'use strict';

  function calculateAndDrawPaths() {
    const wrappers = document.querySelectorAll('.connector-path-wrap');
    if (!wrappers.length) return;

    wrappers.forEach(wrap => {
      const svg = wrap.querySelector('.connector-svg');
      const cards = Array.from(wrap.querySelectorAll('.flow-card'));
      
      // We need at least 2 cards, and on desktop they should be in 2 columns
      if (!svg || cards.length < 2) return;
      
      const svgPath = svg.querySelector('path');
      if (!svgPath) return;

      // If mobile (single column), clear path and exit
      if (window.innerWidth <= 768) {
        svgPath.setAttribute('d', '');
        return;
      }

      // Calculate relative coordinates
      const wrapRect = wrap.getBoundingClientRect();
      
      let d = '';
      
      for (let i = 0; i < cards.length - 1; i++) {
        const c1 = cards[i].getBoundingClientRect();
        const c2 = cards[i+1].getBoundingClientRect();
        
        // Is it L->R or R->L flow?
        const c1IsLeft = c1.left < c2.left;
        
        // Get center Y of cards
        const y1 = c1.top - wrapRect.top + (c1.height / 2);
        const y2 = c2.top - wrapRect.top + (c2.height / 2);
        
        let x1, x2;
        let cp1x, cp1y, cp2x, cp2y;
        
        if (c1IsLeft) {
          // L -> R: Start right edge of C1, end left edge of C2
          x1 = c1.right - wrapRect.left;
          x2 = c2.left - wrapRect.left;
        } else {
          // R -> L: Start left edge of C1, end right edge of C2
          x1 = c1.left - wrapRect.left;
          x2 = c2.right - wrapRect.left;
        }
        
        // Control points for a smooth S-curve
        const distanceX = x2 - x1;
        cp1x = x1 + (distanceX * 0.5);
        cp1y = y1;
        cp2x = x2 - (distanceX * 0.5);
        cp2y = y2;
        
        if (i === 0) {
          d += `M ${x1} ${y1} `;
        }
        
        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2} `;
      }
      
      svgPath.setAttribute('d', d);
    });
  }

  // Handle scroll reveal of the SVG path
  function initScrollReveal() {
    const svgs = document.querySelectorAll('.connector-svg');
    if (!svgs.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.3 });
    
    svgs.forEach(svg => observer.observe(svg));
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to let fonts/layout settle
    setTimeout(() => {
      calculateAndDrawPaths();
      initScrollReveal();
    }, 100);
  });

  // Re-calculate on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(calculateAndDrawPaths, 250);
  });

})();
