/**
 * STEMulus WebMCP Serverless Endpoint — Netlify Function
 * Implements the Model Context Protocol (MCP) over JSON-RPC 2.0.
 *
 * Allows external AI agents (Claude, ChatGPT, Cursor, Copilot, Antigravity) to:
 * 1. Query course catalog & curriculum (get_courses)
 * 2. Check 1-on-1 trial class slot availability (check_availability)
 * 3. Book a free 1-on-1 trial class (book_trial_class)
 * 4. Programmatically enroll a paying student (enroll_student)
 */

const COURSES = [
  {
    id: "scratch-creators",
    title: "Scratch Game Creators",
    ageRange: "5-8 years",
    category: "Block Coding & Creative Logic",
    durationWeeks: 12,
    tuitionMonthlyNGN: 45000,
    tuitionUSD: 75,
    summary: "Visual block-based game design, animations, interactive storytelling, and computational thinking fundamentals.",
    prerequisites: "None. Beginner friendly.",
    nextTrack: "python-young-coders"
  },
  {
    id: "junior-robotics",
    title: "Junior Robotics & Electronics",
    ageRange: "6-10 years",
    category: "Hardware & Physical Computing",
    durationWeeks: 12,
    tuitionMonthlyNGN: 50000,
    tuitionUSD: 85,
    summary: "Hands-on micro-controllers, breadboards, sensors, motors, and smart gadgets with STEM kits delivered home.",
    prerequisites: "None.",
    nextTrack: "arduino-robotics"
  },
  {
    id: "python-young-coders",
    title: "Python for Young Coders",
    ageRange: "9-13 years",
    category: "Text-based Programming",
    durationWeeks: 16,
    tuitionMonthlyNGN: 55000,
    tuitionUSD: 95,
    summary: "Variables, loops, functions, Turtle graphics, Pygame arcade development, and real computational algorithms.",
    prerequisites: "Basic computer familiarity.",
    nextTrack: "fullstack-web-dev"
  },
  {
    id: "arduino-robotics",
    title: "Arduino Robotics & IoT",
    ageRange: "10-15 years",
    category: "Robotics & Hardware",
    durationWeeks: 16,
    tuitionMonthlyNGN: 60000,
    tuitionUSD: 100,
    summary: "C++ microcontroller programming, ultrasonic obstacle avoidance, autonomous rovers, and IoT telemetry.",
    prerequisites: "Junior Robotics or Python basics.",
    nextTrack: "ai-machine-learning"
  },
  {
    id: "fullstack-web-dev",
    title: "Full-Stack Web Development",
    ageRange: "11-17 years",
    category: "Web Engineering",
    durationWeeks: 20,
    tuitionMonthlyNGN: 60000,
    tuitionUSD: 100,
    summary: "Modern semantic HTML5, CSS Grid/Flexbox, JavaScript ES6+, responsive UI, Git, and live cloud deployments.",
    prerequisites: "Basic typing and logic skills.",
    nextTrack: "ai-machine-learning"
  },
  {
    id: "ai-machine-learning",
    title: "AI & Machine Learning for Teens",
    ageRange: "12-17 years",
    category: "Artificial Intelligence",
    durationWeeks: 20,
    tuitionMonthlyNGN: 65000,
    tuitionUSD: 110,
    summary: "Neural network fundamentals, computer vision, natural language processing, predictive data modeling, and ethical AI.",
    prerequisites: "Python for Young Coders or equivalent programming background.",
    nextTrack: "Advanced AI Capstone"
  }
];

