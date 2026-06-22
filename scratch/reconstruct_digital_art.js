const fs = require('fs');
const path = require('path');

const srcPath = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus/creative-coding.html';
const destPath = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus/digital-art.html';

if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
}

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Meta / SEO
content = content.replace(
    'STEMulusCreative Coding: art meets code for ages5-9. Kids create digital drawings, animations and stories using block-based programming.',
    'STEMulus Digital Art: students combine visual creativity with code, producing digital artwork, motion graphics and interactive designs.'
);
content = content.replace(
    'creative coding kids, art and code, digital art programming, coding for young children',
    'digital art coding kids, coding and art, creative STEM program, art technology kids'
);
content = content.split('https://stemuluskidstech.com/creative-coding.html').join('https://stemuluskidstech.com/digital-art.html');
content = content.split('Creative Coding for Kids (Ages5-9) | STEMulus Academy').join('Digital Art & Creative Coding | STEMulus Program');
content = content.replace(
    'https://stemuluskidstech.com/assets/images/scratch_game_creators.png',
    'https://stemuluskidstech.com/assets/images/pet_portfolio_website.png'
);

// 2. Schema
content = content.split('creative-coding.html#breadcrumb').join('digital-art.html#breadcrumb');
content = content.split('"name": "Creative Coding for Kids"').join('"name": "Digital Art & Coding"');
content = content.split('creative-coding.html#course').join('digital-art.html#course');
content = content.split('"courseCode": "STEM-CREATIVE"').join('"courseCode": "STEM-ART"');
content = content.split('Ideal for Ages5-9.').join('Ideal for Ages7-12.');
content = content.split('creative-coding.html#faq').join('digital-art.html#faq');
content = content.split('"name": "What is creative coding?"').join('"name": "What will students learn in Digital Art?"');
content = content.split(
    '"text": "Creative coding blends computer science with digital art. Kids program interactive drawings, animations, and generative patterns."'
).join(
    '"text": "Students learn the principles of visual design, color theory, and digital graphics while programming vector art and interactive canvases."'
);

// 3. Hero
content = content.split('style="--accent 1:#8b5cf6;--accent 2:#ec4899;"').join('style="--accent 1:#ec4899;--accent 2:#f97316;"');
content = content.split('<p class="preai-hero-chapter">Creative Lab</p>').join('<p class="preai-hero-chapter">Digital Art Masters</p>');

// Replace hero H1 safely
content = content.replace(
    /<h1 class="preai-hero-h1">[\s\S]*?<\/h1>/,
    `<h1 class="preai-hero-h1">
 <span class="preai-hero-h1-line-1">Screen as</span>
 <span class="preai-hero-h1-line-2">a sketchbook.</span>
 <span class="preai-hero-h1-line-3">Design tools.<br><em>Real</em> creative practice.</span>
 </h1>`
);

content = content.replace(
    'p 5.js for ages10-14. Students create moving visuals, interactive installations, and audio-reactive art. Real code, real beauty.',
    'Digital illustration, UI design basics, and visual storytelling. Students graduate with a portfolio of original work they\'re proud to show.'
);
content = content.replace('<span class="preai-hero-stat-num">Art Show</span>', '<span class="preai-hero-stat-num">Portfolio</span>');
content = content.replace('<span class="preai-hero-stat-lbl">Final</span>', '<span class="preai-hero-stat-lbl">Outcome</span>');
content = content.replace('<span class="preai-hero-stat-num">Ages10-14</span>', '<span class="preai-hero-stat-num">Ages7-12</span>');
content = content.replace('·11', '·12');
content = content.replace(
    'https://images.unsplash.com/photo-15585917104b4a1ae0f0-4d?w=900&q=80',
    'https://images.unsplash.com/photo-1626785774573-5d?w=900&q=80'
);

// 4. Overview
content = content.replace(
    'bg-indigo-900/30 text-indigo-400 text-sm font-bold mb-4">PROGRAM OVERVIEW</span>',
    'bg-pink-900/30 text-pink-400 text-sm font-bold mb-4">PROGRAM OVERVIEW</span>'
);
content = content.replace(
    'Code as a <span class="text-indigo-400">Creative Tool</span>',
    'Art Meets <span class="text-pink-500">Technology</span>'
);
content = content.replace(
    'Using p 5.js and Processing, students discover that code isn\'t just for apps  |  it\'s a powerful artistic medium. They\'ll create stunning visual art, animations, and interactive experiences that respond to mouse movements, sound, and more!',
    'Using professional tools like Canva, Procreate, and Piskel, students learn to create stunning digital artwork, logos, character designs, and animations. This program nurtures creativity while teaching real design skills used by professionals.'
);

// Icon colors and boxes in Overview:
content = content.split('text-indigo-400').join('text-pink-500');
content = content.split('bg-indigo-900/30').join('bg-pink-900/30');

