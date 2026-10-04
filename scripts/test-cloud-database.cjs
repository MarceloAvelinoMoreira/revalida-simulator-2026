const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {PGlite} = require('@electric-sql/pglite');
test('actual PostgreSQL migrations: names do not authorize, capability pairs devices, RLS isolates profiles',async()=>{
  const db = new PGlite();
  const user1='11111111-1111-4111-8111-111111111111',user2='22222222-2222-4222-8222-222222222222';
  const first='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',second='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon;
      insert into auth.users values ('${user1}'),('${user2}');`);
    for(const file of fs.readdirSync(path.join(__dirname,'../supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',file),'utf8'));
    const identity = async id => {await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
    const connect = async (id,name,hash) => (await db.query('select public.connect_study_profile($1::uuid,$2,$3) as profile',[id,name,hash])).rows[0].profile;
    const sync = async entries => (await db.query('select public.sync_study_results($1::jsonb) as results',[JSON.stringify(entries)])).rows[0].results;
    const row = (answer='A',time='2026-01-01T00:00:00Z')=>({question_id:'q1',answer,elapsed_ms:1000,updated_at:time});
    await identity(user1);assert.equal((await connect(first,'Victor','a'.repeat(64))).id,first);
    assert.equal((await sync([row()]))[0].answer,'A');
    await identity(user2);await connect(second,'Victor','b'.repeat(64));assert.equal((await sync([])).length,0);
    assert.equal((await db.query('select * from public.study_profile_results where profile_id=$1',[first])).rows.length,0);
    await assert.rejects(db.query("insert into public.study_profile_results values ($1,'attack','A',1,now())",[first]),/row-level security/);
    await assert.rejects(db.query('select * from public.study_profiles'),/permission denied/);
    await assert.rejects(connect(first,'Victor','c'.repeat(64)),/Invalid profile/);
    assert.equal((await connect(null,'','a'.repeat(64))).id,first);
    assert.equal((await sync([]))[0].answer,'A');
    await sync([row('B','2025-01-01T00:00:00Z')]);assert.equal((await sync([]))[0].answer,'A');
    await assert.rejects(sync([row('A','2099-01-01T00:00:00Z')]),/Invalid timestamp/);
    await assert.rejects(sync([row('Z')]),/check constraint/);
    await assert.rejects(sync({message:'invalid'}));
    const batch=Array.from({length:1300},(_,i)=>({...row(),question_id:'q'+i}));
    assert.equal((await sync(batch)).length,1300);
    await db.exec('set role anon');await assert.rejects(sync([]),/permission denied/);
  } finally {await db.close();}
});
