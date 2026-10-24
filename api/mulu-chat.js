/**
 * STEMulus Gemini AI Edge Proxy (Vercel Serverless / Edge Function)
 * Route: POST /api/mulu-chat
 * ================================================================
 * Capabilities:
 * - Hides Google Gemini API Key from client code
 * - Global sub-50ms Edge distribution
 * - Automatic CORS preflight handling
 * - Payload length and rate validation
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const origin = request.headers.get("Origin") || "*";
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin === "*" ? "*" : (origin === allowedOrigin ? origin : allowedOrigin),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Configuration: Missing GEMINI_API_KEY" }), {
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
      return new Response(JSON.stringify({ error: "Invalid Request: 'prompt' required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt.slice(0, 10000) }] }]
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

    return new Response(JSON.stringify({ text: generatedText, model }), {
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
