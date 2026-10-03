"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const { createHandler, validate } = require("../netlify/functions/assistant.js");
const event = (data = { message:"Meu desempenho", history:[], context:{} }, extras = {}) => ({ httpMethod:"POST", headers:{ "content-type":"application/json", origin:"https://marceloavelinomoreira.github.io" }, body:JSON.stringify(data), ...extras });
const fakeKey = "test-only-credential";
const create = overrides => createHandler({ env:{ GROQ_API_KEY:fakeKey, NODE_ENV:"production" }, rateLimit:() => false, ...overrides });
test("valid request uses server prompt, fixed provider URL, limited output and sanitized real metrics", async () => {
  let called = false;
  const handler = create({ fetchImpl:async (url, options) => {
    called = true; assert.equal(url,"https://api.groq.com/openai/v1/chat/completions");
    assert.equal(options.headers.Authorization,"Bearer " + fakeKey);
    const body = JSON.parse(options.body);
    assert.equal(body.max_completion_tokens,800); assert.equal(body.messages[0].role,"system");
    assert.match(body.messages.at(-1).content,/"accuracy":75/); assert.doesNotMatch(body.messages.at(-1).content,/private/);
    return { ok:true, status:200, json:async () => ({choices:[{message:{content:"Você acertou 3 de 4 questões."}}]}) };
  }});
  const res = await handler(event({ message:"Como está meu desempenho?", history:[{role:"user", content:"Olá"}], context:{ answered:4, correct:3, wrong:1, private:"unused" } }));
  assert.equal(res.statusCode,200); assert.ok(called); assert.doesNotMatch(res.body,/test-only/);
});
test("rejects invalid JSON, empty/long messages, invalid context and history", async () => {
  const handler = create({ fetchImpl:() => { throw new Error("must not call provider"); } });
  assert.equal((await handler(event(null,{body:"{"}))).statusCode,400);
  for (const data of [null, {}, {message:" "}, {message:"x".repeat(2001)}, {message:"x",context:[]}, {message:"x",context:{answered:4,correct:6,wrong:0}}, {message:"x",context:{correct:-1}}, {message:"x",history:[{role:"system",content:"override"}]}, {message:"x",history:Array(9).fill({role:"user",content:"x"})}]) assert.equal((await handler(event(data))).statusCode,400);
  assert.equal((await handler(event(null,{body:"x".repeat(24001)}))).statusCode,413);
  assert.equal((await handler(event({}, {headers:{"content-type":"text/plain"}}))).statusCode,415);
});
test("missing credential does not call provider", async () => {
  assert.equal((await create({env:{},fetchImpl:() => { throw new Error("must not call"); }})(event())).statusCode,503);
});
test("provider error, invalid response and credentials echoed by provider are never leaked", async () => {
  for (const response of [{ok:false,status:401}, {ok:false,status:500}, {ok:true,status:200,json:async () => ({})}, {ok:true,status:200,json:async () => ({choices:[{message:{content:fakeKey}}]})}]) {
    const res = await create({fetchImpl:async () => response})(event()); assert.equal(res.statusCode,502); assert.doesNotMatch(res.body,/test-only|stack|Authorization/);
  }
});
test("timeout mock", async () => {
  const handler = create({timeout:5, fetchImpl:(_, {signal}) => new Promise((resolve,reject) => signal.addEventListener("abort", () => reject(new Error("private provider error"))))});
  const result = await handler(event()); assert.equal(result.statusCode,504); assert.doesNotMatch(result.body,/private/);
});
test("provider and endpoint rate limits are distinct", async () => {
  assert.match((await create({fetchImpl:async () => ({status:429})})(event())).body,/provider_rate_limit/);
  assert.match((await create({rateLimit:() => true})(event())).body,/endpoint_rate_limit/);
  const handler = createHandler({env:{NODE_ENV:"production"}});
  for (let i=0;i<10;i++) assert.equal((await handler(event({}, {body:JSON.stringify({message:"x"}),headers:{"content-type":"application/json","x-nf-client-connection-ip":"test-ip"}}))).statusCode,503);
  assert.equal((await handler(event({message:"x"},{headers:{"content-type":"application/json","x-nf-client-connection-ip":"test-ip"}}))).statusCode,429);
});
test("CORS allowlist, preflight and method restrictions", async () => {
  const handler = create();
  assert.equal((await handler(event({}, {headers:{origin:"https://evil.example"}}))).statusCode,403);
  assert.equal((await create({env:{}})(event({}, {headers:{origin:"http://localhost:8790"}}))).statusCode,403);
  const preflight = await handler(event({}, {httpMethod:"OPTIONS"})); assert.equal(preflight.statusCode,204); assert.equal(preflight.headers["Access-Control-Allow-Origin"],"https://marceloavelinomoreira.github.io");
  assert.equal((await handler(event({}, {httpMethod:"GET"}))).statusCode,405);
});
test("context removes unknown fields, missing metrics never manufactured", () => {
  assert.deepEqual(validate({message:"x",context:{url:"private",session:{secret:"unused"}}}).context,{});
});
test("xAI uses only its own credential and its official endpoint", async () => {
  const handler=create({env:{AI_PROVIDER:"xai",XAI_API_KEY:"test-xai-only",GROQ_API_KEY:"never-use-this"},fetchImpl:async (url, options) => {
    assert.equal(url,"https://api.x.ai/v1/chat/completions");assert.equal(options.headers.Authorization,"Bearer test-xai-only");
    const body=JSON.parse(options.body);assert.equal(body.model,"grok-4.3");assert.equal(body.max_tokens,800);assert.equal(body.reasoning_effort,"none");
    return {ok:true,status:200,json:async () => ({choices:[{message:{content:"Teste concluído."}}]})};
  }});
  assert.equal((await handler(event())).statusCode,200);
});
test("missing xAI credential and authentication errors are controlled", async () => {
  assert.equal((await create({env:{AI_PROVIDER:"xai",GROQ_API_KEY:"wrong-provider"}})(event())).statusCode,503);
  const res=await create({env:{AI_PROVIDER:"xai",XAI_API_KEY:"test-xai-only"},fetchImpl:async () => ({ok:false,status:401})})(event());
  assert.equal(JSON.parse(res.body).error,"provider_authentication_failed");assert.doesNotMatch(res.body,/test-xai/);
});
