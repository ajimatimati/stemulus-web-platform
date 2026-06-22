/**
 * STEMulus Student Portfolio Engine
 * Dynamically renders student projects from Firestore or local JSON.
 * Matches the design of the "Built by our students" section in Index.html.
 */

const PortfolioEngine = (function() {
    // Determine the container based on page; supports hall-of-fame or homepage
    const CONTAINER_ID = 'portfolio-grid';
    let container = null;

    /**
     * Initialize the engine
     */
    async function init() {
        container = document.getElementById(CONTAINER_ID);
        if (!container) return; // Silent fail if container doesn't exist on this page

        try {
            renderLoading();
            let projects = [];

            // 1. Try Supabase First (Future-proofing)
            if (typeof supabase !== 'undefined') {
                const { data, error } = await supabase
                    .from('student_projects')
                    .select('*')
                    .order('date', { ascending: false });
                
                if (!error && data && data.length > 0) {
                    projects = data;
                }
            }

            // 2. Fallback to local JSON if Supabase is empty/fails
            if (projects.length === 0) {
                const response = await fetch('assets/data/projects.json');
                if (response.ok) {
                    projects = await response.json();
                }
            }

            renderProjects(projects);
            
            // GSAP Animation for entry
            if (window.gsap && window.ScrollTrigger) {
                gsap.from("#portfolio-grid > div", {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: "#portfolio-grid",
                        start: "top 80%"
                    }
                });
            }
            
            // Re-init lucide icons for the new content
            if (window.lucide) window.lucide.createIcons();
            
        } catch (error) {
            console.error("[STEMulus] Portfolio Engine Error:", error);
            container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">Unable to load projects. Please try again later.</p>`;
        }
    }

    function renderLoading() {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 space-y-4">
                <div class="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-blue-900 font-medium animate-pulse">Loading amazing projects...</p>
            </div>
        `;
    }

    function renderProjects(projects) {
        if (projects.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">No projects found.</p>`;
            return;
        }

        container.innerHTML = projects.map((project, index) => {
            // Generate stars HTML based on rating
            const stars = Array(5).fill(0).map((_, i) => 
                `<i data-lucide="star" class="w-3 h-3 fill-current ${i < (project.rating || 5) ? '' : 'text-gray-300'}"></i>`
            ).join('');

            // Default badge color if not specified
            const badgeColor = project.badgeColor || 'bg-blue-600/90';
            
            // Animation delay for staggering
            const delay = index * 0.1;

            return `
            <!-- Project Card: ${project.title} -->
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden group transform transition-all duration-500 hover:-translate-y-4 border border-gray-100" style="animation-delay: ${delay}s;">
                <div class="h-56 overflow-hidden relative">
                    <div class="absolute top-4 left-4 z-10">
                        <span class="px-3 py-1 ${badgeColor} backdrop-blur-md text-white text-xs font-bold rounded-lg uppercase shadow-lg">
                            ${project.category}
                        </span>
                    </div>
                    <img src="${project.image}"
                        alt="${project.title}" 
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <a href="${project.viewUrl || '#'}" class="inline-flex items-center px-6 py-3 bg-white rounded-full text-blue-900 font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-orange-500 hover:text-white">
                            ${project.ctaText || 'View Project'}
                        </a>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-blue-900 mb-2">${project.title}</h3>
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-sm text-gray-500 font-medium flex items-center">
                            <i data-lucide="user" class="w-4 h-4 mr-1"></i> ${project.studentName}, Age ${project.studentAge}
                        </p>
                        <div class="flex text-yellow-400">
                            ${stars}
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        ${project.description}
                    </p>
                </div>
            </div>
            `;
        }).join('');
    }

    return { init };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PortfolioEngine.init);
} else {
    PortfolioEngine.init();
}
