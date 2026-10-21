/**
 * Netlify Serverless Function: Fish Audio Neural TTS Proxy
 * Endpoint: /.netlify/functions/tts (Rewritten from /api/tts via netlify.toml)
 * Features:
 * - In-memory lambda edge caching across warm invocations
 * - Sub-millisecond response for repeat voice queries
 */

const crypto = require("crypto");

// Lambda warm instance memory cache
const memoryCache = new Map();

exports.handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, model"
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const apiKey = process.env.FISH_API_KEY || "sk-fish-Ob7JINBI5EPoxos6h-rVa1gKjoHy9uReHh58Ku47ODk";
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Fish Audio API key is not configured on Netlify environment." })
    };
  }

  try {
    let payload;
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      payload = JSON.parse(rawBody || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON request body" })
      };
    }

    if (!payload.text || typeof payload.text !== "string" || !payload.text.trim()) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Text string is required" })
      };
    }

    const cleanText = payload.text.replace(/\s+/g, " ").trim();
    const voiceId = payload.reference_id || "933563129e564b19a115bedd57b7406a";
    const model = payload.model || "s2.1-pro-free";
    const format = payload.format || "mp3";

    // 1. Check in-memory lambda cache
    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify({ text: cleanText, voice: voiceId, model, format }))
      .digest("hex");

    if (memoryCache.has(cacheKey)) {
      const cachedBase64 = memoryCache.get(cacheKey);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "X-VITH-Cache": "HIT",
          "X-VITH-Proxy": "Netlify-Serverless"
        },
        body: cachedBase64,
        isBase64Encoded: true
      };
    }

    // 2. Fetch from Fish Audio API
    const fishRes = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "model": model
      },
      body: JSON.stringify({
        text: cleanText,
        reference_id: voiceId,
        format: format
      })
    });

    if (!fishRes.ok) {
      const errText = await fishRes.text();
      console.error(`[Netlify TTS] Fish Audio HTTP ${fishRes.status}: ${errText}`);
      return {
        statusCode: fishRes.status,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Fish Audio returned HTTP ${fishRes.status}` })
      };
    }

    const arrayBuffer = await fishRes.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Cache in warm memory (keep max 100 items to conserve memory)
    if (memoryCache.size >= 100) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    memoryCache.set(cacheKey, base64Audio);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-VITH-Cache": "MISS",
        "X-VITH-Proxy": "Netlify-Serverless"
      },
      body: base64Audio,
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("[Netlify TTS Error]", err);
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to synthesize speech via Fish Audio: " + err.message })
    };
  }
};
