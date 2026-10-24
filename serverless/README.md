# STEMulus Gemini AI Edge Proxy Deployment Guide

This directory contains the production-ready Edge Serverless Proxy for Google Gemini AI. It completely eliminates exposing your `GEMINI_API_KEY` in client-side browser JavaScript, enforces CORS origin restrictions, and adds IP-based rate limiting.

---

## Option A: Deploy to Cloudflare Workers (Recommended, 100% Free)

Cloudflare Workers provides 100,000 free requests per day with sub-30ms global latency.

### Method 1: Using the Command Line (Wrangler)
1. Open your terminal in this repository.
2. Run the deployment command:
   ```bash
   npx wrangler deploy serverless/gemini-proxy.js --name stemulus-gemini-proxy
   ```
3. Securely set your Gemini API secret (never committed to git):
   ```bash
   npx wrangler secret put GEMINI_API_KEY --name stemulus-gemini-proxy
   ```
   *(Paste your Google Gemini API Key when prompted)*

4. Copy the resulting URL (e.g., `https://stemulus-gemini-proxy.<your-subdomain>.workers.dev`).
5. Open [`assets/js/gemini-config.js`](../assets/js/gemini-config.js) and set:
   ```javascript
   window.STEMULUS_CONFIG.GEMINI_PROXY_URL = "https://stemulus-gemini-proxy.<your-subdomain>.workers.dev";
   ```

### Method 2: Zero-CLI Web Dashboard
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Create Worker**.
2. Name it `stemulus-gemini-proxy` and click **Deploy**.
3. Click **Edit code** and paste the entire contents of [`serverless/gemini-proxy.js`](./gemini-proxy.js).
4. Click **Deploy**.
5. Go to **Settings** → **Variables and Secrets** → **Add** under *Environment Variables*:
   - Variable name: `GEMINI_API_KEY`
   - Value: *(Your Gemini API Key)*
   - Type: **Secret** / **Encrypt**
6. Copy your Worker URL and add it to `assets/js/gemini-config.js`.

---

## Option B: Deploy to Vercel (Automatic Zero-Config)

If your website is hosted on Vercel or linked to GitHub:
1. An Edge Function has already been added at [`api/mulu-chat.js`](../api/mulu-chat.js).
2. Simply push your changes to GitHub or run:
   ```bash
   vercel
   ```
3. In your **Vercel Project Settings** → **Environment Variables**:
   - Key: `GEMINI_API_KEY`
   - Value: *(Your Gemini API Key)*
4. The client will automatically call `/api/mulu-chat` in production without any extra configuration!

---

## Verification Test (cURL)

Test your deployed proxy endpoint from any terminal:
```bash
curl -X POST "https://stemulus-gemini-proxy.<your-subdomain>.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello from Mulu Mascot!"}'
```
Expected response:
```json
{
  "text": "Hoo-hoo! Hello there from Mulu, the wise mascot of STEMulus Kids Tech! 🦉🚀",
  "model": "gemini-2.5-flash"
}
```
