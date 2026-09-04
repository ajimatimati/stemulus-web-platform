import express from 'express';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { getRules, saveRules, getSettings, saveSettings, getPlaybook, savePlaybook, getChatHistory, saveChatHistory, getAllChatHistoriesPreview } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Data directory setup
const DATA_DIR = path.join(__dirname, 'data');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const HISTORY_FILE = path.join(DATA_DIR, 'chat_history.json');
const PLAYBOOK_FILE = path.join(DATA_DIR, 'playbook.txt');
const AUTH_DIR = path.join(DATA_DIR, 'auth_info');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Sync from root template config files to data directory if not exists
function syncInitialFiles() {
  const filesToSync = [
    { src: path.join(__dirname, 'rules.json'), dest: RULES_FILE },
    { src: path.join(__dirname, 'settings.json'), dest: SETTINGS_FILE },
    { src: path.join(__dirname, 'playbook.txt'), dest: PLAYBOOK_FILE }
  ];

  filesToSync.forEach(({ src, dest }) => {
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`Synced ${path.basename(dest)} to data folder.`);
    }
  });

  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf-8');
  }
}
syncInitialFiles();

// In-Memory Caches
let cachedRules = [];
let cachedSettings = {};
let cachedPlaybook = '';
let activeTakeovers = {}; // { [phone]: { paused: boolean, expiresAt: timestamp } }
let sock = null;
let connectionStatus = 'disconnected';
let qrCodeDataUrl = null;
let stats = { sent: 0, received: 0, rulesMatched: 0, aiResponses: 0 };
let logs = [];

// Load all caches
async function loadAllCaches() {
  try {
    cachedRules = await getRules();
    cachedSettings = await getSettings();
    cachedPlaybook = await getPlaybook();
  } catch (err) {
    console.error('Error loading config caches:', err);
  }
}
loadAllCaches();

// Message Queue for AI Processing (Iteration 3)
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(taskFn, retries = 3) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, retries, resolve, reject });
      this.processNext();
    });
  }
  
  async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    const item = this.queue.shift();
    try {
      const result = await item.taskFn();
      item.resolve(result);
    } catch (err) {
      if (item.retries > 0) {
        logEvent('warning', `AI Task failed, retrying... (${item.retries} left). Error: ${err.message}`);
        item.retries--;
        await new Promise(r => setTimeout(r, 3000)); // wait 3s before retry
        this.queue.unshift(item); // Put back at front
      } else {
        logEvent('error', `AI Task failed permanently. Error: ${err.message}`);
        item.resolve(cachedSettings.fallbackReply); // Resolve with fallback instead of rejecting to not break flow
      }
    }
    
    this.processing = false;
    this.processNext();
  }
}
const aiQueue = new MessageQueue();

function logEvent(type, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message
  };
  logs.push(logEntry);
  if (logs.length > 100) logs.shift();
  io.emit('log', logEntry);
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function emitStatusUpdate() {
  const status = {
    connectionStatus,
    qrCodeDataUrl: connectionStatus === 'qr' ? qrCodeDataUrl : null,
    stats,
    provider: cachedSettings.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'meta',
    globalTakeover: activeTakeovers['all']?.paused || false
  };
  io.emit('status', status);
}

// Helpers
function formatPhoneJid(phone) {
  let clean = phone.replace(/\D/g, '');
  if (!clean.endsWith('@s.whatsapp.net')) {
    clean += '@s.whatsapp.net';
  }
  return clean;
}

function getCleanPhone(jid) {
  return jid.split('@')[0];
}

// Deduplication
const duplicateCache = new Set();
function isDuplicateMessage(msgId) {
  if (duplicateCache.has(msgId)) return true;
  duplicateCache.add(msgId);
  setTimeout(() => duplicateCache.delete(msgId), 300000); // 5 min TTL
  return false;
}

