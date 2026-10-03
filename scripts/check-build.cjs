"use strict";
const fs = require("node:fs"), path = require("node:path"), { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(?:https?:|data:)/.test(match[1]) || match[1] === "netlify-dist/") continue;
  const file = path.join(root, "netlify-dist", match[1].split("?")[0]);
  if (!fs.existsSync(file)) throw new Error("Missing asset: " + match[1]);
}
for (const file of ["netlify-dist/js/assistant.js", "netlify-dist/js/assistant-public-groq.js", "netlify-dist/js/assistant-brain.js", "netlify/functions/assistant.js", "scripts/serve.cjs"]) execFileSync(process.execPath, ["--check", path.join(root, file)]);
const out = path.join(root, "tmp/site");
fs.mkdirSync(out, { recursive:true });
// Public allowlist: neither .env nor backend sources enter the production artifact.
fs.copyFileSync(path.join(root,"index.html"), path.join(out,"index.html"));
fs.copyFileSync(path.join(root,"manifest.webmanifest"), path.join(out,"manifest.webmanifest"));
fs.cpSync(path.join(root,"netlify-dist"), path.join(out,"netlify-dist"), { recursive:true });
console.log("PASS: static production artifact and syntax (tmp/site)");
