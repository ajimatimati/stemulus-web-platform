/**
 * STEMulus Autonomous Meet Recorder Daemon
 * 
 * Provides ZERO-BUTTON live recording for all Google Meet sessions.
 * Runs as a lightweight local background daemon (port 8099).
 * 
 * Works with the 18-month Jio trial plan (stemulusclubs@gmail.com) without
 * requiring paid Google Workspace Enterprise cloud subscriptions.
 * 
 * Features:
 * 1. HTTP API: /api/record, /api/stop, /api/status
 * 2. Playwright Headless Bot with native 1080p recordVideo
 * 3. Auto-finalizes video files to recordings/
 * 4. Ingests into Gemini Content Analysis engine on conclusion
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = 8099;
const ROOT_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.join(ROOT_DIR, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// Active recording child processes indexed by meetUrl
const activeSessions = new Map();

function startRecorderBot(meetUrl, courseName = 'STEMulus_Class', studentName = 'Coder') {
  if (activeSessions.has(meetUrl)) {
    console.log(`[Daemon] Session already actively recording for: ${meetUrl}`);
    return { status: 'already_running', pid: activeSessions.get(meetUrl).pid };
  }

  console.log(`[Daemon] 🚀 Spawning Autonomous Recorder Bot for ${studentName} (${courseName}) -> ${meetUrl}`);
  
  const runnerScript = path.join(__dirname, 'run_single_recording_bot.js');
  
  const child = spawn('node', [runnerScript, meetUrl, courseName, studentName], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  activeSessions.set(meetUrl, {
    pid: child.pid,
    startTime: Date.now(),
    course: courseName,
    student: studentName
  });

  console.log(`[Daemon] Bot spawned with PID ${child.pid}`);
  return { status: 'started', pid: child.pid };
}

function stopRecorderBot(meetUrl) {
  if (activeSessions.has(meetUrl)) {
    const session = activeSessions.get(meetUrl);
    console.log(`[Daemon] Stopping recorder for ${meetUrl} (PID: ${session.pid})...`);
    try {
      process.kill(session.pid);
    } catch(e) {}
    activeSessions.delete(meetUrl);
    return { status: 'stopped' };
  }
  return { status: 'not_found' };
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      daemon: 'active',
      uptime: process.uptime(),
      activeRecordingsCount: activeSessions.size,
      activeSessions: Array.from(activeSessions.entries()).map(([k, v]) => ({ meetUrl: k, ...v }))
    }));
    return;
  }

  if (pathname === '/api/record') {
    const targetUrl = query.url || 'https://meet.google.com/ckd-ngjs-cth';
    const course = query.course || 'Coding Class';
    const student = query.student || 'Coder';
    const result = startRecorderBot(targetUrl, course, student);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/stop') {
    const targetUrl = query.url || '';
    const result = stopRecorderBot(targetUrl);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`[Daemon] STEMulus Autonomous Recorder Daemon running on port ${PORT}`);
  console.log(`[Daemon] Zero-button automatic recording ready for all Google Meet links`);
  console.log(`[Daemon] Works seamlessly on Jio 18-Month Plan without Enterprise fees`);
  console.log(`=============================================================`);
});
