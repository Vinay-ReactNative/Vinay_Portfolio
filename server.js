/**
 * VITH Local Dev Server & High-Performance Fish Audio Proxy
 * Features:
 * - Persistent disk & in-memory caching (.tts-cache/) for sub-millisecond repeat queries
 * - Automatic background pre-warming of intro and key voice responses
 * - Low-latency streaming proxy to Fish Audio S2.1 Pro Free
 * Run with: node server.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const FISH_API_KEY = process.env.FISH_API_KEY || "sk-fish-Ob7JINBI5EPoxos6h-rVa1gKjoHy9uReHh58Ku47ODk";
const CACHE_DIR = path.join(ROOT, ".tts-cache");

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[VITH Cache] Could not create cache directory:", e.message);
}

// In-memory buffer cache for instant zero-disk-latency lookups
const memoryCache = new Map();

function getCacheKey(text, voiceId, model, format) {
  const norm = text.replace(/\s+/g, " ").trim();
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ text: norm, voice: voiceId, model: model || "s2.1-pro-free", format: format || "mp3" }))
    .digest("hex");
}

function getCachedAudio(cacheKey) {
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }
  const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
  if (fs.existsSync(filePath)) {
    try {
      const buf = fs.readFileSync(filePath);
      memoryCache.set(cacheKey, buf);
      return buf;
    } catch (e) {
      console.warn("[VITH Cache] Read error for", cacheKey, e.message);
    }
  }
  return null;
}

function saveCachedAudio(cacheKey, buffer) {
  memoryCache.set(cacheKey, buffer);
  const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
  fs.writeFile(filePath, buffer, (err) => {
    if (err) console.warn("[VITH Cache] Write error for", cacheKey, err.message);
  });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, model");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Fish Audio TTS Proxy with Cache ──────────────────────────────────────
  if (req.url === "/api/tts" && req.method === "POST") {
    if (!FISH_API_KEY) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Fish Audio is not configured. Set FISH_API_KEY on the server." }));
      return;
    }

    const t0 = Date.now();

    try {
      const chunks = [];
      let bodySize = 0;
      for await (const chunk of req) {
        bodySize += chunk.length;
        if (bodySize > 1024 * 1024) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "TTS request body exceeds the 1 MB limit." }));
          return;
        }
        chunks.push(chunk);
      }

      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request body must be valid JSON." }));
        return;
      }

      if (!payload || typeof payload.text !== "string" || !payload.text.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request must include non-empty text." }));
        return;
      }

      const voiceId = payload.reference_id || "933563129e564b19a115bedd57b7406a";
      const model = payload.model || "s2.1-pro-free";
      const format = payload.format || "mp3";
      const cleanText = payload.text.replace(/\s+/g, " ").trim();

      // Check Cache First
      const cacheKey = getCacheKey(cleanText, voiceId, model, format);
      const cached = getCachedAudio(cacheKey);

      if (cached) {
        const elapsed = Date.now() - t0;
        console.log(`[VITH TTS CACHE HIT] (${elapsed}ms) "${cleanText.slice(0, 45)}..."`);
        res.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Length": cached.length,
          "X-VITH-Cache": "HIT",
          "Cache-Control": "public, max-age=86400"
        });
        res.end(cached);
        return;
      }

      // Cache MISS: Fetch from Fish Audio API
      console.log(`[VITH TTS CACHE MISS] Generating (${cleanText.length} chars): "${cleanText.slice(0, 45)}..."`);

      const fishRes = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + FISH_API_KEY,
          "Content-Type": "application/json",
          "model": model
        },
        body: JSON.stringify({
          text: cleanText,
          reference_id: voiceId,
          format: format
        })
      });

      const responseBody = Buffer.from(await fishRes.arrayBuffer());
      const contentType = fishRes.headers.get("content-type") || "audio/mpeg";

      if (fishRes.ok) {
        const elapsed = Date.now() - t0;
        console.log(`[VITH TTS Synthesized & Cached] (${elapsed}ms, ${responseBody.length} bytes): "${cleanText.slice(0, 45)}..."`);
        saveCachedAudio(cacheKey, responseBody);

        res.writeHead(200, {
          "Content-Type": contentType,
          "Content-Length": responseBody.length,
          "X-VITH-Cache": "MISS",
          "Cache-Control": "public, max-age=86400"
        });
        res.end(responseBody);
      } else {
        console.error(`[VITH TTS Error] Fish Audio HTTP ${fishRes.status}: ${responseBody.toString("utf8").slice(0, 500)}`);
        res.writeHead(fishRes.status, { "Content-Type": contentType });
        res.end(responseBody);
      }
    } catch (err) {
      console.error("[VITH TTS] Proxy request failed:", err);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unable to reach Fish Audio from the server." }));
      }
    }
    return;
  }

  // ── Static file server ──────────────────────────────────────────────────
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.join(ROOT, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ── Background Cache Pre-warmer ──────────────────────────────────────────
async function prewarmCache() {
  const voiceId = "933563129e564b19a115bedd57b7406a";
  const model = "s2.1-pro-free";

  try {
    const kbPath = path.join(ROOT, "knowledge-base.js");
    if (!fs.existsSync(kbPath)) return;
    const content = fs.readFileSync(kbPath, "utf8");

    const introMatch = content.match(/introScript:\s*`([\s\S]*?)`/);
    const prewarmTexts = [];

    if (introMatch && introMatch[1]) {
      const cleanIntro = introMatch[1]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[\r\n]+/g, " ")
        .replace(/\bVITH\b/g, "Vith")
        .replace(/\bEDITH\b/g, "Edith")
        .replace(/\bVINXO\b/g, "Vinxo")
        .replace(/\bAI\b/g, "A.I.")
        .replace(/\s+/g, " ")
        .trim();
      prewarmTexts.push(cleanIntro);
    }

    // Common greetings
    prewarmTexts.push("Vith systems online. Good to have you here.");
    prewarmTexts.push("Hello. I am Vith. How can I assist you today?");

    console.log(`[VITH Pre-warm] Checking ${prewarmTexts.length} core audio scripts...`);

    for (const text of prewarmTexts) {
      const cacheKey = getCacheKey(text, voiceId, model, "mp3");
      const cached = getCachedAudio(cacheKey);
      if (cached) {
        console.log(`[VITH Pre-warm: READY] "${text.slice(0, 40)}..." (in cache)`);
      } else {
        console.log(`[VITH Pre-warm: WARMING] "${text.slice(0, 40)}..."`);
        try {
          const res = await fetch("https://api.fish.audio/v1/tts", {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + FISH_API_KEY,
              "Content-Type": "application/json",
              "model": model
            },
            body: JSON.stringify({
              text: text,
              reference_id: voiceId,
              format: "mp3"
            })
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            saveCachedAudio(cacheKey, buf);
            console.log(`[VITH Pre-warm: SUCCESS] Cached ${buf.length} bytes for: "${text.slice(0, 40)}..."`);
          } else {
            console.warn(`[VITH Pre-warm: FAILED] HTTP ${res.status}`);
          }
        } catch (e) {
          console.warn("[VITH Pre-warm Error]", e.message);
        }
        // Small delay between pre-warm items to avoid rate limits
        await new Promise(r => setTimeout(r, 600));
      }
    }
  } catch (err) {
    console.warn("[VITH Pre-warm]", err.message);
  }
}

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  VITH Stark-Tech Laboratory Online`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  TTS Proxy:   http://localhost:${PORT}/api/tts`);
  console.log(`  Cache Dir:   ${CACHE_DIR}`);
  console.log(`=================================================\n`);

  // Run cache pre-warming in background after server binds
  setTimeout(prewarmCache, 500);
});
