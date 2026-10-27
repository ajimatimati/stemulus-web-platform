const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const hubs = [
  // 1. Domestic Nigerian Wealth Hubs
  {
    slug: 'coding-classes-for-kids-lekki-lagos',
    title: 'Coding Classes for Kids in Lekki, Victoria Island & Ikoyi | STEMulus',
    metaDesc: 'Private 1-on-1 online coding classes for kids aged 5 to 17 in Lekki Phase 1, Ikoyi, Victoria Island and Chevron. Scratch, Python, web and robotics without Lagos traffic.',
    h1: 'Premier 1-on-1 Coding Classes for Kids in Lekki & Victoria Island',
    subtitle: 'Zero traffic. Elite personal mentors. Real game development and robotics scheduled around your family routine in Lagos.',
    region: 'Lagos, Nigeria',
    geoRegion: 'NG-LA',
    currency: 'NGN',
    pricingNote: 'Starting from ₦48,000 / month (Beginner Foundation: ₦48k, Intermediate: ₦75k, Advanced: ₦120k). 100% 1-on-1 private mentorship.',
    localContext: 'Parents in Lekki, Ikoyi, and Victoria Island know the toll of Lagos traffic. STEMulus brings world-class, private 1-on-1 computer science education directly into your living room. Your child learns directly from handpicked senior software engineers on flexible weekday evenings and weekend mornings.',
    faqs: [
      { q: 'How do online classes work for kids in Lekki and Ikoyi?', a: 'Every session is a private 1-on-1 live interactive video call. The mentor shares their screen, debugs code collaboratively with your child, and guides them step by step through hands-on game or software builds.' },
      { q: 'What internet speed is required?', a: 'A standard home fiber or reliable 4G/5G connection (MTN, Airtel, Starlink, or FibreOne) is ideal for smooth screen sharing and interactive coding.' },
      { q: 'Can we schedule classes around school and extracurriculars?', a: 'Yes. Because our classes are strictly 1-on-1, you choose the exact days and times that fit your family schedule.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-ikeja-lagos',
    title: 'Coding Classes for Kids in Ikeja, Magodo & Maryland | STEMulus',
    metaDesc: 'Live 1-on-1 online coding lessons for children aged 5 to 17 in Ikeja GRA, Magodo, Maryland and Omole. Master Scratch, Python and Robotics with private mentors.',
    h1: 'Private 1-on-1 Coding Lessons for Kids in Ikeja & Magodo',
    subtitle: 'Practical computer science and game creation for children aged 5 to 17 in Ikeja GRA, Maryland, and surrounding areas.',
    region: 'Lagos Mainland, Nigeria',
    geoRegion: 'NG-LA',
    currency: 'NGN',
    pricingNote: 'From ₦48,000 / month (Beginners: ₦48k, Intermediate: ₦75k, Advanced: ₦120k). Dual certification included.',
    localContext: 'Give your child a head start in global technology from Ikeja, Magodo, or Maryland. Our personalized curriculum replaces passive gaming with real computational logic, algorithmic thinking, and project building.',
    faqs: [
      { q: 'Is my child too young to learn coding at age 6 or 7?', a: 'Not at all. Our Junior Creators track uses visual block logic and Scratch 3.0, teaching core computational concepts through playful character animation and game design.' },
      { q: 'What happens in the free discovery session?', a: 'A senior mentor spends 45 minutes assessing your child skill level, guiding them through a complete live build, and providing parents with a customized curriculum roadmap.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-abuja',
    title: 'Online Coding Classes for Kids in Abuja (Maitama, Asokoro, Wuse) | STEMulus',
    metaDesc: 'Elite 1-on-1 online coding classes for kids aged 5 to 17 in Abuja (Maitama, Asokoro, Wuse 2, Guzape, Gwarinpa). Scratch, Python, Web & Robotics. Book a free session.',
    h1: 'Elite 1-on-1 Online Coding Classes for Kids in Abuja',
    subtitle: 'Empowering the next generation of builders in Maitama, Asokoro, Wuse 2, and Guzape with private software engineering mentorship.',
    region: 'Abuja, FCT, Nigeria',
    geoRegion: 'NG-FC',
    currency: 'NGN',
    pricingNote: 'From ₦48,000 / month. Tailored 1-on-1 schedules matching private school calendars across Abuja.',
    localContext: 'Designed for ambitious families in the Federal Capital Territory. STEMulus delivers rigorous, project-based STEM education aligned with British, American, and Nigerian curricula.',
    faqs: [
      { q: 'Are tutors background-checked?', a: 'Yes. 100% of STEMulus academic mentors pass strict technical audits, pedagogical evaluations, and rigorous identity verifications.' },
      { q: 'Do students receive recognized certificates?', a: 'Every student earns a verified digital Certificate of Project Mastery upon completing each milestone quest.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-port-harcourt',
    title: 'Coding Classes for Kids in Port Harcourt (GRA & Peter Odili) | STEMulus',
    metaDesc: 'Private 1-on-1 online coding for kids aged 5 to 17 in Port Harcourt (Old GRA, New GRA, Peter Odili). Scratch, Python, Robotics with personal tech mentors.',
    h1: '1-on-1 Online Coding Classes for Kids in Port Harcourt',
    subtitle: 'Project-first STEM education for children in Old GRA, New GRA, and Peter Odili. Learn Python, Scratch, and Web Development.',
    region: 'Port Harcourt, Rivers State, Nigeria',
    geoRegion: 'NG-RI',
    currency: 'NGN',
    pricingNote: 'Starting at ₦48,000 / month for foundational tracks. Flexible weekend and evening class times.',
    localContext: 'Parents in Port Harcourt choose STEMulus for structured, distraction-free computer science training that builds independent problem-solving skills.',
    faqs: [
      { q: 'What equipment does my child need?', a: 'A laptop or desktop computer (Windows, Mac, or Chromebook) with a webcam, microphone, and internet connection.' }
    ]
  },

  // 2. UK Diaspora Hubs
  {
    slug: 'coding-classes-for-kids-london',
    title: 'Online Coding Classes for Kids in London | Private 1-on-1 Tutors (Ages 5-17)',
    metaDesc: 'Premier private 1-on-1 online coding classes for children and teens across Greater London. Scratch, Python, Web Development and GCSE Computer Science support.',
    h1: 'Private 1-on-1 Online Coding Tutors in London',
    subtitle: 'Personalized computer science mentorship for children aged 5 to 17 across London. Aligned with Key Stage 1 to 4 and GCSE specifications.',
    region: 'London, United Kingdom',
    geoRegion: 'GB-LND',
    currency: 'GBP',
    pricingNote: 'Parallel anchor from £80 / month. Scheduled in GMT and BST with zero commuting.',
    localContext: 'Whether you reside in North, South, East, West, or Central London, eliminate weekend commutes to tutoring centers. Our live 1-on-1 mentors guide your child through hands-on software development at their own pace.',
    faqs: [
      { q: 'Is the curriculum aligned with the UK National Curriculum?', a: 'Yes. Our pathways reinforce Key Stage computing requirements, algorithmic logic, boolean operators, and GCSE Computer Science fundamentals.' },
      { q: 'Are class timings convenient for London families?', a: 'We offer flexible weekday afternoon slots (4:00 PM to 7:30 PM GMT) and comprehensive weekend morning and afternoon sessions.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-manchester',
    title: 'Online Coding Classes for Kids in Manchester & Salford | STEMulus',
    metaDesc: 'Live 1-on-1 online coding tuition for children aged 5 to 17 in Manchester, Salford, Trafford and Cheshire. Scratch, Python, Web Apps. Book a free trial.',
    h1: 'Private 1-on-1 Coding Classes for Kids in Manchester',
    subtitle: 'Inspiring young coders across Greater Manchester and Cheshire with personalized 1-on-1 computer science tuition.',
    region: 'Manchester, United Kingdom',
    geoRegion: 'GB-MAN',
    currency: 'GBP',
    pricingNote: 'Tuition starting from £80 / month. Flexible 1-on-1 schedules in GMT/BST.',
    localContext: 'Manchester is a premier UK digital hub. Equip your child with real coding capabilities from primary school through secondary exams with dedicated mentor guidance.',
    faqs: [
      { q: 'Can my child get help with GCSE Computer Science projects?', a: 'Yes. Our Advanced Python and Web Engineering tracks directly support GCSE computing logic, pseudocode, and algorithm design.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-birmingham',
    title: 'Coding Classes for Kids in Birmingham & West Midlands | STEMulus',
    metaDesc: 'Private online coding classes for kids aged 5 to 17 in Birmingham, Solihull, and the West Midlands. 1-on-1 Scratch, Python, Robotics. Free discovery session.',
    h1: '1-on-1 Online Coding Classes for Kids in Birmingham',
    subtitle: 'Nurturing tech confidence for children in Birmingham, Solihull, and Sutton Coldfield with private live coding mentors.',
    region: 'Birmingham, United Kingdom',
    geoRegion: 'GB-BIR',
    currency: 'GBP',
    pricingNote: 'From £80 / month parallel anchor. 100% private 1-on-1 instruction.',
    localContext: 'Tailored specifically for West Midlands families seeking structured, project-driven computer programming without crowded group call distractions.',
    faqs: [
      { q: 'How long are the sessions?', a: 'Standard classes are 55 minutes of pure 1-on-1 mentorship. The free diagnostic trial is 45 minutes.' }
    ]
  },

  // 3. North American Diaspora Hubs
  {
    slug: 'coding-classes-for-kids-houston',
    title: 'Online Coding Classes for Kids in Houston, Sugar Land & Katy | STEMulus',
    metaDesc: 'Premier 1-on-1 online coding classes for kids aged 5 to 17 in Houston, Sugar Land, Katy, and Pearland, Texas. Learn Scratch, Python, and Robotics on Central Time.',
    h1: 'Private 1-on-1 Online Coding Classes for Kids in Houston',
    subtitle: 'Live project-based coding lessons for children across Greater Houston, Sugar Land, and Katy. Scheduled conveniently in Central Time (CST).',
    region: 'Houston, Texas, USA',
    geoRegion: 'US-TX',
    currency: 'USD',
    pricingNote: 'Starting from $95 / month. Scheduled in Central Standard Time.',
    localContext: 'Houston families value high-yield STEM education. STEMulus pairs your child directly with experienced engineering mentors who teach real coding, not just drag-and-drop puzzles.',
    faqs: [
      { q: 'What time slots are available for Texas families?', a: 'We support Central Time slots after school on weekdays and flexible weekend hours.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-dallas',
    title: 'Coding Classes for Kids in Dallas, Plano & Frisco TX | STEMulus',
    metaDesc: 'Private 1-on-1 online coding lessons for kids aged 5 to 17 in Dallas, Plano, Frisco, and Irving TX. Master Python, Scratch, and Web Development.',
    h1: '1-on-1 Online Coding Classes for Kids in Dallas & Frisco',
    subtitle: 'Accelerating tech skills for students in Dallas, Plano, and Frisco with private, hands-on computer science tutoring.',
    region: 'Dallas, Texas, USA',
    geoRegion: 'US-TX',
    currency: 'USD',
    pricingNote: 'From $95 / month. 100% private 1-on-1 instruction.',
    localContext: 'From young creators building their first arcade games in Scratch to high schoolers programming neural networks in Python, our Dallas track delivers personalized excellence.',
    faqs: [
      { q: 'Can my child build their own video games?', a: 'Yes. Every track is build-first. By lesson 4, students deploy and play their own original games.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-atlanta',
    title: 'Online Coding Classes for Kids in Atlanta & Alpharetta GA | STEMulus',
    metaDesc: 'Private 1-on-1 coding mentorship for kids aged 5 to 17 in Atlanta, Alpharetta, and Marietta GA. Scratch, Python, and Web Development in Eastern Time.',
    h1: 'Private 1-on-1 Coding Mentorship for Kids in Atlanta',
    subtitle: 'Building the next generation of software creators across Atlanta and Alpharetta. Scheduled in Eastern Time (EST).',
    region: 'Atlanta, Georgia, USA',
    geoRegion: 'US-GA',
    currency: 'USD',
    pricingNote: 'Starting from $95 / month. 1-on-1 mentorship with senior instructors.',
    localContext: 'Give your child an unfair advantage in the tech capital of the South with individualized 1-on-1 coding classes tailored to their exact speed and passions.',
    faqs: [
      { q: 'How does STEMulus differ from group coding franchises?', a: 'In group classes of 8 to 12 kids, students easily get left behind or bored. At STEMulus, your child receives 100% of the mentor attention every minute.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-toronto',
    title: 'Online Coding Classes for Kids in Toronto & GTA | STEMulus',
    metaDesc: 'Premier private 1-on-1 coding classes for kids aged 5 to 17 in Toronto, Mississauga, Brampton, and the GTA. Scratch, Python, and Web Development.',
    h1: 'Private 1-on-1 Online Coding Classes for Kids in Toronto',
    subtitle: 'Inspiring young creators across Toronto, Mississauga, and Brampton with live project-driven coding tuition in Eastern Time.',
    region: 'Toronto, Ontario, Canada',
    geoRegion: 'CA-ON',
    currency: 'CAD',
    pricingNote: 'Starting from $120 CAD / month. Scheduled conveniently in Eastern Time.',
    localContext: 'Equip your child with essential 21st-century problem-solving skills from home in the Greater Toronto Area. No winter commuting, just pure hands-on building.',
    faqs: [
      { q: 'Is a credit card required for the trial class?', a: 'No. The 45-minute discovery session is completely free with no payment info required.' }
    ]
  },
  {
    slug: 'coding-classes-for-kids-calgary',
    title: 'Coding Classes for Kids in Calgary & Edmonton | STEMulus',
    metaDesc: 'Private 1-on-1 online coding tuition for children aged 5 to 17 in Calgary and Edmonton, Alberta. Scratch, Python, Web Apps in Mountain Time.',
    h1: '1-on-1 Online Coding Classes for Kids in Calgary & Edmonton',
    subtitle: 'Project-first coding lessons for Alberta youth. Scheduled in Mountain Time (MST) with personalized mentor matching.',
    region: 'Calgary, Alberta, Canada',
    geoRegion: 'CA-AB',
    currency: 'CAD',
    pricingNote: 'Starting from $120 CAD / month. 1-on-1 private instruction.',
    localContext: 'Alberta families love the flexibility of 1-on-1 lessons that adapt to their child interests, whether building Roblox-style games in Scratch or data science scripts in Python.',
    faqs: [
      { q: 'Can my child progress at their own speed?', a: 'Yes. Because sessions are private, gifted learners can accelerate rapidly while beginners take all the time they need to master core concepts.' }
    ]
  },

  // 4. Global Hubs
  {
    slug: 'coding-classes-for-kids-dubai',
    title: 'Online Coding Classes for Kids in Dubai & Abu Dhabi | STEMulus',
    metaDesc: 'Elite 1-on-1 online coding classes for children aged 5 to 17 in Dubai and Abu Dhabi (UAE). Scratch, Python, Robotics scheduled in Gulf Standard Time (GST).',
    h1: 'Elite 1-on-1 Online Coding Classes for Kids in Dubai',
    subtitle: 'World-class private software engineering mentorship for children in Dubai, Abu Dhabi, and across the UAE. Scheduled in Gulf Standard Time.',
    region: 'Dubai, UAE',
    geoRegion: 'AE-DU',
    currency: 'USD',
    pricingNote: 'From £80 / $95 parallel anchor. Scheduled in GST with flexible afternoon and weekend options.',
    localContext: 'In an innovation-driven economy like the UAE, coding literacy is non-negotiable. STEMulus provides the rigorous, individual instruction needed to turn curiosity into mastery.',
    faqs: [
      { q: 'Are classes scheduled in Gulf Standard Time?', a: 'Yes. We match mentors to your local UAE schedule for seamless afternoon or weekend learning.' }
    ]
  },

  // 5. High-Volume Search Curriculum & Intent Pages
  {
    slug: 'scratch-coding-classes-for-kids',
    title: 'Scratch Coding Classes for Kids (Ages 5-10) | 36-Project Pathway | STEMulus',
    metaDesc: 'The definitive 8-Level Scratch coding curriculum for kids aged 5 to 10. 36 real arcade projects, live 1-on-1 mentors, dual certification. Book a free discovery class.',
    h1: 'The Ultimate 36-Project Scratch Coding Pathway for Kids',
    subtitle: 'Turn screen time into creative superpowers. An 8-level progressive curriculum where your child builds 36 original playable games with a private mentor.',
    region: 'Global',
    geoRegion: 'GLOBAL',
    currency: 'USD',
    pricingNote: 'Domestic: ₦48,000 / month | International: £80 / month parallel. 100% 1-on-1 mentorship.',
    localContext: 'Scratch is the world leading visual programming language created by MIT. At STEMulus, we take children beyond basic animations into full arcade physics, multi-level platformers, and intelligent game design.',
    faqs: [
      { q: 'What projects will my child build?', a: 'Our pathway includes 36 progressive games: from Roaring Lion and Slithering Snake to Brick Breaker Arcade, Space Invaders, and a 3D Subway Surfers clone.' },
      { q: 'Do kids need prior typing or coding experience?', a: 'None at all. Our visual block logic eliminates typing errors, allowing children as young as 5 to grasp core algorithmic concepts immediately.' }
    ]
  },
  {
    slug: 'python-coding-classes-for-teens',
    title: 'Python Programming Classes for Teens (Ages 10-17) | 1-on-1 Mentorship',
    metaDesc: 'Live 1-on-1 Python programming classes for teens aged 10 to 17. Master real syntax, Pygame, data structures, and algorithms with senior software engineers.',
    h1: 'Professional Python Programming Classes for Teens',
    subtitle: 'Real syntax. Real computational problem-solving. Master the world most in-demand language with private senior engineering mentors.',
    region: 'Global',
    geoRegion: 'GLOBAL',
    currency: 'USD',
    pricingNote: 'Domestic: ₦75,000 / month | International: £80 / month parallel. Private 1-on-1 mentorship.',
    localContext: 'Python powers AI, data science, and modern backend engineering. Our teen pathway transitions students from basic syntax to object-oriented programming, graphical games, and data analysis.',
    faqs: [
      { q: 'Is Python suitable for a 12 or 13-year-old beginner?', a: 'Yes. Python clean, readable syntax makes it the ideal first text-based language for young learners.' },
      { q: 'Do students build real portfolio projects?', a: 'Every student builds and hosts interactive projects including text RPGs, cryptographic ciphers, and classic arcade games like Snake and Pong.' }
    ]
  },
  {
    slug: 'robotics-and-electronics-classes-for-kids',
    title: 'Robotics & Virtual Electronics Classes for Kids (Ages 9-17) | STEMulus',
    metaDesc: 'Hands-on virtual robotics and Arduino circuits for kids aged 9 to 17. Ultrasonic sensors, PWM motors, smart automation and C++ programming. Free trial class.',
    h1: 'Robotics & Virtual Electronics Lab for Young Engineers',
    subtitle: 'Explore circuit theory, sensor arrays, motor control, and embedded C++ coding in a safe, interactive virtual simulation lab.',
    region: 'Global',
    geoRegion: 'GLOBAL',
    currency: 'USD',
    pricingNote: 'Domestic: ₦75,000 - ₦120,000 / month | International: £80 - £120 / month parallel.',
    localContext: 'Hardware engineering meets software control. Students wire virtual breadboards, test microcontrollers, and write code to trigger real-world actions like automated gates and obstacle-avoiding rovers.',
    faqs: [
      { q: 'Do we need to buy expensive hardware kits first?', a: 'No. Students start in our state-of-the-art virtual simulator where they can safely experiment with hundreds of sensors and chips without damaging components.' }
    ]
  },
  {
    slug: 'after-school-coding-club-online',
    title: 'Online After-School Coding Club for Kids | Private 1-on-1 Lessons',
    metaDesc: 'Flexible 1-on-1 online after-school coding club for children aged 5 to 17. Zero commuting, flexible evening schedules, expert mentors. Claim a free discovery class.',
    h1: 'The 1-on-1 Online After-School Coding Club',
    subtitle: 'All the excitement of a high-tech coding club, paired with the focused attention of a dedicated private mentor.',
    region: 'Global',
    geoRegion: 'GLOBAL',
    currency: 'USD',
    pricingNote: 'Plans starting from ₦48,000 / £80 parallel monthly. Flexible 1-on-1 scheduling.',
    localContext: 'Traditional after-school clubs require rushing through traffic to physical centers where one instructor oversees 15 children. STEMulus delivers personalized 1-on-1 coaching straight to your home screen.',
    faqs: [
      { q: 'Can we change class days from week to week?', a: 'Yes. Our portal lets parents adjust session schedules with 24 hours notice to accommodate exams and family activities.' }
    ]
  },
  {
    slug: 'holiday-coding-camp-online-kids',
    title: 'Holiday & Summer Online Coding Camp for Kids (Ages 5-17) | STEMulus',
    metaDesc: 'Intensive online holiday coding camps for kids aged 5 to 17. Build games, publish websites, and program robots during school breaks. Live 1-on-1 mentors.',
    h1: 'Online Holiday & Term-Break Coding Intensives',
    subtitle: 'Transform school breaks into game-building breakthroughs. Intensive 1-on-1 STEM bootcamps tailored to your child pace.',
    region: 'Global',
    geoRegion: 'GLOBAL',
    currency: 'USD',
    pricingNote: 'Flexible holiday passes starting from ₦48,000 / £80 parallel. Dual certification upon graduation.',
    localContext: 'Whether it is summer break, Easter vacation, or the December holiday season, keep young minds sharp and creative with project-based computer science milestones.',
    faqs: [
      { q: 'How many classes per week can students take during holidays?', a: 'Students can take 2, 3, or even daily sessions during holiday intensives to accelerate their mastery.' }
    ]
  }
];

function buildHtml(h) {
  const faqSchema = h.faqs.map(f => ({
    '@type': 'Question',
    'name': f.q,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': f.a
    }
  }));

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://stemuluskidstech.com/#organization',
        'name': 'STEMulus Global Coding Academy',
        'url': 'https://stemuluskidstech.com',
        'logo': 'https://stemuluskidstech.com/logo.png',
        'sameAs': [
          'https://facebook.com/stemuluskidstech',
          'https://instagram.com/stemuluskidstech',
          'https://twitter.com/stemuluskids'
        ]
      },
      {
        '@type': 'Course',
        'name': h.title,
        'description': h.metaDesc,
        'provider': { '@id': 'https://stemuluskidstech.com/#organization' },
        'educationalCredentialAwarded': 'Certificate of Project Mastery',
        'inLanguage': 'en',
        'isAccessibleForFree': false,
        'hasCourseInstance': {
          '@type': 'CourseInstance',
          'courseMode': 'Online',
          'courseWorkload': 'PT55M'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqSchema
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://stemuluskidstech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': h.region, 'item': `https://stemuluskidstech.com/${h.slug}.html` }
        ]
      }
    ]
  };

  const faqHtml = h.faqs.map(f => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">${f.q}</h3>
      <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0;">${f.a}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#FFFFFF" />
  <title>${h.title}</title>
  
  <!-- SEO CORE -->
  <meta name="description" content="${h.metaDesc}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="https://stemuluskidstech.com/${h.slug}.html" />
  ${h.geoRegion !== 'GLOBAL' ? `<meta name="geo.region" content="${h.geoRegion}" />` : ''}
  <meta name="geo.placename" content="${h.region}" />

  <!-- OPEN GRAPH -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${h.title}" />
  <meta property="og:description" content="${h.metaDesc}" />
  <meta property="og:url" content="https://stemuluskidstech.com/${h.slug}.html" />
  <meta property="og:site_name" content="STEMulus Kids Tech" />
  <meta property="og:image" content="https://stemuluskidstech.com/assets/images/og-image.png" />

  <!-- TWITTER CARD -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${h.title}" />
  <meta name="twitter:description" content="${h.metaDesc}" />
  <meta name="twitter:image" content="https://stemuluskidstech.com/assets/images/og-image.png" />

  <!-- FONTS & STYLES -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/tailwind-output.css" />
  <link rel="stylesheet" href="dist/combined.css" />
  <link rel="stylesheet" href="assets/css/stemulus-luxury.css" />
  <link rel="icon" type="image/png" href="favicon.png" />

  <!-- SCHEMA JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaJson, null, 2)}
  </script>
</head>
<body style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0;">

  <!-- NAVBAR -->
  <nav style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 50; padding: 0.75rem 1.5rem;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
      <a href="index.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none;">
        <span style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">STEMulus<span style="color: #2563eb;">.</span></span>
      </a>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="programs.html" style="color: #475569; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: none;" class="md:inline-block">Programs</a>
        <a href="scratch-creators.html" style="color: #475569; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: none;" class="md:inline-block">Scratch 36-Projects</a>
        <a href="book-class.html" style="background: #2563eb; color: #ffffff; padding: 0.6rem 1.25rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Book Free Class</a>
      </div>
    </div>
  </nav>

  <!-- HERO SECTION -->
  <header style="background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%); padding: 4rem 1.5rem 3rem; text-align: center;">
    <div style="max-width: 900px; margin: 0 auto;">
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #dbeafe; color: #1e40af; padding: 0.35rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; margin-bottom: 1.5rem;">
        <span>📍</span> ${h.region} · Private 1-on-1 Online Mentorship
      </div>
      <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.5rem; line-height: 1.2; font-weight: 800; color: #0f172a; margin: 0 0 1.25rem; letter-spacing: -0.02em;">
        ${h.h1}
      </h1>
      <p style="font-size: 1.2rem; color: #475569; line-height: 1.6; margin: 0 0 2rem; max-width: 750px; margin-left: auto; margin-right: auto;">
        ${h.subtitle}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="book-class.html" style="background: #2563eb; color: #ffffff; padding: 0.9rem 2rem; border-radius: 12px; font-weight: 800; font-size: 1.05rem; text-decoration: none; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);">
          Claim Free 45-Min Discovery Session
        </a>
        <a href="enroll.html" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 700; font-size: 1.05rem; text-decoration: none;">
          Direct Enrollment
        </a>
      </div>
      <p style="font-size: 0.85rem; color: #64748b; margin-top: 1rem;">
        No credit card required. 100% free diagnostic assessment and live project build.
      </p>
    </div>
  </header>

  <!-- LOCAL CONTEXT & VALUE PILLARS -->
  <section style="max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem;">
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 2.5rem;">
      <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; color: #0f172a; margin-top: 0; margin-bottom: 1rem;">
        Why Families in ${h.region} Choose STEMulus
      </h2>
      <p style="font-size: 1.05rem; line-height: 1.7; color: #334155; margin-bottom: 1.5rem;">
        ${h.localContext}
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0;">
        <strong style="color: #0f172a;">Transparent Tuition Anchor:</strong>
        <span style="color: #475569;"> ${h.pricingNote}</span>
      </div>
    </div>

    <!-- 4 CORE ADVANTAGES -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
        <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🎯</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">100% Private 1-on-1</h3>
        <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">No crowded call rooms. Your child receives complete personal focus from an elite engineering mentor.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
        <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🕹️</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">Build-First Curriculum</h3>
        <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">Students build real playable video games, interactive websites, and robotic scripts from lesson one.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
        <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">⏰</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">Your Family Time Zone</h3>
        <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">Classes are scheduled directly in your local time zone with 24-hour notice rescheduling flexibility.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
        <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📜</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">Dual Certification</h3>
        <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">Graduates earn verified digital credentials and project dossiers ready for high school and college portfolios.</p>
      </div>
    </div>

    <!-- FAQS -->
    <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; color: #0f172a; margin-bottom: 1.5rem; text-align: center;">
      Frequently Asked Questions
    </h2>
    <div style="margin-bottom: 3rem;">
      ${faqHtml}
    </div>

    <!-- CTA BANNER -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; border-radius: 20px; padding: 3rem 2rem; text-align: center; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);">
      <h2 style="font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 1rem;">
        Ready to Unlock Your Child Tech Potential in ${h.region}?
      </h2>
      <p style="font-size: 1.1rem; color: #bfdbfe; max-width: 600px; margin: 0 auto 2rem; line-height: 1.6;">
        Book a free 45-minute 1-on-1 diagnostic coding session today. Your child will code their first interactive project while you receive a tailored roadmap.
      </p>
      <a href="book-class.html" style="background: #ffffff; color: #1e3a8a; padding: 1rem 2.5rem; border-radius: 12px; font-weight: 800; font-size: 1.1rem; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
        Book Free Discovery Class Now
      </a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1.5rem; text-align: center; border-top: 1px solid #1e293b; font-size: 0.9rem;">
    <div style="max-width: 1000px; margin: 0 auto;">
      <p style="color: #f8fafc; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">STEMulus Kids Technologies</p>
      <p style="margin-bottom: 1.5rem;">Global 1-on-1 Computer Science Academy for Ages 5 to 17</p>
      <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <a href="index.html" style="color: #94a3b8; text-decoration: none;">Home</a>
        <a href="programs.html" style="color: #94a3b8; text-decoration: none;">Curriculum</a>
        <a href="scratch-creators.html" style="color: #94a3b8; text-decoration: none;">Scratch Pathway</a>
        <a href="book-class.html" style="color: #94a3b8; text-decoration: none;">Book Discovery</a>
        <a href="enroll.html" style="color: #94a3b8; text-decoration: none;">Enrollment</a>
        <a href="child-safety.html" style="color: #94a3b8; text-decoration: none;">Child Safety</a>
        <a href="contact.html" style="color: #94a3b8; text-decoration: none;">Contact</a>
      </div>
      <p style="font-size: 0.8rem; color: #64748b;">&copy; 2026 STEMulus Kids Technologies. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>`;
}

console.log('Generating Programmatic SEO Fleet...');
let createdCount = 0;
const newUrls = [];

hubs.forEach(h => {
  const filePath = path.join(rootDir, `${h.slug}.html`);
  const html = buildHtml(h);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  Created: ${h.slug}.html`);
  createdCount++;
  newUrls.push(`https://stemuluskidstech.com/${h.slug}.html`);
});

console.log(`Generated ${createdCount} programmatic landing pages.`);

// Update sitemap.xml
const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

let addedSitemapCount = 0;
newUrls.forEach(url => {
  if (!sitemapContent.includes(url)) {
    const urlEntry = `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>\n`;
    sitemapContent = sitemapContent.replace('</urlset>', `${urlEntry}</urlset>`);
    addedSitemapCount++;
  }
});

fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
console.log(`Appended ${addedSitemapCount} new URLs into sitemap.xml.`);