// Sending Messages
async function sendMetaMessage(toPhone, text) {
  const phoneId = cachedSettings.metaPhoneId || process.env.META_PHONE_NUMBER_ID;
  const token = cachedSettings.metaToken || process.env.META_ACCESS_TOKEN;
  
  if (!phoneId || !token) {
    logEvent('error', 'Meta credentials missing. Cannot send message.');
    return false;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone.replace(/\D/g, ''),
        type: 'text',
        text: { body: text }
      })
    });
    const resData = await response.json();
    if (!response.ok) {
      logEvent('error', `Meta API Error: ${JSON.stringify(resData)}`);
      return false;
    }
    stats.sent++;
    logEvent('sent', `To ${toPhone}: "${text.substring(0, 60)}..."`);
    return true;
  } catch (err) {
    logEvent('error', `Failed to send Meta message: ${err.message}`);
    return false;
  }
}

async function sendWhatsAppMessage(recipientJid, text) {
  const provider = cachedSettings.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'meta';
  const cleanPhone = getCleanPhone(recipientJid);

  if (provider === 'meta') {
    return await sendMetaMessage(cleanPhone, text);
  } else if (provider === 'baileys' && sock && connectionStatus === 'connected') {
    try {
      // Simulate typing delay
      await sock.sendPresenceUpdate('composing', recipientJid);
      const delayMs = Math.min(3000, Math.max(1000, text.length * 15));
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await sock.sendPresenceUpdate('paused', recipientJid);

      await sock.sendMessage(recipientJid, { text });
      stats.sent++;
      logEvent('sent', `To ${cleanPhone} (Baileys): "${text.substring(0, 60)}..."`);
      return true;
    } catch (err) {
      logEvent('error', `Baileys send error: ${err.message}`);
      return false;
    }
  } else {
    logEvent('warning', `No active provider connection. Saved unsent msg to ${cleanPhone}`);
    return false;
  }
}

// Meta Webhook Verification Middleware
function verifyMetaSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.META_APP_SECRET;
  
  if (!appSecret) {
    return next(); // Skip validation if secret is not set
  }

  if (!signature) {
    return res.status(401).send('Signature missing');
  }

  const elements = signature.split('=');
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody)
    .digest('hex');

  if (signatureHash !== expectedHash) {
    logEvent('warning', 'Invalid webhook signature received.');
    return res.status(401).send('Signature mismatch');
  }
  next();
}

// Gemini AI Helper
async function getGeminiReply(senderJid, messageText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logEvent('error', 'Gemini API Key missing.');
    return cachedSettings.fallbackReply;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = cachedSettings.geminiModel || 'gemini-2.0-flash';
    
    // Build context
    const fullSystemInstruction = `${cachedSettings.systemInstruction}\n\n=== GROUNDING PLAYBOOK CONTENT ===\n${cachedPlaybook}`;
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: fullSystemInstruction
    });

    // History setup
    let history = await getChatHistory(senderJid);

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: cachedSettings.maxOutputTokens || 500,
        temperature: cachedSettings.temperature || 0.7
      }
    });

    const result = await chat.sendMessage(messageText);
    const responseText = result.response.text();

    // Store history (max 20 turns, sliding window)
    history.push({ role: 'user', parts: [{ text: messageText }] });
    history.push({ role: 'model', parts: [{ text: responseText }] });
    if (history.length > 20) {
      history.splice(0, 2);
    }

    // Persist history
    await saveChatHistory(senderJid, history);

    stats.aiResponses++;
    return responseText;
  } catch (err) {
    logEvent('error', `Gemini AI Error: ${err.message}`);
    return cachedSettings.fallbackReply;
  }
}

