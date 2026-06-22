/**
 * STEMulus Urgency Logic
 * Dynamically updates course availability and start timers.
 */

const CourseUrgency = (function() {
    const COLLECTION = 'course_stats';

    /**
     * Initialize urgency trackers
     */
    async function init() {
        const badges = document.querySelectorAll('.urgency-badge');
        if (badges.length === 0) return;

        try {
            let stats = {};
            
            // 1. Fetch from Supabase
            if (typeof supabase !== 'undefined') {
                const { data, error } = await supabase
                    .from(COLLECTION)
                    .select('*');
                
                if (error) throw error;
                
                if (data) {
                    data.forEach(doc => {
                        stats[doc.id] = doc; // Supabase returns rows directly
                    });
                }
            }

            // 2. Map stats to badges
            badges.forEach(badge => {
                const courseId = badge.getAttribute('data-course-id');
                const type = badge.getAttribute('data-type'); // 'seats' or 'timer'

                if (stats[courseId]) {
                    if (type === 'seats') {
                        renderSeats(badge, stats[courseId].seatsRemaining);
                    } else if (type === 'timer') {
                        startCountdown(badge, stats[courseId].startDate);
                    }
                } else {
                    // Default values if no cloud data
                    if (type === 'seats') renderSeats(badge, 5); 
                }
            });

        } catch (error) {
            console.warn("[STEMulus] Urgency fetch failed:", error);
        }
    }

    function renderSeats(el, count) {
        if (count <= 3) {
            el.innerHTML = `<span class="flex items-center text-red-600 font-bold animate-pulse">
                <i data-lucide="zap" class="w-4 h-4 mr-1"></i> Only ${count} Seats Left!
            </span>`;
        } else {
            el.innerHTML = `<span class="text-cosmic-blue font-medium">${count} Slots Available</span>`;
        }
        if (window.lucide) window.lucide.createIcons();
    }

    function startCountdown(el, dateString) {
        const targetDate = new Date(dateString).getTime();
        
        const update = () => {
            const now = new Date().getTime();
            const diff = targetDate - now;

            if (diff <= 0) {
                el.innerHTML = "New Batch Starting Soon!";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            el.innerHTML = `<span class="text-supernova-orange font-bold">Starts in ${days}d ${hours}h</span>`;
        };

        update();
        setInterval(update, 3600000); // Update every hour
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', CourseUrgency.init);