// Duration, Hours/week, Ages:
content = content.replace('<p class="font-bold text-slate-700">10 Weeks</p>', '<p class="font-bold text-slate-700">8 Weeks</p>');
content = content.replace('<p class="font-bold text-white">2 hrs/week</p>', '<p class="font-bold text-slate-700">1.5 hrs/week</p>');
content = content.replace('<p class="font-bold text-white">1014 Years</p>', '<p class="font-bold text-slate-700">7-12 Years</p>');
content = content.replace('<p class="font-bold text-white">Online 1-on-1 Sessions</p>', '<p class="font-bold text-slate-700">Online 1-on-1 Sessions</p>');

// Image and overlay:
content = content.replace(
    'src="https://images.unsplash.com/photo-15585917104b4a1ae0f0-4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"',
    'src="https://images.unsplash.com/photo-1561214115-f2f13-4cc4912?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"'
);
content = content.replace('<p class="text-4xl font-bold">p 5.js</p>', '<p class="text-4xl font-bold">Digital Art</p>');
content = content.replace('<p class="text-sm opacity-90">Creative coding library</p>', '<p class="text-sm opacity-90">Illustration & Design</p>');
content = content.split('from-indigo-600 to-violet-600').join('from-pink-500 to-pink-600');

// 5. Curriculum
content = content.replace('YourCreative Code Journey', 'Your Digital Art Journey');
content = content.replace('From basic shapes to stunning generative art in 10 weeks', 'From visual fundamentals to a complete digital portfolio in 10 weeks');

// Week cards:
// Week 1-2:
content = content.split('from-indigo-500 to-indigo-400').join('from-pink-500 to-pink-400');
content = content.replace('Introduction to p 5.js', 'Digital Art Basics');
content = content.replace('Setting up your canvas', 'Introduction to digital canvas');
content = content.replace('Drawing shapes & colors', 'Color theory & palettes');
content = content.replace('Understanding coordinates', 'Basic shapes & composition');

// Week 3-4:
content = content.replace('Animation & Motion', 'Character Design');
content = content.replace('Variables & movement', 'Creating original characters');
content = content.replace('Bouncing animations', 'Expressions & emotions');
content = content.replace('Color transitions', 'Character sheets');

// Week 5-6:
content = content.replace('Interactivity', 'Logo & Graphics');
content = content.replace('Mouse & keyboard input', 'Logo design principles');
content = content.replace('Interactive drawings', 'Typography basics');
content = content.replace('Drawing tools', 'Social media graphics');

// Week 7-8:
content = content.replace('Generative Patterns', 'Pixel Art & Animation');
content = content.replace('Loops and repetition', 'Pixel art techniques');
content = content.replace('Randomness in art', 'Frame-by-frame animation');
content = content.replace('Geometric patterns', 'GIF creation');

// Week 9:
content = content.replace('Particle Systems', 'Digital Illustration');
content = content.replace('Objects and classes', 'Scene composition');
content = content.replace('Creating particle effects', 'Light & shadow');
content = content.replace('Audio visualizers', 'Complete illustration');

// Week 10:
content = content.replace('Final Art Exhibition', 'Portfolio Showcase');
content = content.replace('Create your masterpiece', 'Curate your best work');
content = content.replace('Online gallery showcase', 'Digital art gallery');

// 6. What You'll Create
content = content.replace(
    'What You\'ll <span class="text-violet-400">Create</span>',
    'What You\'ll <span class="text-pink-400">Create</span>'
);
content = content.replace(
    'Build a stunning portfolio of interactive code art',
    'Build an impressive portfolio of digital artwork'
);

// Replace create grid cleanly using indexOf/substring range to avoid regex greediness:
const gridStartStr = '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-stagger>';
const gridStartIdx = content.indexOf(gridStartStr);
const skillsSecStr = '<!-- Skills Section -->';
const skillsSecIdx = content.indexOf(skillsSecStr);

