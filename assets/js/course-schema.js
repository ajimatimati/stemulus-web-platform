/**
 * Course Schema Markup for STEMulus
 * Provides rich course data for Google search results and AI discovery engines
 * Shows course cards with ratings, pricing, free trial offers, and duration
 */
const CourseSchema = (function() {
    
    const courses = [
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Scratch Game Creators",
            "description": "Learn visual programming fundamentals by creating fun interactive games and animations with Scratch 3.0. Perfect for young beginners aged 5-10.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/scratch-creators.html",
            "image": "https://stemuluskidstech.com/assets/images/scratch_game_creators.webp",
            "educationalLevel": "Beginner",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 5-10"
            },
            "teaches": ["Visual Programming", "Game Design", "Animation", "Logical Thinking", "Scratch 3.0"],
            "coursePrerequisites": "No prior coding experience required",
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H",
                "instructor": {
                    "@type": "Person",
                    "name": "STEMulus Expert Tutors"
                }
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "184",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Python Game Development",
            "description": "Master Python programming through hands-on game development projects. Build real text games, automation scripts, and Pygame applications with 1-on-1 mentorship.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/python-programming.html",
            "image": "https://stemuluskidstech.com/assets/images/python_game_dev.webp",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children and teens ages 10-16"
            },
            "teaches": ["Python Programming", "Pygame", "Object-Oriented Programming", "Algorithms", "Data Structures"],
            "coursePrerequisites": "Basic computer typing skills",
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H",
                "instructor": {
                    "@type": "Person",
                    "name": "STEMulus Senior Python Mentors"
                }
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "212",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Web Wizards - Front-End Web Development",
            "description": "Learn to build stunning websites from scratch using HTML5, CSS3, and JavaScript. Create interactive portfolios and live published web projects.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/web-wizards.html",
            "image": "https://stemuluskidstech.com/assets/images/web_wizards.webp",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children and teens ages 9-15"
            },
            "teaches": ["HTML5", "CSS3", "JavaScript", "Responsive Web Design", "DOM Manipulation"],
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "145",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Arduino Robotics & Electronics",
            "description": "Build and program physical robots and smart electronic devices using Arduino microcontrollers and C/C++. Hands-on hardware engineering for kids.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/arduino-robotics.html",
            "image": "https://stemuluskidstech.com/assets/images/arduino_robotics.webp",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children and teens ages 10-18"
            },
            "teaches": ["Arduino Microcontroller Programming", "Circuit Design", "Sensors & Actuators", "C/C++", "Robotics"],
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "120",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Junior Robotics",
            "description": "Introduction to robotics, logic gates, and simple machines for elementary learners aged 6-10.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/junior-robotics.html",
            "image": "https://stemuluskidstech.com/assets/images/junior_robotics.webp",
            "educationalLevel": "Beginner",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 6-10"
            },
            "teaches": ["Robotics Foundations", "Mechanical Logic", "Sensory Feedback", "Block Coding"],
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "98",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "AI & Machine Learning for Teens",
            "description": "Discover Artificial Intelligence, neural networks, computer vision, and machine learning models through interactive Python projects and ethical AI case studies.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/ai-machine-learning.html",
            "image": "https://stemuluskidstech.com/assets/images/ai_machine_learning.webp",
            "educationalLevel": "Advanced",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Teens ages 12-18"
            },
            "teaches": ["Artificial Intelligence", "Machine Learning", "Neural Networks", "Computer Vision", "Python Data Science"],
            "coursePrerequisites": "Basic Python programming knowledge",
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "115",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Full-Stack Web Development",
            "description": "Comprehensive engineering track covering front-end and back-end web architecture: HTML5, CSS3, JavaScript, React, Node.js, and SQL databases.",
            "provider": {
                "@type": "EducationalOrganization",
                "name": "STEMulus Kids Tech",
                "sameAs": "https://stemuluskidstech.com",
                "url": "https://stemuluskidstech.com"
            },
            "url": "https://stemuluskidstech.com/fullstack-web-dev.html",
            "image": "https://stemuluskidstech.com/assets/images/fullstack_web_dev.webp",
            "educationalLevel": "Advanced",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Teens ages 12-18"
            },
            "teaches": ["Full-Stack Engineering", "React.js", "Node.js", "REST APIs", "Databases"],
            "offers": {
                "@type": "Offer",
                "name": "Free 1-on-1 Trial Class",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://stemuluskidstech.com/book-class.html"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "88",
                "bestRating": "5"
            }
        }
    ];
    
    function inject() {
        if (document.querySelector('script[data-schema="stemulus-courses"]')) return;
        courses.forEach((course, idx) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-schema', `stemulus-courses-${idx}`);
            script.textContent = JSON.stringify(course);
            document.head.appendChild(script);
        });
    }
    
    return {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', inject);
            } else {
                inject();
            }
        },
        getCourses: function() {
            return courses;
        },
        getCount: function() {
            return courses.length;
        }
    };
})();

// Initialize on load
CourseSchema.init();
console.log(`SEO: ${CourseSchema.getCount()} course schemas loaded for rich search results.`);
