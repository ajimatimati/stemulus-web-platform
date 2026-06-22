/**
 * STEMulus Mobile Navigation
 * Dynamically injects a hamburger button + full-screen drawer into
 * every page that uses .nav-editorial
 */
(function () {
  'use strict';

  // ── 1. Disable custom cursor on touch devices ────────────────────
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.style.cursor = 'auto';
    var toHide = ['cursor-ring', 'cursor-dot'];
    toHide.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  // ── 2. Find the editorial nav ────────────────────────────────────
  var nav = document.querySelector('.nav-editorial');
  if (!nav) return; // Not an editorial-nav page — bail gracefully

  // ── 3. Collect all nav links except the logo ────────────────────
  var links = [];
  nav.querySelectorAll('a').forEach(function (a) {
    if (a.classList.contains('nav-logo-editorial')) return;
    // Detect if it's the enroll CTA (orange button)
    var isEnroll = (
      a.href && a.href.indexOf('enroll') !== -1 &&
      (a.style.background || a.style.backgroundColor || a.className.indexOf('enroll') !== -1)
    );
    links.push({
      href: a.getAttribute('href') || '#',
      text: a.textContent.trim(),
      isEnroll: isEnroll
    });
  });

  if (links.length === 0) return; // Nothing to put in the drawer

  // ── 4. Create hamburger button ───────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobile-nav-drawer');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  // ── 5. Create mobile drawer ──────────────────────────────────────
  var drawer = document.createElement('nav');
  drawer.id = 'mobile-nav-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Navigation menu');
  drawer.setAttribute('hidden', '');

  // Close button inside the drawer
  var closeBtn = document.createElement('button');
  closeBtn.id = 'mnav-close-btn';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  closeBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  drawer.appendChild(closeBtn);

  // Separate regular links from the enroll CTA
  var regularLinks = links.filter(function (l) { return !l.isEnroll; });
  var enrollLinks  = links.filter(function (l) { return  l.isEnroll; });

  regularLinks.forEach(function (link) {
    var a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    drawer.appendChild(a);
  });

  enrollLinks.forEach(function (link) {
    var a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.className = 'mnav-enroll';
    drawer.appendChild(a);
  });

  // If no enroll link found, add a default one
  if (enrollLinks.length === 0) {
    var ea = document.createElement('a');
    ea.href = 'enroll.html';
    ea.textContent = 'Enroll Now';
    ea.className = 'mnav-enroll';
    drawer.appendChild(ea);
  }

  document.body.appendChild(drawer);

  // ── 6. Open / close helpers ──────────────────────────────────────
  function openDrawer() {
    drawer.removeAttribute('hidden');
    // Force reflow so transition plays
    drawer.getBoundingClientRect();
    drawer.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mobile-nav-open');
    // Focus first link for accessibility
    var firstLink = drawer.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-nav-open');
    // Re-hide after transition
    drawer.addEventListener('transitionend', function hide() {
      if (!drawer.classList.contains('open')) {
        drawer.setAttribute('hidden', '');
      }
      drawer.removeEventListener('transitionend', hide);
    });
  }

  // ── 7. Event listeners ──────────────────────────────────────────
  btn.addEventListener('click', function () {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  // Close button click
  closeBtn.addEventListener('click', function () { closeDrawer(); btn.focus(); });

  // Close when any link inside the drawer is clicked
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeDrawer);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.keyCode === 27) && drawer.classList.contains('open')) {
      closeDrawer();
      btn.focus();
    }
  });

  // Trap focus inside drawer when open
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var focusable = drawer.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // ── 8. Close drawer on resize to desktop ────────────────────────
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // ── 9. Hide Header on Scroll Down ─────────────────────────────────
  var lastScrollTop = 0;
  var isNavHidden = false;

  window.addEventListener('scroll', function () {
    // Disable hide-on-scroll if the mobile menu is currently open
    if (drawer.classList.contains('open')) return;

    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Scrolling down & passed a rough threshold of 100px
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      if (!isNavHidden) {
        nav.classList.add('nav-hidden');
        isNavHidden = true;
      }
    } else {
      // Scrolling up or at the very top
      if (isNavHidden) {
        nav.classList.remove('nav-hidden');
        isNavHidden = false;
      }
    }
    
    // Ensure negative scrolling (overscroll on Macs/Phones) doesn't break logic
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }, { passive: true });

  // ── 10. Nav Logo Swap on Light Sections ──────────────────────────
  // When the nav overlaps a light section, swap the logo to dark
  var logoImg = nav.querySelector('.nav-logo-editorial img');
  if (logoImg) {
    var lightSections = document.querySelectorAll('.section--cream, .section--cream-warm, .section--cream-sage, .section--cream-sky, .section--cream-lilac, .section--neutral, [data-theme="light"]');
    
    if (lightSections.length > 0 && window.IntersectionObserver) {
      // Create a sentinel at the top of the viewport
      var sentinel = document.createElement('div');
      sentinel.style.position = 'fixed';
      sentinel.style.top = '24px'; // Height of nav center roughly
      sentinel.style.left = '0';
      sentinel.style.width = '10px';
      sentinel.style.height = '10px';
      sentinel.style.pointerEvents = 'none';
      sentinel.style.zIndex = '-1';
      document.body.appendChild(sentinel);

      function checkLogoIntersect() {
        var navRect = nav.getBoundingClientRect();
        var navCenterY = navRect.top + (navRect.height / 2);
        
        var isOverLight = false;
        for (var i = 0; i < lightSections.length; i++) {
          var rect = lightSections[i].getBoundingClientRect();
          // Check if the center of the nav is within this section
          if (navCenterY >= rect.top && navCenterY <= rect.bottom) {
            isOverLight = true;
            break;
          }
        }
        
        if (isOverLight) {
          nav.classList.add('nav-on-light');
          logoImg.style.filter = 'none';
        } else {
          nav.classList.remove('nav-on-light');
          logoImg.style.filter = 'none';
        }
      }

      window.addEventListener('scroll', checkLogoIntersect, { passive: true });
      // Initial check
      checkLogoIntersect();
    }
  }

  // ── 11. Highlight active page in navigation ───────────────────────
  (function highlightActiveLink() {
    var currentPath = window.location.pathname;
    if (currentPath.endsWith('/')) {
      currentPath = currentPath.slice(0, -1);
    }
    var page = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    var pageName = page.replace(/\.html$/, '').toLowerCase();
    
    // Default to index if empty
    if (pageName === '' || pageName === 'index') {
      pageName = 'index';
    }

    // List of program subpages to map to "Roadmap"
    var programSubpages = [
      'ai-machine-learning',
      'arduino-robotics',
      'creative-coding',
      'digital-art',
      'fullstack-web-dev',
      'junior-robotics',
      'python-programming',
      'scratch-creators',
      'web-wizards'
    ];

    var navLinks = document.querySelectorAll('.nav-editorial a:not(.nav-logo-editorial):not(.nav-cta-btn)');
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      
      var linkPage = href.substring(href.lastIndexOf('/') + 1);
      var linkName = linkPage.replace(/\.html$/, '').toLowerCase();

      var isActive = false;
      if (linkName === pageName) {
        isActive = true;
      } else if (linkName === 'programs' && programSubpages.indexOf(pageName) !== -1) {
        isActive = true;
      } else if (linkName === 'blog' && pageName.indexOf('blog-') === 0) {
        isActive = true;
      }

      if (isActive) {
        link.classList.add('active-nav');
      } else {
        link.classList.remove('active-nav');
      }
    });
  })();

})();