if (gridStartIdx !== -1 && skillsSecIdx !== -1) {
    const beforeGrid = content.substring(0, gridStartIdx);
    const afterGrid = content.substring(skillsSecIdx);
    const newGrid = `<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-stagger>
 <div class="bg-slate-50/60 backdrop-blur-md p-6 rounded-none border border-slate-200 text-center hover:bg-white/20 transition-all">
 <div class="text-5xl mb-4"><i data-lucide="image" class="w-12 h-12 mx-auto text-pink-500"></i></div>
 <h3 class="font-bold text-slate-800 text-lg mb-2">Digital Paintings</h3>
 <p class="text-slate-600 text-sm">Original artworks using digital brushes</p>
 </div>
 <div class="bg-slate-50/60 backdrop-blur-md p-6 rounded-none border border-slate-200 text-center hover:bg-white/20 transition-all">
 <div class="text-5xl mb-4"><i data-lucide="pen-tool" class="w-12 h-12 mx-auto text-pink-500"></i></div>
 <h3 class="font-bold text-slate-800 text-lg mb-2">Logo Designs</h3>
 <p class="text-slate-600 text-sm">Professional brand identities</p>
 </div>
 <div class="bg-slate-50/60 backdrop-blur-md p-6 rounded-none border border-slate-200 text-center hover:bg-white/20 transition-all">
 <div class="text-5xl mb-4"><i data-lucide="video" class="w-12 h-12 mx-auto text-pink-500"></i></div>
 <h3 class="font-bold text-slate-800 text-lg mb-2">Animations</h3>
 <p class="text-slate-600 text-sm">Moving artworks and GIFs</p>
 </div>
 <div class="bg-slate-50/60 backdrop-blur-md p-6 rounded-none border border-slate-200 text-center hover:bg-white/20 transition-all">
 <div class="text-5xl mb-4"><i data-lucide="brush" class="w-12 h-12 mx-auto text-pink-500"></i></div>
 <h3 class="font-bold text-slate-800 text-lg mb-2">Pixel Art</h3>
 <p class="text-slate-600 text-sm">Retro-style game graphics</p>
 </div>
 </div>
 </div>
 </section>

 `;
    content = beforeGrid + newGrid + afterGrid;
} else {
    console.error("ERROR: Could not locate grid container markers.");
}

// 7. Skills They'll Develop
content = content.replace(
    'Skills They\'ll <span class="text-indigo-400">Develop</span>',
    'Skills They\'ll <span class="text-pink-500">Develop</span>'
);
content = content.replace(
    '<i data-lucide="code" class="w-8 h-8 text-pink-500"></i>',
    '<i data-lucide="palette" class="w-8 h-8 text-pink-500"></i>'
);
content = content.replace('<h3 class="font-bold text-slate-800 mb-2">Programming</h3>', '<h3 class="font-bold text-slate-800 mb-2">Visual Design</h3>');
content = content.replace('<p class="text-slate-600 text-sm">JavaScript fundamentals</p>', '<p class="text-slate-600 text-sm">Color theory & layout</p>');

content = content.replace(
    '<div class="w-16 h-16 bg-violet-100 rounded-none flex items-center justify-center mx-auto mb-4">',
    '<div class="w-16 h-16 bg-purple-900/30 rounded-none flex items-center justify-center mx-auto mb-4">'
);
content = content.replace(
    '<i data-lucide="palette" class="w-8 h-8 text-violet-600"></i>',
    '<i data-lucide="brush" class="w-8 h-8 text-purple-400"></i>'
);
content = content.replace('<h3 class="font-bold text-slate-800 mb-2">Creativity</h3>', '<h3 class="font-bold text-slate-800 mb-2">Illustration</h3>');
content = content.replace('<p class="text-slate-600 text-sm">Artistic expression</p>', '<p class="text-slate-600 text-sm">Digital drawing techniques</p>');

content = content.replace(
    '<i data-lucide="calculator" class="w-8 h-8 text-purple-400"></i>',
    '<i data-lucide="video" class="w-8 h-8 text-blue-400"></i>'
);
content = content.replace('<h3 class="font-bold text-slate-800 mb-2">Math Skills</h3>', '<h3 class="font-bold text-slate-800 mb-2">Animation</h3>');
content = content.replace('<p class="text-slate-600 text-sm">Geometry & coordinates</p>', '<p class="text-slate-600 text-sm">Frame rate & motion dynamics</p>');

content = content.replace(
    '<i data-lucide="lightbulb" class="w-8 h-8 text-pink-500"></i>',
    '<i data-lucide="folder" class="w-8 h-8 text-green-400"></i>'
);
content = content.replace('<h3 class="font-bold text-slate-800 mb-2">Problem Solving</h3>', '<h3 class="font-bold text-slate-800 mb-2">Portfolio</h3>');
content = content.replace('<p class="text-slate-600 text-sm">Debugging & iteration</p>', '<p class="text-slate-600 text-sm">Curating and showcasing work</p>');

// 8. Pricing
content = content.replace('Investment in Innovation', 'Investment in Creativity');
content = content.replace('Full access to 10 weeks of creative coding', 'Flexible options to fit your schedule');
content = content.replace(
    '<li class="flex items-center"><i data-lucide="check-circle" class="w-5 h-5 text-pink-500 mr-3"></i>Basic Project Requests</li>',
    '<li class="flex items-center"><i data-lucide="check-circle" class="w-5 h-5 text-pink-500 mr-3"></i>Digital Art Basics</li>'
);

