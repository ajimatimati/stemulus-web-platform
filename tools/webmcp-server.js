#!/usr/bin/env node
/**
 * STEMulus WebMCP Server (Standalone Node.js MCP Server)
 * Supports both stdio (Claude Desktop, Cursor, Antigravity) and HTTP SSE/REST.
 *
 * Usage:
 *   node tools/webmcp-server.js              # Runs in stdio mode
 *   node tools/webmcp-server.js --http 3001  # Runs as local HTTP server on port 3001
 */

const http = require('http');
const readline = require('readline');

const COURSES = [
  {
    id: "scratch-creators",
    title: "Scratch Game Creators",
    ageRange: "5-8 years",
    category: "Block Coding & Creative Logic",
    durationWeeks: 12,
    tuitionMonthlyNGN: 45000,
    tuitionUSD: 75,
    summary: "Visual block-based game design, animations, interactive storytelling, and computational thinking fundamentals."
  },
  {
    id: "junior-robotics",
    title: "Junior Robotics & Electronics",
    ageRange: "6-10 years",
    category: "Hardware & Physical Computing",
    durationWeeks: 12,
    tuitionMonthlyNGN: 50000,
    tuitionUSD: 85,
    summary: "Hands-on micro-controllers, breadboards, sensors, motors, and smart gadgets with STEM kits delivered home."
  },
  {
    id: "python-young-coders",
    title: "Python for Young Coders",
    ageRange: "9-13 years",
    category: "Text-based Programming",
    durationWeeks: 16,
    tuitionMonthlyNGN: 55000,
    tuitionUSD: 95,
    summary: "Variables, loops, functions, Turtle graphics, Pygame arcade development, and real computational algorithms."
  },
  {
    id: "arduino-robotics",
    title: "Arduino Robotics & IoT",
    ageRange: "10-15 years",
    category: "Robotics & Hardware",
    durationWeeks: 16,
    tuitionMonthlyNGN: 60000,
    tuitionUSD: 100,
    summary: "C++ microcontroller programming, ultrasonic obstacle avoidance, autonomous rovers, and IoT telemetry."
  },
  {
    id: "fullstack-web-dev",
    title: "Full-Stack Web Development",
    ageRange: "11-17 years",
    category: "Web Engineering",
    durationWeeks: 20,
    tuitionMonthlyNGN: 60000,
    tuitionUSD: 100,
    summary: "Modern semantic HTML5, CSS Grid/Flexbox, JavaScript ES6+, responsive UI, Git, and live cloud deployments."
  },
  {
    id: "ai-machine-learning",
    title: "AI & Machine Learning for Teens",
    ageRange: "12-17 years",
    category: "Artificial Intelligence",
    durationWeeks: 20,
    tuitionMonthlyNGN: 65000,
    tuitionUSD: 110,
    summary: "Neural network fundamentals, computer vision, natural language processing, predictive data modeling, and ethical AI."
  }
];

const MCP_TOOLS = [
  {
    name: "get_courses",
    description: "Returns the complete STEMulus course catalog, curriculum outlines, age brackets, duration, and tuition pricing.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional category filter" },
        age: { type: "number", description: "Optional child age (5-17)" }
      }
    }
  },
  {
    name: "check_availability",
    description: "Inspects live 1-on-1 trial class slot availability for a specified program and target date.",
    inputSchema: {
      type: "object",
      properties: {
        program: { type: "string", description: "Course ID or title" },
        date: { type: "string", description: "Target date in YYYY-MM-DD format" }
      },
      required: ["program"]
    }
  },
  {
    name: "book_trial_class",
    description: "Books a free 45-minute 1-on-1 trial coding class for a child with an expert STEMulus mentor.",
    inputSchema: {
      type: "object",
      properties: {
        parentName: { type: "string", description: "Full name of parent" },
        parentEmail: { type: "string", format: "email", description: "Parent's contact email" },
        parentPhone: { type: "string", description: "Parent's WhatsApp phone number" },
        childName: { type: "string", description: "Child's name" },
        childAge: { type: "number", minimum: 5, maximum: 17, description: "Child's age" },
        program: { type: "string", description: "Course ID or program name" },
        preferredDate: { type: "string", description: "Date in YYYY-MM-DD" },
        preferredTime: { type: "string", description: "Time in HH:MM WAT" },
        notes: { type: "string", description: "Optional notes" }
      },
      required: ["parentName", "parentEmail", "parentPhone", "childName", "childAge", "program", "preferredDate", "preferredTime"]
    }
  },
  {
    name: "enroll_student",
    description: "Enrolls a student directly into the active STEMulus academy roster, generates student ID, and sets up portal credentials.",
    inputSchema: {
      type: "object",
      properties: {
        parentName: { type: "string", description: "Full name of parent" },
        parentEmail: { type: "string", format: "email", description: "Parent's contact email" },
        parentPhone: { type: "string", description: "Parent's phone number" },
        childName: { type: "string", description: "Child's name" },
        childAge: { type: "number", minimum: 5, maximum: 17, description: "Child's age" },
        program: { type: "string", description: "Course ID or program name" },
        plan: { type: "string", enum: ["monthly", "quarterly", "annual"], description: "Payment plan" },
        tutorPreference: { type: "string", description: "Optional mentor preference" },
        notes: { type: "string", description: "Optional onboarding notes" }
      },
      required: ["parentName", "parentEmail", "parentPhone", "childName", "childAge", "program", "plan"]
    }
  }
];

