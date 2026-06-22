/**
 * STEMulus Progress & Sticky CTA Component
 * Features: Top progress bar, Sticky "Enroll Now" CTA
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Progress Bar
    const progressBarHTML = `<div id="scroll-progress" class="fixed top-0 left-0 h-1 bg-supernova-orange z-[100] transition-all duration-150" style="width: 0%"></div>`;
    document.body.insertAdjacentHTML('afterbegin', progressBarHTML);

    const progressBar = document.getElementById('scroll-progress');

    // 2. Sticky CTA
    const stickyCTAHTML = `
        <div id="sticky-cta" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] transform translate-y-24 opacity-0 transition-all duration-500 w-full max-w-xs px-4 lg:hidden">
            <a href="https://forms.gle/GgNmqWUd55QvW8BU6" target="_blank" 
                class="block w-full bg-supernova-orange text-white font-bold py-4 rounded-full text-center shadow-2xl hover:bg-orange-600 active:scale-95 transition-all">
                Enroll Your Child Now
            </a>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', stickyCTAHTML);

    const stickyCTA = document.getElementById('sticky-cta');

    window.addEventListener('scroll', () => {
        // Update Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";

        // Toggle Sticky CTA (Mobile only, after 20% scroll)
        if (scrolled > 20) {
            stickyCTA.classList.remove('translate-y-24', 'opacity-0');
            stickyCTA.classList.add('translate-y-0', 'opacity-100');
        } else {
            stickyCTA.classList.add('translate-y-24', 'opacity-0');
            stickyCTA.classList.remove('translate-y-0', 'opacity-100');
        }
    }, { passive: true });
});
