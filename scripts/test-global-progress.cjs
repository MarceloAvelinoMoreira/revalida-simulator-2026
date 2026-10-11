const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('global percentage: persistent unique valid answers, storage events, all screens and no fabricated progress',()=>{
  const nodes=new Map(),saved=new Map(),events={};
  const node=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
  const c=vm.createContext({console,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{getElementById:node,addEventListener:(e,f)=>events[e]=f},window:{addEventListener:(e,f)=>events[e]=f}});
  for(const f of ['questions.js','questions-2026-2.js','questions-facisa.js','questions-quinzena-01.js','questions-tutoria-semana-01.js','question-repository.js','question-classification.js','storage.js','area-repository.js','global-progress.js'])vm.runInContext(fs.readFileSync('netlify-dist/js/'+f,'utf8'),c);
  const run=s=>vm.runInContext(s,c);
  assert.equal(node('global-progress-percent').textContent,'0%');
  assert.equal(node('global-progress-bar').max,1347);
  run(`var q=QuestionRepository.getAllQuestions().find(q=>!QuestionRepository.isAnnulled(q));RevalidaStorage.set(RevalidaStorage.keys.progress,{[q.id]:{status:'correct',answer:q.answer}})`);
  assert.equal(node('global-progress-bar').value,1);
  run(`RevalidaStorage.set(RevalidaStorage.keys.progress,{[q.id]:{status:'correct',answer:q.answer},unknown:{status:'wrong',answer:'A'}})`);
  assert.equal(node('global-progress-bar').value,1);
  run(`RevalidaStorage.set(RevalidaStorage.keys.progress,{},true)`);events.storage();
  assert.equal(node('global-progress-bar').value,0);
  const html=fs.readFileSync('index.html','utf8');
  assert.ok(html.indexOf('class="global-progress"')<html.indexOf('id="screen-home"'));
});