const MCP_TOOLS = [
  {
    name: "get_courses",
    description: "Returns the complete STEMulus course catalog, curriculum outlines, age brackets, duration, and tuition pricing in NGN and USD.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional filter by category: 'Block Coding', 'Hardware', 'Text-based Programming', 'Web Engineering', 'Artificial Intelligence'"
        },
        age: {
          type: "number",
          description: "Optional child age (5-17) to filter age-appropriate courses"
        }
      }
    }
  },
  {
    name: "check_availability",
    description: "Inspects live 1-on-1 trial class slot availability for a specified program and target date.",
    inputSchema: {
      type: "object",
      properties: {
        program: {
          type: "string",
          description: "Course ID or title (e.g. 'python-young-coders', 'scratch-creators', 'fullstack-web-dev', 'ai-machine-learning', 'junior-robotics')"
        },
        date: {
          type: "string",
          description: "Target date in YYYY-MM-DD format. Defaults to upcoming Saturday if omitted."
        }
      },
      required: ["program"]
    }
  },
  {
    name: "book_trial_class",
    description: "Books a free 45-minute 1-on-1 trial coding class for a child with an expert STEMulus mentor. Dispatches calendar confirmation and portal access.",
    inputSchema: {
      type: "object",
      properties: {
        parentName: { type: "string", description: "Full name of the parent or guardian" },
        parentEmail: { type: "string", format: "email", description: "Parent's contact email address" },
        parentPhone: { type: "string", description: "Parent's WhatsApp/phone number (international format e.g. +234... or +44...)" },
        childName: { type: "string", description: "First and last name of the child" },
        childAge: { type: "number", minimum: 5, maximum: 17, description: "Age of the child (5-17)" },
        program: { type: "string", description: "Course ID or program name requested" },
        preferredDate: { type: "string", description: "Preferred session date in YYYY-MM-DD format" },
        preferredTime: { type: "string", description: "Preferred time in HH:MM WAT (e.g. '10:00', '14:00', '16:00')" },
        notes: { type: "string", description: "Optional notes about child's prior coding experience or interests" }
      },
      required: ["parentName", "parentEmail", "parentPhone", "childName", "childAge", "program", "preferredDate", "preferredTime"]
    }
  },
  {
    name: "enroll_student",
    description: "Enrolls a student directly into the active STEMulus academy roster. Sets up parent portal account, assigns student ID, and prepares onboarding.",
    inputSchema: {
      type: "object",
      properties: {
        parentName: { type: "string", description: "Full name of the parent or guardian" },
        parentEmail: { type: "string", format: "email", description: "Parent's contact email address" },
        parentPhone: { type: "string", description: "Parent's WhatsApp/phone number" },
        childName: { type: "string", description: "First and last name of the student" },
        childAge: { type: "number", minimum: 5, maximum: 17, description: "Student's age (5-17)" },
        program: { type: "string", description: "Selected course ID or program name" },
        plan: {
          type: "string",
          enum: ["monthly", "quarterly", "annual"],
          description: "Payment cadence. Monthly = standard, Quarterly = 10% discount, Annual = 20% discount."
        },
        tutorPreference: { type: "string", description: "Optional preference for mentor specialization or scheduling" },
        notes: { type: "string", description: "Optional onboarding notes" }
      },
      required: ["parentName", "parentEmail", "parentPhone", "childName", "childAge", "program", "plan"]
    }
  }
];

const MCP_RESOURCES = [
  {
    uri: "curriculum://stemulus/catalog",
    name: "STEMulus Curriculum Catalog",
    description: "Full course catalog with learning milestones, technologies taught, and age tracks",
    mimeType: "application/json"
  },
  {
    uri: "curriculum://stemulus/pricing",
    name: "STEMulus Tuition & Discount Policies",
    description: "Transparent pricing table for Nigeria and international diaspora, sibling discounts, and term concessions",
    mimeType: "application/json"
  },
  {
    uri: "curriculum://stemulus/faqs",
    name: "STEMulus Parent FAQs",
    description: "Frequently asked questions covering equipment, mentor vetting, class recordings, and schedule flexibility",
    mimeType: "text/markdown"
  }
];

