/**
 * STEMulus Kids Tech — Quiet Scroll Choreography
 * High-performance, lightweight IntersectionObserver-driven scroll reveals.
 * Premium, gentle deceleration without layout reflows or distracting bouncy physics.
 */

(function () {
  'use strict';

  // Check if reduced motion is requested
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  function initScrollReveals() {
    // Select elements marked for scroll entrance
    var targets = document.querySelectorAll(
      '[data-reveal], [data-reveal-stagger] > *, .curriculum-card, .editorial-heading, .prog-card, .specimen-wrap, .safety-card'
    );

    if (!targets.length) return;

    var viewHeight = window.innerHeight || document.documentElement.clientHeight;

    // Apply baseline unrevealed state if not already revealed
    targets.forEach(function (el) {
      if (el.classList.contains('revealed') || el.classList.contains('is-visible')) return;
      var rect = el.getBoundingClientRect();
      // If element is in the above-the-fold initial viewport, reveal immediately
      if (rect.top < viewHeight * 0.95) {
        el.classList.add('revealed', 'is-visible');
      } else if (!el.classList.contains('scroll-reveal-item')) {
        el.classList.add('scroll-reveal-item');
      }
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('revealed', 'is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            // Support stagger if parent has data-reveal-stagger
            var parent = el.closest('[data-reveal-stagger]');
            var delay = 0;
            if (parent) {
              var siblings = Array.prototype.slice.call(parent.children);
              var idx = siblings.indexOf(el);
              if (idx !== -1) {
                delay = (idx % 4) * 80;
              }
            }

            setTimeout(function () {
              el.classList.add('revealed', 'is-visible');
            }, delay);

            obs.unobserve(el);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.05
      }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveals);
  } else {
    initScrollReveals();
  }
})();
