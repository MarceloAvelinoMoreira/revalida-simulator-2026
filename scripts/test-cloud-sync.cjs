const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
function setup(configured=true,initial={}) {
  const saved = new Map(Object.entries(initial)), nodes = new Map(), timers = [], events = {};
  const node = id => { if (!nodes.has(id)) nodes.set(id,{style:{display:'none'},textContent:'',value:'',checked:false,hidden:false}); return nodes.get(id); };
  let rows=[], fail=false, calls=0;
  const client={auth:{async getSession(){return {data:{session:{user:{id:'anonymous-device'}}}};}, async signInAnonymously(){return {data:{user:{id:'anonymous-device'}}};}}, async rpc(name,args){calls++; if(fail)return {error:{}}; if(name==='connect_study_profile')return {data:{id:args.profile_id || 'linked-profile',name:args.display_name || 'Perfil existente'}}; assert.equal(name,'sync_study_results'); for(const r of args.entries){const old=rows.find(x=>x.question_id===r.question_id);if(!old) rows.push({...r});else if(Date.parse(r.updated_at)>Date.parse(old.updated_at))Object.assign(old,r);}return {data:rows.map(r=>({...r}))};}};
  const rpc = client.rpc; client.rpc = (...args) => { const request = rpc(...args); request.abortSignal = () => request; return request; };
  const c=vm.createContext({console,Date,AbortController,TextEncoder,crypto:require('node:crypto').webcrypto,navigator:{onLine:true},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},setInterval(){},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},document:{hidden:false,getElementById:node,addEventListener:(e,f)=>events[e]=f},window:{REVALIDDA_CLOUD_CONFIG:configured?{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'}:{},supabase:{createClient:()=>client},addEventListener:(e,f)=>events[e]=f},goHome(){node('screen-quiz').style.display='none';},StudyStatistics:{open(){},render(){}},QuestionRepository:{getAllQuestions:()=>[{id:'q1',opts:['a','b','c','d','e'],answer:'A'},{id:'q2',opts:['a','b','c','d','e'],answer:'B'}],isAnnulled:()=>false}});
  for(const file of ['storage.js','results-transfer.js','cloud-sync.js'])vm.runInContext(fs.readFileSync(path.join(root,'netlify-dist/js',file),'utf8'),c);
  const run=s=>vm.runInContext(s,c);
  return {run,saved,node,c,events,login:id=>{saved.set('revalida.cloud.profile',JSON.stringify({id,name:id,code:'a'.repeat(32)}));events.storage({key:'revalida.cloud.profile'});},remote:r=>{rows=r;},fail:v=>{fail=v;},calls:()=>calls};
}
test('unconfigured cloud leaves guest persistence and backup working; no network',()=>{
  const a=setup(false);a.run("RevalidaStorage.set(RevalidaStorage.keys.progress,{q1:{answer:'A',status:'correct'}})");
  assert.equal(a.run('ResultsTransfer.backup().results.q1.answer'),'A');assert.match(a.node('cloud-status').textContent,/não configurada/);assert.equal(a.calls(),0);
});
test('accounts have isolated caches and visitor migration is explicit',()=>{
  const a=setup();a.run("RevalidaStorage.set(RevalidaStorage.keys.progress,{q1:{answer:'A',status:'correct'}})");a.login('alice');
  assert.equal(a.run('Object.keys(RevalidaStorage.loadProgress()).length'),0);
  a.run('CloudSync.importGuest()');assert.equal(a.run('RevalidaStorage.loadProgress().q1.answer'),'A');
  a.login('bob');assert.equal(a.run('Object.keys(RevalidaStorage.loadProgress()).length'),0);
  a.login('alice');assert.equal(a.run('RevalidaStorage.loadProgress().q1.answer'),'A');
  assert.ok(a.saved.has('revalida.sim.v1.progress'));
});
test('offline queue survives failure and successful sync combines remote results',async()=>{
  const a=setup();a.login('alice');a.c.navigator.onLine=false;
  a.run("RevalidaStorage.set(RevalidaStorage.keys.progress,{q1:{answer:'A',status:'correct',elapsedMs:1000}})");
  await a.run('CloudSync.sync()');assert.equal(a.calls(),0);assert.ok(JSON.parse(a.saved.get('revalida.cloud.pending.alice')).q1);
  a.c.navigator.onLine=true;a.fail(true);await a.run('CloudSync.sync()');assert.ok(JSON.parse(a.saved.get('revalida.cloud.pending.alice')).q1);
  a.fail(false);a.remote([{question_id:'q2',answer:'B',elapsed_ms:2000,updated_at:'2026-01-01T00:00:00Z'}]);await a.run('CloudSync.sync()');
  assert.equal(a.run('RevalidaStorage.loadProgress().q2.status'),'correct');assert.equal(a.run('RevalidaStorage.loadProgress().q1.elapsedMs'),1000);assert.equal(Object.keys(JSON.parse(a.saved.get('revalida.cloud.pending.alice'))).length,0);
});
test('active quiz is not overwritten; remote update reconciles saved quiz on return',async()=>{
  const a=setup();a.login('alice');
  a.run("RevalidaStorage.saveSession({questions:[{id:'q1'}],questionStatus:['wrong'],userAnswers:['B'],timing:{answeredMs:{q1:500},questionMs:{q1:500}}})");
  a.node('screen-quiz').style.display='block';await a.run('CloudSync.sync()');assert.equal(a.calls(),0);
  a.node('screen-quiz').style.display='none';a.remote([{question_id:'q1',answer:'A',elapsed_ms:900,updated_at:'2099-01-01T00:00:00Z'}]);await a.run('CloudSync.sync()');
  assert.equal(a.run('RevalidaStorage.loadSession().userAnswers[0]'),'A');assert.equal(a.run('RevalidaStorage.loadSession().timing.answeredMs.q1'),900);
});
test('navigation does not retimestamp unchanged answers; pending changes replace old values',()=>{
  const a=setup();a.login('alice');
  a.run("RevalidaStorage.saveSession({questions:[{id:'q1'}],questionStatus:['correct'],userAnswers:['A']})");
  const date=a.run('RevalidaStorage.loadProgress().q1.updatedAt');
  a.run("RevalidaStorage.saveSession({questions:[{id:'q1'}],questionStatus:['correct'],userAnswers:['A']})");assert.equal(a.run('RevalidaStorage.loadProgress().q1.updatedAt'),date);
  a.run("ResultsTransfer.apply({q1:{answer:'B',status:'wrong'}},true)");assert.equal(JSON.parse(a.saved.get('revalida.cloud.pending.alice')).q1.answer,'B');
});
test('schema requires auth and RLS, no admin execution or anonymous access',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase/migrations/202610040001_study_results.sql'),'utf8');
  assert.match(sql,/enable row level security/);assert.match(sql,/security invoker/);assert.match(sql,/auth.uid\(\) is null/);assert.match(sql,/revoke all on function.*from public, anon/);assert.match(sql,/excluded.updated_at > existing.updated_at/);
});
test('invalid remote response never clears pending answers or overwrites local results',async()=>{
  const a=setup();a.login('alice');
  a.run("RevalidaStorage.set(RevalidaStorage.keys.progress,{q1:{answer:'A',status:'correct'}})");
  a.remote([{question_id:'q2',answer:'Z',elapsed_ms:null,updated_at:'2026-01-01T00:00:00Z'}]);await a.run('CloudSync.sync()');
  assert.equal(a.run('RevalidaStorage.loadProgress().q1.answer'),'A');assert.equal(a.run('RevalidaStorage.loadProgress().q2'),undefined);assert.ok(JSON.parse(a.saved.get('revalida.cloud.pending.alice')).q1);
});
test('name only starts local saving without cloud, generates recovery capability and migrates guest safely',async()=>{
  const a=setup(false);a.run("RevalidaStorage.set(RevalidaStorage.keys.progress,{q1:{answer:'A',status:'correct'}})");
  a.node('cloud-username').value='Victor';await a.run('CloudSync.authenticate({preventDefault(){}})');
  const profile=JSON.parse(a.saved.get('revalida.cloud.profile'));assert.equal(profile.name,'Victor');assert.match(profile.code,/^[a-f0-9]{32}$/);
  assert.equal(a.run('RevalidaStorage.loadProgress().q1.answer'),'A');assert.ok(a.saved.has('revalida.sim.v1.progress'));assert.equal(a.calls(),0);
  const restored=setup(false,Object.fromEntries(a.saved));assert.equal(restored.node('cloud-name-label').textContent,'Victor');assert.equal(restored.run('RevalidaStorage.loadProgress().q1.answer'),'A');
  await a.run('CloudSync.logout()');assert.equal(a.run('RevalidaStorage.keys.progress'),'revalida.sim.v1.progress');
  a.node('cloud-username').value='Victor';await a.run('CloudSync.authenticate({preventDefault(){}})');
  assert.notEqual(JSON.parse(a.saved.get('revalida.cloud.profile')).id,profile.id);
});
test('another device attaches using code, never name; invalid code does not change local profile',async()=>{
  const a=setup();a.login('original');a.node('cloud-device-code').value='bad';await a.run('CloudSync.joinDevice({preventDefault(){}})');
  assert.equal(JSON.parse(a.saved.get('revalida.cloud.profile')).id,'original');
  a.node('cloud-device-code').value='b'.repeat(32);await a.run('CloudSync.joinDevice({preventDefault(){}})');
  assert.equal(JSON.parse(a.saved.get('revalida.cloud.profile')).id,'linked-profile');assert.equal(a.node('cloud-device-code').value,'');
});
