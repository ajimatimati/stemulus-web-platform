/**
 * STEMulus Visual Enhancements v1.0
 * Implements: Before/After Slider, 3D Cards, Animated Growth, Odometer Counters
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initBeforeAfterSlider();
        init3DCards();
        initAnimatedGrowth();
        initOdometerCounters();
        console.log('[Enhancements] ✅ All visual enhancements loaded');
    }

    // ============================================================
    // ENHANCEMENT 1: Before/After Image Comparison Slider
    // ============================================================
    function initBeforeAfterSlider() {
        const sliders = document.querySelectorAll('.before-after-slider');
        sliders.forEach(slider => {
            const handle = slider.querySelector('.slider-handle');
            const beforeImg = slider.querySelector('.before-image');
            
            if (!handle || !beforeImg) return;

            let isDragging = false;

            const updateSlider = (x) => {
                const rect = slider.getBoundingClientRect();
                let percentage = ((x - rect.left) / rect.width) * 100;
                percentage = Math.max(5, Math.min(95, percentage));
                
                beforeImg.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                handle.style.left = `${percentage}%`;
            };

            // Mouse events
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) updateSlider(e.clientX);
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Touch events
            handle.addEventListener('touchstart', (e) => {
                isDragging = true;
            });

            document.addEventListener('touchmove', (e) => {
                if (isDragging) updateSlider(e.touches[0].clientX);
            });

            document.addEventListener('touchend', () => {
                isDragging = false;
            });

            // Initial position
            updateSlider(slider.getBoundingClientRect().left + slider.offsetWidth / 2);
        });
    }

    // ============================================================
    // ENHANCEMENT 2: 3D Tilt Effect for Cards with Holographic Shine
    // ============================================================
    function init3DCards() {
        const cards = document.querySelectorAll('.card-3d-tilt');
        
        cards.forEach(card => {
            const shine = document.createElement('div');
            shine.className = 'card-shine';
            card.appendChild(shine);

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation (max 15 degrees)
                const rotateX = ((y - centerY) / centerY) * -8;
                const rotateY = ((x - centerX) / centerX) * 8;
                
                // Apply 3D transform
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
                
                // Move holographic shine
                shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3) 0%, transparent 50%)`;
                shine.style.opacity = '1';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                shine.style.opacity = '0';
            });
        });
    }

    // ============================================================
    // ENHANCEMENT 3: Animated Growth Journey (Scroll-triggered)
    // ============================================================
    function initAnimatedGrowth() {
        const growthItems = document.querySelectorAll('.growth-animate');
        
        if (growthItems.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered animation delay
                    entry.target.style.animationDelay = `${index * 0.3}s`;
                    entry.target.classList.add('growth-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        growthItems.forEach(item => observer.observe(item));
    }

    // ============================================================
    // ENHANCEMENT 4: Odometer-style Counter Animation
    // ============================================================
    function initOdometerCounters() {
        const counters = document.querySelectorAll('.odometer-counter');
        
        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateOdometer(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            // Prepare the counter display
            const target = counter.dataset.target;
            const suffix = counter.dataset.suffix || '';
            const prefix = counter.dataset.prefix || '';
            
            // Create digit containers
            counter.innerHTML = '';
            const digits = String(target).split('');
            
            digits.forEach((digit, i) => {
                if (isNaN(parseInt(digit))) {
                    // Non-numeric character (like '/' or '.')
                    const span = document.createElement('span');
                    span.className = 'odometer-separator';
                    span.textContent = digit;
                    counter.appendChild(span);
                } else {
                    const digitWrap = document.createElement('span');
                    digitWrap.className = 'odometer-digit-wrap';
                    digitWrap.dataset.target = digit;
                    
                    const digitRoll = document.createElement('span');
                    digitRoll.className = 'odometer-digit-roll';
                    digitRoll.innerHTML = '0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0';
                    
                    digitWrap.appendChild(digitRoll);
                    counter.appendChild(digitWrap);
                }
            });
            
            if (suffix) {
                const suffixSpan = document.createElement('span');
                suffixSpan.className = 'odometer-suffix';
                suffixSpan.textContent = suffix;
                counter.appendChild(suffixSpan);
            }
            
            observer.observe(counter);
        });
    }

    function animateOdometer(counter) {
        const digitWraps = counter.querySelectorAll('.odometer-digit-wrap');
        
        digitWraps.forEach((wrap, i) => {
            const target = parseInt(wrap.dataset.target);
            const roll = wrap.querySelector('.odometer-digit-roll');
            
            setTimeout(() => {
                // Each digit is ~1em tall, so translate by target * -1em
                roll.style.transform = `translateY(${-target}em)`;
                roll.style.transition = `transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)`;
                
                // Add glow effect on completion
                setTimeout(() => {
                    wrap.classList.add('odometer-complete');
                }, 1200);
            }, i * 100);
        });
        
        // Add overall completion glow
        setTimeout(() => {
            counter.classList.add('odometer-glow');
        }, digitWraps.length * 100 + 1200);
    }

})();
