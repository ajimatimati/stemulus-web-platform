import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const HISTORY_FILE = path.join(DATA_DIR, 'chat_history.json');
const PLAYBOOK_FILE = path.join(DATA_DIR, 'playbook.txt');

let useFirestore = false;
let db = null;

if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const saValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      let serviceAccount;
      if (saValue.startsWith('{')) {
        serviceAccount = JSON.parse(saValue);
      } else {
        const filePath = path.resolve(saValue);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        serviceAccount = JSON.parse(fileContent);
      }
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    db = admin.firestore();
    useFirestore = true;
    console.log('Firebase Firestore successfully initialized for WhatsApp Bot.');
  } catch (err) {
    console.error('Failed to initialize Firebase Firestore, falling back to local files.', err);
  }
}

export async function getRules() {
  if (useFirestore) {
    const doc = await db.collection('whatsapp_bot').doc('rules').get();
    return doc.exists ? (doc.data().rules || []) : [];
  }
  return JSON.parse(fs.readFileSync(RULES_FILE, 'utf-8'));
}

export async function saveRules(rules) {
  if (useFirestore) {
    await db.collection('whatsapp_bot').doc('rules').set({ rules });
  }
  await fs.promises.writeFile(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
}

export async function getSettings() {
  if (useFirestore) {
    const doc = await db.collection('whatsapp_bot').doc('settings').get();
    return doc.exists ? doc.data() : {};
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

export async function saveSettings(settings) {
  if (useFirestore) {
    await db.collection('whatsapp_bot').doc('settings').set(settings);
  }
  await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function getPlaybook() {
  if (useFirestore) {
    const doc = await db.collection('whatsapp_bot').doc('playbook').get();
    return doc.exists ? (doc.data().content || '') : '';
  }
  return fs.readFileSync(PLAYBOOK_FILE, 'utf-8');
}

export async function savePlaybook(content) {
  if (useFirestore) {
    await db.collection('whatsapp_bot').doc('playbook').set({ content });
  }
  await fs.promises.writeFile(PLAYBOOK_FILE, content, 'utf-8');
}

export async function getChatHistory(jid) {
  if (useFirestore) {
    const doc = await db.collection('whatsapp_histories').doc(jid).get();
    return doc.exists ? (doc.data().messages || []) : [];
  }
  const allHistories = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  return allHistories[jid] || [];
}

export async function saveChatHistory(jid, messages) {
  if (useFirestore) {
    await db.collection('whatsapp_histories').doc(jid).set({ messages });
  }
  // Even if using firestore, update local file as backup (optional, but good for local debugging)
  let allHistories = {};
  try {
    allHistories = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch(e) {}
  allHistories[jid] = messages;
  await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(allHistories, null, 2), 'utf-8');
}

export async function getAllChatHistoriesPreview() {
  if (useFirestore) {
    const snapshot = await db.collection('whatsapp_histories').get();
    const previews = {};
    snapshot.forEach(doc => {
      previews[doc.id] = doc.data().messages || [];
    });
    return previews;
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}
