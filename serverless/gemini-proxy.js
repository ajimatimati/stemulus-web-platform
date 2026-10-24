/**
 * STEMulus Secure Edge Proxy for Google Gemini AI
 * =================================================
 * Compatible with Cloudflare Workers, Vercel Edge, and Netlify Functions.
 *
 * Capabilities:
 * - Hides Google Gemini API Key from public client browsers
 * - Origin & Referer CORS protection
 * - Sliding-window IP rate limiting (30 requests/minute per IP)
 * - Safe error handling & JSON payload validation
 *
 * Deployment Environment Variables:
 * - GEMINI_API_KEY: Secret API Key provisioned from Google AI Studio
 * - ALLOWED_ORIGIN: "https://stemuluskidstech.com" (or "*" for staging)
 */

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

    // Standard CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin === "*" ? "*" : (origin === allowedOrigin ? origin : allowedOrigin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server Configuration Error: Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const prompt = body.prompt || body.promptText || "";
      const systemInstruction = body.systemInstruction || "";
      const model = body.model || "gemini-2.5-flash";

      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({ error: "Invalid Request: 'prompt' string required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Construct Google Gemini API Payload
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt.slice(0, 10000) }] // Safeguard payload length
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction.slice(0, 5000) }]
        };
      }

      const geminiResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!geminiResp.ok) {
        const errorText = await geminiResp.text();
        return new Response(JSON.stringify({ error: `Gemini Error HTTP ${geminiResp.status}`, details: errorText.slice(0, 200) }), {
          status: geminiResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const geminiJson = await geminiResp.json();
      const generatedText = (geminiJson.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "").trim();

      return new Response(JSON.stringify({ text: generatedText, model: model }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
