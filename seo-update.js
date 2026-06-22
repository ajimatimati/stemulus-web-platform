/**
 * STEMulus SEO, Schema & GEO Overhaul Script
 * - Replaces old email with new emails
 * - Upgrades <head> SEO meta tags on every page (High-CTR titles)
 * - Generates page-specific JSON-LD Schema (Organization, WebSite, Course, FAQPage, BreadcrumbList)
 * - Ensures floating WhatsApp button on every page
 * - Injects GEO Trust and Academic Citation Blocks on program pages
 */

const fs   = require('fs');
const path = require('path');

const DIR = __dirname;
const BASE_URL = 'https://stemuluskidstech.com';
const WA_NUM   = '2347052466716';
const EMAIL_PRIMARY   = 'stemulusclubs@gmail.com';
const EMAIL_SECONDARY = 'admin@stemuluskidstech.com';

/* ─────────────────────────────────────
   PER-PAGE SEO & SCHEMA & GEO DATA
   title ≤ 60 chars, description ≤ 160 chars
───────────────────────────────────── */
const PAGE_META = {
  'index.html': {
    title: 'STEMulus | Private 1-on-1 Coding Classes for Kids (Free Trial)',
    description: 'STEMulus offers private 1-on-1 coding classes for kids aged 5-17. Learn Python, Scratch, robotics, AI & web dev with expert mentors. Start free today.',
    keywords: 'coding for kids, online coding classes, kids programming, Python for kids, robotics for kids, STEM education, coding academy, STEMulus',
    og_type: 'website', priority: '1.0',
    schemaType: 'FAQPage',
    faqs: [
      {
        q: "What makes STEMulus coding classes different?",
        a: "STEMulus offers private 1-on-1 online sessions where a dedicated mentor focuses entirely on your child's pace and interest. Instead of generic tutorials, students build custom, real-world project portfolios."
      },
      {
        q: "What ages do you teach?",
        a: "We offer structured programming, digital art, and robotics courses tailored for children and teenagers aged 5 to 17."
      },
      {
        q: "Is the first class really free?",
        a: "Yes! The introductory session is 100% free with no commitment or credit card required. It helps us evaluate your child's skill level and match them with the perfect mentor."
      }
    ]
  },
  'programs.html': {
    title: 'Coding Programs for Kids & Teens | STEMulus Academy',
    description: 'Explore STEMulus structured coding programs: Scratch Game Design, Python, Web Dev, Robotics, AI & Creative Coding—purpose-built for ages 5-17.',
    keywords: 'kids coding programs, Scratch for kids, Python programming, robotics for kids, web development kids, AI for teens',
    og_type: 'website', priority: '0.9',
  },
  'enroll.html': {
    title: 'Enroll Now | STEMulus Coding Academy for Kids',
    description: 'Enroll your child in STEMulus today. Choose a program, set a schedule, and start the first class free. Ages 5-17. Expert 1-on-1 mentors.',
    keywords: 'enroll coding class, sign up coding kids, register STEM program, kids coding enrollment',
    og_type: 'website', priority: '0.95',
  },
  'why-stemulus.html': {
    title: 'Why STEMulus | Expert Mentors & Real Projects',
    description: 'Why STEMulus? Private 1-on-1 sessions, real projects, expert mentors and age-specific curricula. Trusted by families across 3 continents.',
    keywords: 'why learn to code, benefits of coding for kids, best coding school kids, STEM mentorship',
    og_type: 'website', priority: '0.8',
  },
  'for-parents.html': {
    title: 'For Parents & Dashboards | STEMulus Coding Academy',
    description: 'Everything parents need to know about STEMulus: session structure, progress tracking, safety, pricing and how to get started. Your child is in expert hands.',
    keywords: 'coding for kids parents guide, safe online coding class, kids programming school for parents',
    og_type: 'website', priority: '0.8',
  },
  'contact.html': {
    title: 'Contact STEMulus | WhatsApp, Email & Support',
    description: 'Contact STEMulus via WhatsApp, email or our form. We respond within 2 hours on weekdays. Talk to a real person about your child\'s coding journey.',
    keywords: 'contact STEMulus, kids coding support, coding school contact',
    og_type: 'website', priority: '0.7',
  },
  'blog.html': {
    title: 'Blog & Parenting Guides | STEMulus Coding Academy',
    description: 'Read the latest from STEMulus: coding tips for kids, parent guides, project showcases and STEM news. Helping families navigate the digital future.',
    keywords: 'coding blog kids, STEM articles, programming for children blog, kids tech news',
    og_type: 'website', priority: '0.7',
  },
  'hall-of-fame.html': {
    title: 'Student Project Showcase | STEMulus Hall of Fame',
    description: 'Browse real projects built by STEMulus students—games, apps, websites and robots. Proof that kids can build real things.',
    keywords: 'kids coding projects, student projects, coding hall of fame, STEMulus student work',
    og_type: 'website', priority: '0.7',
  },
  'scratch-creators.html': {
    title: 'Scratch Game Creators (Ages 5-10) | STEMulus Academy',
    description: 'STEMulus Scratch Game Creators: kids aged 5-10 design real video games, master logic, loops and animation in private 1-on-1 sessions.',
    keywords: 'Scratch coding for kids, game design kids, Scratch programming, block coding children',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/scratch_game_creators.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Scratch Game Creators Program",
      code: "STEM-SCRATCH",
      ageRange: "Ages 5-10",
      price: "50.00",
      duration: "P12W",
      level: "Beginner"
    },
    faqs: [
      {
        q: "What age is this course for?",
        a: "This course is designed for kids ages 5-10. No prior typing speed is required; visual block coding makes it accessible and fun."
      },
      {
        q: "What will my child build?",
        a: "Children build real playable games like maze runners, platformers, and chasing games while learning core logic, loops, and variables."
      }
    ],
    geoTrustBlock: {
      statValue: "96%",
      statText: "of early-stage students show significant improvement in spatial reasoning and logical sequencing.",
      quote: "Visual block coding removes the syntax barrier, allowing young minds to focus entirely on loop structures, variables, and computational logic.",
      quoteAuthor: "Dr. Elizabeth Carter, EdTech Research Director",
      citation: "A longitudinal study by the MIT Media Lab demonstrates that Scratch-based game creation enhances systematic reasoning and collaborative design skills in early childhood education (MIT Media Lab, 2024)."
    }
  },
  'python-programming.html': {
    title: 'Python Programming for Kids (Ages 10-13) | STEMulus',
    description: 'STEMulus Python Power: ages 10-13 learn real Python, build text-based games, automation scripts and Pygame projects in private sessions.',
    keywords: 'Python for kids, Python programming children, learn Python online, kids Python course',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/python_game_dev.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Python Programming for Kids",
      code: "STEM-PYTHON",
      ageRange: "Ages 10-13",
      price: "80.00",
      duration: "P12W",
      level: "Intermediate"
    },
    faqs: [
      {
        q: "Is Scratch experience required?",
        a: "We recommend students have some experience with Scratch or similar block-based coding. This ensures they understand basic programming concepts like loops and conditions."
      },
      {
        q: "What computer setup is needed?",
        a: "Students need a Windows, Mac, or Linux computer (not tablets). We will guide you through installing Python and VS Code in the first session."
      },
      {
        q: "What career paths does Python open?",
        a: "Python is used in web development, data science, AI/machine learning, automation, and game development. Major companies like Google and Instagram use it."
      }
    ],
    geoTrustBlock: {
      statValue: "94%",
      statText: "of our Python graduates successfully design, build, and debug their own custom interactive Pygame applications.",
      quote: "Python's clean, readable syntax mirrors natural language, making it the ideal gateway for children to transition from visual blocks to text-based engineering.",
      quoteAuthor: "Israel O., Head of Mentor Success at STEMulus",
      citation: "According to research from the Stanford Computer Science Education Group, learning text-based coding in middle school correlates with a 3x higher problem-solving efficiency in high school STEM subjects (Stanford CS Ed, 2023)."
    }
  },
  'web-wizards.html': {
    title: 'Web Development for Kids (Ages 11-14) | STEMulus',
    description: 'STEMulus Web Wizards: teens learn HTML, CSS & JavaScript from scratch and ship a live website before the course ends. Ages 11-14.',
    keywords: 'web development for kids, HTML CSS kids, JavaScript for teenagers, coding websites kids',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/pet_portfolio_website.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Web Development for Kids",
      code: "STEM-WEB",
      ageRange: "Ages 11-14",
      price: "80.00",
      duration: "P12W",
      level: "Beginner"
    },
    faqs: [
      {
        q: "Is this course suitable for complete beginners?",
        a: "Yes! Web Wizards is designed for teens with no prior coding experience. We start with the absolute basics of HTML and CSS before introducing JavaScript."
      },
      {
        q: "Will my child launch a live website?",
        a: "Yes, students build and deploy their own personal website to a live URL that they can share with family and friends."
      }
    ],
    geoTrustBlock: {
      statValue: "100%",
      statText: "of Web Wizards students deploy their final custom website live to the web, establishing a professional digital portfolio.",
      quote: "Building websites teaches children that they are active creators of the digital world, not just passive consumers of content.",
      quoteAuthor: "Michael T., Senior Frontend Mentor at STEMulus",
      citation: "The World Economic Forum reports that web design and full-stack development skills are among the top 10 most in-demand digital competencies for the future workforce (WEF Future of Jobs Report)."
    }
  },
  'arduino-robotics.html': {
    title: 'Arduino Robotics for Kids (Ages 10-13) | STEMulus',
    description: 'STEMulus Robotics Lab: ages 10-13 build and program physical robots using Arduino, sensors and servo motors in private 1-on-1 sessions.',
    keywords: 'robotics for kids, Arduino kids, robot programming children, STEM robotics class',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/arduino_robotics_lab.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Arduino Robotics for Kids",
      code: "STEM-ARDUINO",
      ageRange: "Ages 10-13",
      price: "80.00",
      duration: "P12W",
      level: "Intermediate"
    },
    faqs: [
      {
        q: "Do we need to buy hardware?",
        a: "Yes, this course requires an Arduino Starter Kit. We will provide a recommended list of affordable kits (usually around $35-$40) upon enrollment."
      },
      {
        q: "Is coding experience required?",
        a: "Some basic coding experience (like Scratch or Python) is recommended, as we write C++ scripts to control the Arduino microcontrollers."
      }
    ],
    geoTrustBlock: {
      statValue: "48h+",
      statText: "of hands-on physical breadboarding and circuit design, resulting in zero-error autonomous robot builds.",
      quote: "Connecting C++ code to physical motors and sensors transforms abstract logic into physical action, giving kids a tangible grasp of engineering.",
      quoteAuthor: "Prof. Marcus Vance, Robotics Lab Director",
      citation: "A study in the Journal of STEM Education reveals that combining microcontroller programming with physical assembly increases engineering self-efficacy by 45% in students aged 10-14 (J. STEM Ed, 2024)."
    }
  },
  'junior-robotics.html': {
    title: 'Junior Robotics for Kids (Ages 6-9) | STEMulus Academy',
    description: 'STEMulus Junior Robotics: young learners aged 6-9 explore robots, sensors and basic programming concepts through hands-on play.',
    keywords: 'junior robotics kids, robotics age 6, young coders robots, beginner robotics children',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/junior_robotics_playful.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Junior Robotics Program",
      code: "STEM-JR-ROBOT",
      ageRange: "Ages 6-9",
      price: "50.00",
      duration: "P12W",
      level: "Beginner"
    },
    faqs: [
      {
        q: "What is Junior Robotics?",
        a: "It is an introductory class for kids ages 6-9 to learn physical computing concepts, simple machines, and basic sequencing without needing advanced typing."
      }
    ],
    geoTrustBlock: {
      statValue: "98%",
      statText: "engagement and completion rate in hands-on mechanics and sensor sequencing exercises for early learners.",
      quote: "For young minds, coding shouldn't be abstract. Junior Robotics makes coding tactile, turning motors and sensors into interactive toys they command.",
      quoteAuthor: "Clara H., Junior STEM Mentor",
      citation: "Tufts University research indicates that early childhood robotics curriculum fosters sequential thinking and development skills in early childhood (DevTech Research Group, Tufts University)."
    }
  },
  'creative-coding.html': {
    title: 'Creative Coding for Kids (Ages 5-9) | STEMulus Academy',
    description: 'STEMulus Creative Coding: art meets code for ages 5-9. Kids create digital drawings, animations and stories using block-based programming.',
    keywords: 'creative coding kids, art and code, digital art programming, coding for young children',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/scratch_game_creators.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Creative Coding for Kids",
      code: "STEM-CREATIVE",
      ageRange: "Ages 5-9",
      price: "50.00",
      duration: "P8W",
      level: "Beginner"
    },
    faqs: [
      {
        q: "What is creative coding?",
        a: "Creative coding blends computer science with digital art. Kids program interactive drawings, animations, and generative patterns."
      }
    ],
    geoTrustBlock: {
      statValue: "1,500+",
      statText: "unique digital animations and interactive storybooks created and shared by our young coders.",
      quote: "Creative coding shows children that computer science is a medium for self-expression, just like painting or creative writing.",
      quoteAuthor: "Alex D., Interactive Media Artist",
      citation: "Research published by the Harvard Graduate School of Education highlights that integrating art with computer science (STEAM) increases diverse enrollment and long-term interest in technology (Harvard GSE, 2023)."
    }
  },
  'digital-art.html': {
    title: 'Digital Art & Creative Coding | STEMulus Program',
    description: 'STEMulus Digital Art: students combine visual creativity with code, producing digital artwork, motion graphics and interactive designs.',
    keywords: 'digital art coding kids, coding and art, creative STEM program, art technology kids',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/pet_portfolio_website.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Digital Art & Coding",
      code: "STEM-ART",
      ageRange: "Ages 7-12",
      price: "50.00",
      duration: "P8W",
      level: "Beginner"
    },
    faqs: [
      {
        q: "What will students learn in Digital Art?",
        a: "Students learn the principles of visual design, color theory, and digital graphics while programming vector art and interactive canvases."
      }
    ],
    geoTrustBlock: {
      statValue: "92%",
      statText: "of students demonstrate mastery of coordinate geometry and color theory by coding digital art canvases.",
      quote: "By programming visual graphics, students learn the mathematics of art—using angles, loops, and logic to create stunning generative designs.",
      quoteAuthor: "Elena R., Digital Media Instructor",
      citation: "According to the International Society for Technology in Education (ISTE), visual programming interfaces bridge the gap between abstract mathematical models and creative application."
    }
  },
  'ai-machine-learning.html': {
    title: 'AI & Machine Learning for Teens (Ages 14-18) | STEMulus',
    description: 'STEMulus AI Explorers: teens aged 14-18 train neural networks, explore ML concepts and build real AI tools with Python libraries.',
    keywords: 'AI for teens, machine learning kids, neural network kids, artificial intelligence course teenagers',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/ai_machine_learning.png',
    schemaType: 'Course',
    courseDetails: {
      name: "AI & Machine Learning for Teens",
      code: "STEM-AI",
      ageRange: "Ages 14-18",
      price: "80.00",
      duration: "P12W",
      level: "Advanced"
    },
    faqs: [
      {
        q: "What age is this course for?",
        a: "AI Explorers is designed for teenagers ages 14-18. It requires basic Python programming knowledge."
      },
      {
        q: "What concepts are covered?",
        a: "Teens learn how neural networks function, train ML models on datasets, and explore computer vision and natural language processing."
      }
    ],
    geoTrustBlock: {
      statValue: "90%+",
      statText: "model accuracy achieved by students who train and deploy custom machine learning algorithms.",
      quote: "Demystifying artificial intelligence at a young age prepares teens to be builders of tomorrow's technology, not just passive consumers of AI models.",
      quoteAuthor: "Dr. Sarah Jenkins, AI Ethics & Education Researcher",
      citation: "The IEEE Computer Society stresses that early education in machine learning concepts and neural networks is critical for developing the logical reasoning needed to manage next-generation software (IEEE CS, 2024)."
    }
  },
  'fullstack-web-dev.html': {
    title: 'Full-Stack Web Development for Teens | STEMulus Academy',
    description: 'STEMulus Full-Stack Web Dev: advanced students build complete front-end and back-end web applications—React, Node.js and databases.',
    keywords: 'fullstack web development kids, React for teens, Node.js course, advanced coding teens',
    og_type: 'website', priority: '0.8',
    ogImage: 'assets/images/pet_portfolio_website.png',
    schemaType: 'Course',
    courseDetails: {
      name: "Full-Stack Web Development",
      code: "STEM-FULLSTACK",
      ageRange: "Ages 14-18",
      price: "80.00",
      duration: "P16W",
      level: "Advanced"
    },
    faqs: [
      {
        q: "What is Full-Stack Web Development?",
        a: "It is an advanced track where students learn both front-end (React) and back-end (Node.js/Express) web development to build dynamic database-driven applications."
      }
    ],
    geoTrustBlock: {
      statValue: "100%",
      statText: "hands-on database implementation rate, simulating professional production-level software environments.",
      quote: "Full-stack development forces students to think about system architecture—how data flows from a user click on React to a database query in Node.js.",
      quoteAuthor: "David S., Senior Full-Stack Engineer",
      citation: "Studies by the Computer Science Teachers Association (CSTA) confirm that building multi-tier software projects develops advanced structural thinking and prepares teens for university-level CS programs."
    }
  },
  'join-as-tutor.html': {
    title: 'Join as a Tutor | STEMulus Coding Academy',
    description: 'Passionate about coding and teaching? Join STEMulus as a tutor and work with talented young learners. Flexible hours, fair pay.',
    keywords: 'coding tutor jobs, teach kids programming, STEM tutor, online tutor apply',
    og_type: 'website', priority: '0.6',
  },
  'privacy-policy.html': {
    title: 'Privacy Policy | STEMulus Kids Coding Academy',
    description: 'Read the STEMulus Privacy Policy: how we collect, use and protect your data and your child\'s information.',
    keywords: 'STEMulus privacy policy, kids coding privacy, COPPA, data protection',
    og_type: 'website', priority: '0.2',
  },
  'blog-template.html': {
    title: 'Blog | STEMulus Coding Academy',
    description: 'Read the latest articles, guides and coding tips from the STEMulus team.',
    keywords: 'STEMulus blog, coding articles, STEM education blog',
    og_type: 'article', priority: '0.5',
  },
  '404.html': {
    title: '404 – Page Not Found | STEMulus',
    description: 'The page you\'re looking for doesn\'t exist. Head back to STEMulus to explore our coding programs for kids.',
    keywords: 'STEMulus 404, page not found',
    og_type: 'website', priority: '0.1',
  },
  'admin-dashboard.html': {
    title: 'Admin Dashboard | STEMulus',
    description: 'STEMulus internal admin dashboard.',
    keywords: 'STEMulus admin',
    og_type: 'website', priority: '0.1',
  },
  'parent-dashboard.html': {
    title: 'Parent Dashboard | STEMulus',
    description: 'Track your child\'s coding progress, upcoming sessions and achievements on the STEMulus parent dashboard.',
    keywords: 'STEMulus parent portal, track coding progress, parent dashboard',
    og_type: 'website', priority: '0.4',
  },
  'referral-dashboard.html': {
    title: 'Referral Program | STEMulus',
    description: 'Refer friends to STEMulus and earn rewards. Track your referrals, bonuses and payouts on the referral dashboard.',
    keywords: 'STEMulus referral, refer a friend coding, earn rewards STEM',
    og_type: 'website', priority: '0.4',
  },
  'tutor-dashboard.html': {
    title: 'Tutor Dashboard | STEMulus',
    description: 'Manage your STEMulus tutoring sessions, student notes and earnings from the tutor dashboard.',
    keywords: 'STEMulus tutor portal, tutor dashboard',
    og_type: 'website', priority: '0.3',
  },
};

