/**
 * STEMulus Portal Scene Engine v3
 * Handles role switching (blob + 3D object crossfade), card animations, and video management.
 */
const PortalSceneEngine = (function () {
    'use strict';

    const ASSET_BASE = 'images/portal/standalone/';

    const roles = {
        parent: {
            gradient: ['#4FC3F7', '#66BB6A'],
            object: ASSET_BASE + 'rocket-3d.png',
            headline: 'Welcome to<br>STEMulus',
            subtitle: 'Track your child\'s coding journey',
            btnClass: 'orange'
        },
        tutor: {
            gradient: ['#AB47BC', '#5C6BC0'],
            object: ASSET_BASE + 'laptop-3d.png',
            headline: 'Ready to<br>Teach',
            subtitle: 'Inspire the next generation',
            btnClass: 'brand'
        },
        admin: {
            gradient: ['#26A69A', '#EC407A'],
            object: ASSET_BASE + 'admin-shield-3d.png',
            headline: 'Command<br>Center',
            subtitle: 'Manage your academy',
            btnClass: 'teal'
        }
    };

    let blobBg, headline, subtitle, heroImg, currentRole = 'parent';
    let currentColorObj = { c1: '#4FC3F7', c2: '#66BB6A' };

    function init() {
        blobBg = document.getElementById('blob-bg');
        headline = document.getElementById('blob-headline');
        subtitle = document.getElementById('blob-subtitle');
        heroImg = document.getElementById('hero-3d-img');

        if (blobBg) {
            const role = document.getElementById('login-role')?.value || 'parent';
            applyRole(role, true);
        }

        observeCards();
        manageVideos();
        initScrollSway();
        initMagneticRepel();
    }

    function switchRole(role) {
        if (role === currentRole) return;
        currentRole = role;
        applyRole(role, false);
    }

    function applyRole(role, immediate) {
        const cfg = roles[role];
        if (!cfg || !blobBg) return;

        const targetC1 = cfg.gradient[0];
        const targetC2 = cfg.gradient[1];

        if (typeof gsap !== 'undefined' && !immediate) {
            gsap.killTweensOf(currentColorObj);
            gsap.to(currentColorObj, {
                c1: targetC1,
                c2: targetC2,
                duration: 0.6,
                ease: 'power2.out',
                onUpdate: () => {
                    blobBg.style.background = `linear-gradient(135deg, ${currentColorObj.c1}, ${currentColorObj.c2})`;
                }
            });
        } else {
            currentColorObj.c1 = targetC1;
            currentColorObj.c2 = targetC2;
            blobBg.style.background = `linear-gradient(135deg, ${targetC1}, ${targetC2})`;
        }

        if (heroImg) {
            if (!immediate) {
                heroImg.classList.add('switching');
                setTimeout(() => {
                    heroImg.src = cfg.object;
                    heroImg.onload = () => heroImg.classList.remove('switching');
                }, 300);
            } else {
                heroImg.src = cfg.object;
            }
        }

        if (headline) {
            if (!immediate) {
                headline.style.opacity = '0';
                setTimeout(() => {
                    headline.innerHTML = cfg.headline;
                    headline.style.opacity = '1';
                }, 250);
            } else {
                headline.innerHTML = cfg.headline;
            }
        }

        if (subtitle) {
            if (!immediate) {
                subtitle.style.opacity = '0';
                setTimeout(() => {
                    subtitle.innerHTML = cfg.subtitle;
                    subtitle.style.opacity = '1';
                }, 250);
            } else {
                subtitle.innerHTML = cfg.subtitle;
            }
        }
    }

    function observeCards() {
        const cards = document.querySelectorAll('.observe-card');
        if (!cards.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });

        cards.forEach(card => observer.observe(card));
    }

    function manageVideos() {
        const videos = document.querySelectorAll('video[data-lazy-src]');
        if (!videos.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (!video.src) {
                        video.src = video.dataset.lazySrc;
                    }
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.25 });

        videos.forEach(v => observer.observe(v));
    }

    function initScrollSway() {
        const sways = document.querySelectorAll('.scroll-sway');
        if (!sways.length) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            sways.forEach((el, index) => {
                const speed = (index + 1) * 0.04;
                el.style.transform = `translateY(${scrollY * speed}px) rotate(${scrollY * 0.01}deg)`;
            });
        }, { passive: true });
    }

    function initMagneticRepel() {
        const magnets = document.querySelectorAll('.magnetic-repel');
        if (!magnets.length) return;

        document.addEventListener('mousemove', (e) => {
            magnets.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = 200;

                if (dist < radius) {
                    const force = (1 - dist / radius) * 8;
                    const angle = Math.atan2(dy, dx);
                    el.style.setProperty('--mx', (-Math.cos(angle) * force).toFixed(2));
                    el.style.setProperty('--my', (-Math.sin(angle) * force).toFixed(2));
                } else {
                    el.style.setProperty('--mx', '0');
                    el.style.setProperty('--my', '0');
                }
            });
        });
    }

    return { init, switchRole, roles };
})();

document.addEventListener('DOMContentLoaded', PortalSceneEngine.init);
