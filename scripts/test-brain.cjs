"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
const root = path.resolve(__dirname,"..");
function node() { return { attrs:{},style:{},children:[],setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},appendChild(n){this.children.push(n);},addEventListener(k,v){this[k]=v;} }; }
test("48 neurons, dense local connections, clipping, one RAF, visibility, hover, burst and reduced motion", () => {
  const launcher=node(), network=node(), svg=node(), listeners={}, active=new Map(); let id=0;
  launcher.querySelector=() => svg;
  const motion={matches:false,addEventListener(k,f){this[k]=f;}};
  const document={hidden:false,getElementById:id => id === "assistant-launcher" ? launcher : network,createElementNS:() => node(),addEventListener(k,f){listeners[k]=f;}};
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(root,"netlify-dist/js/assistant-brain.js"),"utf8"),{document,window,matchMedia:() => motion,performance:{now:() => 0},requestAnimationFrame:f => {active.set(++id,f);return id;},cancelAnimationFrame:i => active.delete(i),Float32Array,Math});
  assert.equal(active.size,1); assert.equal(network.children.filter(n => n.attrs["data-neuron"]==="true").length,48);
  const lines=network.children.filter(n => n.attrs.x1 !== undefined);
  assert.ok(lines.length >= 100 && lines.length < 150);
  assert.ok(lines.every(n => Math.hypot(n.attrs.x2-n.attrs.x1,n.attrs.y2-n.attrs.y1)<35));
  for(let i=0;i<30;i++){ window.RevaliddaBrain.burst(); assert.equal(active.size,1); }
  launcher.mouseenter(); const tick=[...active.values()][0]; active.clear(); tick(16); assert.equal(active.size,1); assert.match(svg.style.transform,/scale/); launcher.mouseleave();
  document.hidden=true; listeners.visibilitychange(); assert.equal(active.size,0);
  document.hidden=false; listeners.visibilitychange(); assert.equal(active.size,1); listeners.visibilitychange(); assert.equal(active.size,1);
  motion.matches=true; motion.change(); assert.equal(active.size,0); assert.equal(svg.style.transform,""); window.RevaliddaBrain.burst(); assert.equal(active.size,0);
  motion.matches=false; motion.change(); assert.equal(active.size,1);
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(html,/clip-path="url\(#brain-clip\)"/); assert.doesNotMatch(html,/class="assistant-mascot|<img src="assets\/app-icon-robot/);
  assert.equal((html.match(/id="assistant-panel"/g)||[]).length,1);
});
test("same launcher moves above the home brand and returns to study without duplicate RAF", () => {
  const launcher=node(), network=node(), svg=node(), home=node(), slot=node(), page=node();
  home.style.display="flex";
  launcher.querySelector=() => svg;
  launcher.classList={toggle(k,v){launcher.attrs[k]=v;}};
  for(const parent of [slot,page]) parent.appendChild=n => {n.parentElement=parent;};
  let observer, rafCount=0;
  const document={getElementById:id => ({"assistant-launcher":launcher,"brain-network":network,"screen-home":home,"assistant-brain-home":slot,"page-simulado":page})[id],createElementNS:() => node(),addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,"netlify-dist/js/assistant-brain.js"),"utf8"),{document,window:{},getComputedStyle:n => n.style,MutationObserver:class{constructor(f){observer=f;}observe(){}},matchMedia:() => ({matches:false,addEventListener(){}}),performance:{now:() => 0},requestAnimationFrame:() => ++rafCount,cancelAnimationFrame(){},Float32Array,Math});
  assert.equal(launcher.parentElement,slot);assert.equal(launcher.attrs["is-home"],true);
  for(let i=0;i<10;i++){
    home.style.display="none";observer();assert.equal(launcher.parentElement,page);assert.equal(launcher.attrs["is-home"],false);
    home.style.display="flex";observer();assert.equal(launcher.parentElement,slot);
  }
  assert.equal(rafCount,1);
});
