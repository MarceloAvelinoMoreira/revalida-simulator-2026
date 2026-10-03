/* Original high-resolution brain image with one clipped SVG synapse loop. */
(() => {
  "use strict";
  const launcher = document.getElementById("assistant-launcher");
  const network = document.getElementById("brain-network");
  if (!launcher || !network) return;
  const svg = launcher.querySelector("svg");
  // Move the SAME launcher: large above the brand on home, floating during study.
  const home = document.getElementById("screen-home");
  const homeSlot = document.getElementById("assistant-brain-home");
  const page = document.getElementById("page-simulado");
  if (home && homeSlot && page && typeof MutationObserver !== "undefined") {
    function placeLauncher() {
      const isHome = getComputedStyle(home).display !== "none";
      const parent = isHome ? homeSlot : page;
      const focused = document.activeElement === launcher;
      launcher.classList.toggle("is-home", isHome);
      if (launcher.parentElement !== parent) {
        parent.appendChild(launcher);
        if (focused) launcher.focus();
      }
    }
    placeLauncher();
    new MutationObserver(placeLauncher).observe(home, { attributes: true, attributeFilter: ["style", "class"] });
  }
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const ns = "http://www.w3.org/2000/svg";
  function element(tag, attrs) {
    const node = document.createElementNS(ns, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    network.appendChild(node); return node;
  }
  // Landmarks match bright synapses in the supplied sagittal brain photograph.
  const nodes = [[9,32],[17,28],[19,21],[27,16],[29,18],[35,24],[42,15],[47,11],
    [54,13],[60,19],[68,17],[73,11],[78,19],[85,25],[91,30],[85,34],
    [91,37],[84,41],[77,38],[71,32],[66,28],[62,23],[58,22],[52,22],
    [49,29],[54,32],[47,33],[43,36],[40,38],[34,37],[29,34],[22,34],
    [13,40],[23,42],[30,47],[40,52],[34,55],[28,53],[52,51],[58,47],
    [65,42],[70,41],[75,45],[81,50],[76,56],[66,57],[65,62],[72,62]];
  const edges = [];
  nodes.forEach((point, i) => {
    const near = nodes.map((p,j) => ({ j, d: Math.hypot(p[0]-point[0], p[1]-point[1]) })).filter(p => p.j !== i).sort((a,b) => a.d-b.d).slice(0, 4);
    near.forEach(({ j }) => { if (!edges.some(e => (e.a === j && e.b === i) || (e.a === i && e.b === j))) edges.push({ a: i, b: j }); });
  });
  // Keep each node's nearby links, then fill to exactly 200 unique local paths.
  const extraEdges = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a+1; b < nodes.length; b++) {
      if (!edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) {
        extraEdges.push({ a, b, distance:Math.hypot(nodes[a][0]-nodes[b][0],nodes[a][1]-nodes[b][1]) });
      }
    }
  }
  extraEdges.sort((a,b) => a.distance-b.distance);
  edges.push(...extraEdges.slice(0,200-edges.length));
  edges.forEach((e,i) => {
    const a = nodes[e.a], b = nodes[e.b], bend = i%2 ? .16 : -.16;
    e.cx = (a[0]+b[0])/2 + (b[1]-a[1])*bend;
    e.cy = (a[1]+b[1])/2 - (b[0]-a[0])*bend;
    element("path", { d:`M${a[0]} ${a[1]}Q${e.cx} ${e.cy} ${b[0]} ${b[1]}`,stroke:"#8defff","stroke-width":.18,fill:"none",opacity:.22,"data-connection":"true" });
  });
  const flashes = nodes.map(p => element("circle", { cx:p[0], cy:p[1], r:2.8, fill:"url(#synapse-glow)", opacity:0 }));
  nodes.forEach((p,i) => {
    element("circle", { cx:p[0], cy:p[1], r:1.5, fill:"url(#synapse-glow)", opacity:.32 });
    element("circle", { cx:p[0], cy:p[1], r:.32, fill:i%4 ? "#b4f3ff" : "#ffffff", opacity:.9,"data-neuron":"true" });
  });
  const pulses = Array.from({ length:50 }, (_,i) => ({ edge:edges[i*7 % edges.length], progress:i/50, halo:element("circle", {r:2,fill:"url(#synapse-glow)",opacity:0}), core:element("circle", {r:.35,fill:"#edffff",opacity:0,"data-synapse-pulse":"true"}) }));
  const decay = new Float32Array(nodes.length);
  let raf = 0, last = 0, elapsed = 0, hover = false, burstUntil = 0;
  function staticState() {
    svg.style.transform = "";
    pulses.forEach(p => { p.halo.setAttribute("opacity",0); p.core.setAttribute("opacity",0); });
    flashes.forEach(n => n.setAttribute("opacity",0));
  }
  function frame(now) {
    raf = 0;
    if (document.hidden || motion.matches) { staticState(); last = 0; return; }
    const dt = last ? Math.min((now-last)/1000,.05) : 0;
    last = now; elapsed += dt;
    const activity = now < burstUntil ? 5 : hover ? 2.5 : launcher.getAttribute("aria-expanded") === "true" ? 1.25 : 1;
    svg.style.transform = `scale(${1 + .015*(1+Math.sin(elapsed*1.7))})`;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i]; p.progress += dt*(.3+(i%18)*.035)*activity;
      if (p.progress >= 1) { decay[p.edge.b] = 1; p.progress %= 1; p.edge = edges[(Math.floor(elapsed*13)+i*7)%edges.length]; }
      const a = nodes[p.edge.a], b = nodes[p.edge.b];
      const t = p.progress, u = 1-t;
      const x = u*u*a[0]+2*u*t*p.edge.cx+t*t*b[0], y = u*u*a[1]+2*u*t*p.edge.cy+t*t*b[1];
      p.halo.setAttribute("cx",x); p.halo.setAttribute("cy",y); p.halo.setAttribute("opacity",.65);
      p.core.setAttribute("cx",x); p.core.setAttribute("cy",y); p.core.setAttribute("opacity",.95);
    }
    for (let i = 0; i < decay.length; i++) { decay[i] = Math.max(0,decay[i]-dt*3.5); flashes[i].setAttribute("opacity",decay[i]*.6); }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (document.hidden || motion.matches) staticState(); else raf = requestAnimationFrame(frame);
  }
  window.RevaliddaBrain = { burst() { if (!motion.matches) burstUntil = performance.now()+450; } };
  launcher.addEventListener("mouseenter", () => { hover = true; });
  launcher.addEventListener("mouseleave", () => { hover = false; });
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
})();