// Unified Message Processing Pipeline
async function processIncomingMessage(senderJid, text, rawMsg) {
  const cleanPhone = getCleanPhone(senderJid);
  logEvent('received', `From ${cleanPhone}: "${text}"`);
  stats.received++;

  // 1. Admin Commands Interceptor
  const adminPhone = process.env.ADMIN_PHONE || '2347052466716';
  if (cleanPhone === adminPhone && text.startsWith('#')) {
    await handleAdminCommand(senderJid, text);
    return;
  }

  // 2. Takeover check
  if (activeTakeovers['all']?.paused) {
    logEvent('info', `Ignored reply to ${cleanPhone} due to GLOBAL takeover.`);
    return;
  }
  if (activeTakeovers[cleanPhone]?.paused) {
    if (Date.now() < activeTakeovers[cleanPhone].expiresAt) {
      logEvent('info', `Ignored reply to ${cleanPhone} due to ACTIVE user takeover.`);
      return;
    } else {
      delete activeTakeovers[cleanPhone];
      logEvent('info', `Takeover window expired for ${cleanPhone}. Resuming bot.`);
    }
  }

  // 3. Rule matching
  const matchedRule = cachedRules.find(rule => {
    return rule.triggers.some(trigger => {
      const cleanTrigger = trigger.toLowerCase().trim();
      const cleanText = text.toLowerCase().trim();
      if (rule.matchType === 'exact') return cleanText === cleanTrigger;
      if (rule.matchType === 'startsWith') return cleanText.startsWith(cleanTrigger);
      if (rule.matchType === 'contains') return cleanText.includes(cleanTrigger);
      return false;
    });
  });

  if (matchedRule) {
    stats.rulesMatched++;
    logEvent('match', `Rule Match [${matchedRule.id}] for ${cleanPhone}`);
    
    // Check if human takeover action requested
    if (matchedRule.action === 'requestHumanTakeover') {
      activeTakeovers[cleanPhone] = { paused: true, expiresAt: Date.now() + 86400000 }; // 24h pause
      logEvent('warning', `Takeover requested. Paused bot for ${cleanPhone}.`);
    }

    await sendWhatsAppMessage(senderJid, matchedRule.response);
    return;
  }

  // 4. Trial Scheduling Flow detection (conversational Jitsi Meet link generation)
  const isSchedulingIntent = (
    (text.toLowerCase().includes('trial') || text.toLowerCase().includes('book') || text.toLowerCase().includes('schedule')) &&
    (text.toLowerCase().includes('class') || text.toLowerCase().includes('session') || text.toLowerCase().includes('slot'))
  );

  if (isSchedulingIntent && text.length > 5 && !text.includes('http')) {
    const meetId = Math.random().toString(36).substring(2, 8);
    const jitsiUrl = `https://meet.jit.si/stemulus-trial-${meetId}`;
    const scheduleResponse = `Awesome! Let's schedule your child's free trial class! \n\nI have created a virtual classroom space for you:\n[Link] *Jitsi Meet Class Link:* ${jitsiUrl}\n\nPlease let us know what day and time works best for you, and we will lock it in on our calendar! \n\nIf you prefer to book instantly via our website, go here:\n[Link] https://stemuluskidstech.com/book-class.html`;
    await sendWhatsAppMessage(senderJid, scheduleResponse);
    return;
  }

  // 5. Gemini AI Engine Fallback (Queued)
  if (cachedSettings.aiEnabled) {
    const aiReply = await aiQueue.add(() => getGeminiReply(senderJid, text));
    await sendWhatsAppMessage(senderJid, aiReply);
  } else {
    // Static default fallback
    await sendWhatsAppMessage(senderJid, cachedSettings.fallbackReply);
  }
}

// Admin Commands
async function handleAdminCommand(senderJid, text) {
  const parts = text.split(' ');
  const cmd = parts[0].toLowerCase();
  
  if (cmd === '#pause') {
    const target = parts[1];
    if (target === 'all') {
      activeTakeovers['all'] = { paused: true, expiresAt: Date.now() + 86400000 * 365 }; // indefinitely
      logEvent('warning', 'Bot paused GLOBALLY by admin command.');
      await sendWhatsAppMessage(senderJid, '[Bot] Bot has been PAUSED globally.');
    } else if (target) {
      const cleanTarget = target.replace(/\D/g, '');
      activeTakeovers[cleanTarget] = { paused: true, expiresAt: Date.now() + 86400000 };
      logEvent('warning', `Bot paused for conversation ${cleanTarget} by admin command.`);
      await sendWhatsAppMessage(senderJid, `[Bot] Bot has been PAUSED for number ${cleanTarget} (24 hours).`);
    } else {
      await sendWhatsAppMessage(senderJid, 'Usage: `#pause all` or `#pause 234XXXXXXXXXX`');
    }
  } else if (cmd === '#resume') {
    const target = parts[1];
    if (target === 'all') {
      delete activeTakeovers['all'];
      logEvent('success', 'Bot resumed GLOBALLY by admin command.');
      await sendWhatsAppMessage(senderJid, '[Bot] Bot has been RESUMED globally.');
    } else if (target) {
      const cleanTarget = target.replace(/\D/g, '');
      delete activeTakeovers[cleanTarget];
      logEvent('success', `Bot resumed for conversation ${cleanTarget} by admin command.`);
      await sendWhatsAppMessage(senderJid, `[Bot] Bot has been RESUMED for number ${cleanTarget}.`);
    } else {
      await sendWhatsAppMessage(senderJid, 'Usage: `#resume all` or `#resume 234XXXXXXXXXX`');
    }
  } else if (cmd === '#status') {
    const statusMsg = `[Bot] *STEMBot Uptime Status*:\n• Provider: ${cachedSettings.whatsappProvider}\n• Connection: ${connectionStatus}\n• Global Pause: ${activeTakeovers['all']?.paused ? 'ON [Stopped]' : 'OFF [Online]'}\n• Active Takeovers: ${Object.keys(activeTakeovers).filter(k => k !== 'all').length}\n• Sent/Recv Today: ${stats.sent}/${stats.received}`;
    await sendWhatsAppMessage(senderJid, statusMsg);
  } else {
    await sendWhatsAppMessage(senderJid, '[Help] Unknown command. Available: `#pause all`, `#pause <phone>`, `#resume all`, `#resume <phone>`, `#status`.');
  }
  emitStatusUpdate();
}

