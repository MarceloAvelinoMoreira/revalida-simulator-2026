"use strict";
const fs = require("node:fs"), path = require("node:path"), {execFileSync} = require("node:child_process");
const root = path.resolve(__dirname,"..");
const credential = /(?:xai-[A-Za-z0-9_-]{30,}|gsk_[A-Za-z0-9]{35,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,})/;
let files = 0;
function scan(dir) {
  for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if ([".git","node_modules",".netlify"].includes(e.name) || (e.name.startsWith(".env") && e.name !== ".env.example")) continue;
    const file=path.join(dir,e.name);
    if(e.isDirectory()) scan(file);
    else if(/\.(?:js|cjs|json|html|css|md|toml|map)$/.test(e.name) || e.name === ".env.example") {
      files++;
      if(credential.test(fs.readFileSync(file,"utf8"))) throw new Error("Credential-like value detected in " + path.relative(root,file));
    }
  }
}
scan(root);
const frontend=fs.readFileSync(path.join(root,"netlify-dist/js/assistant.js"),"utf8");
if(/Authorization|Bearer|api\.groq\.com|api\.x\.ai|apiKey|systemPrompt/.test(frontend)) throw new Error("Provider/auth configuration in frontend");
const history=execFileSync("git",["log","--all","--format=%h","--name-only","-G","(xai-[A-Za-z0-9_-]{30,}|gsk_[A-Za-z0-9]{35,}|sk-(proj-)?[A-Za-z0-9_-]{30,})"],{cwd:root,encoding:"utf8"});
if(history.trim()) { console.log("WARNING: credential-like value in Git history (commit/file only):\n"+history);process.exitCode=1; }
const ignored=execFileSync("git",["check-ignore","--stdin"],{cwd:root,encoding:"utf8",input:".env\n.env.production\n"});
if(ignored.trim().split(/\r?\n/).length!==2) throw new Error("Secret environment files are not ignored");
const changed=execFileSync("git",["diff","--name-only"],{cwd:root,encoding:"utf8"}).trim().split(/\r?\n/);
if(changed.some(f => /(?:questions(?:-.*)?\.js|\/data\/|\/assets\/|storage\.js|simulator\.js|review\.js|rapid\.js)/.test(f))) throw new Error("Protected exam/study files changed");
console.log(JSON.stringify({result:process.exitCode ? "FAIL" : "PASS",scannedTextFiles:files,envIgnored:true,historyCredentialPatterns:!!history.trim(),protectedBanksUnchanged:true}));
