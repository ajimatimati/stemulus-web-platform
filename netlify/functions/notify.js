/**
 * STEMulus NTFY Proxy — Netlify Function
 *
 * Keeps ntfy topic names and auth token server-side in environment variables.
 * Client JS sends a structured payload here; this function resolves the real
 * topic and forwards to ntfy.sh with authentication.
 *
 * Required Netlify environment variables:
 *   NTFY_TOKEN          — ntfy access token (from ntfy.sh account → Access Tokens)
 *   NTFY_TOPIC_ENROLL   — enrollment + booking notifications (e.g. stm-enr-lx7k9w2mq8vp4tz)
 *   NTFY_TOPIC_CONTACT  — contact form notifications (e.g. stemulus-messages-admin2026)
 *   NTFY_TOPIC_TUTOR    — tutor application notifications (e.g. stm-ttr-nb3r5y6jd1cx8ws)
 *   NTFY_TOPIC_BIRTHDAY — birthday alerts (e.g. stm-bday-qm4p7s9ke2ax1nf)
 *
 * Request body (JSON):
 *   {
 *     channel: 'enroll' | 'contact' | 'tutor' | 'birthday',
 *     title:   string,
 *     message: string,
 *     priority?: 'min'|'low'|'default'|'high'|'urgent',
 *     tags?:   string,   // comma-separated ntfy emoji tags
 *     click?:  string    // URL to open on notification tap
 *   }
 */

const CORS = {
  'Access-Control-Allow-Origin': 'https://stemuluskidstech.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOPIC_MAP = {
  enroll:          'NTFY_TOPIC_ENROLL',
  contact:         'NTFY_TOPIC_CONTACT',
  tutor:           'NTFY_TOPIC_TUTOR',
  birthday:        'NTFY_TOPIC_BIRTHDAY',
  schedule_digest: 'NTFY_TOPIC_BIRTHDAY',
};

// Fallback topic values — used when env vars are not set in Netlify dashboard
const TOPIC_FALLBACKS = {
  NTFY_TOPIC_ENROLL:   'stm-enr-lx7k9w2mq8vp4tz',
  NTFY_TOPIC_CONTACT:  'stemulus-messages-admin2026',
  NTFY_TOPIC_TUTOR:    'stm-ttr-nb3r5y6jd1cx8ws',
  NTFY_TOPIC_BIRTHDAY: 'stm-bday-qm4p7s9ke2ax1nf',
};

exports.handler = async (event) => {
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

  const { channel, title, message, priority = 'high', tags = '', click = '' } = payload;

  if (!channel || !TOPIC_MAP[channel]) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: `Unknown channel "${channel}". Must be one of: ${Object.keys(TOPIC_MAP).join(', ')}` })
    };
  }

  if (!message) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'message is required' }) };
  }

  const topicKey = TOPIC_MAP[channel];
  const topic = process.env[topicKey] || TOPIC_FALLBACKS[topicKey];
  const token = process.env.NTFY_TOKEN;

  if (!topic) {
    console.warn(`[notify] ${topicKey} not configured — skipping`);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, skipped: true, reason: 'topic not configured' }) };
  }

  const ntfyHeaders = {
    'Content-Type': 'text/plain',
    'Priority': priority,
  };

  if (token) ntfyHeaders['Authorization'] = `Bearer ${token}`;
  if (title)  ntfyHeaders['Title'] = title;
  if (tags)   ntfyHeaders['Tags'] = tags;
  if (click)  ntfyHeaders['Click'] = click;

  try {
    const resp = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: ntfyHeaders,
      body: message,
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`[notify] ntfy error ${resp.status}:`, err);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ ok: false, error: err }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('[notify] fetch failed:', err.message);
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
