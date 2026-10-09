const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {PGlite}=require('@electric-sql/pglite');
test('site activity: deduplicates visits and browser presence, expires presence, protects raw records',async()=>{
  const db=new PGlite();
  try{
    await db.exec('create role anon;create role authenticated;');
    await db.exec(fs.readFileSync('supabase/migrations/202610080001_site_activity.sql','utf8'));
    const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
    const call=async(s,d)=>(await db.query('select public.site_activity($1::uuid,$2::uuid) as value',[s,d])).rows[0].value;
    await db.exec('set role anon');
    assert.deepEqual(await call(a,a),{accesses:1,online:1});
    assert.deepEqual(await call(a,a),{accesses:1,online:1});
    assert.deepEqual(await call(b,a),{accesses:2,online:1});
    assert.deepEqual(await call(b,b),{accesses:2,online:2});
    await assert.rejects(db.query('select * from public.site_visits'),/permission denied/);
    await assert.rejects(db.query('select * from public.site_presence'),/permission denied/);
    await assert.rejects(call(null,a),/Invalid activity/);
    await db.exec(`reset role;update public.site_presence set last_seen=now()-interval '100 seconds';set role anon;`);
    assert.deepEqual(await call(a,a),{accesses:2,online:1});
  }finally{await db.close();}
});
test('site activity UI: valid aggregates, bounded heartbeat, invisible/offline pause and error fallback',async()=>{
  const nodes=new Map(),events={},saved=new Map(),session=new Map();let calls=0,body,fail=false,tick;
  const store=m=>({getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)});
  const document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'—'});return nodes.get(id);},addEventListener:(n,f)=>events[n]=f};
  const window={localStorage:store(saved),sessionStorage:store(session),REVALIDDA_CLOUD_CONFIG:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},addEventListener:(n,f)=>events[n]=f};
  const c=vm.createContext({window,document,navigator:{onLine:true},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},AbortController,setTimeout,clearTimeout,setInterval:f=>{tick=f;},fetch:async(url,opts)=>{calls++;body=JSON.parse(opts.body);return {ok:!fail,json:async()=>({accesses:42,online:3})};}});
  vm.runInContext(fs.readFileSync('netlify-dist/js/site-activity.js','utf8'),c);
  await new Promise(r=>setImmediate(r));
  assert.equal(nodes.get('site-accesses').textContent,'142');assert.equal(nodes.get('site-online').textContent,'3');
  assert.match(nodes.get('site-activity-status').textContent,/ajuste manual de 100/);
  assert.deepEqual(Object.keys(body).sort(),['device_id','session_id']);
  document.hidden=true;await tick();assert.equal(calls,1);
  document.hidden=false;fail=true;await tick();assert.equal(nodes.get('site-online').textContent,'—');
  assert.match(nodes.get('site-activity-status').textContent,/indisponíveis/);
  assert.equal(nodes.get('site-accesses').textContent,'142');
  events.offline();assert.match(nodes.get('site-activity-status').textContent,/Sem internet/);
});