// Baileys Connection Code
async function connectToWhatsApp() {
  const provider = cachedSettings.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'meta';

  if (provider === 'meta') {
    connectionStatus = 'connected';
    logEvent('success', 'Meta Cloud API connection initialized.');
    emitStatusUpdate();
    
    // Auto-subscribe the webhook
    const wabaId = cachedSettings.metaBusinessAccountId || process.env.META_BUSINESS_ACCOUNT_ID;
    const token = cachedSettings.metaToken || process.env.META_ACCESS_TOKEN;
    if (wabaId && token) {
      try {
        const subUrl = `https://graph.facebook.com/v19.0/${wabaId}/subscribed_apps`;
        const res = await fetch(subUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await res.json();
        if (res.ok) {
          logEvent('info', 'Successfully verified WABA webhook subscription status.');
        } else {
          logEvent('warning', `WABA subscription check returned: ${JSON.stringify(resData)}`);
        }
      } catch (err) {
        logEvent('warning', `Failed webhook auto-subscription check: ${err.message}`);
      }
    }
    return;
  }

  // Baileys Connection Setup
  connectionStatus = 'connecting';
  emitStatusUpdate();
  logEvent('info', 'Starting Baileys WhatsApp web authentication...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    sock = makeWASocket.default({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['STEMulus Admin Bot', 'Windows', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'qr';
        qrCodeDataUrl = await QRCode.toDataURL(qr);
        logEvent('info', 'New authentication QR code generated.');
        emitStatusUpdate();
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        logEvent('warning', `Baileys disconnect: ${lastDisconnect?.error?.message || 'Unknown'}. Reconnecting: ${shouldReconnect}`);
        
        connectionStatus = 'disconnected';
        emitStatusUpdate();

        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 3000);
        } else {
          logEvent('error', 'Logged out of WhatsApp. Deleting local credentials...');
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          setTimeout(connectToWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        qrCodeDataUrl = null;
        logEvent('success', 'Baileys WhatsApp connection fully established!');
        emitStatusUpdate();
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;
        if (msg.key.remoteJid.endsWith('@g.us')) continue; // ignore group chat

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!text) continue;

        if (isDuplicateMessage(msg.key.id)) continue;

        await processIncomingMessage(msg.key.remoteJid, text, msg);
      }
    });
  } catch (err) {
    logEvent('error', `Failed to bootstrap Baileys: ${err.message}`);
    connectionStatus = 'disconnected';
    emitStatusUpdate();
  }
}

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    connectionStatus,
    qrCodeDataUrl: connectionStatus === 'qr' ? qrCodeDataUrl : null,
    stats,
    provider: cachedSettings.whatsappProvider,
    globalTakeover: activeTakeovers['all']?.paused || false
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    connection: connectionStatus,
    provider: cachedSettings.whatsappProvider
  });
});

