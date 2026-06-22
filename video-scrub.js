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
  let targetTime        = 0;
  let currentTime       = 0;
  let hintHidden        = false;
  const LERP            = 0.10; // Higher = snappier response, 0.08–0.12 is ideal

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
        video.addEventListener('loadedmetadata', proceed, { once: true });
      }
      return;
    }

    body.classList.add('video-loading-lock');

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
        // Hide scroll hint since scrubbing is disabled
        if (hint) {
          hint.style.opacity = '0';
          hint.style.pointerEvents = 'none';
        }
      }, 100);
      return;
    }

    if (video.readyState >= 1) {
      startIntroPlayback();
    } else {
      video.addEventListener('loadedmetadata', startIntroPlayback, { once: true });
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
    video.addEventListener('ended', onHandoff, { once: true });
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
      console.error('[VideoScrub] GSAP or ScrollTrigger not loaded!');
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

      // Function to get absolute scroll distance to showcase section
      const getScrollDistance = () => {
        const pageContent = document.getElementById('page-content');
        const showcase = document.getElementById('showcase-section');
        if (!pageContent || !showcase) return window.innerHeight * 3;
        return showcase.getBoundingClientRect().top + window.scrollY;
      };

      const getInitialVideoTransform = () => {
        return { xPercent: 30, scale: 1.15 };
      };

      // Set up variables
      const initial = getInitialVideoTransform();
      const playhead = { time: video.duration };
      const totalDist = getScrollDistance();
      const vh = window.innerHeight;

      // Calculate percentage ratios within the total scroll timeline
      const shiftStart = (0.4 * vh) / totalDist;
      const shiftEnd = (1.2 * vh) / totalDist;
      const fadeStart = (0.4 * vh) / totalDist;
      const fadeEnd = (0.9 * vh) / totalDist;

      // Single, Unified GSAP Timeline for perfect sync of position & playhead frame
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#page-content',
          start: 'top top',
          endTrigger: '#showcase-section',
          end: 'top top',
          scrub: 1.0, // perfectly smooth catch-up
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Fade out scroll hint once user has started scrubbing
            if (!hintHidden && self.progress > 0.02 && hint) {
              hint.style.opacity = '0';
              hint.style.transition = 'opacity 0.5s ease';
              hintHidden = true;
            }
          }
        }
      });

      // 1. Scrub video playhead from duration (assembled) to 0 (unassembled)
      tl.to(playhead, {
        time: 0,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          if (video.duration) {
            video.currentTime = playhead.time;
          }
        }
      }, 0);

      // 2. Animate video position & scale (spatial transition) - DISABLED to keep robot fixed at 2/3 line
      // tl.fromTo(video, 
      //   {
      //     xPercent: initial.xPercent,
      //     scale: initial.scale
      //   },
      //   {
      //     xPercent: 0,
      //     scale: 1.35,
      //     ease: 'power1.inOut',
      //     duration: shiftEnd - shiftStart
      //   },
      //   shiftStart
      // );

      // 3. Fade out video overlay
      tl.to('#video-overlay', {
        opacity: 0,
        ease: 'power1.inOut',
        duration: shiftEnd - shiftStart
      }, shiftStart);

      // 4. Fade out hero panel
      tl.to('#hero-panel', {
        autoAlpha: 0, // opacity + visibility toggle
        ease: 'power1.inOut',
        duration: fadeEnd - fadeStart
      }, fadeStart);
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

  // ─── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
  } else {
    initLoader();
  }

})();
