# STEMulus WhatsApp Bot Deployment & Setup Guide

This guide details how to verify the bot server locally, register your WhatsApp business number with the official Meta Cloud API, and deploy the bot server to Render.com.

---

## 1. Local Verification & Testing

### A. Environment Configuration
1. Open `whatsapp-bot/.env`.
2. Fill in your `GEMINI_API_KEY` (obtain one for free at [Google AI Studio](https://aistudio.google.com/)).
3. Set `WHATSAPP_PROVIDER=baileys` temporarily for testing with any standard WhatsApp number (no Meta registration required).

### B. Run the Server
In your terminal, navigate to the bot directory and start the server:
```bash
cd whatsapp-bot
npm install
npm run dev
```

### C. Authenticate (Baileys Mode)
1. Open your browser to `http://localhost:3000`.
2. Go to **Settings**.
3. Scan the generated QR code with your phone's WhatsApp app (**Linked Devices > Link a Device**).
4. Once connected, send a message (e.g. "hi") to your linked phone number from another device. The bot should reply using your keyword rules or the Gemini AI.

---

## 2. Migrating to Meta Cloud API (Official WhatsApp Business Platform)

> [!CAUTION]
> Once a number is registered on the Meta Cloud API, it **cannot** be logged into standard WhatsApp or WhatsApp Business mobile apps on a phone. Back up your chats first.

### Step 1: Export Chat History
1. Open your mobile WhatsApp Business app.
2. Go to **Settings > Chats > Chat Backup** and perform a full backup (use your `stemulusclubs@gmail.com` account as backed up).
3. (Optional) Export important individual chat logs to your email.

### Step 2: Delete Mobile Account
1. Go to WhatsApp Business app **Settings > Account > Delete My Account**.
2. This is a Meta requirement. If the number is active on a phone app, Meta Cloud API registration will fail.

### Step 3: Meta App Setup
Since you already have a Meta Developer App for the SEMSAS bot, you can reuse your Meta Developer account:
1. Log into the [Meta Developer Portal](https://developers.facebook.com/).
2. You can either **Create a New Business App** named `STEMulus WhatsApp Bot` or reuse your existing business settings. Creating a separate app is recommended for clarity.
3. Under your Meta App dashboard, add the **WhatsApp** product.

### Step 4: Register Phone Number
1. Navigate to **WhatsApp > API Setup** in your app menu.
2. Under "Step 5: Add a phone number", click **Add Phone Number**.
3. Enter your business name, time zone, website, and phone number (`+2347052466716`).
4. Choose **Text Message (SMS)** or **Voice Call** to verify. Complete the verification code check.

### Step 5: Get ID Credentials
Copy the following values from the **API Setup** screen to your `.env` file or Render configurations:
* **Phone Number ID** (e.g., `1092837482910`)
* **WhatsApp Business Account (WABA) ID** (e.g., `1082739482019`)

### Step 6: Permanent System User Token
Meta's default token expires after 24 hours. To generate a permanent one:
1. Go to your [Meta Business Manager Settings](https://business.facebook.com/settings/).
2. Under **Users > System Users**, add an **Admin System User** (or use your existing SEMSAS system user).
3. Click **Assigned Assets**, select your new WhatsApp Business App, and toggle **Full Control** ON.
4. Click **Generate New Token**, select your WhatsApp App, and select these scopes:
   * `whatsapp_business_messaging`
   * `whatsapp_business_management`
5. Copy the generated token immediately. Save it as `META_ACCESS_TOKEN`.

---

## 3. Webhook Callback Setup

Once your bot is deployed (see Section 4 below), configure Meta to send incoming messages to your server:
1. In the Meta Developer Portal app dashboard, go to **WhatsApp > Configuration**.
2. Next to **Webhook**, click **Edit**.
3. **Callback URL:** `https://your-bot-subdomain.onrender.com/api/webhook`
4. **Verify Token:** `stemulus_verify_token_2026` (must match the token in `.env`)
5. Click **Verify and Save**.
6. Under **Webhook Fields**, click **Manage** and subscribe to **messages**.

---

## 4. Deploying to Render.com

Render is recommended for hosting because it supports persistent disk volumes (needed to save chat histories and settings) and is always-on.

### Step A: Push to GitHub
1. Initialize a Git repo in your bot folder (if separate) or push your STEMulus codebase containing the `whatsapp-bot` folder to GitHub.

### Step B: Create Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New > Web Service**.
3. Connect your GitHub repository.
4. **Root Directory:** `whatsapp-bot` (crucial so Render only builds the bot folder).
5. **Runtime:** `Docker` (Render will automatically use the `Dockerfile` inside the root directory).
6. **Instance Type:** `Starter` ($7/month — do not use free tier because it spins down on inactivity, causing WhatsApp webhooks to timeout).

### Step C: Add Persistent Disk
1. Go to the **Disk** tab on your Render service dashboard.
2. Click **Add Disk**.
3. **Name:** `bot-data`
4. **Mount Path:** `/app/data`
5. **Size:** `1 GiB`
This ensures your AI settings, chat logs, and rules persist across server restarts.

### Step D: Configure Environment Variables
Go to the **Environment** tab on Render and add the following variables:

| Key | Value |
|---|---|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `WHATSAPP_PROVIDER` | `meta` |
| `META_ACCESS_TOKEN` | *[Your Permanent System User Token]* |
| `META_PHONE_NUMBER_ID` | *[Your Meta Phone Number ID]* |
| `META_BUSINESS_ACCOUNT_ID` | *[Your WABA ID]* |
| `META_VERIFY_TOKEN` | `stemulus_verify_token_2026` |
| `GEMINI_API_KEY` | *[Your Gemini API Key]* |
| `ADMIN_PHONE` | `2347052466716` |
| `ADMIN_DASHBOARD_PASSWORD` | *[Choose a secure dashboard password]* |
| `NOTIFY_API_KEY` | `stemulus-notify-key-2026` |
| `FIREBASE_PROJECT_ID` | `stemulus-kidstech` *(Optional: For cloud syncing data)* |
| `FIREBASE_SERVICE_ACCOUNT` | *[Optional: Service Account JSON string or file path]* |

---

## 5. Website Endpoint Update

When your bot is deployed on Render, update the website's API endpoint:
1. Open `assets/js/whatsapp-notify.js` on your website.
2. Update the fallback URL or set `window.STEMULUS_BOT_URL` in your global site config:
```javascript
window.STEMULUS_BOT_URL = 'https://your-bot-subdomain.onrender.com';
```
3. Commit and push the website changes to Netlify. Netlify will rebuild the static pages, and they will start routing booking and enrollment form submissions directly to your WhatsApp Bot!
