/**
 * STEMulus Blog Post Viewer
 * Dynamically loads and displays blog post content based on URL parameter
 */

const BlogPostViewer = (function() {
    
    // Embedded blog data (same as blog-engine-v2.js for consistency)
    const BLOG_POSTS = [
        {
            "id": "feat-1",
            "title": "The 'Screen Time' Myth: Why Creation Beats Consumption",
            "description": "Stop counting minutes. Start counting maker moments. Why 3 hours of coding Minecraft mods is healthier than 30 minutes of YouTube—and how to tell the difference.",
            "image": "https://images.unsplash.com/photo-1516627145497-ae69d0d39e4d?q=80&w=1600&auto=format&fit=crop",
            "category": "Parent Corner",
            "date": "Jan 20, 2026",
            "readTime": "8 min read",
            "content": `
                <p class="text-xl text-gray-600 italic border-l-4 border-orange-500 pl-6 py-2 bg-orange-50/50 rounded-r-lg">
                    Every parent has felt the guilt. Your child is glued to a screen, and you wonder: am I ruining their childhood? Here's the truth most "experts" won't tell you—it's not about HOW LONG, it's about WHAT they're doing.
                </p>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">The Two Types of Screen Time</h2>
                <p>
                    Researchers at the University of Michigan found that children who <strong>create</strong> content on screens—coding games, editing videos, building digital art—show improved problem-solving skills and creativity. Meanwhile, passive consumption (scrolling social media, watching random videos) correlates with decreased attention spans.
                </p>
                <p>
                    The key difference? <em>Active engagement vs. passive consumption.</em>
                </p>

                <blockquote class="text-2xl font-poppins font-semibold text-[#1A237E] text-center px-8 py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
                    "When a child codes, they're not consuming content—they're producing it. They're solving puzzles, debugging logic, and exercising creative muscles."
                </blockquote>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">How to Tell the Difference</h2>
                <p>
                    Ask yourself these questions about your child's screen activity:
                </p>
                <ul class="list-disc pl-6 space-y-3">
                    <li><strong>Is there a goal?</strong> Building a website, finishing a game level they designed, or completing a project.</li>
                    <li><strong>Can they explain what they're doing?</strong> Creators can articulate their process. Consumers can't.</li>
                    <li><strong>Are they frustrated in a good way?</strong> Productive struggle (debugging code) builds resilience. Mindless scrolling doesn't.</li>
                    <li><strong>Do they have something to show?</strong> A finished project, a new skill, a portfolio piece.</li>
                </ul>

                <div class="bg-gray-900 text-white p-8 rounded-3xl my-12 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-indigo-500/20 opacity-50"></div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold mb-4">The STEMulus Approach</h3>
                        <p class="text-gray-300">
                            At STEMulus, we turn "screen time" into "maker time." Every session ends with something tangible: a game, a website, a robot program. That's the difference between consumption and creation.
                        </p>
                    </div>
                </div>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">Practical Tips for Parents</h2>
                <p>
                    Here's how to shift your child's screen time from passive to productive:
                </p>
                <ul class="list-disc pl-6 space-y-3">
                    <li><strong>Schedule "Maker Hours":</strong> Designate specific times for creative digital work, separate from entertainment.</li>
                    <li><strong>Ask to see their work:</strong> Regular show-and-tell builds accountability and pride.</li>
                    <li><strong>Celebrate the struggle:</strong> When they hit a bug and work through it, that's a win—regardless of the final result.</li>
                    <li><strong>Join them:</strong> Try a coding tutorial together. It's harder than you think, and they'll respect your effort.</li>
                </ul>

                <p class="mt-8">
                    The next time guilt creeps in about your child's screen time, don't count the minutes. Count the maker moments. That's what really matters.
                </p>
            `
        },
        {
            "id": "post-1",
            "title": "Will AI Kill Coding? Why Creativity is the New Syntax",
            "description": "Chatbots write code now. So why teach kids syntax? Discover why the 'human element' of problem-solving is becoming more valuable, not less, in the age of Artificial Intelligence.",
            "image": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
            "category": "Insights",
            "date": "Oct 24, 2025",
            "readTime": "6 min read",
            "content": `
                <p class="text-xl text-gray-600 italic border-l-4 border-orange-500 pl-6 py-2 bg-orange-50/50 rounded-r-lg">
                    "AI will write all the code soon. Why bother teaching kids programming?" We hear this a lot. Here's why that thinking is backwards—and why creativity is more valuable than ever.
                </p>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">AI is a Tool, Not a Replacement</h2>
                <p>
                    Yes, ChatGPT can write a Python function. GitHub Copilot can autocomplete your code. But here's what AI cannot do:
                </p>
                <ul class="list-disc pl-6 space-y-3">
                    <li><strong>Ask the right question:</strong> AI answers prompts. Humans figure out what to ask.</li>
                    <li><strong>Understand context:</strong> AI doesn't know your user, your constraints, or your creative vision.</li>
                    <li><strong>Innovate:</strong> AI recombines existing patterns. Humans imagine new possibilities.</li>
                    <li><strong>Debug novel problems:</strong> When things go wrong in unexpected ways, humans still need to think.</li>
                </ul>

                <blockquote class="text-2xl font-poppins font-semibold text-[#1A237E] text-center px-8 py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
                    "The goal isn't to compete with AI at writing code. It's to direct AI to build what you imagine."
                </blockquote>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">The New Skills Hierarchy</h2>
                <p>
                    In the AI age, skills stack differently:
                </p>
                <ul class="list-disc pl-6 space-y-3">
                    <li><strong>Tier 3 (Commoditized):</strong> Basic syntax, simple scripts—AI handles this.</li>
                    <li><strong>Tier 2 (Valuable):</strong> System design, architecture, debugging complex systems.</li>
                    <li><strong>Tier 1 (Irreplaceable):</strong> Problem formulation, creativity, user empathy, ethics.</li>
                </ul>
                <p>
                    Teaching kids to code isn't about the syntax. It's about training them to think at Tier 1 and 2 levels where humans excel.
                </p>

                <div class="bg-gray-900 text-white p-8 rounded-3xl my-12 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-indigo-500/20 opacity-50"></div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold mb-4">The Future is Hybrid</h3>
                        <p class="text-gray-300">
                            The programmers of tomorrow won't write every line of code. They'll architect solutions, validate AI outputs, and apply judgment that no machine can replicate. At STEMulus, we teach both: the fundamentals AND how to think like a creator.
                        </p>
                    </div>
                </div>
            `
        },
        {
            "id": "post-2",
            "title": "Why 'Prompt Engineering' is the 21st Century Handwriting",
            "description": "Knowing how to talk to machines is the literacy of the future. We explore how teaching kids to formulate precise questions is clearer thinking in disguise.",
            "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
            "category": "Tech Trends",
            "date": "Oct 20, 2025",
            "readTime": "5 min read",
            "content": `
                <p class="text-xl text-gray-600 italic border-l-4 border-orange-500 pl-6 py-2 bg-orange-50/50 rounded-r-lg">
                    In the 1800s, handwriting was a gateway skill. In the 2000s, it was typing. Today? It's knowing how to communicate with AI systems effectively.
                </p>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">What is Prompt Engineering?</h2>
                <p>
                    Prompt engineering is the skill of crafting precise, well-structured instructions for AI systems. It sounds technical, but it's really about <strong>clear thinking</strong>.
                </p>
                <p>
                    A good prompt requires you to:
                </p>
                <ul class="list-disc pl-6 space-y-3">
                    <li>Define your goal precisely</li>
                    <li>Consider edge cases and constraints</li>
                    <li>Structure your request logically</li>
                    <li>Iterate based on feedback</li>
                </ul>
                <p>
                    Notice something? These are the exact same skills we teach in coding classes.
                </p>

                <blockquote class="text-2xl font-poppins font-semibold text-[#1A237E] text-center px-8 py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
                    "Teaching a child to write a good prompt is teaching them to think clearly. The AI is just the feedback mechanism."
                </blockquote>

                <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">Why This Matters for Kids</h2>
                <p>
                    Children who learn prompt engineering develop metacognitive skills—they learn to think about their thinking. When an AI gives a bad answer, they learn to ask: "What was wrong with my question?"
                </p>
                <p>
                    This is the same debugging mindset that makes great programmers. The medium has changed (AI instead of compilers), but the mental model is identical.
                </p>

                <div class="bg-gray-900 text-white p-8 rounded-3xl my-12 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-indigo-500/20 opacity-50"></div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold mb-4">Try This at Home</h3>
                        <p class="text-gray-300">
                            Have your child use ChatGPT to write a story. Then challenge them to improve the result by writing a better prompt. Watch how their prompts evolve from vague ("write a story") to specific ("write a 200-word adventure story about a 10-year-old Nigerian girl who builds a robot to help her grandmother").
                        </p>
                    </div>
                </div>
            `
        }
    ];

    // Default content for posts without full content
    function generateDefaultContent(post) {
        return `
            <p class="text-xl text-gray-600 italic border-l-4 border-orange-500 pl-6 py-2 bg-orange-50/50 rounded-r-lg">
                ${post.description}
            </p>

            <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">Exploring ${post.title}</h2>
            <p>
                This comprehensive article explores the key concepts and insights behind ${post.title.toLowerCase()}. 
                Whether you're a parent, educator, or tech enthusiast, you'll discover actionable takeaways that can make a real difference.
            </p>

            <blockquote class="text-2xl font-poppins font-semibold text-[#1A237E] text-center px-8 py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
                "The best time to start learning is yesterday. The second best time is now."
            </blockquote>

            <h2 class="text-3xl font-bold text-[#1A237E] font-poppins pt-8">Key Takeaways</h2>
            <ul class="list-disc pl-6 space-y-3">
                <li>Understanding the fundamentals is crucial for long-term success</li>
                <li>Practical application beats theoretical knowledge</li>
                <li>Consistent practice leads to mastery</li>
                <li>Community and mentorship accelerate learning</li>
            </ul>

            <div class="bg-gray-900 text-white p-8 rounded-3xl my-12 relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-indigo-500/20 opacity-50"></div>
                <div class="relative z-10">
                    <h3 class="text-2xl font-bold mb-4">Ready to Learn More?</h3>
                    <p class="text-gray-300">
                        At STEMulus, we turn curiosity into capability. Our expert tutors guide students through hands-on projects that make learning stick. Book a free trial class today and see the difference.
                    </p>
                </div>
            </div>

            <p class="mt-8">
                Stay tuned for more insights on our blog, and don't forget to share this article with fellow parents and educators who might benefit from these ideas.
            </p>
        `;
    }

    // Get post ID from URL
    function getPostIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Find post by ID
    function findPostById(id) {
        return BLOG_POSTS.find(post => post.id === id);
    }

    // Populate the page with post content
    function populatePage(post) {
        // Update page title
        document.title = `${post.title} - STEMulus Blog`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = post.description;
        }

        // Populate content areas
        const categoryEl = document.getElementById('post-category');
        const titleEl = document.getElementById('post-title');
        const dateEl = document.getElementById('post-date');
        const readTimeEl = document.getElementById('post-read-time');
        const imageEl = document.getElementById('post-image');
        const contentEl = document.getElementById('post-content');

        if (categoryEl) categoryEl.textContent = post.category;
        if (titleEl) titleEl.textContent = post.title;
        if (dateEl) dateEl.textContent = post.date;
        if (readTimeEl) readTimeEl.textContent = post.readTime || '5 min read';
        if (imageEl) {
            imageEl.src = post.image;
            imageEl.alt = post.title;
        }
        if (contentEl) {
            // Try to get content from external database files
            let externalContent = null;
            
            // Check all content databases
            if (typeof BLOG_CONTENT_DATABASE !== 'undefined' && BLOG_CONTENT_DATABASE[post.id]) {
                externalContent = BLOG_CONTENT_DATABASE[post.id];
            } else if (typeof BLOG_CONTENT_PART2 !== 'undefined' && BLOG_CONTENT_PART2[post.id]) {
                externalContent = BLOG_CONTENT_PART2[post.id];
            } else if (typeof BLOG_CONTENT_PART3 !== 'undefined' && BLOG_CONTENT_PART3[post.id]) {
                externalContent = BLOG_CONTENT_PART3[post.id];
            }
            
            if (externalContent) {
                contentEl.innerHTML = externalContent.content;
                // Also update read time if available
                if (readTimeEl && externalContent.readTime) {
                    readTimeEl.textContent = externalContent.readTime;
                }
            } else {
                contentEl.innerHTML = post.content || generateDefaultContent(post);
            }
        }

        // Populate related posts
        populateRelatedPosts(post);
    }

    // Show related posts
    function populateRelatedPosts(currentPost) {
        const container = document.getElementById('related-posts');
        if (!container) return;

        // Get 3 posts from same category (excluding current)
        let related = BLOG_POSTS.filter(p => 
            p.id !== currentPost.id && p.category === currentPost.category
        ).slice(0, 3);

        // If not enough, add random posts
        if (related.length < 3) {
            const others = BLOG_POSTS.filter(p => 
                p.id !== currentPost.id && !related.find(r => r.id === p.id)
            );
            related = [...related, ...others.slice(0, 3 - related.length)];
        }

        container.innerHTML = related.map(post => `
            <a href="blog-template.html?id=${post.id}" class="group cursor-pointer block">
                <div class="rounded-2xl overflow-hidden mb-4 aspect-video bg-gray-100">
                    <img src="${post.image}" alt="${post.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                </div>
                <span class="text-xs font-bold text-orange-500 uppercase tracking-wider">${post.category}</span>
                <h4 class="font-bold text-[#1A237E] group-hover:text-orange-500 transition-colors mt-1">${post.title}</h4>
            </a>
        `).join('');
    }

    // Show 404 state
    function showNotFound() {
        const titleEl = document.getElementById('post-title');
        const contentEl = document.getElementById('post-content');
        
        if (titleEl) titleEl.textContent = 'Post Not Found';
        if (contentEl) {
            contentEl.innerHTML = `
                <p class="text-xl text-gray-600 text-center py-12">
                    Sorry, we couldn't find the blog post you're looking for.
                    <br><br>
                    <a href="blog.html" class="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-colors">
                        ← Back to Blog
                    </a>
                </p>
            `;
        }
    }

    // Initialize
    function init() {
        console.log('[STEMulus] Blog Post Viewer: Initializing...');
        
        const postId = getPostIdFromUrl();
        
        if (!postId) {
            console.warn('[STEMulus] No post ID in URL');
            showNotFound();
            return;
        }

        const post = findPostById(postId);
        
        if (!post) {
            console.warn('[STEMulus] Post not found:', postId);
            showNotFound();
            return;
        }

        console.log('[STEMulus] Loading post:', post.title);
        populatePage(post);
    }

    return { init };
})();

// Run on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    BlogPostViewer.init();
} else {
    document.addEventListener('DOMContentLoaded', BlogPostViewer.init);
}
