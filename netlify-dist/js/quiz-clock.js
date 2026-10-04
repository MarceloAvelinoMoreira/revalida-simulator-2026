// Active exam time only: closed tabs/menu pauses are never added on resume.
const QuizClock = (() => {
  let state, running = false, last = 0, loop = null, ticks = 0;
  const now = () => performance.now();
  const clean = n => Number.isFinite(n) && n >= 0 ? n : 0;
  const format = ms => {
    const seconds = Math.floor(clean(ms) / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
  };
  function reset(saved) {
    stop();
    state = {totalMs:clean(saved?.totalMs), currentId:null, questionMs:{}, answeredMs:{}, finished:false};
    for (const field of ['questionMs','answeredMs']) {
      for (const [id,value] of Object.entries(saved?.[field] || {})) {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) state[field][id] = value;
      }
    }
    render();
  }
  function update() {
    if (!running || !state) return;
    const time = now(), delta = Math.max(0,time-last); last = time;
    state.totalMs += delta;
    if (state.currentId && !(state.currentId in state.answeredMs)) state.questionMs[state.currentId] = (state.questionMs[state.currentId] || 0) + delta;
  }
  function visit(id, eligible) {
    update(); state.currentId = eligible ? id : null;
    if (eligible && !(id in state.questionMs)) state.questionMs[id] = 0;
    render();
  }
  function start() {
    if (!state || running) return;
    running = true; last = now(); ticks = 0;
    loop = setInterval(() => { update(); render(); if (++ticks % 15 === 0) checkpoint(); },1000);
    render();
  }
  function stop() { update(); running = false; if (loop !== null) clearInterval(loop); loop = null; render(); }
  function answer(id) { update(); state.answeredMs[id] = state.questionMs[id] || 0; render(); }
  function retry(id) { update(); delete state.answeredMs[id]; state.questionMs[id] = 0; render(); }
  function finish() { stop(); if (state) state.finished = true; }
  function snapshot() { update(); return state ? JSON.parse(JSON.stringify(state)) : null; }
  function checkpoint() {
    if (!state || typeof RevalidaStorage === 'undefined') return;
    const session = RevalidaStorage.loadSession();
    if (session) RevalidaStorage.set(RevalidaStorage.keys.session,{...session,timing:snapshot()});
  }
  function render() {
    if (!state) return;
    const values = Object.values(state.answeredMs);
    const write = (id,value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    write('quiz-time-total',format(state.totalMs));
    write('quiz-time-question',state.currentId ? format(state.questionMs[state.currentId] || 0) : '—');
    write('quiz-time-average',values.length ? format(values.reduce((a,b)=>a+b,0)/values.length) : '—');
  }
  window.addEventListener('pagehide',() => { stop(); checkpoint(); });
  window.addEventListener('pageshow',event => { if (event.persisted && document.getElementById('screen-quiz')?.style.display === 'block') start(); });
  return {reset,start,stop,visit,answer,retry,finish,snapshot,format};
})();
