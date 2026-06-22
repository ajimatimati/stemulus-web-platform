/**
 * STEMulus User Feedback Component
 * Features: Star rating system, localStorage persistence, Close button, Auto-dismiss
 */

document.addEventListener('DOMContentLoaded', () => {
    const pageId = window.location.pathname;
    const hasRated = localStorage.getItem(`rated_${pageId}`);
    const dismissed = sessionStorage.getItem(`dismissed_feedback_${pageId}`);

    // Don't show if already rated or dismissed this session
    if (hasRated || dismissed) return;

    const feedbackHTML = `
        <div id="feedback-widget" class="fixed bottom-6 right-6 z-[60] transform translate-y-24 opacity-0 transition-all duration-700 max-w-xs pointer-events-auto">
            <div class="bg-white rounded-2xl shadow-2xl p-5 border border-slate-100 relative">
                <button id="close-feedback" class="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors p-1" title="Close">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
                <h4 class="font-bold text-[#1A237E] mb-2 pr-6">How was your experience?</h4>
                <p class="text-xs text-slate-500 mb-3">Your feedback helps us improve.</p>
                <div class="flex space-x-1.5 mb-3" id="star-rating">
                    ${[1,2,3,4,5].map(i => `
                        <button data-value="${i}" class="star-btn text-slate-300 hover:text-yellow-400 transition-colors">
                            <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                        </button>
                    `).join('')}
                </div>
                <div id="feedback-thanks" class="hidden text-emerald-600 text-sm font-bold flex items-center">
                    <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> Thanks!
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', feedbackHTML);
    if (window.lucide) lucide.createIcons();

    const widget = document.getElementById('feedback-widget');
    const stars = document.querySelectorAll('.star-btn');
    const thanks = document.getElementById('feedback-thanks');
    const starContainer = document.getElementById('star-rating');
    const closeBtn = document.getElementById('close-feedback');

    // Close button handler
    closeBtn.addEventListener('click', () => {
        sessionStorage.setItem(`dismissed_feedback_${pageId}`, 'true');
        widget.classList.add('opacity-0', 'translate-y-8');
        setTimeout(() => widget.remove(), 500);
    });

    // Show widget after delay (reduced from 5s to 8s to be less intrusive)
    setTimeout(() => {
        widget.classList.remove('translate-y-24', 'opacity-0');
    }, 8000);

    // Auto-hide after 20 seconds if not interacted
    setTimeout(() => {
        if (widget && !hasRated) {
            widget.classList.add('opacity-0', 'translate-y-8');
            setTimeout(() => widget.remove(), 500);
        }
    }, 28000);

    stars.forEach(star => {
        star.addEventListener('click', async () => {
            const val = star.getAttribute('data-value');
            
            // Visual Update
            stars.forEach((s, i) => {
                if (i < val) {
                    s.classList.remove('text-slate-300');
                    s.classList.add('text-yellow-400');
                    s.querySelector('i').classList.add('fill-current');
                } else {
                    s.classList.add('text-slate-300');
                    s.classList.remove('text-yellow-400');
                    s.querySelector('i').classList.remove('fill-current');
                }
            });

            // Persist locally
            localStorage.setItem(`rated_${pageId}`, val);

            // Persist to Supabase
            if (typeof supabase !== 'undefined') {
                try {
                    const { error } = await supabase.from('feedback').insert([{
                        page: pageId,
                        rating: parseInt(val),
                        user_agent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }]);
                    
                    if (error) console.warn('[Feedback] Supabase error:', error.message);
                    else console.log('[Feedback] Saved to DB');
                } catch (err) {
                    console.warn('[Feedback] Error saving:', err);
                }
            }

            // Transition to thanks
            starContainer.classList.add('opacity-50', 'pointer-events-none');
            // Hide title and text
            widget.querySelector('h4').style.display = 'none';
            widget.querySelector('p').style.display = 'none';
            thanks.classList.remove('hidden');

            // Fade out after thanks
            setTimeout(() => {
                widget.classList.add('opacity-0', 'scale-95');
                setTimeout(() => widget.remove(), 500);
            }, 2000);
        });
    });
});