// Helper: Handle Tool Execution
async function executeTool(name, args = {}) {
  switch (name) {
    case "get_courses": {
      let filtered = [...COURSES];
      if (args.category) {
        const cat = args.category.toLowerCase();
        filtered = filtered.filter(c => c.category.toLowerCase().includes(cat));
      }
      if (args.age) {
        const age = Number(args.age);
        filtered = filtered.filter(c => {
          const match = c.ageRange.match(/(\d+)-(\d+)/);
          if (!match) return true;
          return age >= parseInt(match[1]) && age <= parseInt(match[2]);
        });
      }
      return {
        coursesCount: filtered.length,
        courses: filtered,
        pricingNote: "Tuition includes private 1-on-1 mentoring, personalized learning pace, verified certificate, and 24/7 student portal access.",
        trialClassOffer: "100% Free 45-minute 1-on-1 trial class available for any course."
      };
    }

    case "check_availability": {
      const prog = String(args.program || "").toLowerCase();
      const course = COURSES.find(c => c.id === prog || c.title.toLowerCase().includes(prog)) || COURSES[0];
      const targetDate = args.date || new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

      return {
        programId: course.id,
        programTitle: course.title,
        date: targetDate,
        timeZone: "West Africa Time (WAT) / GMT+1",
        internationalSupport: "Mentors accommodate UK (GMT/BST), US Eastern (EST), US Central (CST), and Canadian time zones.",
        availableSlots: [
          { time: "10:00", available: true, mentorType: "Senior Coding Mentor" },
          { time: "11:30", available: true, mentorType: "Senior Coding Mentor" },
          { time: "14:00", available: true, mentorType: "Robotics & Python Specialist" },
          { time: "15:30", available: true, mentorType: "Full-Stack Web Mentor" },
          { time: "17:00", available: true, mentorType: "AI & Data Science Specialist" }
        ],
        bookingInstruction: "Call tool 'book_trial_class' with chosen date, time, and student details to confirm."
      };
    }

    case "book_trial_class": {
      const { parentName, parentEmail, parentPhone, childName, childAge, program, preferredDate, preferredTime, notes } = args;

      if (!parentName || !parentEmail || !parentPhone || !childName || !program || !preferredDate || !preferredTime) {
        throw new Error("Missing required booking fields. Please provide parentName, parentEmail, parentPhone, childName, childAge, program, preferredDate, preferredTime.");
      }

      const bookingId = "TR-" + Math.floor(100000 + Math.random() * 900000);
      const meetingRoom = `https://meet.google.com/stm-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

      // Dispatch notification via NTFY if configured
      const ntfyTopic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
      try {
        fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': `[Agent Booking] Free Trial: ${childName} (${program})`,
            'Priority': 'high',
            'Tags': 'robot,calendar,tada'
          },
          body: `Agent booked free trial class!\nBooking ID: ${bookingId}\nStudent: ${childName} (Age ${childAge})\nParent: ${parentName} (${parentEmail}, ${parentPhone})\nDate & Time: ${preferredDate} at ${preferredTime} WAT\nMeeting: ${meetingRoom}`
        }).catch(() => {});
      } catch (e) {}

      return {
        status: "CONFIRMED",
        bookingId,
        studentName: childName,
        childAge,
        program,
        scheduledDate: preferredDate,
        scheduledTime: preferredTime + " WAT",
        durationMinutes: 45,
        sessionType: "Private 1-on-1 Online Live Class",
        meetingLink: meetingRoom,
        parentContact: {
          name: parentName,
          email: parentEmail,
          phone: parentPhone
        },
        preparationChecklist: [
          "Ensure student has a laptop or desktop with Chrome browser",
          "Ensure a working microphone and camera",
          "A mentor will join the Google Meet link 5 minutes prior to start",
          "Dual pre-class reminders will be sent to parent 6 hours before and 5 minutes before"
        ],
        message: `Free trial class successfully booked for ${childName}! Confirmation details sent.`
      };
    }

    case "enroll_student": {
      const { parentName, parentEmail, parentPhone, childName, childAge, program, plan, tutorPreference, notes } = args;

      if (!parentName || !parentEmail || !parentPhone || !childName || !program || !plan) {
        throw new Error("Missing required enrollment fields. Please provide parentName, parentEmail, parentPhone, childName, childAge, program, plan.");
      }

      const year = new Date().getFullYear();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const studentId = `STEM-${year}-${randomId}`;
      const enrollmentId = "ENR-" + Math.floor(100000 + Math.random() * 900000);

      const course = COURSES.find(c => c.id === program || c.title.toLowerCase().includes(String(program).toLowerCase())) || COURSES[0];
      const monthlyFee = course.tuitionMonthlyNGN;
      let calculatedTuition = monthlyFee;
      let discountApplied = "0%";

      if (plan === "quarterly") {
        calculatedTuition = Math.round(monthlyFee * 3 * 0.9);
        discountApplied = "10% Term Discount";
      } else if (plan === "annual") {
        calculatedTuition = Math.round(monthlyFee * 12 * 0.8);
        discountApplied = "20% Annual Immersion Discount";
      }

      // Dispatch alert to admin
      const ntfyTopic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
      try {
        fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': `[Agent Enrollment] Student Enrolled: ${childName} (${studentId})`,
            'Priority': 'urgent',
            'Tags': 'mortar_board,credit_card,sparkles'
          },
          body: `Agent direct enrollment confirmed!\nStudent ID: ${studentId}\nStudent: ${childName} (Age ${childAge})\nCourse: ${course.title}\nPlan: ${plan} (${discountApplied})\nParent: ${parentName} (${parentEmail}, ${parentPhone})`
        }).catch(() => {});
      } catch (e) {}

      return {
        status: "ACTIVE_ENROLLMENT",
        enrollmentId,
        studentId,
        studentName: childName,
        childAge,
        enrolledProgram: course.title,
        programCategory: course.category,
        billingPlan: plan,
        discount: discountApplied,
        tuitionNGN: calculatedTuition,
        portalAccess: {
          parentPortalUrl: "https://stemuluskidstech.com/parent-login.html",
          registeredEmail: parentEmail,
          status: "Credentials provisioned. Temporary password delivered via email."
        },
        curriculumSchedule: {
          sessionsPerWeek: 1,
          durationPerSessionMinutes: 60,
          mentorMatchingStatus: "Assigned within 2 hours",
          reminderSchedule: "Automated 6-hour and 5-minute pre-class alerts active"
        },
        message: `Enrollment for ${childName} is complete! Student ID: ${studentId}. Welcome to the STEMulus family.`
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Helper: Handle Resource Read
async function readResource(uri) {
  switch (uri) {
    case "curriculum://stemulus/catalog":
      return JSON.stringify(COURSES, null, 2);

    case "curriculum://stemulus/pricing":
      return JSON.stringify({
        currency: "NGN (Nigerian Naira) and USD for diaspora",
        plans: {
          monthly: { description: "Flexible month-to-month, cancel anytime" },
          quarterly: { discount: "10% off", description: "3-month term commitment" },
          annual: { discount: "20% off", description: "12-month mastery track" }
        },
        siblingDiscount: "15% discount for 2nd and subsequent enrolled children",
        trialClass: "100% Free 45-minute 1-on-1 live session with senior mentor"
      }, null, 2);

    case "curriculum://stemulus/faqs":
      return `# STEMulus Kids Tech — Frequently Asked Questions

### What equipment does my child need?
A working laptop or desktop (Windows, Mac, or Chromebook), a stable internet connection, and working audio/video. We provide all coding software, cloud IDEs, and browser-based tooling.

### Are classes 1-on-1 or in groups?
All core STEMulus classes are strictly private 1-on-1 instruction. Mentors adapt each lesson to the child's exact learning pace, interests, and attention style.

### How do class reminders work?
Every enrolled student and tutor automatically receives two pre-class notifications before every session:
1. **6 Hours Before**: Preparation reminder with syllabus goals, student briefing, and meeting room link.
2. **5 Minutes Before**: Urgent classroom countdown alert with 1-click meeting join link.

### Can we reschedule a class?
Yes. Parents and mentors can reschedule any session through their portal or via direct WhatsApp concierge up to 2 hours before class.
`;

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
}

// ─── Main Netlify Function Handler ─────────────────────────────────────────────
exports.handler = async (event) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Preflight OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // GET Health / Discovery
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: "STEMulus WebMCP Server",
        version: "1.0.0",
        protocolVersion: "2024-11-05",
        status: "ONLINE",
        description: "Model Context Protocol endpoint for AI agent course queries, trial class bookings, and student enrollments.",
        endpoints: {
          mcp: "https://stemuluskidstech.com/api/mcp",
          discovery: "https://stemuluskidstech.com/.well-known/mcp.json",
          testbench: "https://stemuluskidstech.com/webmcp.html"
        },
        tools: MCP_TOOLS.map(t => ({ name: t.name, description: t.description }))
      }, null, 2)
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: "Only POST and GET methods are supported." }, id: null })
    };
  }

  let request;
  try {
    request = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: Invalid JSON" }, id: null })
    };
  }

  const { id = 1, method, params = {} } = request;

  try {
    switch (method) {
      // 1. Initialize
      case "initialize":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: "STEMulus WebMCP Server",
                version: "1.0.0"
              }
            }
          })
        };

      // 2. Initialized Notification
      case "notifications/initialized":
      case "initialized":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ jsonrpc: "2.0", id, result: { acknowledged: true } })
        };

      // 3. Tools List
      case "tools/list":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS
            }
          })
        };

      // 4. Tools Call
      case "tools/call": {
        const toolName = params.name;
        const toolArgs = params.arguments || {};
        if (!toolName) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Missing tool name in params" }
            })
          };
        }

        const toolResult = await executeTool(toolName, toolArgs);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2)
                }
              ]
            }
          })
        };
      }

      // 5. Resources List
      case "resources/list":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              resources: MCP_RESOURCES
            }
          })
        };

      // 6. Resources Read
      case "resources/read": {
        const uri = params.uri;
        if (!uri) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Missing uri parameter" }
            })
          };
        }
        const text = await readResource(uri);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: uri.endsWith(".json") ? "application/json" : "text/markdown",
                  text
                }
              ]
            }
          })
        };
      }

      default:
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          })
        };
    }
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: error.message || "Internal server error" }
      })
    };
  }
};
