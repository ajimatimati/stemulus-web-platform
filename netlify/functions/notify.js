/**
 * STEMulus NTFY Proxy: Netlify Function
 *
 * Keeps ntfy topic names and auth token server-side in environment variables.
 * Client JS sends a structured payload here; this function resolves the real
 * topic and forwards to ntfy.sh with automatic anonymous fallback if token is invalid.
 *
 * Required Netlify environment variables:
 *   NTFY_TOKEN: ntfy access token (optional; if missing or invalid, anonymous post is used)
 *   NTFY_TOPIC_ENROLL: enrollment + booking notifications (default: stm-enr-lx7k9w2mq8vp4tz)
 *   NTFY_TOPIC_CONTACT: contact form notifications (default: stemulus-messages-admin2026)
 *   NTFY_TOPIC_TUTOR: tutor application notifications (default: stm-ttr-nb3r5y6jd1cx8ws)
 *   NTFY_TOPIC_BIRTHDAY: birthday alerts (default: stm-bday-qm4p7s9ke2ax1nf)
 *   NTFY_TOPIC_ADMIN: primary admin escalation channel (default: stemulus-admin-alerts)
 *
 * Request body (JSON):
 *   {
 *     channel: 'enroll' | 'contact' | 'tutor' | 'birthday' | 'admin',
 *     title:   string,
 *     message: string,
 *     priority?: 'min'|'low'|'default'|'high'|'urgent',
 *     tags?:   string,   // comma-separated ntfy emoji tags
 *     click?:  string    // URL to open on notification tap
 *   }
 */

function getCorsHeaders(event) {
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = [
    'https://stemuluskidstech.com',
    'https://www.stemuluskidstech.com',
    'https://portal.stemuluskidstech.com',
    'https://stemulus-portal-web.netlify.app'
  ];
  const isAllowed = allowed.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://stemuluskidstech.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const TOPIC_MAP = {
  enroll:          'NTFY_TOPIC_ENROLL',
  contact:         'NTFY_TOPIC_CONTACT',
  tutor:           'NTFY_TOPIC_TUTOR',
  birthday:        'NTFY_TOPIC_BIRTHDAY',
  schedule_digest: 'NTFY_TOPIC_BIRTHDAY',
  admin:           'NTFY_TOPIC_ADMIN',
};

// Fallback topic values: used when env vars are not set in Netlify dashboard
const TOPIC_FALLBACKS = {
  NTFY_TOPIC_ENROLL:   'stm-enr-lx7k9w2mq8vp4tz',
  NTFY_TOPIC_CONTACT:  'stemulus-messages-admin2026',
  NTFY_TOPIC_TUTOR:    'stm-ttr-nb3r5y6jd1cx8ws',
  NTFY_TOPIC_BIRTHDAY: 'stm-bday-qm4p7s9ke2ax1nf',
  NTFY_TOPIC_ADMIN:    'stemulus-admin-alerts',
};

/**
 * Sanitize header strings to strictly ASCII (ISO-8859-1 safe) to prevent Node fetch ERR_INVALID_CHAR
 */
function sanitizeHeader(val) {
  if (!val) return '';
  return String(val).replace(/[^\x20-\x7E]/g, ' ').trim();
}

/**
 * Robust dispatcher to ntfy.sh with automatic 401/403 recovery
 */
async function dispatchToNtfy(topic, baseHeaders, body) {
  const headers = { ...baseHeaders };
  try {
    let resp = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers,
      body,
    });

    // If unauthorized / forbidden because NTFY_TOKEN in Netlify is expired or bad,
    // automatically retry anonymously without the Authorization header.
    if ((resp.status === 401 || resp.status === 403) && headers['Authorization']) {
      console.warn(`[notify] Auth failed (${resp.status}) on ${topic}. Retrying anonymously...`);
      delete headers['Authorization'];
      resp = await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers,
        body,
      });
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[notify] ntfy error ${resp.status} for topic ${topic}:`, errText);
      return { ok: false, status: resp.status, error: errText };
    }

    return { ok: true, status: resp.status };
  } catch (err) {
    console.error(`[notify] fetch exception for topic ${topic}:`, err.message);
    return { ok: false, error: err.message };
  }
}

exports.handler = async (event) => {
  const CORS = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const rawChannel = payload.channel || (payload.topic ? 'admin' : 'admin');
  const channel = TOPIC_MAP[rawChannel] ? rawChannel : 'admin';
  const { title, message, priority = 'high', tags = '', click = '' } = payload;

  if (!message) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'message is required' }) };
  }

  const topicKey = TOPIC_MAP[channel];
  const primaryTopic = payload.topic || process.env[topicKey] || TOPIC_FALLBACKS[topicKey];
  const adminTopic = process.env.NTFY_TOPIC_ADMIN || TOPIC_FALLBACKS.NTFY_TOPIC_ADMIN;
  const token = process.env.NTFY_TOKEN;

  if (!primaryTopic) {
    console.warn(`[notify] ${topicKey} not configured: skipping`);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, skipped: true, reason: 'topic not configured' }) };
  }

  const normalizedTags = Array.isArray(tags) ? tags.join(',') : String(tags || '');

  const ntfyHeaders = {
    'Content-Type': 'text/plain',
    'Priority': sanitizeHeader(priority) || 'high',
  };

  if (token && token.trim()) {
    ntfyHeaders['Authorization'] = `Bearer ${token.trim()}`;
  }
  if (title) {
    ntfyHeaders['Title'] = sanitizeHeader(title);
  }
  if (normalizedTags) {
    ntfyHeaders['Tags'] = sanitizeHeader(normalizedTags);
  }
  if (click) {
    ntfyHeaders['Click'] = click.trim();
  }

  // 1. Dispatch to primary channel topic and dual-broadcast to admin escalation channel
  // Using Promise.allSettled so serverless container doesn't terminate before dispatches complete.
  const dispatches = [dispatchToNtfy(primaryTopic, ntfyHeaders, message)];
  if ((channel === 'enroll' || channel === 'contact' || channel === 'tutor' || channel === 'admin') && adminTopic && adminTopic !== primaryTopic) {
    dispatches.push(dispatchToNtfy(adminTopic, ntfyHeaders, message));
  }

  const results = await Promise.allSettled(dispatches);
  const anySuccess = results.some(r => r.status === 'fulfilled' && r.value && r.value.ok);

  if (!anySuccess) {
    const firstErr = results.find(r => r.status === 'fulfilled' && r.value && !r.value.ok)?.value?.error ||
                     results.find(r => r.status === 'rejected')?.reason?.message ||
                     'Failed to dispatch to ntfy.sh';
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ ok: false, error: firstErr })
    };
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, deliveredTopics: dispatches.length }) };
};
