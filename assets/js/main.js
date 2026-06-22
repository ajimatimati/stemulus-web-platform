// =========================================================================
// STEMulus Global Animations & Logic
// Includes: Locomotive Scroll, Global Animations (Momentum, Directional)
// =========================================================================

// Wait for Window Load to ensure images/layout are ready
window.addEventListener('load', () => {
    


    // SEO Service Worker removed (Humanization Phase 1)

    // Native Scroll Listener for Navbar and Progress
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const header = document.getElementById('header');
        const scrollProgress = document.getElementById('scroll-progress');
        
        // Navbar Effect
        if (header) {
            if (scrollY > 100) {
                header.classList.add('navbar-scrolled');
            } else {
                header.classList.remove('navbar-scrolled');
            }
        }

        // Scroll Progress Bar
        if (scrollProgress) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            scrollProgress.style.width = scrolled + "%";
        }
    }, { passive: true });


    // -------------------------------------------------------------------------
    // Mobile Menu Logic (Global)
    // -------------------------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                mobileMenu.classList.remove('opacity-0');
                
                // Staggered animation for links
                const links = mobileMenu.querySelectorAll('.mobile-nav-link');
                links.forEach((link, index) => {
                    setTimeout(() => {
                        link.classList.remove('translate-y-4', 'opacity-0');
                    }, index * 50);
                });
            }, 10);
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('opacity-0');
            
            // Reset links
            const links = mobileMenu.querySelectorAll('.mobile-nav-link');
            links.forEach(link => {
                link.classList.add('translate-y-4', 'opacity-0');
            });

            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 300);
        });
    }

    // Init Global Animations
    initMomentumCards();
    initDirectionalHover();
});



// -------------------------------------------------------------------------
// 2. Momentum Inertia Hover (Physics-based Tilt)
// -------------------------------------------------------------------------
function initMomentumCards() {
    const cards = document.querySelectorAll('.hover-momentum, .program-card, .tilt-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt (limit to +/- 10 deg)
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;

            // Apply Transform
            gsap.to(card, {
                transformPerspective: 1000,
                rotateX: rotateX,
                rotateY: rotateY,
                scale: 1.05,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            });
        });
    });
}

// -------------------------------------------------------------------------
// 3. Directional List Hover (Enter/Exit Direction)
// -------------------------------------------------------------------------
function initDirectionalHover() {
    const listItems = document.querySelectorAll('.hover-directional li, .nav-link'); // Add .hover-directional to ULs

    listItems.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            const dir = getDirection(e, item);
            animateDirection(item, 'in', dir);
        });

        item.addEventListener('mouseleave', (e) => {
            const dir = getDirection(e, item);
            animateDirection(item, 'out', dir);
        });
    });
}

function getDirection(e, item) {
    const w = item.offsetWidth;
    const h = item.offsetHeight;
    const rect = item.getBoundingClientRect();
    const x = (e.pageX - rect.left - (w / 2)) * (w > h ? (h / w) : 1);
    const y = (e.pageY - rect.top - (h / 2)) * (h > w ? (w / h) : 1);
    
    // 0: top, 1: right, 2: bottom, 3: left
    return Math.round((((Math.atan2(y, x) * (180 / Math.PI)) + 180) / 90) + 3) % 4;
}

function animateDirection(item, state, direction) {
    const content = item.querySelector('.hover-content') || item; 
    let x = 0, y = 0;

    // Defined Offsets
    switch(direction) {
        case 0: y = -100; break; // Top
        case 1: x = 100; break;  // Right
        case 2: y = 100; break;  // Bottom
        case 3: x = -100; break; // Left
    }

    if (state === 'in') {
        gsap.fromTo(content, 
            { x: x + '%', y: y + '%', opacity: 0 }, 
            { x: '0%', y: '0%', opacity: 1, duration: 0.4, ease: "power3.out" }
        );
    } else {
        gsap.to(content, 
            { x: x + '%', y: y + '%', opacity: 0, duration: 0.4, ease: "power3.in" }
        );
    }
}
