const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
let content = fs.readFileSync(file, 'utf-8');
const origContent = content;

// Replace the parallax block with a matchMedia wrapper
const statsParallaxRegex = /\/\/ True Scroll Parallax for Stats[\s\S]*?\}\);/m;
const statsParallaxMatch = content.match(statsParallaxRegex);

if (statsParallaxMatch) {
    const desktopOnlyParallax = `// True Scroll Parallax for Stats (Desktop Only)
    var mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", function() {
        gsap.to('#stats-section', {
            backgroundPosition: "50% 100%",
            ease: "none",
            scrollTrigger: {
                trigger: '#stats-section',
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });`;
    
    // Only replace if it doesn't already have matchMedia
    if (!statsParallaxMatch[0].includes('matchMedia')) {
        content = content.replace(statsParallaxMatch[0], desktopOnlyParallax);
    }
}

// Replace the timeline horizontal pin
const timelinePinRegex = /\/\/ 8\. Timeline — pinned horizontal scrub[\s\S]*?if\s*\(track\)\s*\{[\s\S]*?\}\);[\s\S]*?\}/m;
const timelinePinMatch = content.match(timelinePinRegex);

if (timelinePinMatch) {
    const desktopOnlyTimeline = `// 8. Timeline — pinned horizontal scrub on Desktop only
    var track = document.getElementById('timeline-track');
    if (track) {
        var mm2 = gsap.matchMedia();
        mm2.add("(min-width: 768px)", function() {
            var getScrollDistance = function() {
                return track.scrollWidth - window.innerWidth + 100;
            };

            gsap.to(track, {
                x: function() { return -getScrollDistance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: '#timeline-section',
                    start: 'top top',
                    pin: true,
                    scrub: 1,
                    anticipatePin: 1,
                    end: function() { return '+=' + getScrollDistance(); },
                    invalidateOnRefresh: true
                }
            });
        });
        
        // Mobile fallback: allow natural horizontal scroll
        mm2.add("(max-width: 767px)", function() {
            gsap.set(track, { clearProps: "x" });
            track.parentElement.style.overflowX = 'auto';
            track.parentElement.style.paddingBottom = '3rem';
            track.parentElement.style.paddingLeft = '5vw';
        });
    }`;
    
    if (!timelinePinMatch[0].includes('matchMedia')) {
        content = content.replace(timelinePinMatch[0], desktopOnlyTimeline);
    }
}

if (content !== origContent) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Successfully optimized index.html GSAP for mobile.');
} else {
    console.log('No changes needed in index.html, or already optimized.');
}
