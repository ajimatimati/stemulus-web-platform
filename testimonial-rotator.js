/**
 * STEMulus v2.0 — Testimonial Rotator
 * Auto-cycles testimonial cards every 4500ms with a synchronized gold
 * progress bar fill. Pauses on hover/focus. Supports touch swipe.
 * Announces changes via aria-live for screen readers.
 */
(function () {
  'use strict';

  function initRotator(rotator) {
    const track = rotator.querySelector('.testimonial-track');
    const cards = rotator.querySelectorAll('.testimonial-card');
    const bars  = rotator.querySelectorAll('.progress-bar-item');
    if (!track || cards.length < 2) return;

    const INTERVAL = 4500;
    let current    = 0;
    let timer      = null;
    let touchStartX = 0;

    // Make the track announce changes to screen readers
    track.setAttribute('aria-live', 'polite');
    track.setAttribute('aria-atomic', 'true');

    function goTo(index) {
      // Clamp
      index = ((index % cards.length) + cards.length) % cards.length;

      // Reset bars
      bars.forEach((bar, i) => {
        bar.classList.remove('is-active', 'is-done');
        if (i < index) bar.classList.add('is-done');
      });

      // Force reflow so the active animation restarts cleanly
      void bars[index]?.offsetWidth;
      bars[index]?.classList.add('is-active');

      // Slide track
      track.style.transform = `translateX(-${index * 100}%)`;

      // Update aria label on active card
      cards.forEach((card, i) => {
        card.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
      });

      current = index;
    }

    function next() {
      goTo(current + 1);
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, INTERVAL);
    }

    function pauseTimer() {
      clearInterval(timer);
      rotator.classList.add('is-paused');
    }

    function resumeTimer() {
      rotator.classList.remove('is-paused');
      startTimer();
    }

    // Allow clicking progress bars to jump to a card
    bars.forEach((bar, i) => {
      bar.addEventListener('click', () => {
        clearInterval(timer);
        goTo(i);
        startTimer();
      });
    });

    // Pause on hover
    rotator.addEventListener('mouseenter', pauseTimer);
    rotator.addEventListener('mouseleave', resumeTimer);

    // Pause on keyboard focus within
    rotator.addEventListener('focusin',  pauseTimer);
    rotator.addEventListener('focusout', resumeTimer);

    // Touch swipe support
    rotator.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    rotator.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        clearInterval(timer);
        goTo(dx < 0 ? current + 1 : current - 1);
        startTimer();
      }
    }, { passive: true });

    // Init
    goTo(0);
    startTimer();
  }

  // Initialize all rotators on the page
  function init() {
    document.querySelectorAll('.testimonial-rotator').forEach(initRotator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