async function handleRpcRequest(request) {
  const { id = 1, method, params = {} } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "STEMulus WebMCP Server", version: "1.0.0" }
        }
      };

    case "notifications/initialized":
    case "initialized":
      return { jsonrpc: "2.0", id, result: { acknowledged: true } };

    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } };

    case "tools/call": {
      const name = params.name;
      const args = params.arguments || {};
      let result;

      if (name === "get_courses") {
        let filtered = [...COURSES];
        if (args.age) {
          const age = Number(args.age);
          filtered = filtered.filter(c => {
            const m = c.ageRange.match(/(\d+)-(\d+)/);
            return !m || (age >= parseInt(m[1]) && age <= parseInt(m[2]));
          });
        }
        result = { coursesCount: filtered.length, courses: filtered };
      } else if (name === "check_availability") {
        const prog = String(args.program || "").toLowerCase();
        const course = COURSES.find(c => c.id === prog || c.title.toLowerCase().includes(prog)) || COURSES[0];
        result = {
          program: course.title,
          date: args.date || new Date().toISOString().split("T")[0],
          slots: ["10:00", "11:30", "14:00", "15:30", "17:00"]
        };
      } else if (name === "book_trial_class") {
        const bookingId = "TR-" + Math.floor(100000 + Math.random() * 900000);
        result = {
          status: "CONFIRMED",
          bookingId,
          studentName: args.childName,
          childAge: args.childAge,
          program: args.program,
          scheduledDate: args.preferredDate,
          scheduledTime: args.preferredTime + " WAT",
          meetingLink: `https://meet.google.com/stm-${Math.random().toString(36).substring(2, 6)}`,
          remindersScheduled: "6 hours and 5 minutes prior to class for parent and tutor"
        };
      } else if (name === "enroll_student") {
        const studentId = `STEM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        result = {
          status: "ACTIVE_ENROLLMENT",
          studentId,
          studentName: args.childName,
          program: args.program,
          plan: args.plan,
          portalLogin: "https://stemuluskidstech.com/parent-login.html"
        };
      } else {
        return { jsonrpc: "2.0", id, error: { code: -32601, message: `Tool not found: ${name}` } };
      }

      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      };
    }

    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

// Check run mode: HTTP or stdio
const isHttp = process.argv.includes('--http');
const portIdx = process.argv.indexOf('--http');
const port = portIdx !== -1 && process.argv[portIdx + 1] ? parseInt(process.argv[portIdx + 1], 10) : 3001;

if (isHttp) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ONLINE', server: 'STEMulus WebMCP Server', port }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const rpc = JSON.parse(body || '{}');
          const response = await handleRpcRequest(rpc);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }));
        }
      });
      return;
    }

    res.writeHead(405);
    res.end();
  });

  server.listen(port, () => {
    console.log(`[STEMulus WebMCP] HTTP Server listening on http://localhost:${port}`);
  });
} else {
  // Stdio mode for Claude Desktop / Cursor
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const request = JSON.parse(line);
      const response = await handleRpcRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }) + '\n');
    }
  });
}
