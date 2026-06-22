/**
 * STEMulus — 3D Tactile Card Tilt Effect
 * Applies hardware-accelerated 3D transforms to elements with class .card-tilt-3d on hover.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initCardTilt);

  function initCardTilt() {
    const cards = document.querySelectorAll('.card-tilt-3d');
    if (!cards.length) return;

    cards.forEach(card => {
      // Ensure the parent container has perspective
      const parent = card.parentElement;
      if (parent && !parent.classList.contains('perspective-3d')) {
        parent.classList.add('perspective-3d');
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        
        // Mouse coordinate offsets relative to card dimensions
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        
        // Calculate tilt angles (limit rotation to 12 degrees max)
        const angleX = -(y - yc) / (rect.height / 2) * 12;
        const angleY = (x - xc) / (rect.width / 2) * 12;

        // Apply style transform
        card.style.transform = `rotateX(${angleX.toFixed(2)}deg) rotateY(${angleY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
      });

      // Reset card orientation on mouse exit
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      });

      // Clear transition during mouse movement for real-time responsiveness
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.05s ease-out';
      });
    });
  }
})();
