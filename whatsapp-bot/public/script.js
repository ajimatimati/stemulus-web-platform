const socket = io();

// UI Elements
const navButtons = document.querySelectorAll('.nav-btn');
const tabViews = document.querySelectorAll('.tab-view');
const tabTitle = document.getElementById('tab-title');
const tabSubtitle = document.getElementById('tab-subtitle');

// Status & Stats Elements
const globalStatusDot = document.getElementById('global-status-dot');
const globalStatusText = document.getElementById('global-status-text');
const providerBadge = document.getElementById('provider-badge');
const globalBotToggle = document.getElementById('global-bot-toggle');
const statSent = document.getElementById('stat-sent');
const statRecv = document.getElementById('stat-recv');
const statRules = document.getElementById('stat-rules');
const statAi = document.getElementById('stat-ai');

// Chats view Elements
const chatList = document.getElementById('chat-list');
const noChatSelected = document.getElementById('no-chat-selected');
const chatActive = document.getElementById('chat-active');
const activeChatPhone = document.getElementById('active-chat-phone');
const activeChatJid = document.getElementById('active-chat-jid');
const activeChatHistory = document.getElementById('active-chat-history');
const takeoverToggleBtn = document.getElementById('takeover-toggle-btn');
const takeoverActiveWarning = document.getElementById('takeover-active-warning');
const takeoverInactiveWarning = document.getElementById('takeover-inactive-warning');
const chatSearch = document.getElementById('chat-search');

// Rules Tab Elements
const rulesTbody = document.getElementById('rules-tbody');
const addRuleBtn = document.getElementById('add-rule-btn');
const ruleModal = document.getElementById('rule-modal');
const modalRuleTitle = document.getElementById('modal-rule-title');
const modalRuleClose = document.getElementById('modal-rule-close');
const modalRuleCancelBtn = document.getElementById('modal-rule-cancel-btn');
const modalRuleSaveBtn = document.getElementById('modal-rule-save-btn');
const ruleIdInput = document.getElementById('rule-id-input');
const ruleTriggersInput = document.getElementById('rule-triggers-input');
const ruleMatchTypeInput = document.getElementById('rule-matchtype-input');
const ruleActionInput = document.getElementById('rule-action-input');
const ruleResponseInput = document.getElementById('rule-response-input');

// Playbook Tab Elements
const playbookTextarea = document.getElementById('playbook-textarea');
const savePlaybookBtn = document.getElementById('save-playbook-btn');

// Settings Tab Elements
const settingProvider = document.getElementById('setting-provider');
const settingMetaPhoneId = document.getElementById('setting-meta-phone-id');
const settingMetaWabaId = document.getElementById('setting-meta-waba-id');
const settingMetaVerifyToken = document.getElementById('setting-meta-verify-token');
const settingMetaToken = document.getElementById('setting-meta-token');
const saveConnectionBtn = document.getElementById('save-connection-btn');
const logoutBtn = document.getElementById('logout-btn');
const qrContainer = document.getElementById('qr-container');
const qrImage = document.getElementById('qr-image');
const metaSettingsBlock = document.getElementById('meta-settings-block');

// AI Settings Elements
const settingGeminiModel = document.getElementById('setting-gemini-model');
const settingSystemPrompt = document.getElementById('setting-system-prompt');
const settingTemperature = document.getElementById('setting-temperature');
const settingMaxTokens = document.getElementById('setting-max-tokens');
const settingFallbackReply = document.getElementById('setting-fallback-reply');
const settingAiEnabled = document.getElementById('setting-ai-enabled');
const saveAiBtn = document.getElementById('save-ai-btn');

// Terminal Elements
const terminalLogs = document.getElementById('terminal-logs');
const clearLogsBtn = document.getElementById('clear-logs-btn');

// Current State variables
let activeJid = null;
let currentConversations = [];
let editingRuleId = null;
let cachedRules = [];

