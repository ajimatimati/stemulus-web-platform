/**
 * STEMulus — Card Motion Engine
 * Scroll-reveal with stagger + interactive 3D tilt for all premium card surfaces.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', function () {
    initSectionReveal();
    initStandaloneCardReveal();
    initCardTilt3D();
  });

  /* Section-level reveal ([data-reveal] containers).
     Cards inside them get stagger via CSS animation-delay, NOT a second observer. */
  function initSectionReveal() {
    var sections = document.querySelectorAll('[data-reveal]');
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    sections.forEach(function (el) { observer.observe(el); });
  }

  /* Card-level reveal for cards that are NOT inside a [data-reveal] ancestor.
     Cards inside [data-reveal] containers use CSS stagger — no JS needed. */
  function initStandaloneCardReveal() {
    var cardSelectors = [
      '.fp-step',
      '.fp-safety-card',
      '.fp-chat-card',
      '.why-card',
      '.showcase-new-card',
      '.testi-card',
      '#blog-grid-container > article',
      '[data-stagger] > div > .rounded-xl',
      '.roadmap-card-outer.card-3d-tilt'
    ];

    var allCards = document.querySelectorAll(cardSelectors.join(','));
    if (!allCards.length) return;

    var standaloneCards = Array.prototype.filter.call(allCards, function (card) {
      return !card.closest('[data-reveal]');
    });

    if (!standaloneCards.length) return;

    standaloneCards.forEach(function (card) {
      card.classList.add('card-reveal');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    standaloneCards.forEach(function (card) { observer.observe(card); });
  }

  /* Interactive 3D tilt on mouse-move. Only desktop, not reduced-motion. */
  function initCardTilt3D() {
    var isMobile = window.innerWidth < 768;
    if (isMobile) return;

    var tiltSelectors = [
      '.fp-step',
      '.fp-safety-card',
      '.fp-chat-card',
      '.why-card',
      '.showcase-new-card',
      '.testi-card',
      '#blog-grid-container > article',
      '[data-stagger] > div > .rounded-xl'
    ];

    var cards = document.querySelectorAll(tiltSelectors.join(','));
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;

        var rotateX = ((y - cy) / cy) * -4;
        var rotateY = ((x - cx) / cx) * 4;

        card.style.transform =
          'perspective(1000px) translateY(-6px) rotateX(' +
          rotateX.toFixed(2) + 'deg) rotateY(' +
          rotateY.toFixed(2) + 'deg)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  }
})();
