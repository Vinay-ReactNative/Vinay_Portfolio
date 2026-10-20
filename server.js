/**
 * VITH Local Dev Server & Fish Audio Proxy
 * Serves portfolio static files and proxies /api/tts to api.fish.audio
 * Run with: node server.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const FISH_API_KEY = process.env.FISH_API_KEY;

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

  // ── Fish Audio TTS Proxy ──────────────────────────────────────────────
  if (req.url === "/api/tts" && req.method === "POST") {
    if (!FISH_API_KEY) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Fish Audio is not configured. Set FISH_API_KEY on the server." }));
      return;
    }

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

      if (!payload || typeof payload.text !== "string" || !payload.text.trim() || typeof payload.reference_id !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request must include non-empty text and a reference_id." }));
        return;
      }

      const fishRes = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + FISH_API_KEY,
          "Content-Type": "application/json",
          "model": "s2-pro"
        },
        body: JSON.stringify({
          text: payload.text,
          reference_id: payload.reference_id,
          format: payload.format || "mp3"
        })
      });

      const responseBody = Buffer.from(await fishRes.arrayBuffer());
      const contentType = fishRes.headers.get("content-type") || "audio/mpeg";
      res.writeHead(fishRes.status, { "Content-Type": contentType });
      res.end(responseBody);

      if (!fishRes.ok) {
        console.error("[VITH TTS] Fish Audio returned HTTP " + fishRes.status + ": " + responseBody.toString("utf8").slice(0, 1000));
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

  // Static file server
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

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  VITH Stark-Tech Laboratory Online`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  TTS Proxy: http://localhost:${PORT}/api/tts`);
  console.log(`=================================================\n`);
});