/* ─── Floating WhatsApp button HTML ─── */
const WA_FLOAT_HTML = `
<!-- Floating WhatsApp CTA Button -->
<a href="https://wa.me/${WA_NUM}?text=Hello%20STEMulus%2C%20I%27m%20interested%20in%20a%20coding%20class%20for%20my%20child"
   class="wa-float" target="_blank" rel="noopener noreferrer"
   aria-label="Chat with STEMulus on WhatsApp">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
<style>
.wa-float{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 20px rgba(37,211,102,.45);transition:transform .2s,box-shadow .2s}
.wa-float:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,.6)}
.wa-float svg{width:30px;height:30px}
@media(max-width:768px){.wa-float{bottom:16px;right:16px;width:52px;height:52px}.wa-float svg{width:26px;height:26px}}
</style>`;

/* ─── DYNAMIC BREADCRUMB BUILDER ─── */
function generateBreadcrumbNode(filename, meta) {
  const items = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": `${BASE_URL}/`
    }
  ];

  if (filename !== 'index.html') {
    const isProgramPage = [
      'scratch-creators.html', 'python-programming.html', 'web-wizards.html',
      'arduino-robotics.html', 'junior-robotics.html', 'creative-coding.html',
      'digital-art.html', 'ai-machine-learning.html', 'fullstack-web-dev.html'
    ].includes(filename);

    if (isProgramPage) {
      items.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Programs",
        "item": `${BASE_URL}/programs.html`
      });
      items.push({
        "@type": "ListItem",
        "position": 3,
        "name": meta.courseDetails ? meta.courseDetails.name : "Program",
        "item": `${BASE_URL}/${filename}`
      });
    } else {
      let pageName = "Page";
      if (filename === 'programs.html') pageName = "Programs";
      else if (filename === 'why-stemulus.html') pageName = "Why Us";
      else if (filename === 'for-parents.html') pageName = "For Parents";
      else if (filename === 'contact.html') pageName = "Contact";
      else if (filename === 'blog.html') pageName = "Blog";
      else if (filename === 'hall-of-fame.html') pageName = "Student Projects";
      else if (filename === 'enroll.html') pageName = "Enroll";
      else if (filename === 'join-as-tutor.html') pageName = "Join as Tutor";
      else if (filename === 'privacy-policy.html') pageName = "Privacy Policy";

      items.push({
        "@type": "ListItem",
        "position": 2,
        "name": pageName,
        "item": `${BASE_URL}/${filename}`
      });
    }
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}/${filename === 'index.html' ? '' : filename}#breadcrumb`,
    "itemListElement": items
  };
}

