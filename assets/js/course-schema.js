/**
 * Course Schema Markup for STEMulus
 * Provides rich course data for Google search results
 * Shows course cards with ratings, pricing, and duration
 */
const CourseSchema = (function() {
    
    const courses = [
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Scratch Game Creators",
            "description": "Learn visual programming fundamentals by creating fun games and animations with Scratch. Perfect for young beginners aged 5-10.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/scratch-creators.html",
            "image": "https://stemulus.com/assets/images/scratch_game_creators.png",
            "educationalLevel": "Beginner",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 5-10"
            },
            "teaches": ["Visual Programming", "Game Design", "Animation", "Logical Thinking", "Scratch"],
            "coursePrerequisites": "No prior experience required",
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
                "ratingCount": "45",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Python Game Development",
            "description": "Master Python programming through hands-on game development projects. Build real games while learning coding fundamentals.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/python-programming.html",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 10-16"
            },
            "teaches": ["Python Programming", "Game Development", "Object-Oriented Programming", "Pygame"],
            "coursePrerequisites": "Basic computer skills recommended",
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "38",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Web Wizards - Web Development",
            "description": "Learn to build stunning websites from scratch using HTML, CSS, and JavaScript. Create your own portfolio and interactive web projects.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/web-wizards.html",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 9-15"
            },
            "teaches": ["HTML", "CSS", "JavaScript", "Web Design", "Responsive Design"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "32",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Arduino Robotics",
            "description": "Build and program real robots using Arduino microcontrollers. Hands-on electronics and coding combined.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/arduino-robotics.html",
            "educationalLevel": "Intermediate",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Children ages 10-18"
            },
            "teaches": ["Arduino Programming", "Robotics", "Electronics", "C/C++", "Sensors"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "28",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "AI & Machine Learning for Kids",
            "description": "Discover the world of Artificial Intelligence and Machine Learning through hands-on projects and experiments.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/ai-machine-learning.html",
            "educationalLevel": "Advanced",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Teens ages 12-18"
            },
            "teaches": ["Artificial Intelligence", "Machine Learning", "Neural Networks", "Python", "Data Science"],
            "coursePrerequisites": "Basic Python knowledge recommended",
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "22",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Mathematics Mastery",
            "description": "Comprehensive mathematics tutoring covering algebra, geometry, trigonometry, and exam preparation for all levels.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/programs.html#mathematics",
            "educationalLevel": "All Levels",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Students ages 7-16"
            },
            "teaches": ["Algebra", "Geometry", "Trigonometry", "Calculus", "GCSE Maths", "Problem Solving"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "35",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "English Language",
            "description": "Develop strong reading, writing, grammar, and communication skills through engaging personalized lessons.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/programs.html#english",
            "educationalLevel": "All Levels",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Students ages 7-16"
            },
            "teaches": ["Reading Comprehension", "Creative Writing", "Grammar", "Vocabulary", "Essay Writing"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "30",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Science Explorers",
            "description": "Explore Biology, Chemistry, and Physics through interactive lessons, experiments, and real-world applications.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/programs.html#science",
            "educationalLevel": "All Levels",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Students ages 7-14"
            },
            "teaches": ["Biology", "Chemistry", "Physics", "Scientific Method", "Lab Skills"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "25",
                "bestRating": "5"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "GCSE Past Papers Practice",
            "description": "Intensive exam preparation with past papers, mock tests, and exam technique training for GCSE and IGCSE success.",
            "provider": {
                "@type": "Organization",
                "name": "STEMulus",
                "sameAs": "https://stemulus.com"
            },
            "url": "https://stemulus.com/programs.html#exam-prep",
            "educationalLevel": "GCSE/IGCSE",
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
                "audienceType": "Students ages 14-16"
            },
            "teaches": ["Exam Techniques", "Past Paper Practice", "Time Management", "Mark Scheme Analysis"],
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT1H30M"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "40",
                "bestRating": "5"
            }
        }
    ];
    
    function inject() {
        courses.forEach(course => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
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
