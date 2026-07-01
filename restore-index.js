const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexFile, 'utf-8');

// The `replace_file_content` script deleted the entire stats block and difference grid.
// We need to inject it back precisely before the timeline section.

const timelineAnchor = `<!-- ═══════════════════════════════════════════════
     LEARNING JOURNEY — HORIZONTAL SCROLL TIMELINE
═══════════════════════════════════════════════ -->`;

const restoredContent = `        <div class="stat-block" id="stat-1">
            <span class="stat-num">50<span class="stat-unit">+</span></span>
            <p class="stat-label">Real Projects<br>published live to the web.</p>
        </div>
        <div class="stat-block" id="stat-2">
            <span class="stat-num">4.9<span class="stat-unit">★</span></span>
            <p class="stat-label">Average parent rating<br>across all private sessions</p>
        </div>
        <div class="stat-block" id="stat-4">
            <span class="stat-num">5<span class="stat-unit">–17</span></span>
            <p class="stat-label">Ages enrolled<br>in active private sessions</p>
        </div>
        <div class="stat-block" id="stat-5">
            <span class="stat-num">3<span class="stat-unit">×</span></span>
            <p class="stat-label">Continents with<br>active student families</p>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════════════
     THE STEMULUS DIFFERENCE — ASYMMETRIC TWO-COL
═══════════════════════════════════════════════ -->
<section class="difference-section" id="difference-section" aria-label="Why STEMulus">

    <p class="mono-label" style="margin-bottom:1.5rem;color:rgba(10,10,10,0.35);">Why STEMulus</p>

    <div class="difference-grid">
        <!-- Left: macro quote block -->
        <div class="difference-left" id="difference-quote">
            <blockquote>
                "We don't teach kids <em>about</em> technology. We teach them to think in it."
            </blockquote>
            <p style="font-family:'DM Sans',sans-serif;font-size:0.82rem;line-height:1.8;color:rgba(10,10,10,0.5);max-width:440px;">
                Most coding platforms give children passive content: watch a video, fill in a blank. STEMulus is built around mentorship and creation. Every child leaves with a portfolio of things they actually built.
            </p>
            <div style="margin-top:3rem;padding:2rem;background:var(--ink);display:inline-block;max-width:100%;overflow-wrap:break-word;">
                <p class="mono-label" style="color:var(--orange);margin-bottom:0.5rem;">Contact</p>
                <a href="mailto:admin@stemuluskidstech.com" style="font-family:'Nunito',sans-serif;font-size:clamp(1rem,3vw,1.4rem);font-weight:700;color:white;text-decoration:none;letter-spacing:-0.02em;word-break:break-all;">
                    admin@stemuluskidstech.com
                </a>
            </div>
        </div>

        <!-- Right: staggered feature rows -->
        <div class="feature-row" id="feature-rows">
            <div class="feature-item">
                <span class="feature-num">01</span>
                <div>
                    <p class="feature-title">Expert Mentors, Not Algorithms</p>
                    <p class="feature-desc">Every session is a private 1-on-1 with a qualified instructor — a real expert who sets the pace around your child's curiosity.</p>
                </div>
            </div>
            <div class="feature-item">
                <span class="feature-num">02</span>
                <div>
                    <p class="feature-title">Real Projects, Real Portfolio</p>
                    <p class="feature-desc">From session one, students build. Games, apps, robots, websites — not sandbox exercises. Projects they can show anyone.</p>
                </div>
            </div>
            <div class="feature-item">
                <span class="feature-num">03</span>
                <div>
                    <p class="feature-title">100% Private, 1-on-1 Sessions</p>
                    <p class="feature-desc">No shared learning groups. Every session is a dedicated hour between one student and one expert mentor — zero distractions, 100% focus.</p>
                </div>
            </div>
            <div class="feature-item">
                <span class="feature-num">04</span>
                <div>
                    <p class="feature-title">Age-Structured Curriculum</p>
                    <p class="feature-desc">No one-size-fits-all. Each of our six programs is purpose-built for a specific developmental stage, strictly serving ages 5 to 17.</p>
                </div>
            </div>
        </div>
    </div>
</section>

`;

html = html.replace(timelineAnchor, restoredContent + timelineAnchor);

fs.writeFileSync(indexFile, html, 'utf-8');
console.log('Restored index attributes');