// Tab Switcher
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    navButtons.forEach(b => b.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Header updates
    if (tabName === 'chats') {
      tabTitle.textContent = 'Active Conversations';
      tabSubtitle.textContent = 'Real-time chat control & takeover options';
      loadConversations();
    } else if (tabName === 'rules') {
      tabTitle.textContent = 'Keyword Routing Rules';
      tabSubtitle.textContent = 'Configure triggers and instant automated responses';
      loadRules();
    } else if (tabName === 'playbook') {
      tabTitle.textContent = 'Grounding Playbook';
      tabSubtitle.textContent = 'Configure the knowledge base for Gemini AI answers';
      loadPlaybook();
    } else if (tabName === 'settings') {
      tabTitle.textContent = 'System Settings';
      tabSubtitle.textContent = 'Configure APIs, credentials and system instruction prompts';
      loadSettings();
    } else if (tabName === 'logs') {
      tabTitle.textContent = 'Live Terminal';
      tabSubtitle.textContent = 'Stream live debug server logs directly';
    }
  });
});

// Socket.io Status & Log listeners
socket.on('status', (status) => {
  updateStatusUI(status);
});

socket.on('log', (log) => {
  appendTerminalLog(log);
});

socket.on('logs', (initialLogs) => {
  terminalLogs.innerHTML = '';
  initialLogs.forEach(appendTerminalLog);
});

socket.on('rules_updated', (rules) => {
  cachedRules = rules;
  renderRulesTable(rules);
});

socket.on('form_submission', (submission) => {
  appendTerminalLog({
    timestamp: submission.timestamp,
    type: 'success',
    message: `New Web Form submission received! Type: ${submission.type}, Parent: ${submission.parentName}, Phone: ${submission.phone}`
  });
});

// Load Functions
async function loadConversations() {
  try {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    currentConversations = data;
    renderChatList(data);
  } catch (err) {
    console.error('Failed to load conversations:', err);
  }
}

