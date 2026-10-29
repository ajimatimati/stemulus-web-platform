/**
 * ═══════════════════════════════════════════════════════════════
 * STEMULUS CINEMATIC MOTION ENGINE (JS)
 * Story-Driven ScrollTrigger Reveals, Magnetic Physics & KPI Rolls
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  function boot() {
    initCustomCursor();
    initScrollReveals();
    initMagneticButtons();
    initKPICounterRolls();
    initCard3DTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── 1. Magnetic Custom Cursor Tracker (Deactivated) ── */
  function initCustomCursor() {
    return;
  }

  /* ── 2. GSAP ScrollTrigger Story Reveals ── */
  function initScrollReveals() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Story reveal elements
    const revealElems = document.querySelectorAll('.reveal-story, .reveal-left, .reveal-right, .reveal-scale, [data-reveal]');
    revealElems.forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });

    // Stagger grids
    const staggerGrids = document.querySelectorAll('[data-stagger]');
    staggerGrids.forEach((grid) => {
      const children = grid.children;
      if (children.length === 0) return;
      gsap.from(children, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%'
        }
      });
    });
  }

  /* ── 3. Magnetic Button Physics ── */
  function initMagneticButtons() {
    const magBtns = document.querySelectorAll('.nav-cta-btn, .btn-3d, .magnetic-btn');
    magBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate3d(${x * 0.25}px, ${y * 0.25}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ── 4. Numeric KPI Roll Counter ── */
  function initKPICounterRolls() {
    const kpiElems = document.querySelectorAll('#kpi-children, #kpi-sessions, #kpi-certs, .kpi-roll');
    kpiElems.forEach((el) => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target) || target === 0) return;

      let current = 0;
      const step = Math.max(1, Math.ceil(target / 25));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 35);
    });
  }

  /* ── 5. Card 3D Tilt Micro-Interactions ── */
  function initCard3DTilt() {
    const cards = document.querySelectorAll('.motion-card-tilt, .showcase-card, .dash-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

})();
