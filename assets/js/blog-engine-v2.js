/**
 * STEMulus Autonomous Blog Engine
 * Handles the release of blog posts every 3 days and dynamic rendering.
 * NOW WITH EMBEDDED DATA to support local file:// access without CORS errors.
 */

const BlogEngine = (function() {
    const SITE_LAUNCH_DATE = "2026-01-01"; // Base date for release logic
    const RELEASE_INTERVAL_DAYS = 3;
    const POSTS_PER_PAGE = 9; // Increased for better layout
    let cachedPosts = []; // Store for filtering

    // EMBEDDED DATA (Bypasses fetch CORS issues on local desktop)
    const LOCAL_DATA = [
      {
        "id": "feat-1",
        "title": "Turning 'Zombie Mode' into Creative Time",
        "description": "Stop counting minutes. Start counting maker moments. Why 3 hours of coding Minecraft mods is healthier than 30 minutes of YouTube—and how to tell the difference.",
        "image": "https://images.unsplash.com/photo-1516627145497-ae69d0d39e4d?q=80&w=1600&auto=format&fit=crop",
        "category": "Parent Corner",
        "date": "Jan 20, 2026",
        "link": "#",
        "featured": true,
        "release_days": 0
      },
      {
        "id": "post-1",
        "title": "Will AI Replace My Kid's Future Job? (And How to Prevent It)",
        "description": "Chatbots write code now. So why teach kids syntax? Discover why the 'human element' of problem-solving is becoming more valuable, not less, in the age of Artificial Intelligence.",
        "image": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Oct 24, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-2",
        "title": "Why 'Prompt Engineering' is the 21st Century Handwriting",
        "description": "Knowing how to talk to machines is the literacy of the future. We explore how teaching kids to formulate precise questions is clearer thinking in disguise.",
        "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Oct 20, 2025",
        "link": "#",
        "featured": false,
        "release_days": 1
      },
      {
        "id": "post-3",
        "title": "The 'Flow State' Advantage: Why Gamers Make Great Coders",
        "description": "Mihaly Csikszentmihalyi called it 'Flow.' We call it the 'Zone.' Learn how coding triggers the same dopamine loops as video games—but for creation, not consumption.",
        "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Oct 15, 2025",
        "link": "#",
        "featured": false,
        "release_days": 2
      },
      {
        "id": "post-4",
        "title": "Build Your First AI Bot in 10 Minutes (No Code Required)",
        "description": "A step-by-step guide for parents and kids to build a simple 'Homework Helper' bot using free tools. Demystify AI by building it yourself.",
        "image": "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Sep 28, 2025",
        "link": "#",
        "featured": false,
        "release_days": 3
      },
      {
        "id": "post-5",
        "title": "The $1,000 Bug: What My Student Learned from Breaking Production",
        "description": "Why making big mistakes in a safe environment is the fastest way to learn responsibility and debugging resilience.",
        "image": "https://images.unsplash.com/photo-1555861496-0666c8981751?q=80&w=800&auto=format&fit=crop",
        "category": "Student Spotlight",
        "date": "Sep 15, 2025",
        "link": "#",
        "featured": false,
        "release_days": 4
      },
      {
        "id": "post-6",
        "title": "Growth Mindset: Tracking a Glitch Without Losing Your Cool",
        "description": "Based on Carol Dweck's research. How coding teaches kids that 'I can't do it' really just means 'I can't do it YET.'",
        "image": "https://images.unsplash.com/photo-1493612276216-9c5901955d43?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Sep 10, 2025",
        "link": "#",
        "featured": false,
        "release_days": 5
      },
      {
        "id": "post-7",
        "title": "More Than Metal: How Robotics Teaches Empathy",
        "description": "When a child builds a robot that helps a disabled person or cleans a park, instructions become impact. The surprising link between STEM and social good.",
        "image": "https://images.unsplash.com/photo-1535378437813-12440c4dd3c7?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Aug 30, 2025",
        "link": "#",
        "featured": false,
        "release_days": 6
      },
      {
        "id": "post-8",
        "title": "Google Doesn't Care About Grades. They Care About THIS.",
        "description": "Laszlo Bock, former SVP of People at Google, revealed that GPAs are worthless for hiring. Here is the #1 trait Big Tech actually looks for.",
        "image": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=800&auto=format&fit=crop",
        "category": "Parent Corner",
        "date": "Aug 22, 2025",
        "link": "#",
        "featured": false,
        "release_days": 7
      },
      {
        "id": "post-9",
        "title": "Minecraft Education: The Trojan Horse of Learning",
        "description": "It's not just a game. It's CAD, logic circuits, and chemical engineering disguised as blocks. How to turn 'stop playing' into 'keep building.'",
        "image": "https://images.unsplash.com/photo-1587560699334-cc4da63c2409?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Aug 14, 2025",
        "link": "#",
        "featured": false,
        "release_days": 8
      },
      {
        "id": "post-10",
        "title": "Digital Hygiene: 5 Conversations Before Their First Phone",
        "description": "Passwords are the new toothbrushing. A practical guide to teaching cybersecurity and digital footprint management without the scare tactics.",
        "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop",
        "category": "Parent Corner",
        "date": "Aug 05, 2025",
        "link": "#",
        "featured": false,
        "release_days": 9
      },
      {
        "id": "post-11",
        "title": "Hidden Figures: The Women Who Wrote the Code to the Moon",
        "description": "Before microchips, 'computers' were women. An inspiring look at Margaret Hamilton and Katherine Johnson, proving coding has no gender.",
        "image": "https://images.unsplash.com/photo-1614312385003-dcea7b8b6ab6?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jul 30, 2025",
        "link": "#",
        "featured": false,
        "release_days": 10
      },
      {
        "id": "post-12",
        "title": "Africa's Next Tech Boom: Why Your Child is the Engine",
        "description": "The global remote workforce is shifting. Why major tech companies are looking to the continent for the next generation of engineers.",
        "image": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jul 22, 2025",
        "link": "#",
        "featured": false,
        "release_days": 11
      },
      {
        "id": "post-13",
        "title": "Meet the 12-Year-Old Who Automated Her Chores",
        "description": "Ada didn't want to feed the cat manually anymore. So she built an Arduino IoT feeder triggered by her phone. Genius.",
        "image": "https://images.unsplash.com/photo-1581092921461-eab62e97a395?q=80&w=800&auto=format&fit=crop",
        "category": "Student Spotlight",
        "date": "Jul 15, 2025",
        "link": "#",
        "featured": false,
        "release_days": 12
      },
      {
        "id": "post-14",
        "title": "Code is Poetry: Teaching Logic Through Storytelling",
        "description": "Inspired by Seymour Papert. Code is just another language for expression. Why we ask kids to 'write a story' with their loops.",
        "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jul 01, 2025",
        "link": "#",
        "featured": false,
        "release_days": 13
      },
      {
        "id": "post-15",
        "title": "Kids Can Do Hard Things: The Case for 'Deep Work'",
        "description": "In a world of 5-second TikToks, teaching kids to focus for 60 minutes on a complex problem is a superpower. Cal Newport's Deep Work applied to education.",
        "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jun 24, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-16",
        "title": "Roblox Studio vs. Unity: Where Should Your Child Start?",
        "description": "One is a playground, the other is a professional engine. Why we recommend starting with Lua in Roblox before graduating to C# in Unity.",
        "image": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Jun 18, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-17",
        "title": "The 'Rubber Duck' Method: Teaching Kids to Talk Through Problems",
        "description": "The best debuggers aren't the best typists; they are the best communicators. How explaining code to a toy duck builds clarity of thought.",
        "image": "https://images.unsplash.com/photo-1596464716127-f9a0859606d6?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jun 10, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-18",
        "title": "Why We Teach Python Instead of Java (At First)",
        "description": "Java is powerful, but Python is readable. We explain our pedagogical choice to prioritize logic over complex syntax for beginners.",
        "image": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Jun 02, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-19",
        "title": "Beyond the 'Brogrammer': Why the Future of Tech is Female",
        "description": "Inspired by Reshma Saujani. Diversity isn't just a buzzword; it's an optimization strategy. Diverse teams build better algorithms.",
        "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "May 25, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-20",
        "title": "The New Playground Bully: Recognizing Cyberbullying",
        "description": "It doesn't happen by the swings anymore. It happens in Discord servers. Signs your child might be experiencing (or participating in) digital harassment.",
        "image": "https://images.unsplash.com/photo-1563206767-5b1d972b9fb9?q=80&w=800&auto=format&fit=crop",
        "category": "Parent Corner",
        "date": "May 18, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-21",
        "title": "The Math of Art: Generative Design with Code",
        "description": "When trigonometry creates beauty. How creative coding frameworks like p5.js turn 'boring' math into stunning visual art.",
        "image": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "May 10, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-22",
        "title": "VR in Education: Field Trips to Mars",
        "description": "Virtual Reality is moving from gaming to the classroom. How immersive learning increases retention rates by up to 75%.",
        "image": "https://images.unsplash.com/photo-1592478411213-61535fdd861d?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "May 02, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-23",
        "title": "Soft Skills for Hard Tech: The Art of the Demo",
        "description": "Writing code is half the battle. Selling your idea is the other half. Why our curriculum includes 'Show & Tell' day for every project.",
        "image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop",
        "category": "Career",
        "date": "Apr 25, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-24",
        "title": "Arduino vs. Micro:bit: Choosing Your First Microcontroller",
        "description": "Micro:bit is the tricycle; Arduino is the bicycle. A hardware guide for parents looking to get their kids into physical computing.",
        "image": "https://images.unsplash.com/photo-1553406830-ef2513450d76?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Apr 18, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-25",
        "title": "Open Source: Why Giving Away Work Makes You Richer",
        "description": "Teaching kids about the collaborative economy. Why programmers share their secrets, and how 'remixing' drives innovation.",
        "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Apr 10, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-26",
        "title": "Accessibility: designing for the 'Edge Cases'",
        "description": "Empathy in engineering. Teaching kids to build apps that work for the blind, the deaf, and the colorblind, making the web better for everyone.",
        "image": "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Apr 04, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-27",
        "title": "Data Literacy: Reading Charts Like a Detective",
        "description": "In the age of 'Fake News,' data literacy is self-defense. How to spot misleading graphs and understand what the numbers are really saying.",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Mar 28, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-28",
        "title": "The History of the Internet (Explained to a 10-Year-Old)",
        "description": "From Vint Cerf to TikTok. Understanding the pipes, cables, and protocols that hold our digital world together.",
        "image": "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?q=80&w=800&auto=format&fit=crop",
        "category": "History",
        "date": "Mar 20, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-29",
        "title": "Addiction vs. Passion: When to Worry About Gaming",
        "description": "Is your child obsessed or just engaged? Psychological markers to distinguish between a healthy hobby and a behavioral issue.",
        "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
        "category": "Parent Corner",
        "date": "Mar 12, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-30",
        "title": "Quantum Computing for Babies (and Parents)",
        "description": "Bits can be 1 or 0. Qubits can be both. A simplified look at the next computing revolution and why today's encryption might disappear.",
        "image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Mar 05, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-31",
        "title": "Biotech & Code: Writing DNA like Software",
        "description": "CRISPR and synthetic biology. How the next generation of programmers might be debugging cells instead of servers.",
        "image": "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Feb 25, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-32",
        "title": "SpaceX & Reusable Code: Modular Design Lessons",
        "description": "Rockets land on drone ships because the software works. What Elon Musk's approach teaches us about modularity and testing.",
        "image": "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Feb 18, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-33",
        "title": "Blockchain 101: It's Just a Fancy Ledger",
        "description": "Demystifying crypto. Forget the hype coin prices; learn the computer science concept of 'distributed trust' that makes it work.",
        "image": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800&auto=format&fit=crop",
        "category": "Tech Trends",
        "date": "Feb 10, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      },
      {
        "id": "post-34",
        "title": "The Myth of the 10,000 Hour Rule",
        "description": "Gladwell said 10,000 hours. Science says 'Deliberate Practice.' Why 100 hours of focused coding beats 1,000 hours of mindless typing.",
        "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
        "category": "Insights",
        "date": "Feb 01, 2025",
        "link": "#",
        "featured": false,
        "release_days": 0
      }
    ];

    /**
     * Calculate days since site launch
     */
    function getDaysSinceLaunch() {
        const launch = new Date(SITE_LAUNCH_DATE);
        const today = new Date();
        const diffTime = Math.abs(today - launch);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Filter posts based on release schedule
     */
    function filterVisiblePosts(allPosts) {
        // Since we are simulating, we just show all labeled with release_days=0 for now.
        // Or if using dates, logic applies.
        // For security against local file CORS, we trust the array is ready.
        return allPosts;
    }

    function renderFeatured(post) {
        console.log("[STEMulus] Rendering Featured Post...");
        const container = document.getElementById('featured-post-container');
        if (!container || !post) {
            console.warn("[STEMulus] Featured container or post missing.");
            return;
        }

        // Force visibility
        container.classList.remove('sr-hidden');
        container.style.opacity = '1';
        container.style.visibility = 'visible';

        container.innerHTML = `
            <div class="bg-cosmic-blue text-white rounded-3xl shadow-xl overflow-hidden mb-16 flex flex-col md:flex-row group cursor-pointer">
                <div class="md:w-1/2 relative overflow-hidden h-64 md:h-auto bg-gray-100">
                     <img src="${post.image}" data-no-lazy class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="${post.title}" onerror="this.parentElement.style.backgroundColor='#ffeecb'; console.error('[STEMulus] Featured image failed to load:', this.src)">
                </div>
                <div class="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-20">
                    <span class="inline-block self-start text-xs font-bold bg-supernova-orange/90 text-white px-3 py-1 rounded-full uppercase tracking-wider mb-6 backdrop-blur-sm">Featured Story</span>
                    <h2 class="font-poppins text-3xl md:text-4xl font-bold mb-4 leading-tight group-hover:text-orange-200 transition-colors">${post.title}</h2>
                    <p class="text-gray-300 text-lg mb-8 leading-relaxed">${post.description}</p>
                    <div class="flex items-center space-x-6">
                        <a href="blog-template.html?id=${post.id}" class="inline-block font-bold text-cosmic-blue bg-white py-3 px-8 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">Read Full Article</a>
                        <span class="text-white/60 text-sm font-medium">8 min read</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the blog grid
     */
    function renderGrid(posts) {
        const container = document.getElementById('blog-grid-container');
        if (!container) return;

        // Force visibility
        container.classList.remove('sr-hidden');
        container.style.opacity = '1';
        container.style.visibility = 'visible';

        if (posts.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-20 col-span-full">No posts found in this category.</p>`;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group transform hover:-translate-y-2 transition-all duration-300 h-full flex flex-col" data-category="${post.category}">
                <div class="relative h-56 overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src="${post.image}" data-no-lazy class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" alt="${post.title}" onerror="this.parentElement.style.backgroundColor='#ffeecb'; console.warn('[STEMulus] Grid image failed:', this.src)">
                    <div class="absolute top-4 left-4">
                        <span class="bg-white/95 backdrop-blur-md text-cosmic-blue text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-gray-100">${post.category}</span>
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center text-xs text-gray-400 mb-3 space-x-2 font-medium">
                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                        <span>${post.date}</span>
                    </div>
                    <h3 class="text-xl font-bold font-poppins text-cosmic-blue mb-3 line-clamp-2 leading-tight group-hover:text-supernova-orange transition-colors">${post.title}</h3>
                    <p class="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">${post.description}</p>
                    <a href="blog-template.html?id=${post.id}" class="inline-flex items-center font-bold text-sm text-supernova-orange hover:text-orange-700 transition-colors mt-auto group/link">
                        Read More <i data-lucide="arrow-right" class="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform"></i>
                    </a>
                </div>
            </div>
        `).join('');
        
        // Refresh icons
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Filter posts by category (public API)
     */
    function filterByCategory(category) {
        const visiblePosts = cachedPosts; // Uses ALL local data
        const gridPosts = visiblePosts.filter(p => !p.featured);

        if (category === 'all') {
            renderGrid(gridPosts);
        } else {
            const filtered = gridPosts.filter(p => p.category.toLowerCase() === category.toLowerCase());
            renderGrid(filtered);
        }
        
        // Update active tab visually
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('bg-supernova-orange', 'text-white');
            tab.classList.add('bg-gray-100', 'text-gray-700');
            if (tab.getAttribute('data-category') === category) {
                tab.classList.remove('bg-gray-100', 'text-gray-700');
                tab.classList.add('bg-supernova-orange', 'text-white');
            }
        });
    }

    /**
     * Initialize the engine
     */
    function init() {
        console.log("[STEMulus] Blog Engine: Initialized!");
        
        try {
            // DIRECTLY USE LOCAL_DATA to ensure it works offline/local file system
            const allPosts = LOCAL_DATA;
            cachedPosts = allPosts; // Cache for filtering
            
            // Separate featured from grid
            const featuredPost = allPosts.find(p => p.featured);
            const gridPosts = allPosts.filter(p => !p.featured);

            renderFeatured(featuredPost);
            renderGrid(gridPosts);

        } catch (error) {
            console.error('[STEMulus] Blog Engine Error:', error);
        }
    }

    return { init, filterByCategory };
})();

// Robust execution logic
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    BlogEngine.init();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        BlogEngine.init();
    });
}

// Fallback for very slow loads
window.addEventListener('load', function() {
    BlogEngine.init();
});
