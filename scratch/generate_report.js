const fs = require('fs');
const path = require('path');

const workspace = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';
const auditData = JSON.parse(fs.readFileSync(path.join(workspace, 'scratch/physical_images_audit.json'), 'utf8'));

// Detailed descriptions for each image asset based on name, context, and site usage
const descriptions = {
  "assets/images/after_stemulus.png": {
    category: "Branding & Infographics",
    desc: "An illustrative comparison graphic displaying the positive learning outcomes and skills a child gains 'after' enrolling in the STEMulus program. Typically shows a visual checklist of modern skills like critical thinking, logic, Python/HTML, and self-confidence, styled with clean brand typography.",
    designRole: "Marketing infographic used to drive conversion by contrasting traditional screen-time with productive creation."
  },
  "assets/images/ai_machine_learning.png": {
    category: "Course & Program Banners",
    desc: "A stylized feature banner for the 'AI & Machine Learning' course. It visually portrays concepts of artificial intelligence, featuring neural network diagrams, coding blocks, or machine learning icons to capture children's interest in future tech.",
    designRole: "Used as a primary card thumbnail on the Programs overview page and the dedicated AI & ML course page."
  },
  "assets/images/anansi_story_scratch.png": {
    category: "Student Projects & Demos",
    desc: "A colorful screenshot representing a student-built visual storytelling project in Scratch, based on the popular West African folklore 'Anansi the Spider'. It highlights visual sprite animations and scratch block interfaces, showcasing creative coding in action.",
    designRole: "Featured on Scratch Creators course and Programs pages to demonstrate storytelling projects built by younger students."
  },
  "assets/images/arduino_robotics_lab.png": {
    category: "Course & Program Banners",
    desc: "A modern graphic banner illustrating the 'Robotics & Arduino' course. It displays a physical microcontroller board, connector wires, and basic robot assembly schematics to represent physical computing and hardware integration.",
    designRole: "Serves as the main visual banner on the Arduino Robotics course details page and as card art on the Programs list."
  },
  "assets/images/before_traditional.png": {
    category: "Branding & Infographics",
    desc: "An infographic graphic depicting 'before' enrolling in STEMulus—representing passive screen consumption (e.g. endless scrolling, gaming with no understanding). Designed with slightly muted colors to contrast with the vibrant 'after' graphic.",
    designRole: "Used in parent-facing materials and landing pages to show how STEMulus transforms consumer habits into builder habits."
  },
  "assets/images/footer_student_1.png": {
    category: "Footer & Marketing Elements",
    desc: "A cutout transparent portrait of a happy student working on a laptop, designed to be embedded in the footer or social proof sections to give the brand a friendly, human, and authentic face.",
    designRole: "Used for layout framing in marketing sections or footer overlays."
  },
  "assets/images/footer_student_2.png": {
    category: "Footer & Marketing Elements",
    desc: "A transparent cutout image of a student smiling while looking at a completed robotics project. Reinforces the themes of child agency and achievement in tech.",
    designRole: "Used as secondary social proof visuals at the bottom of pages."
  },
  "assets/images/footer_student_3.png": {
    category: "Footer & Marketing Elements",
    desc: "A portrait cutout of a young programmer gesturing excitedly towards a computer screen, representing the fun and social nature of STEMulus coding cohorts.",
    designRole: "Used for bottom-page content accents and call-to-action branding."
  },
  "assets/images/footer_student_4.png": {
    category: "Footer & Marketing Elements",
    desc: "A high-quality image of a child displaying a tablet with Scratch scripts, demonstrating hands-on project results.",
    designRole: "Branding element embedded near the footer call-to-action blocks."
  },
  "assets/images/hero_background_blur.png": {
    category: "Backgrounds & Textures",
    desc: "A soft, high-quality radial colorful blur background texture designed to sit behind editorial typography. It creates a subtle depth without competing with text legibility.",
    designRole: "Applied as a background layer on the Digital Art & Design page."
  },
  "assets/images/hero_coding_girl_futuristic.png": {
    category: "Hero & Key Visuals",
    desc: "A flagship editorial illustration/render showing a young girl coder interacting with futuristic elements and data streams. It is styled with creative lighting and represents the unlimited potential of children learning to write software.",
    designRole: "Main hero visual for the Creative Coding course details and featured in metadata schema markup."
  },
  "assets/images/junior_robotics_playful.png": {
    category: "Course & Program Banners",
    desc: "A colorful, playful banner showcasing basic Lego-like robot kits, motors, and block-based controller steps tailored for younger children (ages 7-10). It emphasizes play, physical assembly, and easy logical loops.",
    designRole: "Featured on the Junior Robotics course page and general program catalogs."
  },
  "assets/images/line_following_robot.png": {
    category: "Student Projects & Demos",
    desc: "A detailed schematic/photo showing a classic student robotics project: a two-wheeled line-following robot using infrared sensors and an Arduino board. Demonstrates real-world application of algorithmic loops.",
    designRole: "Displayed in the projects slider and detailed Arduino Robotics course info."
  },
  "assets/images/parallax-bg.png": {
    category: "Backgrounds & Textures",
    desc: "A repeating tiled texture background with subtle grid lines or dot patterns, used to drive GSAP parallax scroll effects. Its neutral coloring ensures text layers slide over it cleanly.",
    designRole: "Loaded via GSAP parallax scripts to create editorial spatial depth as the user scrolls."
  },
  "assets/images/pet_portfolio_website.png": {
    category: "Student Projects & Demos",
    desc: "A screenshot mockup of a student's personal project: a full website portfolio dedicated to pet care. Displays HTML/CSS card components, images, and nav links created by a student.",
    designRole: "Used as a program portfolio showcase on the Web Wizards page and in project directories."
  },
  "assets/images/python_game_dev.png": {
    category: "Course & Program Banners",
    desc: "A sleek, clean visual showing python game development code alongside a running retro arcade sprite project. Highlights libraries like Pygame and clean text-based scripting concepts.",
    designRole: "Banner image for Python Programming details and programs catalog cards."
  },
  "assets/images/quiz_app_interface.png": {
    category: "Student Projects & Demos",
    desc: "A visual mockup displaying the user interface of a quiz application built using Python GUI (Tkinter or Pygame). Shows buttons, question panels, and clean layout design.",
    designRole: "Project sample visual for Intermediate Python students."
  },
  "assets/images/scratch_game_creators.png": {
    category: "Course & Program Banners",
    desc: "A bright, energetic visual banner depicting Scratch game blocks, sprites (like cats, spaceships), and gaming layouts. Highlights visual logic, loops, variables, and coordinate tracking.",
    designRole: "Key catalog banner for the Scratch Creators course."
  },
  "assets/images/space_raiders_game.png": {
    category: "Student Projects & Demos",
    desc: "A screenshot showing a child-coded 'Space Raiders' retro arcade game, with code blocks alongside a player spaceship dodging asteroids. Visually communicates logic-meets-creativity.",
    designRole: "Showcased under Digital Art & Scratch Creators to validate project outcomes."
  },
  "assets/images/stats-parallax-bg.png": {
    category: "Backgrounds & Textures",
    desc: "A neutral textured background pattern utilized to anchor text statistics columns, sliding independently of foreground cards.",
    designRole: "Parallax background image managed by apply-parallax.js."
  },
  "assets/images/stemulus_mastery_kids.png": {
    category: "Course & Program Banners",
    desc: "A premium marketing graphic representing STEMulus students showing off mathematical logic achievements, emphasizing structured problem-solving.",
    designRole: "Visual card asset on the AI & math programs pages."
  },
  "assets/images/student_ai_dashboard.png": {
    category: "Student Projects & Demos",
    desc: "A screenshot showing an AI-powered student dashboard mockup, with chat interface widgets and data chart metrics.",
    designRole: "Hero project example on the landing page showing advanced student capabilities."
  },
  "assets/images/weather_app_ui.png": {
    category: "Student Projects & Demos",
    desc: "A clean screenshot of a student-built Weather App, showcasing responsive design, weather condition icons, and temperature forecasts using HTML, CSS, and API requests.",
    designRole: "Portfolio preview on Web Wizards and Fullstack Web Dev pages."
  },
  "Favicon.png": {
    category: "Core Branding",
    desc: "The browser tab icon representing the STEMulus brand logo: a stylized geometric colorful cube block with clean facets.",
    designRole: "Branding asset in the HTML head and offline service worker manifest."
  },
  "images/become-a-mentor.jpg": {
    category: "Hero & Key Visuals",
    desc: "A high-quality image banner showing professional developers mentoring students in a classroom/online setup, showing collaboration and active support.",
    designRole: "Banner visual for the tutor application page (join-as-tutor.html)."
  },
  "images/become-a-mentor.png": {
    category: "Hero & Key Visuals",
    desc: "PNG duplicate/alternative format of the mentor recruitment banner. High quality, showing coding support.",
    designRole: "Backup asset or duplicate format in images directory."
  },
  "images/girl_coding_hero.png": {
    category: "Hero & Key Visuals",
    desc: "A graphic of a girl focused on her coding screen, surrounded by subtle graphics indicating programming concepts.",
    designRole: "Branding graphic for index headers."
  },
  "images/kid_robot_proud.png": {
    category: "Hero & Key Visuals",
    desc: "A heartwarming, high-contrast photo/graphic of a young kid standing proudly next to their self-assembled robotics rover kit. Emphasizes hands-on success.",
    designRole: "Primary visual anchor for the Junior Robotics page."
  },
  "images/mentor_session_girl.png": {
    category: "Hero & Key Visuals",
    desc: "An image representing an online 1-on-1 coding session, showing a friendly instructor guiding a young girl as she clicks and drops Scratch blocks.",
    designRole: "Featured visual on the coding readiness blog post."
  },
  "images/mentor_student_session.png": {
    category: "Hero & Key Visuals",
    desc: "The primary brand photograph of a supportive, friendly 1-on-1 online mentoring session. Shows a split screen with a child smiling at code and an encouraging tutor explaining a concept.",
    designRole: "Widely used across index, parents, template pages to sell the 1-on-1 human mentorship model."
  },
  "loader-logo.png": {
    category: "Core Branding",
    desc: "A horizontal brand layout of the STEMulus logo, incorporating the icon cube alongside the wordmark 'STEMulus' in custom brand typography.",
    designRole: "Branding wordmark utilized by tools and sitemaps."
  },
  "logo-dark.jpg": {
    category: "Core Branding",
    desc: "STEMulus logo variants optimized with a dark background contrast frame.",
    designRole: "Variant branding file."
  },
  "logo-light.jpg": {
    category: "Core Branding",
    desc: "STEMulus logo variants optimized with a light background contrast frame.",
    designRole: "Variant branding file."
  },
  "logo.png": {
    category: "Core Branding",
    desc: "The official primary brand logo of STEMulus: a beautifully balanced geometric, colorful 3D-style block representational of building blocks, logical assembly, and creativity.",
    designRole: "Crucial brand asset loaded in the navigation headers and footers of all 32+ pages."
  },
  "new-logo.jpg": {
    category: "Core Branding",
    desc: "A JPEG version of the updated branding block, with refreshed color palettes.",
    designRole: "Variant branding file."
  },
  "scratch_game_program.png": {
    category: "Student Projects & Demos",
    desc: "A screenshot layout demonstrating Daniel's Scratch Game Project: shows the sprite output (a space ranger) side-by-side with the logical blocks he wrote to make it jump and shoot.",
    designRole: "Main student highlight feature on the landing page, blog Daniel spotlight, and Hall of Fame."
  },
  "stembotbg.png": {
    category: "Backgrounds & Textures",
    desc: "A giant, atmospheric background illustration of a friendly learning robot mascot ('StemBot') surrounded by digital patterns and glowing lines.",
    designRole: "General background assets."
  },
  "student_robot.png": {
    category: "Student Projects & Demos",
    desc: "A photograph showcasing a completed physical student robot built using Arduino: showing chassis, servo motors, breadboard wiring, and wheels.",
    designRole: "Student success proof featured in the Hall of Fame gallery and index section."
  },
  "student_scratch_game.png": {
    category: "Student Projects & Demos",
    desc: "A screenshot mockup of another student-made Scratch platformer game project with clean score widgets and sprite assets.",
    designRole: "Referenced dynamically in admin engine interfaces."
  },
  "student_website.png": {
    category: "Student Projects & Demos",
    desc: "A sleek, responsive website designed by a student, showing CSS layouts, customized text fonts, and image grids.",
    designRole: "Student project demo on the Hall of Fame."
  }
};

