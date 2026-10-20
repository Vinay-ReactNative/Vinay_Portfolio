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
const FISH_API_KEY = process.env.FISH_API_KEY || "sk-fish-Ob7JINBI5EPoxos6h-rVa1gKjoHy9uReHh58Ku47ODk";

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
    let bodyData = "";
    req.on("data", chunk => { bodyData += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyData || "{}");
        const fishRes = await fetch("https://api.fish.audio/v1/tts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FISH_API_KEY}`,
            "Content-Type": "application/json",
            "model": "s2.1-pro"
          },
          body: JSON.stringify(payload)
        });

        res.writeHead(fishRes.status, {
          "Content-Type": fishRes.headers.get("content-type") || "audio/mpeg",
          "Access-Control-Allow-Origin": "*"
        });

        if (!fishRes.ok) {
          const errText = await fishRes.text();
          res.end(errText);
          return;
        }

        const arrayBuf = await fishRes.arrayBuffer();
        res.end(Buffer.from(arrayBuf));
      } catch (err) {
        console.error("[VITH Proxy Error]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Static File Server ────────────────────────────────────────────────
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
