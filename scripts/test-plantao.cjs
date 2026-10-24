const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(saved=new Map(),denied=false){
 const c=vm.createContext({localStorage:{getItem:k=>{if(denied)throw Error();return saved.get(k)||null;},setItem:(k,v)=>{if(denied)throw Error();saved.set(k,v);}}});
 vm.runInContext('const EXAMS={};'+fs.readFileSync('netlify-dist/js/questions-tpi-2026-2-tpi2.js','utf8')+'\n'+fs.readFileSync('netlify-dist/js/plantao.js','utf8')+'\nthis.api=Plantao;',c);
 return {a:c.api,saved};
}
test('Plantao: 15 real source cases, five sectors, comments and existing images',()=>{
 const {a}=boot();assert.equal(a.questions.size,15);assert.equal(a.sectors.length,5);
 for(const s of a.sectors)assert.equal(s.numbers.length,3);
 for(const q of a.questions.values()){assert.equal(q.opts.length,4);assert.match(q.answer,/^[A-D]$/);assert.ok(q.officialComment.length>100);if(q.image)assert.ok(fs.existsSync('netlify-dist/'+q.image));}
});
test('Sector icons: consistent local vectors, distinct medical metaphors and no remote runtime',()=>{
 const {a}=boot();
 assert.equal(new Set(a.sectors.map(s=>s.icon)).size,5);
 for(const sector of a.sectors){assert.match(sector.icon,/<path /);assert.doesNotMatch(sector.icon,/<script|<image|href=|onload=|https?:/i);}
 assert.match(a.sectors[0].icon,/<circle cx="20" cy="10" r="2"/);
 assert.match(a.sectors[1].icon,/m3 21 9-9/);
 assert.match(a.sectors[2].icon,/M12 15/);
 assert.match(a.sectors[3].icon,/M4 16/);
 assert.match(a.sectors[4].icon,/m9 12 2 2 4-4/);
 const css=fs.readFileSync('netlify-dist/css/plantao-icons.css','utf8');
 assert.match(css,/width:24px;height:24px/);assert.match(css,/stroke-width:2/);
 assert.match(css,/border-radius:12px/);assert.match(css,/color:#e2e8f0/);
 assert.match(css,/\.department\.complete \.sector-icon-check\{display:flex\}/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(fs.readFileSync('netlify-dist/assets/licenses/lucide.txt','utf8'),/ISC License/);
});
test('Plantao: saved answers, resumable session, no duplicate XP and independent simulator data',()=>{
 const saved=new Map([['revalida_progress','untouched']]);let {a}=boot(saved);
 const ids=[...a.questions.keys()].slice(0,3);a.start(ids);
 const q=a.questions.get(ids[0]),wrong=q.answer==='A'?'B':'A';
 assert.equal(a.answer(wrong).earned,5);assert.equal(a.answer(q.answer),null);
 assert.equal(a.stats().errors.length,1);assert.equal(a.next(),false);
 a=boot(saved).a;assert.equal(a.snapshot().session.index,1);
 a.answer(a.questions.get(ids[1]).answer);a.next();a.answer(a.questions.get(ids[2]).answer);assert.equal(a.next(),true);
 assert.equal(a.stats().xp,45);a.start([ids[0]]);assert.equal(a.answer(q.answer).earned,0);a.next();
 assert.equal(a.stats().errors.length,0);assert.equal(a.stats().xp,45);
 assert.equal(saved.get('revalida_progress'),'untouched');assert.equal(saved.size,2);
});
test('Plantao: invalid storage and denied storage keep a working in-memory game',()=>{
 let {a}=boot(new Map([['revalidda.plantao.v1','bad json']]));assert.equal(a.stats().answered,0);
 a=boot(new Map(),true).a;const id=[...a.questions.keys()][0];a.start([id]);a.answer(a.questions.get(id).answer);
 assert.equal(a.blocked(),true);assert.equal(a.stats().answered,1);
});

test('Notebook: wrong, correct and relapse retain dated history and notes without farming XP',()=>{
 const saved=new Map();let {a}=boot(saved);const id=[...a.questions.keys()][0],q=a.questions.get(id),wrong=q.answer==='A'?'B':'A';
 a.start([id]);a.answer(wrong);assert.equal(a.answer(wrong),null);a.next();
 assert.equal(a.notebook().length,1);assert.equal(a.notebook()[0].events.length,1);assert.equal(a.notebook()[0].status,'pending');
 assert.ok(Number.isFinite(Date.parse(a.notebook()[0].events[0].at)));
 assert.equal(a.annotate(id,'Rever a interpretação do caso <script>literal</script>','Interpretação'),true);
 assert.equal(a.notebook({query:'interpretacao'}).length,1);
 assert.equal(a.notebook({area:'cirurgia'}).length,0);
 a.start([id],'notebook');a.answer(q.answer);a.next();
 a=boot(saved).a;
 assert.equal(a.notebook().length,1);assert.equal(a.notebook({status:'pending'}).length,0);assert.equal(a.notebook({status:'reviewed'}).length,1);
 assert.equal(a.notebook()[0].events.length,2);assert.equal(a.notebook()[0].note,'Rever a interpretação do caso <script>literal</script>');
 a.start([id],'notebook');a.answer(wrong);a.next();
 assert.equal(a.notebook()[0].status,'pending');assert.equal(a.notebook()[0].events.length,3);assert.equal(a.stats().xp,5);
});

test('Notebook migration: keep known legacy errors, never invent attempt dates or counts',()=>{
 const id='tpi-2026-2-tpi2-001';
 for(const answer of ['A','B']){
  const saved=new Map([['revalidda.plantao.v1',JSON.stringify({version:1,answers:{[id]:{answer,xp:5}},session:null})]]);
  const {a}=boot(saved),r=a.notebook()[0];
  assert.equal(r.legacy,true);assert.equal(r.events.length,0);assert.equal(r.status,answer==='A'?'reviewed':'pending');
  assert.equal(a.stats().xp,5);assert.equal(a.annotate(id,'Anotação migrada','Conteúdo'),true);
  assert.equal(boot(saved).a.notebook()[0].note,'Anotação migrada');
 }
});

test('Notebook: invalid annotations rejected; failed writes stay explicit and preserve old storage',()=>{
 const {a,saved}=boot();const id=[...a.questions.keys()][0],q=a.questions.get(id);a.start([id]);a.answer(q.answer==='A'?'B':'A');
 assert.equal(a.annotate(id,'x'.repeat(3001),'Conteúdo'),false);assert.equal(a.annotate(id,'ok','Fake'),false);assert.equal(a.annotate('unknown','ok',''),false);
 const previous=saved.get(a.key);assert.equal(a.notebook()[0].note,'');
 const c=vm.createContext({localStorage:{getItem:()=>previous,setItem:()=>{throw Error('quota');}}});
 vm.runInContext('const EXAMS={};'+fs.readFileSync('netlify-dist/js/questions-tpi-2026-2-tpi2.js','utf8')+'\n'+fs.readFileSync('netlify-dist/js/plantao.js','utf8')+'\nthis.api=Plantao;',c);
 assert.equal(c.api.annotate(id,'não salvo','Tempo'),false);assert.equal(c.api.blocked(),true);assert.equal(saved.get(a.key),previous);
 a.start([id],'notebook');assert.equal(boot(saved).a.snapshot().session.origin,'notebook');
});
test('Plantao navigation: both entries above study modes; original modules preserved',()=>{
 for(const file of ['index.html','netlify-dist/index.html']){
  const s=fs.readFileSync(file,'utf8');assert(s.indexOf('class="plantao-entry"')<s.indexOf('Modo de estudo'));assert.match(s,/href="plantao.html"/);assert.match(s,/data-mode="all"/);
 }
 const html=fs.readFileSync('netlify-dist/plantao.html','utf8');assert.match(html,/href="..\/index.html"/);assert.match(html,/viewport/);
});
test('Plantao UI: guide toggles with ARIA, Escape closes, sectors show real progress',()=>{
 const nodes=new Map(),listeners={};
 function element(){return {hidden:false,textContent:'',children:[],attrs:{},style:{setProperty(){}},classList:{values:new Set(),add(v){this.values.add(v);}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},replaceChildren(...x){this.children=x;},append(...x){this.children.push(...x);},focus(){this.focused=true;},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}};}
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 get('guide-panel').hidden=true;
 const c=vm.createContext({localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:get,querySelectorAll:()=>[],createElement:element,addEventListener:(k,v)=>listeners[k]=v},window:{addEventListener(){}},location:{reload(){}}});
 vm.runInContext('const EXAMS={};'+fs.readFileSync('netlify-dist/js/questions-tpi-2026-2-tpi2.js','utf8')+'\n'+fs.readFileSync('netlify-dist/js/plantao.js','utf8'),c);
 assert.equal(get('hospital-progress').textContent,'0/15');assert.equal(get('departments').children.length,5);
 for(const room of get('departments').children){assert.match(room.innerHTML,/class="sector-icon" aria-hidden="true"/);assert.match(room.innerHTML,/viewBox="0 0 24 24"/);assert.match(room.innerHTML,/stroke-width="2"/);assert.match(room.innerHTML,/class="sector-icon-check"/);assert.ok(!room.classList.values.has('complete'));}
 get('brain-guide').onclick();assert.equal(get('brain-guide').attrs['aria-expanded'],'true');assert.equal(get('guide-panel').hidden,false);
 assert.match(get('guide-text').textContent,/Escolha uma ala/);
 listeners.keydown({key:'Escape'});assert.equal(get('guide-panel').hidden,true);assert.equal(get('brain-guide').attrs['aria-expanded'],'false');
 get('departments').children[0].onclick();assert.equal(get('game').hidden,false);
 get('options').children[0].onclick();assert.equal(get('hospital-progress').textContent,'1/15');assert.equal(get('case-progress').value,1);
 assert.equal(get('feedback').className,'correct');
 assert.ok(get('departments').children[0].classList.values.has('in-progress'));
 assert.equal(get('plantao-main').attrs['data-view'],'game');
 assert.equal(get('xp').textContent,'20 / 100 XP');
 assert.equal(get('feedback').children[0].textContent,'+20 XP');
 get('departments').children[1].onclick();get('options').children[0].onclick();get('next').onclick();
 assert.equal(get('image-open').hidden,false);
 get('image-open').onclick();assert.equal(get('image-zoom').open,true);
 assert.equal(get('zoom-image').src,get('case-image').src);
 get('image-close').onclick();assert.equal(get('image-zoom').open,false);
 vm.runInContext('for(const q of [...Plantao.questions.values()].filter(q=>q.sector==="clinica")){Plantao.start([q.id]);Plantao.answer(q.answer);Plantao.next();}',c);
 get('back').onclick();
 assert.ok(get('departments').children[0].classList.values.has('complete'));
 assert.match(get('departments').children[0].attrs['aria-label'],/Setor concluído/);
 assert.match(get('departments').children[0].innerHTML,/Concluída · revisar/);
 const html=fs.readFileSync('netlify-dist/plantao.html','utf8');
 assert.match(html,/class="return-link"/);assert.match(html,/aria-controls="guide-panel"/);
 assert.match(fs.readFileSync('netlify-dist/css/plantao-polish.css','utf8'),/prefers-reduced-motion/);
});
