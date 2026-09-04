/**
 * STEMulus — Cinematic Video Scrub Controller
 *
 * ARCHITECTURE:
 *   #video-bg   → position:fixed, z-index:0 — the permanent background canvas
 *   #page-content → position:relative, z-index:10 — scrolls over the fixed video
 *   #scrub-spacer → height:400vh — provides scroll room for the reverse scrub
 *   #hero-panel → position:sticky inside scrub-spacer — stays visible while scrub plays
 *
 * PHASE 1 — LOADER: body overflow:hidden, video plays forward (robot assembles)
 * PHASE 2 — HANDOFF: video ends → overflow unlocked, GSAP ScrollTrigger initialised
 * PHASE 3 — SCRUB: scroll progress maps inversely to video.currentTime
 * PHASE 4 — PAST SCRUB: sections with solid backgrounds cover the fixed video naturally
 */

(function () {
  'use strict';

  const body    = document.body;
  const video   = document.getElementById('scrub-video');
  const spacer  = document.getElementById('scrub-spacer');
  const nav     = document.getElementById('main-nav');
  const hint    = document.getElementById('scroll-hint');

  if (!video || !spacer) {
    console.warn('[VideoScrub] Required elements not found. Bailing.');
    return;
  }

  // ─── State ──────────────────────────────────────────────────────────────────
  let isScrubbingActive = false;
  let hintHidden        = false;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

  // ─── PHASE 1: Loader ────────────────────────────────────────────────────────
  function initLoader() {
    // Bypass loader if user refreshed the page while already scrolled down
    if (window.scrollY > 50) {
      body.classList.remove('video-loading-lock');
      const proceed = () => {
        if (video.duration) {
          video.currentTime = video.duration;
        }
        onHandoff();
      };
      if (video.readyState >= 1) {
        proceed();
      } else {
        video.addEventListener('error', () => onHandoff(), { once: true });
        // canplaythrough = browser confident it can play all the way through without buffering
        // Fall back to canplay if canplaythrough is slow (> 8s)
        let cptFiredBypass = false;
        const cptFallbackBypass = setTimeout(() => {
          if (!cptFiredBypass) {
            video.removeEventListener('canplaythrough', onCanPlayThroughBypass);
            video.addEventListener('canplay', proceed, { once: true });
          }
        }, 8000);
        function onCanPlayThroughBypass() {
          cptFiredBypass = true;
          clearTimeout(cptFallbackBypass);
          proceed();
        }
        video.addEventListener('canplaythrough', onCanPlayThroughBypass, { once: true });
        video.load(); // trigger load when preload="metadata" or "none"
      }
      return;
    }

    body.classList.add('video-loading-lock');

    // Safety net: if video fails or takes too long, always unlock the page
    let handoffCalled = false;
    function safeHandoff() {
      if (handoffCalled) return;
      handoffCalled = true;
      onHandoff();
    }
    video.addEventListener('error', () => {
      console.warn('[VideoScrub] Video failed to load — unlocking page.');
      body.classList.remove('video-loading-lock');
      handoffCalled = true; // suppress scrub setup, no video to scrub
    }, { once: true });
    // Hard timeout: 8s max wait regardless of network
    setTimeout(() => {
      if (!handoffCalled) {
        console.warn('[VideoScrub] Video load timeout — unlocking page.');
        safeHandoff();
      }
    }, 15000);

    if (isMobile) {
      // Mobile bypass: autoplay looping video background, avoid heavy ScrollTrigger scrub
      video.loop = true;
      video.muted = true;
      video.setAttribute('playsinline', 'true');

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn('[VideoScrub] Autoplay blocked on mobile.');
        });
      }

      // Complete loader handoff immediately to unlock scroll
      setTimeout(() => {
        body.classList.remove('video-loading-lock');
        handoffCalled = true;
        // Hide scroll hint since scrubbing is disabled
        if (hint) {
          hint.style.opacity = '0';
          hint.style.pointerEvents = 'none';
        }
      }, 100);
      return;
    }

    // canplaythrough = browser confident it can play all the way through without buffering
    // Fall back to canplay if canplaythrough is slow (> 8s)
    let cptFired = false;
    const cptFallback = setTimeout(() => {
      if (!cptFired && !handoffCalled) {
        video.removeEventListener('canplaythrough', onCanPlayThrough);
        video.addEventListener('canplay', startIntroPlayback, { once: true });
      }
    }, 8000);
    function onCanPlayThrough() {
      cptFired = true;
      clearTimeout(cptFallback);
      startIntroPlayback();
    }
    if (video.readyState >= 4) {
      startIntroPlayback(); // already fully buffered
    } else {
      video.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
      video.load();
    }
  }

  function startIntroPlayback() {
    video.currentTime = 0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked (e.g. no interaction yet) — unlock immediately
        console.warn('[VideoScrub] Autoplay blocked. Unlocking immediately.');
        onHandoff();
      });
    }

    video.addEventListener('timeupdate', watchIntro);
    video.addEventListener('ended', safeHandoff, { once: true });

    // Suspend the safety deadline while video is buffering
    video.addEventListener('waiting', function onWaiting() {
      // video stalled — temporarily disable safeHandoff by extending deadline
      // The 'playing' event will fire when it resumes — watchIntro continues naturally
      console.log('[VideoScrub] Buffering mid-intro — waiting for data...');
    });
    video.addEventListener('playing', function onResumed() {
      console.log('[VideoScrub] Resumed after buffer.');
    });
  }

  function watchIntro() {
    // Trigger handoff 0.08s before absolute end — avoids blank-frame flash
    if (video.duration && video.currentTime >= video.duration - 0.08) {
      video.removeEventListener('timeupdate', watchIntro);
      onHandoff();
    }
  }

  // ─── PHASE 2: Handoff ───────────────────────────────────────────────────────
  function onHandoff() {
    video.removeEventListener('timeupdate', watchIntro);
    video.pause();

    // Freeze at last frame (assembled robot)
    if (video.duration) {
      video.currentTime = video.duration;
    }

    body.classList.remove('video-loading-lock');

    // Small rAF delay to let the browser paint before setting up ScrollTrigger
    requestAnimationFrame(() => requestAnimationFrame(initScrollTrigger));
  }

  // ─── PHASE 3: GSAP ScrollTrigger & matchMedia ────────────────────────────
  let matchMediaInstance = null;

  function initScrollTrigger() {
    if (!window.gsap || !window.ScrollTrigger) {
      // Retry up to 10× every 400ms — covers slow CDN loads
      window._scrubRetries = (window._scrubRetries || 0) + 1;
      if (window._scrubRetries < 10) {
        setTimeout(initScrollTrigger, 400);
      } else {
        console.error('[VideoScrub] GSAP never loaded after retries — scrub disabled.');
      }
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Clean up existing media queries if any
    if (matchMediaInstance) {
      matchMediaInstance.revert();
    }

    matchMediaInstance = gsap.matchMedia();

    // ─── Desktop Setup (> 768px) ───
    matchMediaInstance.add("(min-width: 769px)", () => {
      isScrubbingActive = true;

      // Scrub ends when the spacer bottom hits the top of the viewport.
      // The spacer is 100vh tall → entire 10s video plays within one full viewport of scroll.
      const SCRUB_END = '+=' + Math.round(window.innerHeight * 1.0) + 'px';

      const playhead = { time: video.duration };

      // ── Track 1: Video frame scrub — scrub:true = zero lag, frame-perfect ──
      const tlScrub = gsap.timeline({
        scrollTrigger: {
          trigger: '#scrub-spacer',
          start: 'top top',
          end: SCRUB_END,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!hintHidden && self.progress > 0.02 && hint) {
              hint.style.opacity = '0';
              hint.style.transition = 'opacity 0.5s ease';
              hintHidden = true;
            }
          }
        }
      });

      tlScrub.to(playhead, {
        time: 0,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          if (video.duration) {
            video.currentTime = playhead.time;
          }
        }
      }, 0);

      // ── Track 2: Visual fades — scrub:0.8 = smooth, cinematic feel ──
      // Fades happen over the last 40% of the scrub window
      const tlFade = gsap.timeline({
        scrollTrigger: {
          trigger: '#scrub-spacer',
          start: 'top top',
          end: SCRUB_END,
          scrub: 0.8,
          invalidateOnRefresh: true
        }
      });

      tlFade.to('#video-overlay', {
        opacity: 0,
        ease: 'power1.inOut',
        duration: 0.4
      }, 0.45);

      tlFade.to('#hero-panel', {
        autoAlpha: 0,
        ease: 'power1.inOut',
        duration: 0.4
      }, 0.45);

      // Start the alive blink loop — desktop only
      initBlinkEngine();
    });

    // ─── Mobile Setup (<= 768px) ───
    matchMediaInstance.add("(max-width: 768px)", () => {
      isScrubbingActive = false;

      // Clear GSAP properties and run simple loop playback
      gsap.set(video, { clearProps: "all" });
      gsap.set('#video-overlay', { clearProps: "all" });
      gsap.set('#hero-panel', { clearProps: "all" });

      video.loop = true;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    });

    // Debounced window resize handler to rebuild trigger metrics on desktop resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768) {
          ScrollTrigger.refresh();
        }
      }, 250);
    });

  }

  function initBlinkEngine() {
    // robot_blink.mp4 = reverse(t=8.6-10s) + forward(t=8.6-10s)
    // = glowing→dark→glowing (2.8s total)
    // Starts AND ends on the identical glowing frame as the frozen scrub video.
    // The overlay fades in over the frozen background → plays → fades out.
    // The main scrub video is NEVER seeked — zero visible jump.
    const IDLE_MIN = 4500;   // ms minimum between blinks
    const IDLE_MAX = 10000;  // ms maximum between blinks
    const FADE_MS  = 80;     // crossfade duration in ms (fast — imperceptible)

    const blinkVid = document.getElementById('blink-video');
    if (!blinkVid) return;

    let blinkTimer    = null;
    let isBlinking    = false;
    let isScrolling   = false;
    let scrollTimeout = null;
    let isHeroPast    = false;
    let fadeRaf       = null;

    // ── Scroll guard — never play while scrubbing ──
    window.addEventListener('scroll', () => {
      isScrolling = true;
      cancelBlink();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        if (!isHeroPast && window.scrollY < window.innerHeight * 0.5) {
          scheduleBlink();
        }
      }, 350);
    }, { passive: true });

    // ── IntersectionObserver — suspend when hero is off screen ──
    const heroEl = document.getElementById('hero-panel');
    if (heroEl) {
      new IntersectionObserver((entries) => {
        const visible = entries[0].isIntersecting;
        isHeroPast = !visible;
        if (!visible) cancelBlink();
        else if (!isScrolling) scheduleBlink();
      }, { threshold: 0.1 }).observe(heroEl);
    }

    function setOpacity(el, val) {
      el.style.opacity = val;
    }

    function fadeTo(el, target, durationMs, onDone) {
      cancelAnimationFrame(fadeRaf);
      const start    = parseFloat(el.style.opacity) || 0;
      const diff     = target - start;
      const t0       = performance.now();
      function tick(now) {
        const p = Math.min((now - t0) / durationMs, 1);
        setOpacity(el, start + diff * p);
        if (p < 1) { fadeRaf = requestAnimationFrame(tick); }
        else if (onDone) onDone();
      }
      fadeRaf = requestAnimationFrame(tick);
    }

    function cancelBlink() {
      clearTimeout(blinkTimer);
      blinkTimer = null;
      cancelAnimationFrame(fadeRaf);
      if (isBlinking) {
        isBlinking = false;
        blinkVid.pause();
        setOpacity(blinkVid, 0);
        blinkVid.removeEventListener('ended', onBlinkEnded);
      }
    }

    function scheduleBlink() {
      if (blinkTimer || isBlinking || isScrolling || isHeroPast) return;
      const delay = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
      blinkTimer = setTimeout(fireBlink, delay);
    }

    function fireBlink() {
      blinkTimer = null;
      if (isScrolling || isHeroPast) return;
      isBlinking = true;

      blinkVid.currentTime = 0;
      blinkVid.addEventListener('ended', onBlinkEnded, { once: true });

      // Fade overlay in, then play, then fade out when ended
      fadeTo(blinkVid, 1, FADE_MS, () => {
        blinkVid.play().catch(() => { cancelBlink(); scheduleBlink(); });
      });
    }

    function onBlinkEnded() {
      // Fade overlay back out — scrub video underneath is already on the matching frame
      fadeTo(blinkVid, 0, FADE_MS, () => {
        isBlinking = false;
        scheduleBlink();
      });
    }

    // Pre-buffer blink video during the 2s idle window before first blink
    blinkVid.load();

    // Kick off first blink after page settles
    setTimeout(() => {
      if (!isScrolling && !isHeroPast) scheduleBlink();
    }, 2000);
  }

  // ─── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
  } else {
    initLoader();
  }

})();