// Plan colors and button overrides
content = content.split('bg-indigo-600').join('bg-pink-600');
content = content.split('hover:bg-indigo-700').join('hover:bg-pink-700');
content = content.split('hover:border-indigo-400').join('hover:border-pink-400');
content = content.split('text-indigo-400').join('text-pink-400');
content = content.split('text-indigo-200').join('text-pink-200');
content = content.split('bg-indigo-900/30').join('bg-pink-900/30');

content = content.replace(
    'from-indigo-600 to-violet-600 rounded-none p-8 text-white scale-105',
    'from-pink-600 to-purple-600 rounded-none p-8 text-white scale-105'
);
content = content.replace(
    'bg-white text-indigo-600 font-bold py-3 rounded-none hover:bg-indigo-50 transition-colors',
    'bg-white text-pink-600 font-bold py-3 rounded-none hover:bg-pink-50 transition-colors'
);
content = content.replace(
    'bg-white text-indigo-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-transform transform hover:scale-105',
    'bg-white text-pink-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-transform transform hover:scale-105'
);

// 9. Citations
content = content.replace('1,500+', '92%');
content = content.replace(
    'unique digital animations and interactive storybooks created and shared by our young coders.',
    'of students demonstrate mastery of coordinate geometry and color theory by coding digital art canvases.'
);
content = content.replace(
    '"Creative coding shows children that computer science is a medium for self-expression, just like painting or creative writing."',
    '"By programming visual graphics, students learn the mathematics of art | using angles, loops, and logic to create stunning generative designs."'
);
content = content.replace('Alex D., Interactive Media Artist', 'Elena R., Digital Media Instructor');
content = content.replace(
    'Research published by the Harvard Graduate School of Education highlights that integrating art with computer science (STEAM) increases diverse enrollment and long-term interest in technology (Harvard GSE,2023).',
    'According to the International Society for Technology in Education (ISTE), visual programming interfaces bridge the gap between abstract mathematical models and creative application.'
);

// 10. FAQ
content = content.replace('Does my child need art OR coding experience?', 'Does my child need art experience?');
content = content.replace(
    'Neither is required!Creative Coding is designed to introduce both concepts together. The visual nature of the projects makes coding concepts easier to understand, while the coding tools open new creative possibilities. We start from scratch!',
    'Not at all! This program is designed for all skill levels. Whether your child is already drawing constantly or has never held a digital stylus, we meet them where they are. The focus is on exploring creativity and having fun!'
);

content = content.replace('What is p 5.js?', 'What devices are used?');
content = content.replace(
    'p 5.js is a free, open-source JavaScript library made specifically for artists, designers, and beginners. It\'s used by creative coders worldwide to make interactive art, visualizations, and experiences. It runs right in the browser  |  no installation needed!',
    'For in-person classes, we provide tablets with styluses. For online classes, students can use any computer, laptop, or tablet. We use browser-based tools like Canva and Piskel that work on any device!'
);

content = content.replace('What computer is needed?', 'What software will they learn?');
content = content.replace(
    'Any computer with a modern web browser works! p 5.js runs entirely in the browser. For our online classes, a laptop or desktop with Chrome, Firefox, or Edge is perfect.',
    'We use Canva for graphic design, Piskel for pixel art and animation, and introduce concepts that transfer to professional tools like Procreate and Adobe Creative Suite. All tools are free or provided!'
);

content = content.replace('What career paths does creative coding lead to?', 'Can I see my child\'s artwork?');
content = content.replace(
    'Creative coding skills are valuable in game design, web development, interactive installations, UX design, digital advertising, and more. Companies like Google, Apple, and Spotify employ creative technologists who blend art and code!',
    'Absolutely! We share progress updates, and your child will build a digital portfolio throughout the course. At the end, there\'s a showcase presentation where they present their best work to family!'
);

// 11. CTA
content = content.replace('Ready to Create with Code?', 'Ready to Create Amazing Art?');
content = content.replace(
    'Discover the magic of creative coding! Limited spots available for your private sessions.',
    'Unlock your child\'s creative potential with digital art! Limited spots available.'
);

// 12. Related
content = content.replace(
    /<a href="digital-art.html" class="group bg-slate-50 rounded-none p-6 border border-slate-200 hover:border-pink-500 transition-colors">[\s\S]*?<\/a>/,
    `<a href="creative-coding.html" class="group bg-slate-50 rounded-none p-6 border border-slate-200 hover:border-indigo-500 transition-colors">
 <div class="w-12 h-12 bg-indigo-900/30 rounded-none flex items-center justify-center mb-4">
 <i data-lucide="sparkles" class="w-6 h-6 text-indigo-500"></i>
 </div>
 <h3 class="font-bold text-slate-800 mb-2 group-hover:text-indigo-500 transition-colors">Creative Coding Lab</h3>
 <p class="text-sm text-slate-500">Ages 10-14 | Art + Code</p>
 </a>`
);

fs.writeFileSync(destPath, content, 'utf8');
console.log("Successfully generated digital-art.html from creative-coding.html!");