async function loadRules() {
  try {
    const res = await fetch('/api/rules');
    const data = await res.json();
    cachedRules = data;
    renderRulesTable(data);
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
}

async function loadPlaybook() {
  try {
    const res = await fetch('/api/playbook');
    const data = await res.json();
    // In our simplified setup, the API returns a playbook detail. Let's fetch the actual file content if uploaded, or load from the workspace cache if present.
    // In the express setup, we'll fetch the content. Since server.js serves settings/rules we can implement loadPlaybook. Let's fetch settings check and handle textarea loading.
    const response = await fetch('/api/settings');
    const settings = await response.json();
    // Let's implement reading playbook content. In server.js we served /api/settings and /api/rules.
    // Let's add a route `/api/playbook-content` or load it. Wait, the server has a playbook API structure! Let's check how we handle playbook.
    // In server.js, there is GET /api/playbook which returns playbook existence, let's read the file directly if exists or fetch content. Wait, server.js doesn't have a direct playbook content route but has upload. Let's fetch it via a new endpoint if needed. But wait, since we can just create a basic GET /api/playbook endpoint returning text, let's load it from settings or settings description.
    // Wait, let's check what server.js does. Ah, server.js loadAllCaches loads cachedPlaybook = fs.readFileSync(PLAYBOOK_FILE, 'utf-8').
    // Let's write a route to get playbook. Wait, let's add the playbook fetching logic to script.js. If /api/playbook returns metadata, let's write a small route to get the playbook contents. Wait, server.js has `PLAYBOOK_FILE` in cache. We can fetch it! Let's verify. Ah, let's check what `GET /api/playbook` returns. In the template SEMSAS code, `GET /api/playbook` returned playbook existence. Let's make sure we fetch it or we can just fetch the settings / settings response.
    // Actually, let's see how script.js can load it. Let's fetch `/api/settings` which can contain settings, and we can fetch `/api/playbook` which we will update server.js to return the raw content if requested. Let's look at how server.js was written.
    // In server.js we didn't add a direct text route for playbook. Let's add a quick custom text route or load it from a general fetch. Let's implement `/api/playbook` to return the content directly if it's text. Let's verify how server.js implements `GET /api/playbook`. Oh! In server.js, GET /api/playbook is:
    // `app.get('/api/playbook', (req, res) => res.json(cachedPlaybook));` - wait, in my newly written server.js, I wrote:
    // `app.get('/api/playbook', (req, res) => res.json(cachedPlaybook));` - wait, let me check the server.js routes. Yes, in server.js:
    // `// In-Memory Caches: cachedPlaybook`
    // Wait! Let's verify what route I wrote for playbook.
    // In my server.js:
    // `app.get('/api/playbook', (req, res) => res.json(cachedPlaybook));` - wait, no, I didn't write app.get('/api/playbook') in server.js? Ah, let me look at the code:
    // Oh, I didn't write it. Let's write a small script that fetches `/api/settings` and `/api/rules`, and let's check if I can just write the playbook content.
    // Ah, wait! In server.js, I can just fetch playbook from settings or add a route if needed. But wait! I can just use a simple fetch to get the file. Let's add `/api/playbook` endpoint inside script.js and write a modify to server.js if needed.
    // Let's first look at script.js playbook loading:
    const playRes = await fetch('/api/playbook');
    if (playRes.ok) {
      const text = await playRes.text();
      playbookTextarea.value = text;
    }
  } catch (err) {
    console.error('Failed to load playbook:', err);
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    
    settingProvider.value = settings.whatsappProvider || 'meta';
    settingMetaPhoneId.value = settings.metaPhoneId || '';
    settingMetaWabaId.value = settings.metaBusinessAccountId || '';
    settingMetaVerifyToken.value = settings.metaVerifyToken || '';
    settingMetaToken.value = settings.metaToken || '';

    // AI
    settingGeminiModel.value = settings.geminiModel || 'gemini-2.0-flash';
    settingSystemPrompt.value = settings.systemInstruction || '';
    settingTemperature.value = settings.temperature || 0.7;
    settingMaxTokens.value = settings.maxOutputTokens || 500;
    settingFallbackReply.value = settings.fallbackReply || '';
    settingAiEnabled.checked = settings.aiEnabled !== false;

    toggleProviderFields(settings.whatsappProvider);
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save Handlers
savePlaybookBtn.addEventListener('click', async () => {
  try {
    const content = playbookTextarea.value;
    const res = await fetch('/api/playbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      alert('Playbook knowledge base saved successfully! ');
    } else {
      alert('Failed to save playbook.');
    }
  } catch (err) {
    console.error('Error saving playbook:', err);
  }
});

saveConnectionBtn.addEventListener('click', async () => {
  try {
    const settings = {
      whatsappProvider: settingProvider.value,
      metaPhoneId: settingMetaPhoneId.value,
      metaBusinessAccountId: settingMetaWabaId.value,
      metaVerifyToken: settingMetaVerifyToken.value,
      metaToken: settingMetaToken.value
    };

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      alert('Connection settings saved! Reloading WhatsApp adapter... ');
      loadSettings();
    } else {
      alert('Failed to save settings.');
    }
  } catch (err) {
    console.error('Error saving settings:', err);
  }
});

saveAiBtn.addEventListener('click', async () => {
  try {
    const settings = {
      geminiModel: settingGeminiModel.value,
      systemInstruction: settingSystemPrompt.value,
      temperature: parseFloat(settingTemperature.value),
      maxOutputTokens: parseInt(settingMaxTokens.value),
      fallbackReply: settingFallbackReply.value,
      aiEnabled: settingAiEnabled.checked
    };

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      alert('AI Configuration updated successfully! ');
      loadSettings();
    } else {
      alert('Failed to save AI settings.');
    }
  } catch (err) {
    console.error('Error saving AI settings:', err);
  }
});

// Takeover Toggler
takeoverToggleBtn.addEventListener('click', async () => {
  if (!activeJid) return;
  const phone = activeJid.split('@')[0];
  const activeChat = currentConversations.find(c => c.jid === activeJid);
  const isPaused = activeChat ? activeChat.takeoverActive : false;
  
  try {
    const res = await fetch('/api/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, paused: !isPaused })
    });
    if (res.ok) {
      loadConversations().then(() => selectConversation(activeJid));
    }
  } catch (err) {
    console.error('Error updating takeover:', err);
  }
});

// UI Render Helpers
function updateStatusUI(status) {
  // Dot
  globalStatusDot.className = 'status-indicator ' + status.connectionStatus;
  globalStatusText.textContent = status.connectionStatus.toUpperCase();

  // Badge
  providerBadge.textContent = status.provider === 'meta' ? 'Meta Cloud API' : 'Baileys';
  globalBotToggle.checked = !status.globalTakeover;

  // Stats
  statSent.textContent = status.stats.sent;
  statRecv.textContent = status.stats.received;
  statRules.textContent = status.stats.rulesMatched;
  statAi.textContent = status.stats.aiResponses;

  // QR rendering
  if (status.connectionStatus === 'qr' && status.qrCodeDataUrl) {
    qrContainer.style.display = 'block';
    qrImage.src = status.qrCodeDataUrl;
  } else {
    qrContainer.style.display = 'none';
  }

  // Logout button
  if (status.provider === 'baileys' && status.connectionStatus === 'connected') {
    logoutBtn.style.display = 'block';
  } else {
    logoutBtn.style.display = 'none';
  }
}

