/**
 * Master SEO Keywords for STEMulus
 * 500+ keywords organized by category for maximum search engine visibility
 * This file injects keywords meta tag into document head
 */
const SEOKeywords = (function() {
    
    // Comprehensive keyword list organized by category
    const keywords = [
        // Primary Brand Keywords
        "STEMulus", "STEMulus coding academy", "STEMulus online coding", "STEMulus kids programming",
        "STEMulus global academy", "STEMulus tech education", "STEMulus STEM courses", "STEMulus innovation",
        
        // Core Services Keywords
        "coding classes for kids", "online coding for children", "kids programming courses",
        "coding academy for children", "programming school for kids", "tech education for kids",
        "virtual coding classes", "online programming tutoring", "1-on-1 coding lessons",
        "personalized coding education", "live coding classes online", "interactive coding for kids",
        
        // Age-Specific Keywords
        "coding for 5 year olds", "coding for 6 year olds", "coding for 7 year olds",
        "coding for 8 year olds", "coding for 9 year olds", "coding for 10 year olds",
        "coding for 11 year olds", "coding for 12 year olds", "coding for 13 year olds",
        "coding for 14 year olds", "coding for 15 year olds", "coding for 16 year olds",
        "coding for 17 year olds", "coding for 18 year olds",
        "programming for teenagers", "coding for teens", "teen coding bootcamp",
        "coding for elementary students", "coding for middle schoolers", "coding for high schoolers",
        "coding for kids ages 5-8", "coding for kids ages 8-12", "coding for kids ages 12-18",
        
        // Programming Languages Keywords
        "Scratch programming for kids", "Scratch coding courses", "learn Scratch online",
        "Scratch game development", "Scratch animation for kids", "visual programming for children",
        "Python for kids", "Python programming for children", "learn Python online kids",
        "Python game development kids", "Python coding course for teens", "Python bootcamp kids",
        "JavaScript for kids", "JavaScript programming teens", "learn JavaScript online",
        "HTML CSS for kids", "web development for kids", "front-end coding for children",
        "Arduino programming kids", "Arduino robotics course", "Arduino projects for kids",
        "block-based coding", "text-based coding for beginners", "beginner programming languages",
        
        // Robotics Keywords
        "robotics for kids", "robotics classes for children", "online robotics course",
        "kids robotics programming", "robot building for kids", "LEGO robotics",
        "junior robotics", "robotics engineering for kids", "robotics summer camp",
        "Arduino robotics tutorial", "robotics curriculum for kids", "robotics STEM education",
        "learn robotics online", "robotics programming basics", "educational robotics",
        
        // AI & Machine Learning Keywords
        "AI for kids", "artificial intelligence for children", "machine learning for kids",
        "AI programming course kids", "intro to AI for students", "AI education for teens",
        "neural networks for beginners", "AI projects for kids", "machine learning tutorial kids",
        "AI coding for children", "computer vision for kids", "AI bootcamp for teens",
        
        // Game Development Keywords
        "game development for kids", "kids game design course", "game coding for children",
        "learn game programming", "video game creation for kids", "game design bootcamp kids",
        "Pygame for kids", "game development with Python", "game development with Scratch",
        "mobile game development kids", "2D game development course", "indie game development kids",
        "unity game development kids", "game mechanics for kids", "game art for children",
        
        // Web Development Keywords  
        "web development for kids", "web design for children", "learn HTML CSS kids",
        "website building for kids", "front-end development kids", "full-stack web dev teens",
        "responsive web design kids", "web programming course kids", "build websites for beginners",
        "JavaScript web development", "React for teens", "website creation for students",
        
        // Project-Based Learning Keywords
        "project-based coding", "hands-on programming", "learn by doing coding",
        "real-world coding projects", "coding projects for kids", "build apps for kids",
        "portfolio building for students", "coding portfolio kids", "practical coding skills",
        "creative coding projects", "interactive coding projects", "coding challenges for kids",
        
        // STEM Education Keywords
        "STEM education for kids", "STEM classes online", "STEM curriculum for children",
        "STEM after-school programs", "STEM summer camps", "STEM enrichment programs",
        "science technology engineering math", "STEM skills for kids", "STEM learning platform",
        "STEM academy online", "STEM tutoring for kids", "STEM education programs",
        
        // Online Learning Keywords
        "online learning for kids", "virtual classes for children", "e-learning for kids",
        "remote learning coding", "distance learning programming", "online STEM education",
        "virtual tutoring kids", "online education platform kids", "at-home coding lessons",
        "self-paced coding course", "flexible online coding", "asynchronous coding classes",
        
        // Parent-Focused Keywords
        "coding classes for my child", "best coding program for kids", "affordable coding classes kids",
        "safe online learning for kids", "parental controls online classes", "coding progress tracking",
        "coding education investment", "future-proof education kids", "tech skills for children",
        "prepare kids for tech careers", "coding for future success", "digital literacy for kids",
        "screen time that matters", "educational screen time kids", "productive screen time",
        
        // Career Preparation Keywords
        "prepare kids for tech careers", "future software developers", "coding as career skill",
        "tech career preparation teens", "software engineering for kids", "computer science for kids",
        "coding skills for jobs", "employable tech skills", "21st century skills for kids",
        "digital skills for future", "tech job preparation", "coding career paths",
        
        // Geographic Keywords - Priority Markets
        "coding classes UAE", "coding academy Dubai", "coding for kids Dubai",
        "online coding UAE", "kids programming Abu Dhabi", "STEM education UAE",
        "coding school Dubai", "tech education Emirates", "virtual coding classes UAE",
        "coding classes Qatar", "coding academy Doha", "coding for kids Qatar",
        "online coding Qatar", "kids programming Doha", "STEM education Qatar",
        "coding school Doha", "tech education Qatar", "virtual coding classes Qatar",
        "coding classes Kuwait", "coding academy Kuwait", "coding for kids Kuwait",
        "online coding Kuwait", "kids programming Kuwait City", "STEM education Kuwait",
        "coding school Kuwait", "tech education Kuwait", "virtual coding classes Kuwait",
        "Gulf coding academy", "GCC coding for kids", "Middle East coding classes",
        "Arab coding education", "coding for Arab kids", "Arabic speaking coding tutors",
        
        // Geographic Keywords - Africa & Global
        "coding classes Africa", "coding academy Nigeria", "coding for African kids",

        "online coding Ghana", "coding classes Lagos", "tech education Africa",
        "African STEM education", "Nigerian coding school", "coding classes Kenya",
        "online coding South Africa", "coding academy Abuja", "coding for African teens",
        "global coding academy", "international coding classes", "worldwide coding education",
        "coding classes UK", "coding classes USA", "coding classes Canada",
        "coding classes Australia", "coding classes Europe", "coding classes Asia",
        
        // Comparison Keywords
        "best coding classes for kids", "top online coding courses kids", "best programming school",
        "vs code.org", "vs codecademy kids", "vs tynker", "vs codemonkey",
        "affordable coding classes", "cheap online coding kids", "budget coding education",
        "premium coding education", "quality coding tutoring", "certified coding instructors",
        
        // Problem-Solving Keywords
        "computational thinking for kids", "logical thinking through coding", "problem solving skills kids",
        "critical thinking coding", "algorithmic thinking kids", "debugging skills for children",
        "logic puzzles coding", "coding math skills", "analytical thinking for kids",
        
        // Creative Skills Keywords
        "creative coding for kids", "coding and creativity", "digital art for kids",
        "animation coding kids", "creative technology kids", "coding for artists kids",
        "storytelling with code", "digital storytelling kids", "coding imagination kids",
        
        // Summer Program Keywords
        "summer coding camps", "summer coding for kids", "coding summer school",
        "tech summer camp online", "virtual summer coding camp", "summer STEM programs",
        "summer programming bootcamp", "holiday coding classes", "school break coding",
        
        // After-School Keywords
        "after school coding", "after school programming", "extracurricular coding",
        "coding club for kids", "coding enrichment programs", "supplemental coding education",
        "weekend coding classes", "Saturday coding classes", "coding tutoring after school",
        
        // Beginner Keywords  
        "coding for beginners kids", "first coding class", "intro to programming kids",
        "no experience coding", "start coding from scratch", "coding fundamentals kids",
        "beginner friendly coding", "easy coding for kids", "simple programming for children",
        
        // Advanced Keywords
        "advanced coding for teens", "competitive programming kids", "coding competitions students",
        "hackathon for kids", "advanced Python teens", "data science for teens",
        "app development for teens", "mobile app coding kids", "advanced robotics teens",
        
        // Certificate & Achievement Keywords
        "coding certificate for kids", "coding certification program", "verified coding skills",
        "coding badges kids", "achievement system coding", "coding diploma for students",
        "accredited coding program", "recognized coding education", "coding credentials kids",
        
        // Skill Development Keywords
        "develop coding skills", "improve programming abilities", "build tech skills kids",
        "code faster better", "efficient coding habits", "clean code for kids",
        "debugging skills", "testing code kids", "version control for kids",
        
        // Innovation Keywords
        "innovation education kids", "creative problem solving", "inventor mindset kids",
        "entrepreneurship for kids", "startup skills teens", "tech innovation education",
        "design thinking for kids", "prototype building kids", "maker education kids",
        
        // Mentorship Keywords
        "coding mentor for kids", "tech mentorship program", "software developer mentors",
        "industry expert tutors", "professional coding instructors", "experienced coding teachers",
        "personalized coding mentorship", "one-on-one coding mentor", "dedicated coding tutor",
        
        // Safety Keywords
        "safe online learning", "child-safe coding platform", "secure online classes",
        "vetted instructors", "background checked tutors", "parental oversight online learning",
        "COPPA compliant", "child protection online", "safe coding environment",
        
        // Technology Tool Keywords
        "code editor for kids", "kid-friendly IDE", "online code compiler kids",
        "browser-based coding", "no download coding", "cloud coding platform kids",
        "coding playground for kids", "interactive code runner", "visual code editor kids",
        
        // Curriculum Keywords
        "structured coding curriculum", "progressive coding lessons", "comprehensive tech curriculum",
        "grade-aligned coding", "standards-based coding", "curriculum coding kids",
        "lesson plans coding kids", "coding syllabus", "educational coding content",
        
        // Class Format Keywords
        "live coding classes", "recorded coding lessons", "hybrid coding classes",
        "premium 1-on-1 coding", "private coding mentorship", "individual coding lessons",
        "masterclass coding kids", "workshop coding kids", "intensive coding bootcamp",
        
        // Learning Outcomes Keywords
        "build real apps", "create games from scratch", "launch personal website",
        "program robots", "develop AI projects", "complete coding portfolio",
        "coding proficiency kids", "measurable coding progress", "tangible coding results",
        
        // Support Keywords
        "24/7 coding support", "homework help coding", "coding question answers",
        "community support coding", "peer learning coding", "collaborative coding kids",
        "coding forums kids", "student community coding", "coding study groups",
        
        // Schedule Keywords
        "flexible coding schedule", "book coding class online", "schedule coding lessons",
        "reschedule coding class", "on-demand coding lessons", "anytime coding",
        "convenient coding times", "timezone friendly coding", "international schedule coding",
        
        // Payment Keywords
        "coding class pricing", "affordable STEM education", "coding subscription kids",
        "pay per class coding", "monthly coding plan", "annual coding membership",
        "coding class fees", "investment in education", "value coding education",
        
        // Trial Keywords
        "free coding class trial", "try coding for free", "demo coding lesson",
        "sample coding class", "introductory coding session", "no obligation coding trial",
        "test coding platform", "free coding assessment", "coding readiness check",
        
        // Enrollment Keywords
        "enroll coding class", "register coding course", "sign up coding",
        "join coding academy", "start coding today", "begin coding journey",
        "coding registration open", "limited spots coding", "reserve coding seat",
        
        // Review Keywords
        "coding class reviews", "parent testimonials coding", "student success stories",
        "coding academy ratings", "top-rated coding school", "verified coding reviews",
        "recommended coding program", "trusted coding education", "proven coding results",
        
        // Long-tail Keywords
        "best online coding classes for 8 year old", "how to teach kids programming at home",
        "is coding good for kids", "why should kids learn to code", "what age to start coding",
        "which programming language for kids", "how to get kids interested in coding",
        "benefits of coding for children", "coding vs gaming for kids", "coding instead of video games",
        "turn screen time into learning", "productive activities for kids",
        "STEM activities for kids at home", "tech education alternative to school",
        "supplemental education technology kids", "gifted education coding",
        "learning differences coding", "ADHD friendly coding classes", "autism friendly coding",
        "coding for neurodivergent kids", "adaptive coding education",
        
        // Q&A Keywords (FAQ style)
        "what is Scratch programming", "how does Python work for kids", "what age for robotics",
        "is AI too hard for kids", "can kids build websites", "what projects do kids make",
        "how long to learn coding", "certificates for kids coding", "coding class refund policy",
        "what equipment needed coding", "laptop for kids coding", "tablet for kids coding",
        
        // ========================================
        // NEW: 500+ ADDITIONAL STEM KEYWORDS
        // ========================================
        
        // Academic Mathematics Keywords
        "mathematics tutoring for kids", "math tutor online", "maths lessons for children",
        "algebra tutoring kids", "geometry for kids", "trigonometry tutoring teens",
        "calculus for beginners", "statistics for students", "probability lessons kids",
        "arithmetic practice kids", "mental math for children", "math olympiad preparation",
        "math competition training", "mathematical reasoning kids", "number theory basics",
        "fractions tutoring kids", "decimals lessons children", "percentages for students",
        "math word problems help", "mathematical problem solving", "math anxiety help kids",
        "times tables practice", "multiplication tutoring", "division lessons kids",
        "math homework help online", "math exam preparation", "GCSE maths tutoring",
        "IGCSE mathematics preparation", "A-level maths tutoring", "IB mathematics help",
        "common core math tutoring", "primary maths tutoring", "secondary maths lessons",
        "advanced mathematics teens", "pre-algebra for kids", "pre-calculus tutoring",
        "linear equations help", "quadratic equations tutoring", "polynomials for students",
        "functions and graphs tutoring", "coordinate geometry kids", "vectors for beginners",
        "matrices tutoring", "sequences and series help", "logarithms for students",
        "indices tutoring kids", "surds and radicals help", "mathematical proof writing",
        
        // Academic English Keywords
        "English tutoring for kids", "English language lessons", "grammar tutoring online",
        "vocabulary building kids", "reading comprehension help", "writing skills for children",
        "creative writing tutoring", "essay writing help kids", "academic writing teens",
        "spelling practice kids", "phonics tutoring", "reading fluency lessons",
        "comprehension strategies kids", "literary analysis teens", "poetry for children",
        "English literature tutoring", "book club for kids", "storytelling skills kids",
        "public speaking for kids", "debate skills teens", "presentation skills children",
        "GCSE English tutoring", "IGCSE English preparation", "A-level English literature",
        "SAT verbal preparation", "IELTS for teens", "TOEFL preparation students",
        "English as second language", "ESL tutoring for kids", "EAL support children",
        "punctuation tutoring", "sentence structure help", "paragraph writing kids",
        "descriptive writing tutoring", "narrative writing kids", "persuasive writing teens",
        "argumentative essay help", "report writing students", "summary skills tutoring",
        "inference skills kids", "critical reading teens", "textual analysis help",
        
        // Science Topics Keywords
        "science tutoring for kids", "general science lessons", "science experiments at home",
        "biology tutoring kids", "chemistry for children", "physics tutoring teens",
        "life science lessons", "earth science for kids", "space science tutoring",
        "astronomy for children", "ecology lessons kids", "environmental science tutoring",
        "human biology for kids", "animal science lessons", "plant biology tutoring",
        "cell biology basics", "genetics for beginners", "evolution for students",
        "photosynthesis lessons", "respiration tutoring", "digestive system kids",
        "circulatory system lessons", "nervous system tutoring", "human anatomy kids",
        "chemistry experiments kids", "chemical reactions tutoring", "periodic table lessons",
        "atoms and molecules kids", "states of matter tutoring", "acids and bases lessons",
        "organic chemistry basics", "inorganic chemistry tutoring", "physical chemistry intro",
        "physics experiments kids", "forces and motion lessons", "electricity tutoring kids",
        "magnetism for children", "waves and sound tutoring", "light and optics lessons",
        "energy types tutoring", "thermodynamics basics", "mechanics for students",
        "GCSE science tutoring", "IGCSE science preparation", "triple science tutoring",
        "combined science help", "science coursework help", "science practical skills",
        
        // Technology & Computing Keywords
        "computer science for kids", "computing lessons children", "digital literacy tutoring",
        "cybersecurity for kids", "ethical hacking teens", "network basics kids",
        "database fundamentals kids", "SQL for beginners", "data structures kids",
        "algorithms for children", "software engineering basics", "system design teens",
        "cloud computing basics", "AWS for beginners", "Microsoft Azure kids",
        "Google Cloud basics", "Docker for beginners", "Kubernetes basics",
        "DevOps for students", "version control kids", "Git and GitHub kids",
        "agile methodology basics", "scrum for students", "software development life cycle",
        "API development basics", "REST APIs for kids", "microservices basics",
        "frontend development kids", "backend development teens", "full stack bootcamp",
        "TypeScript for kids", "C++ for beginners", "C programming basics",
        "Java for kids", "Kotlin for beginners", "Swift programming kids",
        "Flutter development kids", "React Native basics", "iOS development teens",
        "Android development kids", "cross-platform development", "mobile app testing",
        "UI/UX design for kids", "Figma for beginners", "Adobe XD basics",
        "graphic design kids", "3D modeling for children", "Blender for kids",
        "video editing for kids", "animation software kids", "motion graphics basics",
        
        // Engineering Keywords
        "engineering for kids", "STEM engineering projects", "mechanical engineering basics",
        "electrical engineering kids", "civil engineering lessons", "chemical engineering intro",
        "biomedical engineering kids", "aerospace engineering teens", "environmental engineering",
        "structural engineering basics", "materials science kids", "engineering design process",
        "CAD for kids", "3D printing for children", "prototyping projects kids",
        "engineering challenges kids", "bridge building projects", "tower building STEM",
        "catapult building kids", "trebuchet engineering kids", "simple machines lessons",
        "circuits for kids", "electronics for beginners", "soldering for kids",
        "breadboard projects", "LED projects kids", "motor projects children",
        "sensor projects kids", "IoT for kids", "smart home projects",
        "drone building kids", "quadcopter engineering", "RC car building",
        "boat building STEM", "rocket building kids", "water rocket projects",
        "bridge engineering kids", "truss structures lessons", "load bearing projects",
        "sustainable engineering kids", "green technology lessons", "renewable energy projects",
        "solar panel projects kids", "wind turbine building", "hydropower projects",
        "engineering career exploration", "women in engineering", "engineering role models",
        
        // Advanced STEM Keywords
        "data science for teens", "big data basics", "machine learning projects kids",
        "deep learning introduction", "natural language processing", "computer vision basics",
        "reinforcement learning intro", "tensorflow for beginners", "pytorch basics kids",
        "neural network projects", "chatbot development kids", "voice assistant projects",
        "image recognition projects", "sentiment analysis basics", "recommendation systems",
        "blockchain for kids", "cryptocurrency basics teens", "smart contracts intro",
        "NFT education kids", "Web3 for beginners", "metaverse education",
        "VR development kids", "AR projects children", "mixed reality basics",
        "quantum computing basics", "quantum programming intro", "future technology education",
        "biotechnology for kids", "nanotechnology basics", "materials science kids",
        "space technology education", "satellite technology kids", "Mars exploration education",
        
        // Exam Preparation Keywords
        "GCSE exam preparation", "IGCSE tutoring online", "A-level exam prep",
        "O-level tutoring", "AS-level preparation", "IB diploma tutoring",
        "SAT preparation online", "ACT tutoring kids", "PSAT practice",
        "11+ exam preparation", "common entrance tutoring", "grammar school preparation",
        "scholarship exam prep", "entrance exam tutoring", "competitive exam preparation",
        "mock exam practice", "past papers practice", "exam technique training",
        "revision strategies kids", "study skills tutoring", "time management exams",
        "exam anxiety help", "test-taking strategies", "performance under pressure",
        "coursework help online", "controlled assessment prep", "internal assessment help",
        "extended essay tutoring", "dissertation help teens", "research skills students",
        "cambridge exam prep", "edexcel tutoring", "AQA exam preparation",
        "OCR tutoring online", "WJEC exam prep", "exam board specific tutoring",
        
        // Academic Skills Keywords
        "study skills for kids", "learning strategies children", "memory techniques kids",
        "note-taking skills", "mind mapping for students", "concept mapping kids",
        "research skills children", "citation skills teens", "referencing tutoring",
        "academic integrity lessons", "plagiarism awareness", "source evaluation skills",
        "library skills kids", "online research skills", "information literacy",
        "critical thinking kids", "analytical skills children", "evaluation skills students",
        "synthesis skills teens", "application skills tutoring", "knowledge transfer",
        "metacognition for kids", "self-regulated learning", "growth mindset education",
        "grit and perseverance", "resilience training kids", "academic confidence building",
        "goal setting students", "motivation strategies kids", "procrastination help",
        "organization skills kids", "planning skills children", "time management kids",
        
        // Specific Programming Topics
        "object-oriented programming kids", "OOP for beginners", "classes and objects kids",
        "inheritance programming", "polymorphism basics", "encapsulation lessons",
        "abstraction in coding", "design patterns basics", "MVC architecture kids",
        "functional programming kids", "recursion for beginners", "loops and iterations",
        "conditional statements kids", "boolean logic children", "arrays and lists kids",
        "dictionaries and maps", "string manipulation kids", "file handling basics",
        "exception handling kids", "debugging techniques", "code optimization basics",
        "clean code principles", "code documentation", "code review skills",
        "pair programming kids", "mob programming basics", "code collaboration",
        "open source for kids", "contributing to GitHub", "open source projects kids",
        
        // Hardware & Electronics Keywords
        "Raspberry Pi for kids", "Raspberry Pi projects", "Pi programming kids",
        "micro:bit projects", "micro:bit coding", "BBC micro:bit kids",
        "Arduino Uno projects", "Arduino Nano basics", "Arduino Mega projects",
        "ESP32 for kids", "NodeMCU projects", "WiFi projects kids",
        "Bluetooth projects kids", "wireless communication", "RF projects basics",
        "servo motor projects", "stepper motor kids", "DC motor projects",
        "relay projects kids", "transistor basics", "capacitor projects",
        "resistor learning", "voltage and current", "Ohm's law for kids",
        "breadboard circuits", "PCB design basics", "circuit design kids",
        "oscilloscope basics", "multimeter for kids", "electronics tools",
        "SMD soldering kids", "through-hole soldering", "desoldering techniques",
        
        // Soft Skills & Future Skills
        "21st century skills education", "future-ready skills kids", "workforce skills teens",
        "collaboration skills kids", "teamwork education", "leadership for children",
        "communication skills kids", "interpersonal skills teens", "emotional intelligence kids",
        "empathy education", "social skills through STEM", "conflict resolution kids",
        "adaptability skills", "flexibility in learning", "change management kids",
        "innovation mindset", "entrepreneurial skills kids", "business basics teens",
        "financial literacy kids", "money management teens", "budgeting for students",
        "project management kids", "Kanban for students", "task management training",
        "decision making skills", "risk assessment kids", "strategic thinking teens",
        
        // Learning Styles & Approaches
        "visual learning STEM", "auditory learning coding", "kinesthetic learning tech",
        "hands-on learning approach", "experiential learning STEM", "inquiry-based learning",
        "discovery learning kids", "constructivist education", "scaffolded learning",
        "differentiated instruction", "personalized learning STEM", "adaptive learning platform",
        "mastery-based learning", "competency-based education", "self-paced STEM learning",
        "private blended learning coding", "1-on-1 STEM mentorship", "premium tech tutoring",
        "synchronous learning online", "asynchronous coding lessons", "microlearning STEM",
        "gamified learning", "game-based education", "educational games STEM",
        
        // Special Needs & Inclusive Education
        "inclusive STEM education", "accessible coding classes", "disability-friendly tech",
        "dyslexia-friendly coding", "dyscalculia support math", "dyspraxia accommodations",
        "visual impairment coding", "screen reader compatible", "braille coding resources",
        "hearing impairment STEM", "sign language tutoring", "deaf-friendly classes",
        "gifted and talented STEM", "advanced learner programs", "acceleration programs",
        "twice exceptional education", "2e learning support", "enrichment for gifted",
        "learning disability support", "IEP tutoring", "504 plan accommodations",
        "executive function support", "attention support coding", "focus strategies STEM",
        
        // Global Education Keywords
        "international curriculum STEM", "British curriculum coding", "American curriculum tech",
        "Australian curriculum STEM", "Canadian curriculum coding", "Singapore math method",
        "Finnish education STEM", "international education online", "expat children education",
        "third culture kids education", "global citizens education", "multicultural STEM",
        "bilingual STEM education", "multilingual coding", "language immersion STEM",
        "study abroad preparation", "international school tutoring", "boarding school prep",
        "university preparation STEM", "college admissions help", "UCAS application support",
        "common app tutoring", "personal statement help", "interview preparation STEM",
        
        // Specific Tool Keywords
        "Scratch 3.0 for kids", "ScratchJr basics", "Scratch extensions",
        "code.org curriculum", "CodeCombat for kids", "CodeMonkey lessons",
        "Tynker tutorials", "Kodable for kids", "Hopscotch programming",
        "Swift Playgrounds", "Sphero programming", "LEGO Mindstorms",
        "LEGO Spike Prime", "VEX Robotics", "FIRST LEGO League",
        "Jupyter notebooks kids", "Google Colab basics", "Replit for kids",
        "Glitch web development", "Codepen for beginners", "JSFiddle kids",
        "Khan Academy computing", "Brilliant.org kids", "Coursera for teens",
        "edX STEM courses", "Udemy for kids", "Codecademy kids",
        
        // Content Creation Keywords
        "YouTube for kids education", "educational content creation", "STEM YouTube channels",
        "podcast for kids STEM", "educational TikTok STEM", "Instagram STEM education",
        "blogging for kids", "tech blogging teens", "science communication kids",
        "documentation skills", "technical writing kids", "tutorial creation",
        "screencast creation", "video tutorial making", "explainer video kids",
        
        // Community & Events Keywords
        "coding clubs near me", "STEM clubs for kids", "tech meetups kids",
        "hackathons for children", "coding competitions kids", "STEM olympiad",
        "science fair projects", "invention convention", "maker faire kids",
        "robotics competition", "coding challenge events", "game jam for kids",
        "STEM career day", "tech industry visits", "company tours kids",
        "STEM mentorship programs", "volunteer coding teachers", "peer tutoring STEM",
        
        // Seasonal & Trending Keywords
        "2024 STEM trends", "2025 coding for kids", "latest tech education",
        "emerging technology kids", "future jobs preparation", "automation education",
        "AI literacy kids", "digital citizenship", "online safety education",
        "cyber hygiene kids", "password security kids", "social media safety",
        "screen time balance", "digital wellness kids", "tech-life balance education",
        
        // ========================================
        // GEOGRAPHIC KEYWORDS - MAJOR CITIES
        // ========================================
        
        // Nigeria Major Cities
        "coding classes Lagos", "STEM education Lagos", "kids programming Lagos",
        "coding academy Abuja", "tech education Abuja", "STEM tutoring Abuja",
        "coding for kids Port Harcourt", "programming lessons Port Harcourt",
        "coding classes Kano", "STEM education Kano", "tech tutoring Kano",
        "coding academy Ibadan", "kids coding Ibadan", "programming Ibadan",
        "STEM classes Benin City", "coding tutoring Benin City",
        "coding for kids Kaduna", "tech education Kaduna",
        "programming classes Enugu", "coding lessons Enugu",
        "STEM tutoring Onitsha", "coding academy Onitsha",
        "kids coding Warri", "tech classes Warri",
        "coding education Calabar", "STEM classes Calabar",
        "programming tutoring Uyo", "coding classes Uyo",
        "tech education Owerri", "STEM tutoring Owerri",
        "coding for kids Abeokuta", "programming Abeokuta",
        "coding classes Jos", "tech tutoring Jos",
        "STEM education Ilorin", "kids coding Ilorin",
        "coding academy Maiduguri", "programming Maiduguri",
        "tech education Zaria", "coding classes Zaria",
        "STEM tutoring Aba", "coding for kids Aba",
        "programming lessons Sokoto", "coding Sokoto",
        
        // Singapore
        "coding classes Singapore", "STEM education Singapore", "kids programming Singapore",
        "coding academy Singapore", "tech tutoring Singapore", "robotics Singapore",
        "Python for kids Singapore", "Scratch coding Singapore", "AI education Singapore",
        "online coding Singapore", "coding bootcamp Singapore", "STEM camp Singapore",
        "coding Orchard Road", "tech education Marina Bay", "STEM Jurong",
        "coding classes Tampines", "kids programming Woodlands", "tech tutoring Bedok",
        "coding academy Ang Mo Kio", "STEM education Bukit Timah",
        "programming Clementi", "coding for kids Punggol", "tech classes Sengkang",
        
        // Turkey Major Cities
        "coding classes Istanbul", "STEM education Istanbul", "kids programming Istanbul",
        "coding academy Ankara", "tech tutoring Ankara", "robotics Ankara",
        "coding for kids Izmir", "programming lessons Izmir", "STEM tutoring Izmir",
        "coding classes Bursa", "tech education Bursa", "kids coding Bursa",
        "STEM academy Antalya", "coding tutoring Antalya", "programming Antalya",
        "coding for kids Adana", "tech classes Adana", "STEM education Adana",
        "coding academy Konya", "programming Konya", "tech tutoring Konya",
        "kids coding Gaziantep", "STEM Gaziantep", "coding classes Gaziantep",
        "coding education Mersin", "tech tutoring Mersin",
        "STEM classes Kayseri", "coding for kids Kayseri",
        "programming tutoring Eskisehir", "coding academy Eskisehir",
        "tech education Trabzon", "STEM tutoring Trabzon",
        "coding classes Samsun", "kids programming Samsun",
        "coding for kids Denizli", "tech classes Denizli",
        
        // UAE Major Cities
        "coding classes Dubai", "STEM education Dubai", "kids programming Dubai",
        "coding academy Abu Dhabi", "tech tutoring Abu Dhabi", "robotics Abu Dhabi",
        "coding for kids Sharjah", "programming lessons Sharjah", "STEM tutoring Sharjah",
        "coding classes Ajman", "tech education Ajman", "kids coding Ajman",
        "STEM academy Ras Al Khaimah", "coding tutoring RAK", "programming RAK",
        "coding for kids Fujairah", "tech classes Fujairah", "STEM education Fujairah",
        "coding academy Al Ain", "programming Al Ain", "tech tutoring Al Ain",
        "kids coding Umm Al Quwain", "STEM UAQ", "coding classes UAQ",
        "coding Dubai Marina", "tech education JBR Dubai", "STEM Downtown Dubai",
        "coding classes Jumeirah", "kids programming Palm Jumeirah",
        "tech tutoring Business Bay", "coding academy JLT Dubai",
        "STEM education DIFC", "programming Dubai Silicon Oasis",
        "coding for kids Dubai Hills", "tech classes Arabian Ranches",
        
        // Qatar Major Cities
        "coding classes Doha", "STEM education Doha", "kids programming Doha",
        "coding academy Qatar", "tech tutoring Doha", "robotics Doha",
        "coding for kids Al Wakrah", "programming lessons Al Wakrah",
        "STEM tutoring Al Khor", "coding classes Al Khor",
        "tech education Al Rayyan", "kids coding Al Rayyan",
        "coding academy Lusail", "programming Lusail", "STEM Lusail City",
        "coding for kids The Pearl Qatar", "tech classes West Bay Doha",
        "STEM education Education City Qatar", "coding tutoring Dukhan",
        "kids programming Mesaieed", "tech tutoring Al Shamal",
        "coding classes Umm Salal", "STEM education Madinat Khalifa",
        
        // Kuwait Major Cities
        "coding classes Kuwait City", "STEM education Kuwait", "kids programming Kuwait",
        "coding academy Kuwait", "tech tutoring Kuwait City", "robotics Kuwait",
        "coding for kids Hawalli", "programming lessons Hawalli", "STEM tutoring Hawalli",
        "coding classes Salmiya", "tech education Salmiya", "kids coding Salmiya",
        "STEM academy Jahra", "coding tutoring Jahra", "programming Jahra",
        "coding for kids Ahmadi", "tech classes Ahmadi", "STEM education Ahmadi",
        "coding academy Farwaniya", "programming Farwaniya", "tech tutoring Farwaniya",
        "kids coding Mubarak Al-Kabeer", "STEM classes Fahaheel",
        "coding classes Mangaf", "tech education Mahboula",
        "programming tutoring Fintas", "coding for kids Sabah Al Salem",
        
        // USA Major Cities
        "coding classes New York", "STEM education NYC", "kids programming Manhattan",
        "coding academy Brooklyn", "tech tutoring Queens", "robotics New York",
        "coding for kids Los Angeles", "programming lessons LA", "STEM tutoring LA",
        "coding classes San Francisco", "tech education Silicon Valley", "kids coding Bay Area",
        "STEM academy Chicago", "coding tutoring Chicago", "programming Chicago",
        "coding for kids Houston", "tech classes Houston", "STEM education Houston",
        "coding academy Phoenix", "programming Phoenix", "tech tutoring Phoenix",
        "kids coding Philadelphia", "STEM Philadelphia", "coding classes Philly",
        "coding education San Antonio", "tech tutoring San Antonio",
        "STEM classes San Diego", "coding for kids San Diego",
        "programming tutoring Dallas", "coding academy Dallas", "tech education Dallas",
        "coding classes Austin", "kids programming Austin", "STEM Austin Texas",
        "coding for kids San Jose", "tech classes San Jose", "Silicon Valley coding",
        "STEM education Seattle", "coding tutoring Seattle", "programming Seattle",
        "coding academy Denver", "kids coding Denver", "tech tutoring Denver",
        "coding classes Boston", "STEM education Boston", "programming Boston",
        "coding for kids Atlanta", "tech classes Atlanta", "STEM tutoring Atlanta",
        "coding academy Miami", "programming Miami", "kids coding Miami",
        "STEM education Washington DC", "coding classes DC", "tech tutoring DC",
        "coding for kids Charlotte", "programming Charlotte",
        "STEM classes Nashville", "coding academy Nashville",
        "kids programming Portland", "tech education Portland Oregon",
        "coding classes Las Vegas", "STEM tutoring Las Vegas",
        "coding for kids Minneapolis", "tech classes Minneapolis",
        "STEM education Detroit", "coding tutoring Detroit",
        "coding academy Orlando", "kids coding Orlando",
        "programming San Bernardino", "tech tutoring Riverside",
        "coding classes Tampa", "STEM education Tampa Bay",
        "coding for kids Baltimore", "tech classes Sacramento",
        "STEM tutoring Kansas City", "coding academy Cleveland",
        "kids programming Columbus Ohio", "tech education Indianapolis",
        
        // ========================================
        // "CODING IN-" PREFIX KEYWORDS - ALL CITIES
        // ========================================
        
        // Coding in Nigeria Cities
        "coding in Lagos", "learn coding in Lagos", "coding in Abuja",
        "coding in Port Harcourt", "coding in Kano", "coding in Ibadan",
        "coding in Benin City", "coding in Kaduna", "coding in Enugu",
        "coding in Onitsha", "coding in Warri", "coding in Calabar",
        "coding in Uyo", "coding in Owerri", "coding in Abeokuta",
        "coding in Jos", "coding in Ilorin", "coding in Maiduguri",
        "coding in Zaria", "coding in Aba", "coding in Sokoto",
        "coding in Akure", "coding in Osogbo", "coding in Bauchi",
        "coding in Makurdi", "coding in Yola", "coding in Lokoja",
        "coding in Asaba", "coding in Awka", "coding in Ado-Ekiti",
        "learn to code in Nigeria", "coding bootcamp in Lagos",
        "programming in Abuja", "software development in Lagos",
        
        // Coding in Singapore
        "coding in Singapore", "learn coding in Singapore", "programming in Singapore",
        "coding in Orchard Road", "coding in Marina Bay", "coding in Jurong",
        "coding in Tampines", "coding in Woodlands", "coding in Bedok",
        "coding in Ang Mo Kio", "coding in Bukit Timah", "coding in Clementi",
        "coding in Punggol", "coding in Sengkang", "coding in Yishun",
        "coding in Hougang", "coding in Toa Payoh", "coding in Bishan",
        "coding in Pasir Ris", "coding in Serangoon",
        "learn to code in Singapore", "programming bootcamp Singapore",
        
        // Coding in Turkey Cities
        "coding in Istanbul", "learn coding in Istanbul", "coding in Ankara",
        "coding in Izmir", "coding in Bursa", "coding in Antalya",
        "coding in Adana", "coding in Konya", "coding in Gaziantep",
        "coding in Mersin", "coding in Kayseri", "coding in Eskisehir",
        "coding in Trabzon", "coding in Samsun", "coding in Denizli",
        "coding in Diyarbakir", "coding in Malatya", "coding in Erzurum",
        "coding in Mugla", "coding in Bodrum", "coding in Kusadasi",
        "learn to code in Turkey", "programming in Istanbul",
        "software development in Ankara", "coding bootcamp Istanbul",
        
        // Coding in UAE Cities
        "coding in Dubai", "learn coding in Dubai", "coding in Abu Dhabi",
        "coding in Sharjah", "coding in Ajman", "coding in Ras Al Khaimah",
        "coding in Fujairah", "coding in Al Ain", "coding in Umm Al Quwain",
        "coding in Dubai Marina", "coding in JBR", "coding in Downtown Dubai",
        "coding in Jumeirah", "coding in Palm Jumeirah", "coding in Business Bay",
        "coding in JLT", "coding in DIFC", "coding in Silicon Oasis",
        "coding in Dubai Hills", "coding in Arabian Ranches", "coding in Deira",
        "coding in Bur Dubai", "coding in Al Barsha", "coding in Mirdif",
        "coding in Sports City Dubai", "coding in Motor City Dubai",
        "learn to code in Dubai", "programming in Abu Dhabi",
        "software development in UAE", "coding bootcamp Dubai",
        
        // Coding in Qatar Cities
        "coding in Doha", "learn coding in Doha", "coding in Qatar",
        "coding in Al Wakrah", "coding in Al Khor", "coding in Al Rayyan",
        "coding in Lusail", "coding in The Pearl Qatar", "coding in West Bay",
        "coding in Education City", "coding in Dukhan", "coding in Mesaieed",
        "coding in Al Shamal", "coding in Umm Salal", "coding in Madinat Khalifa",
        "coding in Al Sadd", "coding in Souq Waqif area",
        "learn to code in Qatar", "programming in Doha",
        "software development in Qatar", "coding bootcamp Doha",
        
        // Coding in Kuwait Cities
        "coding in Kuwait", "learn coding in Kuwait", "coding in Kuwait City",
        "coding in Hawalli", "coding in Salmiya", "coding in Jahra",
        "coding in Ahmadi", "coding in Farwaniya", "coding in Mubarak Al-Kabeer",
        "coding in Fahaheel", "coding in Mangaf", "coding in Mahboula",
        "coding in Fintas", "coding in Sabah Al Salem", "coding in Mishref",
        "coding in Salwa", "coding in Rumaithiya", "coding in Bayan",
        "learn to code in Kuwait", "programming in Kuwait City",
        "software development in Kuwait", "coding bootcamp Kuwait",
        
        // Coding in USA Cities - Major
        "coding in New York", "learn coding in NYC", "coding in Manhattan",
        "coding in Brooklyn", "coding in Queens", "coding in Bronx",
        "coding in Los Angeles", "coding in LA", "coding in Hollywood",
        "coding in San Francisco", "coding in Silicon Valley", "coding in Bay Area",
        "coding in Chicago", "coding in Houston", "coding in Phoenix",
        "coding in Philadelphia", "coding in San Antonio", "coding in San Diego",
        "coding in Dallas", "coding in Austin", "coding in San Jose",
        "coding in Seattle", "coding in Denver", "coding in Boston",
        "coding in Atlanta", "coding in Miami", "coding in Washington DC",
        
        // Coding in USA Cities - Secondary
        "coding in Charlotte", "coding in Nashville", "coding in Portland",
        "coding in Las Vegas", "coding in Minneapolis", "coding in Detroit",
        "coding in Orlando", "coding in Tampa", "coding in Baltimore",
        "coding in Sacramento", "coding in Kansas City", "coding in Cleveland",
        "coding in Columbus Ohio", "coding in Indianapolis", "coding in Salt Lake City",
        "coding in Pittsburgh", "coding in Cincinnati", "coding in Raleigh",
        "coding in Milwaukee", "coding in Jacksonville", "coding in Memphis",
        "coding in Oklahoma City", "coding in Louisville", "coding in Richmond",
        "coding in New Orleans", "coding in Hartford", "coding in Buffalo",
        "coding in Honolulu", "coding in Anchorage", "coding in Boise",
        "coding in Albuquerque", "coding in Tucson", "coding in Fresno",
        "coding in Mesa", "coding in Virginia Beach", "coding in Omaha",
        "coding in Colorado Springs", "coding in Tulsa", "coding in Arlington",
        
        // Additional "Learn to code in" variations
        "learn to code in New York", "learn to code in Los Angeles",
        "learn to code in San Francisco", "learn to code in Chicago",
        "learn to code in Houston", "learn to code in Phoenix",
        "learn to code in Dallas", "learn to code in Austin",
        "learn to code in Seattle", "learn to code in Denver",
        "learn to code in Boston", "learn to code in Atlanta",
        "learn to code in Miami", "learn to code in Washington DC",
        
        // "Kids coding in" variations
        "kids coding in Lagos", "kids coding in Abuja", "kids coding in Dubai",
        "kids coding in Abu Dhabi", "kids coding in Doha", "kids coding in Kuwait",
        "kids coding in Singapore", "kids coding in Istanbul", "kids coding in Ankara",
        "kids coding in New York", "kids coding in Los Angeles", "kids coding in Chicago",
        "kids coding in Houston", "kids coding in San Francisco", "kids coding in Seattle",
        "kids coding in Boston", "kids coding in Miami", "kids coding in Atlanta",
        
        // "Online coding from" variations
        "online coding from Lagos", "online coding from Dubai", "online coding from Doha",
        "online coding from Kuwait", "online coding from Singapore", "online coding from Istanbul",
        "online coding from New York", "online coding from Los Angeles", "online coding from London",
        "virtual coding classes Nigeria", "virtual coding classes UAE",
        "virtual coding classes Qatar", "virtual coding classes Kuwait",
        "virtual coding classes Singapore", "virtual coding classes Turkey",
        "virtual coding classes USA", "remote coding lessons worldwide"
    ];
    
    function injectKeywords() {
        // Check if keywords meta already exists
        let existingMeta = document.querySelector('meta[name="keywords"]');
        
        if (existingMeta) {
            // Append to existing keywords
            const existingKeywords = existingMeta.getAttribute('content') || '';
            const newKeywords = keywords.join(', ');
            existingMeta.setAttribute('content', existingKeywords + ', ' + newKeywords);
        } else {
            // Create new keywords meta tag
            const meta = document.createElement('meta');
            meta.name = 'keywords';
            meta.content = keywords.join(', ');
            document.head.appendChild(meta);
        }
    }
    
    return {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', injectKeywords);
            } else {
                injectKeywords();
            }
        },
        getKeywords: function() {
            return keywords;
        },
        getCount: function() {
            return keywords.length;
        }
    };
})();

// Initialize keywords injection
SEOKeywords.init();

console.log(`SEO: ${SEOKeywords.getCount()} keywords loaded for enhanced search visibility.`);