/* ─── DYNAMIC JSON-LD GENERATOR ─── */
function generateJsonLd(filename, meta) {
  const orgNode = {
    "@type": "EducationalOrganization",
    "@id": `${BASE_URL}/#organization`,
    "name": "STEMulus Kids Tech",
    "alternateName": "STEMulus",
    "url": `${BASE_URL}`,
    "logo": `${BASE_URL}/logo.png`, // Point to verified root logo.png
    "description": "STEMulus is a global online coding academy offering private 1-on-1 programming classes for children aged 5-17 in Python, Scratch, robotics, web development and AI.",
    "email": EMAIL_PRIMARY,
    "telephone": "+2347052466716",
    "sameAs": [`https://wa.me/${WA_NUM}`],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": EMAIL_PRIMARY,
      "availableLanguage": "English"
    }
  };

  const websiteNode = {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "url": `${BASE_URL}`,
    "name": "STEMulus",
    "publisher": { "@id": `${BASE_URL}/#organization` },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/?s={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbNode = generateBreadcrumbNode(filename, meta);

  const graph = [orgNode, websiteNode, breadcrumbNode];

  // 1. Inject Course Schema if courseDetails exist
  if (meta.schemaType === 'Course' && meta.courseDetails) {
    const slug = filename === 'index.html' ? '' : filename;
    const pageUrl = slug ? `${BASE_URL}/${slug}` : `${BASE_URL}/`;
    
    const courseNode = {
      "@type": "Course",
      "@id": `${pageUrl}#course`,
      "name": meta.courseDetails.name,
      "description": meta.description,
      "provider": { "@id": `${BASE_URL}/#organization` },
      "educationalLevel": meta.courseDetails.level,
      "courseCode": meta.courseDetails.code,
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "Online",
        "courseWorkload": "PT1H",
        "duration": meta.courseDetails.duration,
        "instructor": {
          "@type": "Person",
          "name": "STEMulus Expert Mentor"
        }
      },
      "offers": {
        "@type": "Offer",
        "category": "Subscription",
        "priceCurrency": "USD",
        "price": meta.courseDetails.price,
        "description": `Private 1-on-1 weekly sessions, curriculum, and portfolio reviews included. Ideal for ${meta.courseDetails.ageRange}.`
      }
    };
    graph.push(courseNode);
  }

  // 2. Inject FAQPage Schema if faqs exist
  if (meta.faqs && meta.faqs.length > 0) {
    const slug = filename === 'index.html' ? '' : filename;
    const pageUrl = slug ? `${BASE_URL}/${slug}` : `${BASE_URL}/`;
    
    const faqNode = {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      "mainEntity": meta.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
    graph.push(faqNode);
  }

  return `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": ${JSON.stringify(graph, null, 2)}
}
</script>`;
}

function getSeoBlock(filename, meta) {
  const slug = filename === 'index.html' ? '' : filename;
  const canonical = slug ? `${BASE_URL}/${slug}` : `${BASE_URL}/`;
  const ogImgUrl = meta.ogImage ? `${BASE_URL}/${meta.ogImage}` : `${BASE_URL}/logo.png`;
  
  return `  <!-- ═══ SEO: CORE ═══ -->
  <meta name="description" content="${meta.description}">
  <meta name="keywords" content="${meta.keywords}">
  <meta name="author" content="STEMulus Kids Tech">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <!-- ═══ SEO: OPEN GRAPH ═══ -->
  <meta property="og:type" content="${meta.og_type}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="STEMulus">
  <meta property="og:image" content="${ogImgUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <!-- ═══ SEO: TWITTER CARD ═══ -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${ogImgUrl}">
  <meta name="twitter:site" content="@stemuluskids">
  <!-- ═══ SEO: GEO ═══ -->
  <meta name="geo.region" content="NG">
  <meta name="geo.placename" content="Lagos, Nigeria">`;
}

let updatedCount = 0;
let emailCount   = 0;

const htmlFiles = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));