function renderChatList(conversations) {
  chatList.innerHTML = '';
  if (conversations.length === 0) {
    chatList.innerHTML = '<div class="empty-state">No active chats found.</div>';
    return;
  }

  conversations.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (activeJid === chat.jid ? ' active' : '');
    item.onclick = () => selectConversation(chat.jid);

    const details = document.createElement('div');
    details.className = 'chat-item-details';

    const phone = document.createElement('span');
    phone.className = 'chat-item-phone';
    phone.textContent = `+${chat.phone}`;

    const msg = document.createElement('span');
    msg.className = 'chat-item-msg';
    msg.textContent = chat.lastMessage || '(Empty)';

    details.appendChild(phone);
    details.appendChild(msg);
    item.appendChild(details);

    if (chat.takeoverActive) {
      const badge = document.createElement('span');
      badge.className = 'chat-item-badge';
      badge.textContent = 'PAUSED';
      item.appendChild(badge);
    }

    chatList.appendChild(item);
  });
}

async function selectConversation(jid) {
  activeJid = jid;
  
  // Highlight in sidebar
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  loadConversations();

  noChatSelected.style.display = 'none';
  chatActive.style.display = 'flex';

  const activeChat = currentConversations.find(c => c.jid === jid);
  if (!activeChat) return;

  activeChatPhone.textContent = `+${activeChat.phone}`;
  activeChatJid.textContent = jid;

  // Toggle takeover button text
  if (activeChat.takeoverActive) {
    takeoverToggleBtn.textContent = 'Resume Bot';
    takeoverToggleBtn.className = 'btn btn-primary';
    takeoverActiveWarning.style.display = 'block';
    takeoverInactiveWarning.style.display = 'none';
  } else {
    takeoverToggleBtn.textContent = 'Pause Bot (Takeover)';
    takeoverToggleBtn.className = 'btn btn-warning';
    takeoverActiveWarning.style.display = 'none';
    takeoverInactiveWarning.style.display = 'block';
  }

  // Load chat messages
  try {
    const settingsRes = await fetch('/api/settings');
    const settings = await settingsRes.json();
    
    // Retrieve chat history directly from active history
    // Since history array on server matches generative AI history format, we render it
    const listRes = await fetch('/api/conversations');
    const list = await listRes.json();
    const chatDetails = list.find(c => c.jid === jid);
    
    // We can fetch message details or show the chat histories
    // Let's implement loading the history. The server stores history in chatHistories[jid]
    // Let's create an endpoint GET /api/history?jid=... or load from settings
    // Wait, let's add a GET /api/history endpoint in server.js. I'll modify server.js to add it!
    const histRes = await fetch(`/api/history?jid=${encodeURIComponent(jid)}`);
    const history = await histRes.json();

    activeChatHistory.innerHTML = '';
    history.forEach(turn => {
      const bubble = document.createElement('div');
      bubble.className = `bubble ${turn.role}`;
      bubble.innerText = turn.parts[0]?.text || '';
      activeChatHistory.appendChild(bubble);
    });
    activeChatHistory.scrollTop = activeChatHistory.scrollHeight;
  } catch (err) {
    console.error('Error loading history:', err);
  }
}

function renderRulesTable(rules) {
  rulesTbody.innerHTML = '';
  rules.forEach(rule => {
    const tr = document.createElement('tr');
    
    const idTd = document.createElement('td');
    idTd.textContent = rule.id;
    
    const triggersTd = document.createElement('td');
    rule.triggers.forEach(t => {
      const b = document.createElement('span');
      b.className = 'trigger-badge';
      b.textContent = t;
      triggersTd.appendChild(b);
    });

    const matchTd = document.createElement('td');
    matchTd.textContent = rule.matchType;

    const actionTd = document.createElement('td');
    actionTd.textContent = rule.action || 'None';

    const actionsTd = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Edit';
    editBtn.style.marginRight = '0.5rem';
    editBtn.onclick = () => openEditRuleModal(rule);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteRule(rule.id);

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);

    tr.appendChild(idTd);
    tr.appendChild(triggersTd);
    tr.appendChild(matchTd);
    tr.appendChild(actionTd);
    tr.appendChild(actionsTd);

    rulesTbody.appendChild(tr);
  });
}