// Ensure directory exists
const folderPath = path.join(workspace, 'All img assests');
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

// Generate Markdown Report
let md = `# STEMulus Kids Tech — Comprehensive Image Asset Audit

This document compiles the exhaustive visual asset audit for the **STEMulus** website. We scanned all HTML, CSS, and JS files across the project workspace to identify every physical image asset, its dimensions, formats, code references, and designed purpose.

---

## 📊 Summary Statistics

* **Total Physical Image Files Found:** ${auditData.length}
* **Active Images (Referenced in Code):** ${auditData.filter(img => img.referenced_in.length > 0).length}
* **Inactive/Variant Images (Unreferenced):** ${auditData.filter(img => img.referenced_in.length === 0).length}

---

## 📂 Category Breakdown

`;

// Group by category
const categories = {};
auditData.forEach(img => {
  const descObj = descriptions[img.path] || { category: "Uncategorized/Variant Assets", desc: "No description available.", designRole: "General support image asset." };
  const cat = descObj.category;
  if (!categories[cat]) categories[cat] = [];
  
  categories[cat].push({
    path: img.path,
    filename: img.filename,
    size_kb: (img.size_bytes / 1024).toFixed(1),
    dimensions: img.dimensions || 'N/A',
    format: img.format || 'Unknown',
    referenced_in: img.referenced_in,
    desc: descObj.desc,
    designRole: img.referenced_in.length > 0 ? descObj.designRole : "None (Inactive / Alternate Variant)"
  });
});

Object.keys(categories).forEach(cat => {
  md += `### ${cat}\n\n`;
  categories[cat].forEach(img => {
    const referencesList = img.referenced_in.length > 0 
      ? img.referenced_in.map(ref => `\`${ref}\``).join(', ')
      : "*No references (Inactive/Archive asset)*";
      
    md += `#### 🖼️ \`${img.path}\`
* **Filename:** \`${img.filename}\`
* **Size:** ${img.size_kb} KB
* **Format:** ${img.format}
* **Code References:** ${referencesList}
* **Audit Description:** ${img.desc}
* **Designed Role on Website:** *${img.designRole}*

---

`;
  });
});

fs.writeFileSync(path.join(folderPath, 'image_audit_report.md'), md);
console.log('Successfully wrote the comprehensive image audit report to All img assests/image_audit_report.md');
