/**
 * STEMulus Hero Parallax — Mouse-tracking depth illusion
 * 
 * Creates a premium multi-layer parallax effect where:
 * - Background blobs move at 2% of mouse offset (slowest)
 * - Main hero image moves at 5% (medium)  
 * - Floating badges move at 12% (fastest, most depth)
 * 
 * This creates a convincing 3D depth illusion purely with CSS transforms.
 * Uses requestAnimationFrame + lerp for buttery-smooth motion.
 */

(function() {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  var CONFIG = {
    blob:   { x: 0.060, y: 0.045 },   // background blobs offset multiplier (noticeable depth)
    image:  { x: 0.140, y: 0.100 },   // main image offset multiplier (obvious depth)
    badge:  { x: 0.220, y: 0.160 },   // badges offset multiplier
    lerpSpeed: 0.050,                 // extra silky smooth LERP transition
    tiltMax: 16,                      // maximum tilt in degrees (brag-worthy depth)
  };

  // ── State ──────────────────────────────────────────────────────
  var mouse = { x: 0, y: 0 };    // raw mouse position (normalised -0.5 to 0.5)
  var current = { x: 0, y: 0 }; // smoothed position
  var rafId = null;
  var isActive = false;

  // ── Elements ───────────────────────────────────────────────────
  var scene, blobLayer, imageLayer, badges, heroImg;

  function init() {
    scene      = document.getElementById('hero-parallax-scene');
    blobLayer  = document.getElementById('hero-blob-layer');
    imageLayer = document.getElementById('hero-image-layer');
    heroImg    = document.getElementById('hero-parallax-img');
    badges     = document.querySelectorAll('.floating-badge');

    if (!scene) return; // not on index page

    // Only activate on non-touch devices
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      isActive = true;
      scene.addEventListener('mousemove', onMouseMove, { passive: true });
      scene.addEventListener('mouseleave', onMouseLeave, { passive: true });
      scene.addEventListener('mouseenter', onMouseEnter, { passive: true });
    }

    // Entrance animation
    runEntranceAnimation();
  }

  function onMouseEnter() {
    if (!rafId) tick();
  }

  function onMouseLeave() {
    // Gently return to center
    mouse.x = 0;
    mouse.y = 0;
  }

  function onMouseMove(e) {
    var rect = scene.getBoundingClientRect();
    // Normalise to -0.5 .. 0.5
    mouse.x = ((e.clientX - rect.left) / rect.width)  - 0.5;
    mouse.y = ((e.clientY - rect.top)  / rect.height) - 0.5;
  }

  // ── Main animation loop ────────────────────────────────────────
  function tick() {
    // Lerp toward target
    current.x += (mouse.x - current.x) * CONFIG.lerpSpeed;
    current.y += (mouse.y - current.y) * CONFIG.lerpSpeed;

    applyTransforms();

    // Keep ticking as long as there's movement
    if (Math.abs(mouse.x - current.x) > 0.0001 || 
        Math.abs(mouse.y - current.y) > 0.0001) {
      rafId = requestAnimationFrame(tick);
    } else {
      applyTransforms(); // final snap
      rafId = null;
    }
  }

  function applyTransforms() {
    var cx = current.x;
    var cy = current.y;

    // Blob layer — gentle shift
    if (blobLayer) {
      var bx = cx * CONFIG.blob.x * 100;
      var by = cy * CONFIG.blob.y * 100;
      blobLayer.style.transform = 
        'translate3d(' + bx + 'px, ' + by + 'px, 0)';
    }

    // Hero image — medium shift + subtle tilt
    if (heroImg) {
      var ix = cx * CONFIG.image.x * 100;
      var iy = cy * CONFIG.image.y * 100;
      var tiltY = cx * CONFIG.tiltMax;   // tilt around Y axis
      var tiltX = -cy * (CONFIG.tiltMax * 0.6); // tilt around X axis
      heroImg.style.transform = 
        'translate3d(' + ix + 'px, ' + iy + 'px, 0) ' +
        'perspective(900px) ' +
        'rotateY(' + tiltY + 'deg) ' +
        'rotateX(' + tiltX + 'deg)';
    }

    // Floating badges — fastest (most pronounced depth)
    if (badges.length) {
      var oddEven = 1;
      badges.forEach(function(badge) {
        var bfx = cx * CONFIG.badge.x * 100 * oddEven;
        var bfy = cy * CONFIG.badge.y * 100 * oddEven;
        badge.style.transform = 
          badge.dataset.baseTransform
            ? badge.dataset.baseTransform + ' translate3d(' + bfx + 'px, ' + bfy + 'px, 0)'
            : 'translate3d(' + bfx + 'px, ' + bfy + 'px, 0)';
        oddEven = -oddEven; // alternate direction for badges (adds depth variety)
      });
    }
  }

  // ── Entrance animation ────────────────────────────────────────
  function runEntranceAnimation() {
    var left = document.querySelector('.hero-parallax-left');
    var right = document.querySelector('.hero-parallax-right');

    if (left) {
      left.style.opacity = '0';
      left.style.transform = 'translateY(32px)';
      setTimeout(function() {
        left.style.transition = 'opacity 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        left.style.opacity = '1';
        left.style.transform = 'translateY(0)';
      }, 200);
    }

    if (right) {
      right.style.opacity = '0';
      right.style.transform = 'scale(0.96)';
      setTimeout(function() {
        right.style.transition = 'opacity 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        right.style.opacity = '1';
        right.style.transform = 'scale(1)';
      }, 350);
    }

    // Stagger badge entrances
    badges.forEach(function(badge, i) {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(20px) scale(0.85)';
      setTimeout(function() {
        badge.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        badge.style.opacity = '1';
        badge.style.transform = 'translateY(0) scale(1)';
      }, 600 + i * 150);
    });
  }

  // ── Boot when DOM ready ───────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