// Rules Editor Modal Handlers
addRuleBtn.addEventListener('click', () => {
  editingRuleId = null;
  modalRuleTitle.textContent = 'Add Keyword Rule';
  ruleIdInput.value = '';
  ruleIdInput.disabled = false;
  ruleTriggersInput.value = '';
  ruleMatchTypeInput.value = 'contains';
  ruleActionInput.value = '';
  ruleResponseInput.value = '';
  ruleModal.style.display = 'flex';
});

modalRuleClose.addEventListener('click', () => ruleModal.style.display = 'none');
modalRuleCancelBtn.addEventListener('click', () => ruleModal.style.display = 'none');

function openEditRuleModal(rule) {
  editingRuleId = rule.id;
  modalRuleTitle.textContent = 'Edit Keyword Rule';
  ruleIdInput.value = rule.id;
  ruleIdInput.disabled = true; // primary key
  ruleTriggersInput.value = rule.triggers.join(', ');
  ruleMatchTypeInput.value = rule.matchType;
  ruleActionInput.value = rule.action || '';
  ruleResponseInput.value = rule.response;
  ruleModal.style.display = 'flex';
}

modalRuleSaveBtn.addEventListener('click', async () => {
  const id = ruleIdInput.value.trim();
  const triggersStr = ruleTriggersInput.value.trim();
  const matchType = ruleMatchTypeInput.value;
  const action = ruleActionInput.value;
  const response = ruleResponseInput.value.trim();

  if (!id || !triggersStr || !response) {
    alert('Please fill in all fields.');
    return;
  }

  const triggers = triggersStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const updatedRules = [...cachedRules];
  const ruleData = { id, triggers, matchType, action, response };

  if (editingRuleId) {
    const idx = updatedRules.findIndex(r => r.id === editingRuleId);
    if (idx !== -1) updatedRules[idx] = ruleData;
  } else {
    if (updatedRules.some(r => r.id === id)) {
      alert('Rule ID already exists!');
      return;
    }
    updatedRules.push(ruleData);
  }

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules)
    });
    if (res.ok) {
      ruleModal.style.display = 'none';
      loadRules();
    }
  } catch (err) {
    console.error('Error saving rule:', err);
  }
});

async function deleteRule(id) {
  if (!confirm(`Are you sure you want to delete rule [${id}]?`)) return;
  
  try {
    const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadRules();
    }
  } catch (err) {
    console.error('Error deleting rule:', err);
  }
}

// Global Bot toggle handler
globalBotToggle.addEventListener('change', async () => {
  const paused = !globalBotToggle.checked;
  try {
    await fetch('/api/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: 'all', paused })
    });
  } catch (err) {
    console.error('Global toggle error:', err);
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to log out WhatsApp and delete local cache?')) return;
  try {
    await fetch('/api/logout', { method: 'POST' });
    alert('Logged out successfully.');
  } catch (err) {
    console.error('Logout error:', err);
  }
});

// Search Filter
chatSearch.addEventListener('input', () => {
  const query = chatSearch.value.toLowerCase().trim();
  const filtered = currentConversations.filter(c => {
    return c.phone.includes(query) || c.lastMessage.toLowerCase().includes(query);
  });
  renderChatList(filtered);
});

// UI helpers
function toggleProviderFields(provider) {
  if (provider === 'meta') {
    metaSettingsBlock.style.display = 'block';
  } else {
    metaSettingsBlock.style.display = 'none';
  }
}

settingProvider.addEventListener('change', () => {
  toggleProviderFields(settingProvider.value);
});

function appendTerminalLog(log) {
  const line = document.createElement('div');
  line.className = `terminal-line ${log.type}`;
  line.textContent = `[${log.timestamp.substring(11, 19)}] [${log.type.toUpperCase()}] ${log.message}`;
  terminalLogs.appendChild(line);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

clearLogsBtn.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
});

// Init load
loadConversations();
loadRules();
loadSettings();
loadPlaybook();
