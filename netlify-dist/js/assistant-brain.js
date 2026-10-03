/* One SVG animation loop; the anatomical silhouette remains usable without JS. */
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
  const points = [[32,18],[42,29],[24,30],[16,44],[34,44],[43,57],[20,60],[31,64],[14,73],[29,79],[41,82],[31,91],
    [24,23],[35,26],[16,35],[28,37],[41,43],[17,52],[30,56],[39,64],[20,69],[35,73],[23,87],[39,90]];
  const nodes = points.concat(points.map(([x,y]) => [100-x,y]));
  const edges = [];
  nodes.forEach((point, i) => {
    const near = nodes.map((p,j) => ({ j, d: Math.hypot(p[0]-point[0], p[1]-point[1]) })).filter(p => p.j !== i && (p.j < points.length) === (i < points.length)).sort((a,b) => a.d-b.d).slice(0, 4);
    near.forEach(({ j }) => { if (!edges.some(e => (e.a === j && e.b === i) || (e.a === i && e.b === j))) edges.push({ a: i, b: j }); });
  });
  edges.forEach((e,i) => { const a = nodes[e.a], b = nodes[e.b]; element("line", { x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:i%3 ? "#42baff" : "#8ba8ff","stroke-width":.35,opacity:.36 }); });
  const flashes = nodes.map(p => element("circle", { cx:p[0], cy:p[1], r:4, fill:"url(#synapse-glow)", opacity:0 }));
  nodes.forEach((p,i) => {
    element("circle", { cx:p[0], cy:p[1], r:2.1, fill:"url(#synapse-glow)", opacity:.22 });
    element("circle", { cx:p[0], cy:p[1], r:.8, fill:i%4 ? "#b4f3ff" : "#d5dbff", opacity:.85,"data-neuron":"true" });
  });
  const pulses = Array.from({ length:14 }, (_,i) => ({ edge:edges[i*7 % edges.length], progress:i/14, halo:element("circle", {r:3.2,fill:"url(#synapse-glow)",opacity:0}), core:element("circle", {r:.65,fill:"#edffff",opacity:0}) }));
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
      const p = pulses[i]; p.progress += dt*(.3+i*.035)*activity;
      if (p.progress >= 1) { decay[p.edge.b] = 1; p.progress %= 1; p.edge = edges[(Math.floor(elapsed*13)+i*7)%edges.length]; }
      const a = nodes[p.edge.a], b = nodes[p.edge.b];
      const x = a[0]+(b[0]-a[0])*p.progress, y = a[1]+(b[1]-a[1])*p.progress;
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
