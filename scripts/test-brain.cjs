"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
const root = path.resolve(__dirname,"..");
function node() { return { attrs:{},style:{},children:[],setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},appendChild(n){this.children.push(n);},addEventListener(k,v){this[k]=v;} }; }
test("48 neurons, 200 unique local connections, 50 pulses, clipping, one RAF and reduced motion", () => {
  const launcher=node(), network=node(), svg=node(), listeners={}, active=new Map(); let id=0;
  launcher.querySelector=() => svg;
  const motion={matches:false,addEventListener(k,f){this[k]=f;}};
  const document={hidden:false,getElementById:id => id === "assistant-launcher" ? launcher : network,createElementNS:() => node(),addEventListener(k,f){listeners[k]=f;}};
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(root,"netlify-dist/js/assistant-brain.js"),"utf8"),{document,window,matchMedia:() => motion,performance:{now:() => 0},requestAnimationFrame:f => {active.set(++id,f);return id;},cancelAnimationFrame:i => active.delete(i),Float32Array,Math});
  assert.equal(active.size,1); assert.equal(network.children.filter(n => n.attrs["data-neuron"]==="true").length,48);
  const lines=network.children.filter(n => n.attrs["data-connection"] === "true");
  assert.equal(lines.length,200);
  assert.ok(lines.every(n => /^M[\d.]+ [\d.]+Q/.test(n.attrs.d)));
  const pairs=lines.map(n => {
    const coords=n.attrs.d.match(/[\d.]+/g).map(Number);
    assert.ok(Math.hypot(coords[4]-coords[0],coords[5]-coords[1])<25);
    return [coords.slice(0,2).join(','),coords.slice(4,6).join(',')].sort().join('|');
  });
  assert.equal(new Set(pairs).size,200);
  const neurons=network.children.filter(n => n.attrs["data-neuron"] === "true");
  assert.ok(neurons.every(n => n.attrs.cx > 0 && n.attrs.cx < 100 && n.attrs.cy > 0 && n.attrs.cy < 72));
  for(let i=0;i<30;i++){ window.RevaliddaBrain.burst(); assert.equal(active.size,1); }
  launcher.mouseenter(); const tick=[...active.values()][0]; active.clear(); tick(16); assert.equal(active.size,1); assert.match(svg.style.transform,/scale/); launcher.mouseleave();
  const cores=network.children.filter(n => n.attrs.r === .35);
  assert.equal(cores.length,50);
  assert.ok(cores.every(n => n.attrs["data-synapse-pulse"] === "true"));
  const start=cores[0].attrs.cx;
  const next=[...active.values()][0];active.clear();next(32);
  assert.notEqual(cores[0].attrs.cx,start);assert.equal(active.size,1);
  document.hidden=true; listeners.visibilitychange(); assert.equal(active.size,0);
  document.hidden=false; listeners.visibilitychange(); assert.equal(active.size,1); listeners.visibilitychange(); assert.equal(active.size,1);
  motion.matches=true; motion.change(); assert.equal(active.size,0); assert.equal(svg.style.transform,""); window.RevaliddaBrain.burst(); assert.equal(active.size,0);
  motion.matches=false; motion.change(); assert.equal(active.size,1);
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(html,/clip-path="url\(#brain-clip\)"/); assert.doesNotMatch(html,/class="assistant-mascot|<img src="assets\/app-icon-robot/);
  assert.match(html,/<image class="brain-photo" href="assets\/assistant-brain-photo.jpg"/);
  assert.match(html,/viewBox="0 0 100 72"/);
  assert.ok(fs.existsSync(path.join(root,"netlify-dist/assets/assistant-brain-photo.jpg")));
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
