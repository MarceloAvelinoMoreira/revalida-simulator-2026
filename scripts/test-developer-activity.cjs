const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const vm=require('node:vm');
test('developer UI: code not stored, safe rows, invalid code, logout and no delayed unlock',async()=>{
  const nodes=new Map(),events={};let body,pending,reply={devices:1,visits:2,unmapped_visits:0,rows:[{device_id:'11111111-1111-4111-8111-111111111111',visits:2,first_seen:'2026-10-11',last_seen:'2026-10-11'}]};
  const make=()=>({textContent:'',value:'',hidden:false,children:[],addEventListener(e,f){this[e]=f;},appendChild(x){this.children.push(x);},replaceChildren(...items){this.children=items;}});
  const node=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);};
  const document={hidden:false,getElementById:node,createElement:make,createDocumentFragment:make,addEventListener:(e,f)=>events[e]=f};
  vm.runInNewContext(fs.readFileSync('netlify-dist/js/developer-activity.js','utf8'),{
    document,
    window:{REVALIDDA_CLOUD_CONFIG:{url:'https://example.supabase.co',publishableKey:'test'}},crypto:{randomUUID:()=> '22222222-2222-4222-8222-222222222222'},AbortController,setTimeout,clearTimeout,
    fetch:async(url,opts)=>{body=JSON.parse(opts.body);if(pending)await pending;return {ok:true,json:async()=>url.endsWith('site_developer_profiles')?{total:1,rows:[{profile_id:'11111111-1111-4111-8111-111111111111',name:'<script>test</script>',devices:2,saved_questions:3,last_synced_answer:null}]}:reply};}
  });
  node('developer-code').value='12345678';node('developer-login').submit({preventDefault(){}});
  await new Promise(r=>setImmediate(r));assert.equal(body.access_code,'12345678');assert.equal(node('developer-code').value,'');assert.equal(node('developer-results').hidden,false);
  assert.match(node('developer-profiles-status').textContent,/1 perfis/);
  assert.equal(node('developer-profiles').children[0].children[0].children[0].textContent,'<script>test</script>');
  node('developer-logout').click();assert.equal(node('developer-results').hidden,true);assert.equal(node('developer-devices').children.length,0);
  assert.equal(node('developer-profiles').children.length,0);
  reply={error:'unauthorized'};node('developer-code').value='00000000';node('developer-login').submit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.match(node('developer-status').textContent,/incorreto/);
  let resolve;pending=new Promise(r=>resolve=r);reply={devices:0,visits:0,unmapped_visits:0,rows:[]};
  node('developer-code').value='12345678';node('developer-login').submit({preventDefault(){}});document.hidden=true;events.visibilitychange();resolve();await new Promise(r=>setImmediate(r));assert.equal(node('developer-results').hidden,true);
});

test('developer profiles: existing code gate, minimal aggregate data, pagination and private tables',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
    for(const file of ['202610040002_username_profiles.sql','202610080001_site_activity.sql','202610110001_developer_activity.sql','202610160001_developer_profiles.sql']) await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
    const id='11111111-1111-4111-8111-111111111111',client='22222222-2222-4222-8222-222222222222';
    await db.query('insert into public.site_developer_settings values(true,$1)',[crypto.createHash('sha256').update('12345678').digest('hex')]);
    await db.query('insert into public.study_profiles values($1,$2,$3)',[id,'Perfil salvo','a'.repeat(64)]);
    await db.query("insert into public.study_profile_results values($1,'q1','A',1000,now())",[id]);
    await db.exec('set role anon');
    const report=async(code,offset=0)=>(await db.query('select public.site_developer_profiles($1,$2::uuid,$3) as data',[code,client,offset])).rows[0].data;
    assert.equal((await report('00000000')).error,'unauthorized');
    const result=await report('12345678');assert.equal(result.total,1);
    assert.deepEqual(Object.keys(result.rows[0]).sort(),['devices','last_synced_answer','name','profile_id','saved_questions']);
    assert.equal(result.rows[0].saved_questions,1);assert.equal(result.rows[0].devices,0);
    assert.equal((await report('12345678',100)).rows.length,0);
    assert.equal((await report('12345678',-1)).error,'invalid_request');
    await assert.rejects(db.query('select * from public.study_profiles'),/permission denied/);
  }finally{await db.close();}
});

test('site counters and profile list are only inside the locked developer results',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const section=html.slice(html.indexOf('<section id="developer-results" hidden>'),html.indexOf('</section>',html.indexOf('<section id="developer-results" hidden>')));
  for(const id of ['site-accesses','site-online','developer-profiles']){
    assert.ok(section.includes('id="'+id+'"'));assert.equal(html.split('id="'+id+'"').length,2);
  }
});
test('developer SQL: private records, per-session visits, protected report, limits and legacy preservation',async()=>{
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(fs.readFileSync('supabase/migrations/202610080001_site_activity.sql','utf8'));
    const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',c='33333333-3333-4333-8333-333333333333';
    await db.query('select public.site_activity($1::uuid,$1::uuid)',[a]);
    await db.exec(fs.readFileSync('supabase/migrations/202610110001_developer_activity.sql','utf8'));
    await db.query('insert into public.site_developer_settings values(true,$1)',[crypto.createHash('sha256').update('12345678').digest('hex')]);
    await db.exec('set role anon');
    const visit=async(s,d)=>(await db.query('select public.site_activity($1::uuid,$2::uuid) as data',[s,d])).rows[0].data;
    const report=async(code,client=b,offset=0)=>(await db.query('select public.site_developer_activity($1,$2::uuid,$3) as data',[code,client,offset])).rows[0].data;
    await visit(b,a);await visit(b,a);await visit(c,a);
    const result=await report('12345678');
    assert.equal(result.devices,1);assert.equal(result.visits,3);assert.equal(result.unmapped_visits,1);
    assert.equal(result.rows[0].visits,2);assert.equal(result.rows[0].device_id,a);
    assert.equal((await report('00000000')).error,'unauthorized');
    for(let i=0;i<4;i++)await report('00000000');
    assert.equal((await report('12345678')).error,'rate_limited');
    assert.equal((await report('12345678',c,-1)).error,'invalid_request');
    for(const table of ['site_devices','site_developer_settings','site_developer_attempts'])await assert.rejects(db.query(`select * from public.${table}`),/permission denied/);
    assert.equal((await visit(c,a)).accesses,3);
  }finally{await db.close();}
});
