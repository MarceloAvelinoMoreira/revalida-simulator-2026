const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
function setup(savedSession) {
  let time=0, intervalId=0, session=savedSession;
  const loops=new Map(), listeners=new Map(), nodes=new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id,{textContent:'',style:{display:'block'}}); return nodes.get(id); };
  const ctx=vm.createContext({performance:{now:()=>time},setInterval:fn=>{loops.set(++intervalId,fn);return intervalId;},clearInterval:id=>loops.delete(id),document:{getElementById:node},window:{addEventListener:(name,fn)=>listeners.set(name,fn)},RevalidaStorage:{keys:{session:'session'},loadSession:()=>session,set:(key,value)=>{session=value;}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../netlify-dist/js/quiz-clock.js'),'utf8'),ctx);
  const run=s=>vm.runInContext(s,ctx);
  return {run,node,loops,listeners,advance:ms=>{time+=ms;for(const fn of loops.values())fn();},session:()=>session};
}
test('total continues after answer; question freezes; mean includes only timed answers',()=>{
  const {run,advance,node}=setup();
  run('QuizClock.reset();QuizClock.start();QuizClock.visit("a",true)');advance(12000);
  assert.equal(node('quiz-time-total').textContent,'00:00:12');
  assert.equal(node('quiz-time-average').textContent,'—');
  run('QuizClock.answer("a")');advance(8000);
  assert.equal(node('quiz-time-total').textContent,'00:00:20');
  assert.equal(node('quiz-time-question').textContent,'00:00:12');
  run('QuizClock.visit("b",true)');advance(4000);run('QuizClock.answer("b")');
  assert.equal(node('quiz-time-average').textContent,'00:00:08');
  run('QuizClock.visit("old-or-annulled",false)');advance(3000);
  assert.equal(node('quiz-time-question').textContent,'—');
  assert.equal(node('quiz-time-average').textContent,'00:00:08');
});
test('skipped questions accumulate across navigation; retry replaces time without double count',()=>{
  const {run,advance}=setup();run('QuizClock.reset();QuizClock.start();QuizClock.visit("a",true)');advance(5000);
  run('QuizClock.visit("b",true)');advance(3000);run('QuizClock.visit("a",true)');advance(2000);run('QuizClock.answer("a")');
  assert.equal(run('QuizClock.snapshot().answeredMs.a'),7000);
  run('QuizClock.retry("a")');advance(4000);run('QuizClock.answer("a")');
  assert.equal(run('Object.keys(QuizClock.snapshot().answeredMs).length'),1);
  assert.equal(run('QuizClock.snapshot().answeredMs.a'),4000);
});
test('menu pauses, resume excludes downtime, one interval, finish freezes and reset clears',()=>{
  const {run,advance,loops}=setup();run('QuizClock.reset();QuizClock.start();QuizClock.start();QuizClock.visit("a",true)');
  assert.equal(loops.size,1);advance(6000);run('QuizClock.stop();var saved=QuizClock.snapshot()');advance(60000);
  run('QuizClock.reset(saved);QuizClock.start();QuizClock.visit("a",true)');advance(4000);
  assert.equal(run('QuizClock.snapshot().totalMs'),10000);
  run('QuizClock.finish()');advance(60000);assert.equal(run('QuizClock.snapshot().totalMs'),10000);
  assert.equal(run('QuizClock.snapshot().finished'),true);assert.equal(loops.size,0);
  run('QuizClock.reset();QuizClock.start()');assert.equal(run('QuizClock.snapshot().totalMs'),0);assert.equal(loops.size,1);
});
test('pagehide checkpoints current time; new runtime restores without closed-tab time',()=>{
  const a=setup({questions:[{id:'a'}]});a.run('QuizClock.reset();QuizClock.start();QuizClock.visit("a",true)');a.advance(9000);
  a.listeners.get('pagehide')();assert.equal(a.loops.size,0);
  const b=setup(a.session());b.run('QuizClock.reset(RevalidaStorage.loadSession().timing);QuizClock.start();QuizClock.visit("a",true)');b.advance(1000);
  assert.equal(b.run('QuizClock.snapshot().totalMs'),10000);
  assert.equal(b.run('QuizClock.snapshot().questionMs.a'),10000);
});
test('format supports hours and invalid legacy timing does not cause NaN',()=>{
  const {run,node}=setup();run('QuizClock.reset({totalMs:-1,questionMs:{a:"bad"},answeredMs:{a:Infinity}})');
  assert.equal(node('quiz-time-total').textContent,'00:00:00');
  assert.equal(run('QuizClock.format(3661000)'),'01:01:01');
});
