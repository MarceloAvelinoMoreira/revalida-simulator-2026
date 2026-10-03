"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync(require("node:path").join(__dirname,"../netlify-dist/js/assistant-public-groq.js"),"utf8").replace(/gsk_[A-Za-z0-9]{35,}/g,"test-credential");
function setup(fetch){const context={window:{},fetch};vm.runInNewContext(source,context);return context.window.RevaliddaPublicAI;}
test("public adapter calls only Groq with bounded history and output",async()=>{
 let request;const api=setup(async(url,options)=>{request={url,options};return {ok:true,json:async()=>({choices:[{message:{content:"OK"}}]})};});
 assert.equal((await api.ask({message:"Teste",history:Array(12).fill({role:"user",content:"Olá"}),context:{}},undefined)).reply,"OK");
 assert.equal(request.url,"https://api.groq.com/openai/v1/chat/completions");assert.equal(request.options.headers.Authorization,"Bearer test-credential");
 const body=JSON.parse(request.options.body);assert.equal(body.messages.length,10);assert.equal(body.max_completion_tokens,800);
});
test("public adapter sanitizes errors, rate limits and echoed credential",async()=>{
 const payload={message:"Teste",history:[],context:{}};
 await assert.rejects(setup(async()=>({ok:false,status:429})).ask(payload),/rate_limit/);
 await assert.rejects(setup(async()=>({ok:false,status:401})).ask(payload),/unavailable/);
 await assert.rejects(setup(async()=>({ok:true,json:async()=>({choices:[{message:{content:"test-credential"}}]})})).ask(payload),/unavailable/);
});
