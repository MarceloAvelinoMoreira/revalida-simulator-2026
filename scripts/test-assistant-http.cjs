"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), { once } = require("node:events");
test("real HTTP adapter serves app, denies secrets and provides controlled fallback response", async () => {
  // Guarantee zero paid requests in this test, irrespective of developer environment.
  const previous = process.env.GROQ_API_KEY;
  const previousXai = process.env.XAI_API_KEY;
  process.env.GROQ_API_KEY = "";
  process.env.XAI_API_KEY = "";
  const server = require("./serve.cjs");
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const base="http://127.0.0.1:" + server.address().port;
  try {
    assert.equal((await fetch(base + "/")).status,200);
    for(const url of ["/.env","/netlify/functions/assistant.js","/scripts/serve.cjs","/netlify-dist/.env"]) assert.equal((await fetch(base+url)).status,404);
    const res=await fetch(base + "/api/assistant",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify({message:"Meu desempenho",context:{},history:[]})});
    assert.equal(res.status,503); assert.equal((await res.json()).error,"ai_not_configured"); assert.equal(res.headers.get("cache-control"),"no-store");
    assert.equal((await fetch(base + "/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:"{"})).status,400);
  } finally { await new Promise(resolve => server.close(resolve)); if(previous !== undefined) process.env.GROQ_API_KEY=previous; else delete process.env.GROQ_API_KEY; if(previousXai !== undefined) process.env.XAI_API_KEY=previousXai; else delete process.env.XAI_API_KEY; }
});
