/**
 * STEMulus Kids Tech — Interactive Engine
 * Orchestrates:
 * 1. Executive non-blocking top hairline loader
 * 2. Interactive curriculum code specimen tab switching
 * 3. 4-Phase architectural syllabus accordion interaction
 */

(function () {
  'use strict';

  // 1. Executive Top Hairline Loader
  function initLoader() {
    var loader = document.getElementById('stem-top-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'stem-top-loader';
      loader.innerHTML = '<div id="stem-top-loader-bar"></div>';
      document.body.appendChild(loader);
    }

    var bar = document.getElementById('stem-top-loader-bar');
    if (!bar) return;

    // Fast progression
    bar.style.width = '35%';
    setTimeout(function () {
      bar.style.width = '75%';
    }, 100);

    function completeLoader() {
      bar.style.width = '100%';
      setTimeout(function () {
        bar.style.opacity = '0';
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 300);
      }, 150);
    }

    if (document.readyState === 'complete') {
      completeLoader();
    } else {
      window.addEventListener('load', completeLoader);
    }
  }

  // 2. Interactive Code Specimen Tabs
  function initSpecimenTabs() {
    document.querySelectorAll('.specimen-wrap').forEach(function (wrap) {
      var tabs = wrap.querySelectorAll('.specimen-tab');
      var codePanes = wrap.querySelectorAll('[data-specimen-pane]');
      var termPanes = wrap.querySelectorAll('[data-terminal-pane]');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var targetId = tab.getAttribute('data-tab');

          tabs.forEach(function (t) { t.classList.remove('active'); });
          tab.classList.add('active');

          codePanes.forEach(function (pane) {
            if (pane.getAttribute('data-specimen-pane') === targetId) {
              pane.style.display = 'block';
            } else {
              pane.style.display = 'none';
            }
          });

          termPanes.forEach(function (term) {
            if (term.getAttribute('data-terminal-pane') === targetId) {
              term.style.display = 'block';
            } else {
              term.style.display = 'none';
            }
          });
        });
      });
    });
  }

  // 3. Architectural Syllabus Accordion
  function initSyllabusAccordion() {
    document.querySelectorAll('.syllabus-phase-header').forEach(function (header) {
      header.addEventListener('click', function () {
        var card = header.closest('.syllabus-phase-card');
        if (!card) return;
        var isOpen = card.classList.contains('open');

        // Close siblings for clean focused view
        var dossier = card.closest('.syllabus-dossier');
        if (dossier) {
          dossier.querySelectorAll('.syllabus-phase-card').forEach(function (sibling) {
            if (sibling !== card) sibling.classList.remove('open');
          });
        }

        if (isOpen) {
          card.classList.remove('open');
        } else {
          card.classList.add('open');
        }
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLoader();
      initSpecimenTabs();
      initSyllabusAccordion();
    });
  } else {
    initLoader();
    initSpecimenTabs();
    initSyllabusAccordion();
  }
})();
