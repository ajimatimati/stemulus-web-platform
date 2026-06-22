/**
 * STEMulus Learning Outcomes
 * Replaces placeholder video testimonials with real curriculum outcomes
 */

const LearningOutcomes = (function() {
    'use strict';

    const outcomes = [
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><path d="M16 4L4 10l12 6 12-6-12-6z" fill="#6366f1"/><path d="M4 16l12 6 12-6" stroke="#6366f1" stroke-width="2" fill="none"/><path d="M4 22l12 6 12-6" stroke="#6366f1" stroke-width="2" fill="none" opacity=".5"/></svg>`,
            title: 'Computational Thinking',
            description: 'Pattern recognition, decomposition, and algorithmic thinking that transfers to every subject.',
            color: '#6366f1'
        },
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="3" y="6" width="26" height="18" rx="3" stroke="#f97316" stroke-width="2"/><path d="M10 14l3 3 6-6" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            title: 'Real Programming Languages',
            description: 'Not just drag-and-drop. Scratch, Python, JavaScript, and C++ — the same tools professionals use.',
            color: '#f97316'
        },
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="12" r="5" stroke="#8b5cf6" stroke-width="2"/><path d="M10 26c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#8b5cf6" stroke-width="2"/><path d="M24 8l4-4M24 4l4 4" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" opacity=".6"/></svg>`,
            title: 'AI & Robotics',
            description: 'Hands-on experience with machine learning concepts and physical computing with real robots.',
            color: '#8b5cf6'
        },
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><path d="M16 4v24M4 16h24" stroke="#10b981" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="11" stroke="#10b981" stroke-width="2"/><path d="M10 10l12 12M22 10L10 22" stroke="#10b981" stroke-width="1" stroke-linecap="round" opacity=".3"/></svg>`,
            title: 'Problem Solving',
            description: 'Debugging, testing, and iteration — the engineering mindset that makes kids fearless learners.',
            color: '#10b981'
        },
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="10" height="10" rx="2" fill="#ec4899" opacity=".3"/><rect x="17" y="5" width="10" height="10" rx="2" fill="#ec4899" opacity=".5"/><rect x="5" y="17" width="10" height="10" rx="2" fill="#ec4899" opacity=".5"/><rect x="17" y="17" width="10" height="10" rx="2" fill="#ec4899" opacity=".8"/></svg>`,
            title: 'Creative Projects',
            description: 'Games, websites, animations, and apps — kids build a real portfolio they can show off.',
            color: '#ec4899'
        },
        {
            icon: `<svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><path d="M16 4l4 8h8l-6.5 5 2.5 9L16 21l-8 5 2.5-9L4 12h8l4-8z" fill="#eab308"/></svg>`,
            title: 'Career-Ready Skills',
            description: 'Teamwork, presentation, and technical fluency that give kids a 10-year head start.',
            color: '#eab308'
        }
    ];

    const styles = `
        .learning-outcomes {
            padding: 96px 0;
            background: linear-gradient(to bottom, #f8fafc, #ffffff);
            position: relative;
            overflow: hidden;
        }
        
        .dark .learning-outcomes {
            background: linear-gradient(to bottom, #0f172a, #1e293b);
        }
        
        .lo-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            position: relative;
            z-index: 2;
        }
        
        .lo-header {
            text-align: center;
            margin-bottom: 64px;
        }
        
        .lo-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 12px;
            background: #eff6ff;
            color: #1e3a5f;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        
        .dark .lo-badge {
            background: rgba(99, 102, 241, 0.15);
            color: #a5b4fc;
        }
        
        .lo-title {
            font-size: clamp(28px, 5vw, 48px);
            font-weight: 800;
            color: #1e3a5f;
            line-height: 1.15;
            margin-bottom: 16px;
            font-family: 'Poppins', sans-serif;
        }
        
        .dark .lo-title {
            color: #f1f5f9;
        }
        
        .lo-title span {
            background: linear-gradient(135deg, #f97316, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .lo-subtitle {
            font-size: 18px;
            color: #6b7280;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.7;
        }
        
        .dark .lo-subtitle {
            color: #9ca3af;
        }
        
        .lo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
        }
        
        @media (max-width: 1024px) {
            .lo-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 640px) {
            .lo-grid { grid-template-columns: 1fr; gap: 20px; }
        }
        
        .lo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 32px 28px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .dark .lo-card {
            background: #1e293b;
            border-color: #334155;
        }
        
        .lo-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--card-color);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .lo-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
            border-color: var(--card-color);
        }
        
        .lo-card:hover::before {
            opacity: 1;
        }
        
        .lo-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            background: color-mix(in srgb, var(--card-color) 10%, transparent);
            transition: transform 0.3s ease;
        }
        
        .lo-card:hover .lo-icon {
            transform: scale(1.1) rotate(-3deg);
        }
        
        .lo-card-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 10px;
            font-family: 'Poppins', sans-serif;
        }
        
        .dark .lo-card-title {
            color: #f1f5f9;
        }
        
        .lo-card-desc {
            font-size: 14px;
            line-height: 1.7;
            color: #6b7280;
        }
        
        .dark .lo-card-desc {
            color: #9ca3af;
        }
        
        /* Ambient glow */
        .lo-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            pointer-events: none;
            z-index: 0;
        }
    `;

    function injectStyles() {
        if (document.getElementById('lo-styles')) return;
        const style = document.createElement('style');
        style.id = 'lo-styles';
        style.textContent = styles;
        document.head.appendChild(style);
    }

    function createSection() {
        const section = document.createElement('section');
        section.id = 'learning-outcomes';
        section.className = 'learning-outcomes';
        section.setAttribute('data-scroll-section', '');

        const cards = outcomes.map((o, i) => `
            <div class="lo-card" style="--card-color: ${o.color}; animation: fadeInUp 0.5s ease ${i * 0.1}s both;">
                <div class="lo-icon">${o.icon}</div>
                <h3 class="lo-card-title">${o.title}</h3>
                <p class="lo-card-desc">${o.description}</p>
            </div>
        `).join('');

        section.innerHTML = `
            <div class="lo-glow" style="top: -10%; left: -5%; width: 400px; height: 400px; background: rgba(99, 102, 241, 0.06);"></div>
            <div class="lo-glow" style="bottom: -10%; right: -5%; width: 350px; height: 350px; background: rgba(249, 115, 22, 0.06);"></div>
            
            <div class="lo-container">
                <div class="lo-header">
                    <span class="lo-badge">Curriculum Highlights</span>
                    <h2 class="lo-title">What Your Child Will <span>Actually Learn</span></h2>
                    <p class="lo-subtitle">Not abstract theories — concrete skills they'll use to build real things and think like engineers.</p>
                </div>
                
                <div class="lo-grid">
                    ${cards}
                </div>
            </div>
        `;

        return section;
    }

    function insertSection() {
        const footer = document.querySelector('footer');
        if (footer) {
            const section = createSection();
            footer.parentNode.insertBefore(section, footer);
        }
    }

    function init() {
        const isIndexPage = window.location.pathname === '/' || 
                           window.location.pathname.toLowerCase().includes('index.html');
        
        if (!isIndexPage) return;
        
        injectStyles();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => insertSection());
        } else {
            insertSection();
        }
    }

    return { init, insert: insertSection };
})();

LearningOutcomes.init();
console.log('Learning Outcomes section loaded');
