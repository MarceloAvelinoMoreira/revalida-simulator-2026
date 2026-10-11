const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot() {
  const d={},w={},s={};let reloads=0,syncs=0,refreshes=0,updates=0,removed=0;
  const quiz={style:{display:'none'}},result={style:{display:'none'}};
  const navigator={onLine:true,serviceWorker:{addEventListener:(e,f)=>s[e]=f,getRegistrations:async()=>[{scope:'https://example.com/app/netlify-dist/',unregister:async()=>removed++},{scope:'https://example.com/unrelated/',unregister:async()=>{throw Error('wrong scope');}}],register:async(url,opts)=>{assert.equal(url,'https://example.com/app/service-worker.js');assert.equal(opts.scope,'https://example.com/app/');assert.equal(opts.updateViaCache,'none');return {active:true,update:async()=>updates++};}}};
  const document={baseURI:'https://example.com/app/netlify-dist/',hidden:false,getElementById:id=>id==='screen-quiz'?quiz:result,addEventListener:(e,f)=>d[e]=f};
  vm.runInNewContext(fs.readFileSync('netlify-dist/js/app.js','utf8'),{URL,navigator,document,window:{location:{reload:()=>reloads++},addEventListener:(e,f)=>w[e]=f},setTimeout:f=>f(),CloudSync:{sync:async()=>syncs++},GlobalStudyProgress:{refresh:()=>refreshes++},updateStartBtn(){}});
  d.DOMContentLoaded();
  return {d,w,s,quiz,result,navigator,document,counts:()=>({reloads,syncs,refreshes,updates,removed})};
}
test('startup: root scope, existing profile sync, online resume, one reload and unrelated worker preserved',async()=>{
  const a=boot();await new Promise(r=>setImmediate(r));
  assert.equal(a.counts().syncs,1);assert.equal(a.counts().updates,1);assert.equal(a.counts().removed,1);
  a.w.pageshow({persisted:false});assert.equal(a.counts().reloads,0);
  a.document.hidden=true;a.d.visibilitychange();a.document.hidden=false;a.d.visibilitychange();
  await new Promise(r=>setImmediate(r));assert.equal(a.counts().reloads,1);
  await a.s.controllerchange();assert.equal(a.counts().reloads,1);
});
test('startup: active quiz delays update until menu; offline preserves local results; bfcache checks again',async()=>{
  const a=boot();await new Promise(r=>setImmediate(r));a.quiz.style.display='block';
  await a.s.controllerchange();assert.equal(a.counts().reloads,0);
  a.d.click();assert.equal(a.counts().reloads,0);
  a.quiz.style.display='none';a.navigator.onLine=false;a.d.click();assert.equal(a.counts().reloads,0);
  a.navigator.onLine=true;a.w.online();assert.equal(a.counts().reloads,1);
  const b=boot();await new Promise(r=>setImmediate(r));b.w.pageshow({persisted:true});assert.equal(b.counts().reloads,1);
});
function worker() {
  const events={},store=new Map();let online=true,current='v1',skipped=0,claimed=0;const cacheKeys=['revalida-legacy','other-app'];
  const key=x=>typeof x==='string'?x:x.url;
  const cache={put:async(k,v)=>store.set(key(k),v.clone()),match:async(k,options)=>{
    const found=store.get(key(k));if(found)return found.clone();
    if(options?.ignoreSearch)for(const [url,response] of store)if(url.split('?')[0]===key(k).split('?')[0])return response.clone();
  }};
  vm.runInNewContext(fs.readFileSync('service-worker.js','utf8'),{URL,Response,AbortController,setTimeout,clearTimeout,self:{location:{pathname:'/app/service-worker.js',href:'https://example.com/app/service-worker.js'},addEventListener:(e,f)=>events[e]=f,skipWaiting:async()=>skipped++,clients:{claim:async()=>claimed++}},caches:{open:async()=>cache,keys:async()=>cacheKeys,delete:async name=>{cacheKeys.splice(cacheKeys.indexOf(name),1);}},fetch:async(req,opts)=>{
    assert.equal(opts.cache,'no-store');if(!online)throw Error('offline');
    return new Response(key(req).endsWith('index.html')?'<script src="js/app.js?v=1"></script><link href="css/mobile-app.css"><img src="assets/brain-apple-touch-icon.png">':current);
  }});
  const install=async()=>{let promise;events.install({waitUntil:p=>promise=p});await promise;};
  const get=async(url,mode='cors')=>{let promise;events.fetch({request:{url,mode,method:'GET'},respondWith:p=>promise=p});return promise;};
  return {events,store,cacheKeys,install,get,setOnline:v=>online=v,setVersion:v=>current=v,counts:()=>({skipped,claimed})};
}
test('worker: precaches actual entry points, latest JS without version bump, offline app and queries, no API interception',async()=>{
  const a=worker();await a.install();assert.equal(a.counts().skipped,1);
  assert.ok(a.store.has('https://example.com/app/netlify-dist/js/app.js?v=1'));
  assert.ok(a.store.has('https://example.com/app/netlify-dist/assets/brain-apple-touch-icon.png'));
  assert.equal(await (await a.get('https://example.com/app/netlify-dist/js/app.js?v=1')).text(),'v1');
  a.setVersion('v2');assert.equal(await (await a.get('https://example.com/app/netlify-dist/js/app.js?v=1')).text(),'v2');
  a.setOnline(false);
  assert.match(await (await a.get('https://example.com/app/?offline=1','navigate')).text(),/script/);
  assert.equal(await (await a.get('https://example.com/app/netlify-dist/js/app.js?v=1')).text(),'v2');
  assert.equal(await a.get('https://example.com/app/api/assistant'),undefined);
  let activation;a.events.activate({waitUntil:p=>activation=p});await activation;
  assert.deepEqual(a.cacheKeys,['revalida-legacy','other-app']);assert.equal(a.counts().claimed,1);
});
