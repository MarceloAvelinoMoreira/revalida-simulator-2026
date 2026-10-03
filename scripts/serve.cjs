"use strict";
// Local development adapter for the SAME Netlify handler. No third-party dependencies.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
if (fs.existsSync(path.join(root, ".env"))) process.loadEnvFile(path.join(root, ".env"));
process.env.REVALIDDA_LOCAL = "true";
const { handler } = require("../netlify/functions/assistant.js");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  try {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/assistant") {
    let body = "", size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 24000) { res.writeHead(413, { "Content-Type": "application/json" }); res.end('{"error":"payload_too_large"}'); return; }
      body += chunk;
    }
    const result = await handler({ httpMethod: req.method, body, headers: { ...req.headers, "x-nf-client-connection-ip": req.socket.remoteAddress } });
    res.writeHead(result.statusCode, result.headers); res.end(result.body); return;
  }
  let relative;
  try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html"; } catch (_) { res.writeHead(400); res.end(); return; }
  // Explicit public allowlist: .env, function sources and scripts are never served.
  if (!(relative === "index.html" || relative === "manifest.webmanifest" || relative.startsWith("netlify-dist/")) || relative.split(/[\\/]/).some(part => part.startsWith(".")) || relative.includes("\\")) { res.writeHead(404); res.end(); return; }
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
  } catch (_) {
    if (!res.headersSent && !res.destroyed) {
      res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end('{"error":"temporarily_unavailable"}');
    } else if (!res.destroyed) res.destroy();
  }
});
if (require.main === module) server.listen(Number(process.env.PORT) || 8790, "127.0.0.1", () => console.log("REVALIDDA local: http://127.0.0.1:" + server.address().port));
module.exports = server;