app.post('/api/connect', (req, res) => {
  if (connectionStatus !== 'connected') {
    connectToWhatsApp();
    res.json({ success: true, message: 'Reconnection sequence triggered.' });
  } else {
    res.json({ success: false, message: 'Bot already connected.' });
  }
});

app.post('/api/logout', (req, res) => {
  if (cachedSettings.whatsappProvider === 'baileys') {
    try {
      if (sock) sock.logout();
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      connectionStatus = 'disconnected';
      emitStatusUpdate();
      res.json({ success: true, message: 'Baileys credentials cleared and socket closed.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.json({ success: true, message: 'Meta mode has no local credentials to clear.' });
  }
});

app.get('/api/rules', (req, res) => res.json(cachedRules));

app.post('/api/rules', async (req, res) => {
  const newRules = req.body;
  if (!Array.isArray(newRules)) return res.status(400).json({ error: 'Body must be a rules array.' });
  cachedRules = newRules;
  await saveRules(cachedRules);
  logEvent('success', 'Rules database updated via dashboard.');
  io.emit('rules_updated', cachedRules);
  res.json({ success: true });
});

app.delete('/api/rules/:id', async (req, res) => {
  const { id } = req.params;
  const filteredRules = cachedRules.filter(r => r.id !== id);
  if (filteredRules.length === cachedRules.length) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  cachedRules = filteredRules;
  await saveRules(cachedRules);
  logEvent('success', `Deleted rule [${id}] via dashboard.`);
  io.emit('rules_updated', cachedRules);
  res.json({ success: true });
});

app.get('/api/playbook', (req, res) => {
  res.send(cachedPlaybook);
});

app.post('/api/playbook', async (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'Content must be a string' });
  cachedPlaybook = content;
  await savePlaybook(content);
  logEvent('success', 'Playbook updated via dashboard.');
  res.json({ success: true });
});

app.get('/api/history', async (req, res) => {
  const { jid } = req.query;
  if (!jid) return res.status(400).json({ error: 'jid parameter required' });
  const history = await getChatHistory(jid);
  res.json(history);
});

app.get('/api/settings', (req, res) => res.json(cachedSettings));

app.post('/api/settings', async (req, res) => {
  const newSettings = req.body;
  const providerChanged = cachedSettings.whatsappProvider !== newSettings.whatsappProvider;

  cachedSettings = { ...cachedSettings, ...newSettings };
  await saveSettings(cachedSettings);
  logEvent('success', 'Bot settings database updated via dashboard.');

  if (providerChanged) {
    logEvent('info', `Switching WhatsApp provider from ${cachedSettings.whatsappProvider || 'baileys'} to ${newSettings.whatsappProvider}`);
    if (sock) {
      try { sock.end(); } catch (e) {}
      sock = null;
    }
    setTimeout(connectToWhatsApp, 2000);
  }
  
  emitStatusUpdate();
  res.json({ success: true });
});

app.get('/api/conversations', async (req, res) => {
  const previews = await getAllChatHistoriesPreview();
  const list = Object.keys(previews).map(jid => {
    const history = previews[jid];
    const lastTurn = history[history.length - 1];
    return {
      jid,
      phone: getCleanPhone(jid),
      lastMessage: lastTurn ? (lastTurn.parts[0]?.text || '') : '',
      lastTimestamp: new Date().toISOString(), // Mock timestamp for layout
      takeoverActive: activeTakeovers[getCleanPhone(jid)]?.paused || false
    };
  });
  res.json(list);
});

app.post('/api/takeover', (req, res) => {
  const { phone, paused } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  if (phone === 'all') {
    if (paused) {
      activeTakeovers['all'] = { paused: true, expiresAt: Date.now() + 86400000 * 365 };
    } else {
      delete activeTakeovers['all'];
    }
    logEvent('warning', `GLOBAL Takeover toggled: ${paused}`);
  } else {
    const cleanPhone = phone.replace(/\D/g, '');
    if (paused) {
      activeTakeovers[cleanPhone] = { paused: true, expiresAt: Date.now() + 86400000 }; // 24h
    } else {
      delete activeTakeovers[cleanPhone];
    }
    logEvent('warning', `Conversation takeover for ${cleanPhone} toggled: ${paused}`);
  }
  emitStatusUpdate();
  res.json({ success: true });
});

// Meta Webhook Challange/Response Verification
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const expectedVerifyToken = cachedSettings.metaVerifyToken || process.env.META_VERIFY_TOKEN || 'stemulus_verify_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedVerifyToken) {
      logEvent('success', 'Meta Webhook verification completed successfully.');
      return res.status(200).send(challenge);
    } else {
      logEvent('warning', 'Meta Webhook verification failed: verify token mismatch.');
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Meta Webhook POST Payload endpoint
app.post('/api/webhook', verifyMetaSignature, async (req, res) => {
  const provider = cachedSettings.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'meta';
  if (provider !== 'meta') {
    return res.sendStatus(200); // Ignore webhook requests if in Baileys mode
  }

  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from; // Phone number
      const jid = formatPhoneJid(from);
      
      if (isDuplicateMessage(msg.id)) {
        return res.sendStatus(200);
      }

      let text = '';
      if (msg.type === 'text') {
        text = msg.text.body;
      } else if (msg.type === 'interactive') {
        text = msg.interactive.button_reply?.title || msg.interactive.list_reply?.title || '';
      } else if (msg.type === 'button') {
        text = msg.button.text;
      }

      if (text) {
        await processIncomingMessage(jid, text, msg);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Website Form Notification API (secure notification routing)
app.post('/api/notify', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.NOTIFY_API_KEY || 'stemulus-notify-key-2026';

  if (apiKey !== expectedApiKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized API key' });
  }

  const { type, parentName, studentName, email, phone, bookingId, enrollmentId, program, message, subject } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Recipient phone number is required.' });
  }

  const targetJid = formatPhoneJid(phone);
  let whatsappText = '';
  
  if (type === 'booking') {
    whatsappText = `Hello ${parentName || 'Parent'}!  Thank you for booking a *FREE trial class* with STEMulus Kids Tech! \n\n *Booking Details:*\n• Child: ${studentName}\n• Booking ID: ${bookingId}\n\nOur class session runs 1 to 1.5 hours depending on age. A class meeting link will be sent to your email (${email}) shortly. \n\nIf you have any questions or want to customize your schedule, just reply directly to this chat! `;
  } else if (type === 'enrollment') {
    whatsappText = `Congratulations ${parentName || 'Parent'}!  Your child ${studentName} has been enrolled in our *${program || 'STEM'} Program*!\n\n *Enrollment Details:*\n• Enrollment ID: ${enrollmentId}\n• Classes: Twice a week\n\nAn administrator will reach out to you within 24 hours with custom class times, payment instructions, and your virtual classroom links. Welcome to the STEMulus family! `;
  } else if (type === 'contact') {
    // Notify admin phone about contact message
    const adminPhone = process.env.ADMIN_PHONE || '2347052466716';
    const adminJid = formatPhoneJid(adminPhone);
    whatsappText = `[Announcement] *New STEMulus Website Message:*\n\n[From] From: ${parentName} (${email})\n[Phone] Phone: ${phone}\n[Note] Subject: ${subject || 'General Inquiry'}\n Message:\n"${message}"`;
    
    // Route to admin instead
    await sendWhatsAppMessage(adminJid, whatsappText);
    res.json({ success: true, message: 'Admin alert sent.' });
    return;
  } else {
    return res.status(400).json({ success: false, error: 'Invalid notification type.' });
  }

  // Send WhatsApp message to parent
  const sent = await sendWhatsAppMessage(targetJid, whatsappText);
  
  // Broadcast alert to bot dashboard
  io.emit('form_submission', {
    type,
    parentName,
    studentName,
    phone,
    timestamp: new Date().toISOString()
  });

  res.json({ success: sent, message: sent ? 'WhatsApp notify sent.' : 'Failed to send WhatsApp message.' });
});

// Serve frontend logs & stats via Socket.io
io.on('connection', (socket) => {
  emitStatusUpdate();
  socket.emit('logs', logs);
  
  socket.on('request_status', () => {
    emitStatusUpdate();
  });
});

// Uptime monitor & auto-reconnect
httpServer.listen(PORT, () => {
  console.log(`STEMulus WhatsApp Admin Bot server listening on port ${PORT}`);
  connectToWhatsApp();
});

// Process cleanups
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});
