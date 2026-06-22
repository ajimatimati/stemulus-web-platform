/**
 * STEMulus How It Works
 * Replaces placeholder instructor profiles with a clear 3-step onboarding process
 */

const HowItWorks = (function() {
    'use strict';

    const steps = [
        {
            number: '01',
            title: 'Pick Your Track',
            description: 'Choose from Robotics, Game Dev, Web Design, Python, or AI — matched to your child\'s age and interests.',
            icon: `<svg class="w-10 h-10" viewBox="0 0 40 40" fill="none"><path d="M20 5l-2 6h-6l5 4-2 6 5-4 5 4-2-6 5-4h-6l-2-6z" fill="#f97316"/><rect x="6" y="24" width="28" height="12" rx="4" stroke="#f97316" stroke-width="2"/><path d="M14 30h12" stroke="#f97316" stroke-width="2" stroke-linecap="round"/></svg>`,
            gradient: 'from-orange-500 to-amber-500',
            glow: 'rgba(249, 115, 22, 0.15)'
        },
        {
            number: '02',
            title: 'Start Learning',
            description: 'Live 1-on-1 or small-group sessions with a dedicated mentor. Real projects from week one — no boring lectures.',
            icon: `<svg class="w-10 h-10" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="32" height="22" rx="4" stroke="#6366f1" stroke-width="2"/><path d="M15 18l4 3 6-6" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="32" r="6" fill="#6366f1" opacity=".2"/><path d="M30 32l2 2 4-4" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            gradient: 'from-indigo-500 to-purple-500',
            glow: 'rgba(99, 102, 241, 0.15)'
        },
        {
            number: '03',
            title: 'Ship Real Projects',
            description: 'Your child builds a portfolio of games, websites, and apps. Show it off at our Hall of Fame.',
            icon: `<svg class="w-10 h-10" viewBox="0 0 40 40" fill="none"><path d="M20 4l5 10h11l-9 7 3.5 11L20 25l-10.5 7L13 21 4 14h11l5-10z" fill="none" stroke="#10b981" stroke-width="2"/><path d="M20 14v8M16 18h8" stroke="#10b981" stroke-width="2" stroke-linecap="round"/></svg>`,
            gradient: 'from-emerald-500 to-teal-500',
            glow: 'rgba(16, 185, 129, 0.15)'
        }
    ];

    const styles = `
        .how-it-works {
            padding: 96px 0;
            background: white;
            position: relative;
            overflow: hidden;
        }
        
        .dark .how-it-works {
            background: #0f172a;
        }
        
        .hiw-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            position: relative;
            z-index: 2;
        }
        
        .hiw-header {
            text-align: center;
            margin-bottom: 72px;
        }
        
        .hiw-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 12px;
            background: #f0fdf4;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        
        .dark .hiw-badge {
            background: rgba(16, 185, 129, 0.15);
            color: #6ee7b7;
        }
        
        .hiw-title {
            font-size: clamp(28px, 5vw, 48px);
            font-weight: 800;
            color: #1e3a5f;
            line-height: 1.15;
            margin-bottom: 16px;
            font-family: 'Poppins', sans-serif;
        }
        
        .dark .hiw-title {
            color: #f1f5f9;
        }
        
        .hiw-title span {
            background: linear-gradient(135deg, #10b981, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hiw-subtitle {
            font-size: 18px;
            color: #6b7280;
            max-width: 550px;
            margin: 0 auto;
            line-height: 1.7;
        }
        
        .dark .hiw-subtitle {
            color: #9ca3af;
        }
        
        .hiw-steps {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
            position: relative;
        }
        
        /* Connecting line between steps */
        .hiw-steps::before {
            content: '';
            position: absolute;
            top: 80px;
            left: 16.67%;
            right: 16.67%;
            height: 2px;
            background: linear-gradient(to right, #f97316, #6366f1, #10b981);
            opacity: 0.2;
            z-index: 0;
        }
        
        @media (max-width: 768px) {
            .hiw-steps { grid-template-columns: 1fr; gap: 40px; }
            .hiw-steps::before {
                top: 0;
                bottom: 0;
                left: 39px;
                right: auto;
                width: 2px;
                height: auto;
                background: linear-gradient(to bottom, #f97316, #6366f1, #10b981);
            }
        }
        
        .hiw-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            padding: 40px 32px;
            text-align: center;
            position: relative;
            z-index: 1;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark .hiw-card {
            background: #1e293b;
            border-color: #334155;
        }
        
        .hiw-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 60px var(--card-glow);
        }
        
        .hiw-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 16px;
            font-weight: 800;
            color: white;
            margin-bottom: 24px;
            position: relative;
            font-family: 'Poppins', sans-serif;
        }
        
        .hiw-number::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px dashed currentColor;
            opacity: 0.2;
            animation: spin 20s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .hiw-icon {
            width: 72px;
            height: 72px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            background: var(--card-glow);
            transition: transform 0.3s ease;
        }
        
        .hiw-card:hover .hiw-icon {
            transform: scale(1.1) rotate(-5deg);
        }
        
        .hiw-card-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 12px;
            font-family: 'Poppins', sans-serif;
        }
        
        .dark .hiw-card-title {
            color: #f1f5f9;
        }
        
        .hiw-card-desc {
            font-size: 15px;
            line-height: 1.7;
            color: #6b7280;
        }
        
        .dark .hiw-card-desc {
            color: #9ca3af;
        }
        
        .hiw-cta {
            text-align: center;
            margin-top: 56px;
        }
        
        .hiw-cta a {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 16px 36px;
            background: linear-gradient(135deg, #1A237E, #4F46E5);
            color: white;
            font-weight: 700;
            font-size: 16px;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px rgba(26, 35, 126, 0.25);
        }
        
        .hiw-cta a:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 12px 40px rgba(26, 35, 126, 0.35);
        }
        
        .hiw-cta a svg {
            transition: transform 0.3s ease;
        }
        
        .hiw-cta a:hover svg {
            transform: translateX(4px);
        }
        
        @media (max-width: 768px) {
            .hiw-card { text-align: left; padding: 28px 24px; }
            .hiw-icon { margin: 0 0 20px; }
        }
    `;

    function injectStyles() {
        if (document.getElementById('hiw-styles')) return;
        const style = document.createElement('style');
        style.id = 'hiw-styles';
        style.textContent = styles;
        document.head.appendChild(style);
    }

    function createSection() {
        const section = document.createElement('section');
        section.id = 'how-it-works';
        section.className = 'how-it-works';
        section.setAttribute('data-scroll-section', '');

        const cards = steps.map((s, i) => `
            <div class="hiw-card" style="--card-glow: ${s.glow}; animation: fadeInUp 0.5s ease ${i * 0.15}s both;">
                <div class="hiw-number bg-gradient-to-br ${s.gradient}">${s.number}</div>
                <div class="hiw-icon">${s.icon}</div>
                <h3 class="hiw-card-title">${s.title}</h3>
                <p class="hiw-card-desc">${s.description}</p>
            </div>
        `).join('');

        section.innerHTML = `
            <div class="hiw-container">
                <div class="hiw-header">
                    <span class="hiw-badge">Simple Process</span>
                    <h2 class="hiw-title">How It <span>Works</span></h2>
                    <p class="hiw-subtitle">Getting started is easy. Three simple steps to launch your child's tech career.</p>
                </div>
                
                <div class="hiw-steps">
                    ${cards}
                </div>
                
                <div class="hiw-cta">
                    <a href="Enroll.html">
                        Get Started Today
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                </div>
            </div>
        `;

        return section;
    }

    function insertSection() {
        // Insert after learning outcomes, or before footer
        const learningOutcomes = document.getElementById('learning-outcomes');
        if (learningOutcomes) {
            const section = createSection();
            learningOutcomes.parentNode.insertBefore(section, learningOutcomes.nextSibling);
            return;
        }
        
        const footer = document.querySelector('footer');
        if (footer) {
            const section = createSection();
            footer.parentNode.insertBefore(section, footer);
        }
    }

    function init() {
        const pathname = window.location.pathname.toLowerCase();
        const isValidPage = pathname === '/' || 
                           pathname.includes('index.html') ||
                           pathname.includes('why-stemulus');
        
        if (!isValidPage) return;
        
        injectStyles();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => insertSection(), 100);
            });
        } else {
            setTimeout(() => insertSection(), 100);
        }
    }

    return { init, insert: insertSection };
})();

HowItWorks.init();
console.log('How It Works section loaded');