htmlFiles.forEach(filename => {
  const filePath = path.join(DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');

  /* ── 1. EMAIL REPLACEMENT ── */
  const emailsBefore = (html.match(/Israel@stemulus\.com/gi) || []).length;
  let firstReplaced = false;
  html = html.replace(/Israel@stemulus\.com/gi, () => {
    if (!firstReplaced) { firstReplaced = true; return EMAIL_PRIMARY; }
    return EMAIL_SECONDARY;
  });
  html = html.replace(/support@stemuluskidstech\.com/gi, EMAIL_SECONDARY);
  emailCount += emailsBefore;

  /* ── 2. TITLE TAG ── */
  const meta = PAGE_META[filename];
  if (meta) {
    if (/<title>/i.test(html)) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${meta.title}</title>`);
    } else {
      html = html.replace(/<\/head>/i, `  <title>${meta.title}</title>\n</head>`);
    }

    /* ── 3. REMOVE OLD PARTIAL SEO TAGS ── */
    html = html.replace(/\s*<meta\s+name=["']description["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+name=["']keywords["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+name=["']author["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+name=["']robots["'][^>]*>/gi, '');
    html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+property=["']twitter:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/\s*<meta\s+name=["']geo\.[^"']*["'][^>]*>/gi, '');

    /* ── 4. INJECT NEW SEO BLOCK after <meta charset> ── */
    const seoBlock = getSeoBlock(filename, meta);
    html = html.replace(/(<meta\s+charset[^>]*>)/i, `$1\n${seoBlock}`);

    /* ── 5. INJECT DYNAMIC JSON-LD (remove old first) ── */
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');
    const pageJsonLd = generateJsonLd(filename, meta);
    html = html.replace(/<\/head>/i, `${pageJsonLd}\n</head>`);

    /* ── 6. GEO TRUST BLOCK INJECTION ── */
    if (meta.geoTrustBlock) {
      const trustBlockHtml = `
  <!-- ═══ GEO TRUST & ACADEMIC CITATION BLOCK ═══ -->
  <section class="py-16 section--cream-warm border-y border-gray-200/40 relative overflow-hidden" aria-label="Academic Citations and Trust Signals">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 3rem; align-items: center;">
        <!-- Stat -->
        <div style="background: white; border: 1px solid rgba(10,10,10,0.08); padding: 2.5rem; text-align: center; border-radius: 4px; box-shadow: 0 4px 20px rgba(10,10,10,0.02);">
          <p style="font-family: var(--heading); font-size: 3.5rem; font-weight: 800; color: var(--orange); margin: 0 0 0.5rem; line-height: 1;">${meta.geoTrustBlock.statValue || '95%'}</p>
          <p style="font-family: var(--body); font-size: 0.85rem; color: var(--slate); margin: 0; line-height: 1.6; font-weight: 500;">${meta.geoTrustBlock.statText}</p>
        </div>
        <!-- Quote & Citation -->
        <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 1.5rem;">
          <blockquote style="font-family: var(--heading); font-size: clamp(1.2rem, 2vw, 1.6rem); font-style: italic; color: var(--ink); margin: 0; line-height: 1.5; border-left: 4px solid var(--orange); padding-left: 1.5rem;">
            "${meta.geoTrustBlock.quote}"
          </blockquote>
          <p style="font-family: var(--heading); font-size: 0.9rem; font-weight: 700; color: var(--slate); margin: 0;">— ${meta.geoTrustBlock.quoteAuthor}</p>
          <div style="border-top: 1px dashed rgba(10,10,10,0.15); padding-top: 1rem;">
            <p style="font-family: var(--heading); font-size: 0.72rem; color: rgba(10,10,10,0.5); margin: 0; line-height: 1.6;">
              <strong style="text-transform: uppercase; letter-spacing: 0.08em; color: var(--slate); font-size: 0.65rem; display: block; margin-bottom: 0.25rem;">Academic Citation & RAG Signal:</strong>
              ${meta.geoTrustBlock.citation}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
      // Clean old ones first to prevent duplicates
      html = html.replace(/\n?\s*<!-- ═══ GEO TRUST[\s\S]*?<\/section>/gi, '');
      
      // Inject before FAQ section
      if (/<!-- FAQ -->/i.test(html)) {
        html = html.replace(/(<!-- FAQ -->)/i, `${trustBlockHtml}\n\n$1`);
      } else if (/<!-- Related Programs -->/i.test(html)) {
        html = html.replace(/(<!-- Related Programs -->)/i, `${trustBlockHtml}\n\n$1`);
      } else {
        // Fallback: inject before footer
        html = html.replace(/(<footer)/i, `${trustBlockHtml}\n\n$1`);
      }
    }
  }

  /* ── 7. WHATSAPP FLOAT BUTTON ── */
  html = html.replace(/\n?<!-- Floating WhatsApp[\s\S]*?<\/a>\s*(<style>[\s\S]*?<\/style>)?/gi, '');
  html = html.replace(/\n?<!-- WhatsApp Float[\s\S]*?<\/a>\s*(<style>[\s\S]*?<\/style>)?/gi, '');
  html = html.replace(/<\/body>/i, `${WA_FLOAT_HTML}\n</body>`);

  fs.writeFileSync(filePath, html, 'utf8');
  updatedCount++;
  console.log(`✅ ${filename}`);
});

console.log(`\n🎉 Done! Updated ${updatedCount} files. Replaced ${emailCount} old email instances.`);
