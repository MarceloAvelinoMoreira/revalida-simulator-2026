// Explicit opt-in: creates two anonymous identities and two synthetic test profiles.
// No administrative keys, tokens or recovery codes are logged. Does not delete data.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
async function main() {
  if (!process.argv.includes('--run')) { console.log('Use --run to create isolated test profiles in the configured Supabase project.'); return; }
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../netlify-dist/js/cloud-config.js'),'utf8'),context);
  const config=context.window.REVALIDDA_CLOUD_CONFIG;
  if (!/^https:\/\/[^/]+\.supabase\.co$/.test(config.url) || !config.publishableKey.startsWith('sb_publishable_'))throw Error('Public configuration missing');
  async function request(route,body,token,method='POST') {
    const response=await fetch(config.url+route,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    const data=await response.json().catch(()=>null);return {status:response.status,data};
  }
  const session=async()=>{const r=await request('/auth/v1/signup',{});assert.equal(r.status,200,'Anonymous Auth HTTP '+r.status);assert.ok(r.data.access_token);return r.data.access_token;};
  const rpc=async(name,args,token)=>{const r=await request('/rest/v1/rpc/'+name,args,token);assert.equal(r.status,200,name+' HTTP '+r.status);return r.data;};
  const a=await session(),b=await session(),profile=crypto.randomUUID(),other=crypto.randomUUID();
  const proof=()=>crypto.createHash('sha256').update(crypto.randomBytes(16)).digest('hex');
  const hash=proof(),label='TESTE sincronização '+new Date().toISOString().slice(0,10);
  await rpc('connect_study_profile',{profile_id:profile,display_name:label,recovery_hash:hash},a);
  const row={question_id:'2021-001',answer:'A',elapsed_ms:12000,updated_at:new Date().toISOString()};
  assert.equal((await rpc('sync_study_results',{entries:[row]},a))[0].answer,'A');
  await rpc('connect_study_profile',{profile_id:other,display_name:label,recovery_hash:proof()},b);
  assert.equal((await rpc('sync_study_results',{entries:[]},b)).length,0);
  const isolated=await request('/rest/v1/study_profile_results?profile_id=eq.'+profile,undefined,b,'GET');assert.equal(isolated.status,200);assert.equal(isolated.data.length,0);
  const denied=await request('/rest/v1/study_profile_results',{profile_id:profile,...row},b);assert.ok([401,403].includes(denied.status),'RLS rejected foreign insert');
  const wrong=await request('/rest/v1/rpc/connect_study_profile',{profile_id:profile,display_name:label,recovery_hash:proof()},b);assert.ok(wrong.status>=400,'Wrong capability rejected');
  await rpc('connect_study_profile',{profile_id:null,display_name:'',recovery_hash:hash},b);
  assert.equal((await rpc('sync_study_results',{entries:[]},b))[0].elapsed_ms,12000);
  row.answer='B';row.updated_at=new Date(Date.now()+1000).toISOString();await rpc('sync_study_results',{entries:[row]},b);
  assert.equal((await rpc('sync_study_results',{entries:[]},a))[0].answer,'B');
  const publicDenied=await request('/rest/v1/rpc/sync_study_results',{entries:[]});assert.ok(publicDenied.status>=400,'Unauthenticated access rejected');
  console.log('PASS: real Anonymous Auth, two-device sync, matching-name isolation, wrong-code rejection, RLS and unauthenticated denial.');
  console.log('Two synthetic TESTE profiles retained; no existing student results were changed.');
}
main().catch(error=>{console.error('FAIL: cloud smoke test:',error instanceof assert.AssertionError?error.message:'request/configuration failed');process.exitCode=1;});
