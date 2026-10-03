"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
function setup(fetchImpl) {
  const elements={};
  for(const id of ["assistant-panel","assistant-launcher","assistant-input","assistant-accuracy","assistant-answered","assistant-streak","assistant-messages","assistant-status"]) elements[id]={ attrs:{},children:[],classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;},appendChild(n){this.children.push(n);} };
  const document={getElementById:id => elements[id],createElement:() => ({}),addEventListener(){}};
  const context={document,window:{REVALIDDA_ASSISTANT_CONFIG:{endpoint:"/api/assistant"},location:{origin:"http://127.0.0.1:8790"},setTimeout,clearTimeout},RevalidaStorage:{loadSession:() => ({correct:3,wrong:1,currentIndex:99,questions:Array(100).fill({id:"x"})})},QuestionRepository:{count:() => 1300},URL,AbortController,fetch:fetchImpl};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,"../netlify-dist/js/assistant.js"),"utf8"),context); return {context,elements};
}
test("same panel, keyboard-compatible ARIA toggle, actual correct+wrong metrics", () => {
  const {context,elements}=setup(); assert.equal(context.assistantStats().answered,4); assert.equal(context.assistantStats().accuracy,"75%");
  for(let i=0;i<30;i++) { context.toggleAssistant(true); assert.equal(elements["assistant-launcher"].attrs["aria-expanded"],"true"); assert.equal(elements["assistant-panel"].inert,false); context.toggleAssistant(false); assert.equal(elements["assistant-panel"].attrs["aria-hidden"],"true"); assert.equal(elements["assistant-panel"].inert,true); }
});
test("all quick actions, sanitized context, bounded history, no provider direct calls", async () => {
  const requests=[];
  const {context,elements}=setup(async (url,options) => {requests.push(JSON.parse(options.body));assert.equal(url,"http://127.0.0.1:8790/api/assistant"); assert.equal(options.headers.Authorization,undefined); return {ok:true,json:async () => ({reply:"Resposta de teste",stats:{answered:99999}})};});
  for(const text of ["Como está meu desempenho?","Em que devo melhorar?","Me dê uma dica rápida para a próxima questão.",...Array(8).fill("Olá")]) await context.askAssistant(text);
  assert.equal(requests[0].context.answered,4);assert.equal(requests[0].context.session,undefined); assert.deepEqual(requests[2].context,{});
  assert.equal(requests.at(-1).history.length,8);assert.equal(elements["assistant-answered"].textContent,4);
});
test("missing backend / invalid provider response / 429 / timeout preserve local fallback", async () => {
  for(const implementation of [async () => ({ok:false,status:503}),async () => ({ok:true,json:async () => ({})}),async () => ({ok:false,status:429}),async () => {throw new Error("timeout");}]) {
    const {context,elements}=setup(implementation);await context.askAssistant("Como está meu desempenho?"); assert.match(elements["assistant-messages"].children.at(-1).innerHTML,/4 questões/);assert.equal(elements["assistant-panel"].attrs["aria-busy"],"false");
  }
});
test("missing session reports insufficient data, messages are HTML-escaped", () => {
  const {context}=setup();context.RevalidaStorage.loadSession=() => null;
  assert.equal(context.assistantStats().answered,"—");assert.match(context.fallbackAssistantReply("desempenho"),/Não há dados/);
  assert.equal(context.assistantEscape('<img onerror="x">'),"&lt;img onerror=&quot;x&quot;&gt;");
});
