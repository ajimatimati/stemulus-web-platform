/**
 * STEMulus v2.0 — Step Accordion + Canvas Animator
 * Manages the "How It Works" two-column layout.
 * Left: accordion that advances every 5s.
 * Right: canvas that draws a dot grid and the current step number.
 */
(function() {
  'use strict';

  function initStepSection(section) {
    const items = section.querySelectorAll('.step-item');
    const canvas = section.querySelector('.step-canvas');
    if (!items.length || !canvas) return;

    const ctx = canvas.getContext('2d');
    const INTERVAL = 5000;
    
    let currentIdx = 0;
    let timer = null;
    let animFrame = null;
    
    // Canvas sizing
    let width = canvas.offsetWidth || 460;
    let height = canvas.offsetHeight || 460;
    const dpr = window.devicePixelRatio || 1;
    
    function resizeCanvas() {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      drawCurrentState(1); // fully drawn on resize
    }
    
    const ro = new ResizeObserver(() => {
      // Debounce resize
      requestAnimationFrame(resizeCanvas);
    });
    ro.observe(canvas);
    
    function drawDotGrid() {
      const cols = 24;
      const spacing = width / cols;
      const rows = Math.floor(height / spacing);
      
      ctx.fillStyle = 'rgba(7,13,31,0.06)';
      const radius = 1.5;
      
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          ctx.beginPath();
          ctx.arc(i * spacing, j * spacing, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    function drawNumber(numText, progress) {
      const fontSize = Math.min(width, height) * 0.7;
      ctx.font = `700 ${fontSize}px "Nunito", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate drawing state based on progress
      ctx.globalAlpha = Math.min(1, progress * 1.5); // fades in
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(229,178,42,0.2)'; // Gold accent with low opacity
      
      // If we wanted a true stroke-draw we'd use setLineDash, 
      // but a fade-in stroke is cleaner and cheaper on GPU
      ctx.strokeText(numText, width / 2, height / 2 + (fontSize * 0.05));
      ctx.globalAlpha = 1.0;
    }
    
    function drawCurrentState(progress) {
      ctx.clearRect(0, 0, width, height);
      drawDotGrid();
      
      const numText = (currentIdx + 1).toString();
      drawNumber(numText, progress);
    }
    
    function animateChange() {
      if (animFrame) cancelAnimationFrame(animFrame);
      
      const duration = 600;
      let start = null;
      
      function step(timestamp) {
        if (!start) start = timestamp;
        const p = Math.min(1, (timestamp - start) / duration);
        
        // Easing: ease-out
        const easeP = 1 - Math.pow(1 - p, 3);
        
        drawCurrentState(easeP);
        
        if (p < 1) {
          animFrame = requestAnimationFrame(step);
        }
      }
      
      animFrame = requestAnimationFrame(step);
    }
    
    function setStep(index) {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      });
      
      currentIdx = index;
      animateChange();
    }
    
    function next() {
      setStep((currentIdx + 1) % items.length);
    }
    
    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, INTERVAL);
    }
    
    // Bind click events
    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        if (currentIdx !== i) {
          clearInterval(timer);
          setStep(i);
          startTimer();
        }
      });
      
      // Keyboard a11y
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
    
    // Initial setup
    resizeCanvas();
    setStep(0);
    
    // Only start timer when visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        startTimer();
      } else {
        clearInterval(timer);
      }
    }, { threshold: 0.2 });
    
    observer.observe(section);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.step-accordion-section').forEach(initStepSection);
  });
})();
