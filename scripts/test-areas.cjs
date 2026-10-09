const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname,'..');
function setup(initial = {}) {
  const saved = new Map(Object.entries(initial)), nodes = new Map(), listeners = new Map();
  let clockTime = 0, clockId = 0;
  const clockLoops = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id,{style:{},classList:{add(){},remove(){}},textContent:'',innerHTML:'',value:'',hidden:false,children:[],setAttribute(){},focus(){},scrollTo(){},appendChild(child){this.children.push(child);}});
    return nodes.get(id);
  };
  const c = vm.createContext({console, setTimeout,clearTimeout,performance:{now:()=>clockTime},setInterval:fn=>{clockLoops.set(++clockId,fn);return clockId;},clearInterval:id=>clockLoops.delete(id), window:{scrollTo(){},addEventListener:(name,fn)=>listeners.set(name,fn)}, localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},document:{getElementById:node,createElement:()=>node('button'+Math.random()),querySelectorAll:()=>[],querySelector:()=>node('query'),addEventListener(){}},insertSoftHyphens:s=>s,formatProseHtml:s=>s});
  for (const f of ['questions.js','questions-2026-2.js','questions-facisa.js','questions-quinzena-01.js','questions-tutoria-semana-01.js','utils.js','storage.js','score.js','question-repository.js','question-classification.js','area-repository.js','quiz-clock.js','simulator.js','rapid.js','areas.js','statistics.js','results-transfer.js']) vm.runInContext(fs.readFileSync(path.join(root,'netlify-dist/js',f),'utf8'),c);
  const run = source=>vm.runInContext(source,c);
  // Tests never call a provider. Educational rendering is checked separately below.
  run('loadEduForCurrent = async () => null; syncExtraButtons = () => {}; renderTakeHome = () => {}; renderKeyPoints = () => {}; renderAltRationales = () => {};');
  return {run,node,saved,c,listeners,advance:ms=>{clockTime+=ms;for(const fn of clockLoops.values())fn();},clockLoops};
}

test('Quinzena 01: 100 source comments, valid keys, five areas and existing quiz/rapid modes',()=>{
  const {run,node}=setup();
  const list=run('QuestionRepository.getAllQuestions().filter(q=>q.year==="quinzena-01")');
  assert.equal(list.length,100);
  assert.equal(new Set(list.map(q=>q.id)).size,100);
  for(const q of list){
    assert.ok(q.officialComment.length>100);
    assert.ok(q.explanation.length>100);
    assert.ok(q.opts[q.answer.charCodeAt(0)-65]);
  }
  for(const area of run('Object.keys(AreaRepository.areas)')){
    assert.equal(run(`AreaRepository.filter({area:'${area}',exam:'quinzena-01'}).length`),20);
  }
  run('selectedMode="year";selectedYear="quinzena-01";startQuiz()');
  assert.equal(run('questions.length'),100);
  run('handleAnswer(questions[0].answer,document.createElement("button"),questions[0])');
  assert.equal(run('correct'),1);
  run('goHome();openRapidAnswers("quinzena-01")');
  assert.equal(run('rapidQuestions.length'),100);
  assert.equal((node('rapid-list').innerHTML.match(/<article/g)||[]).length,1);
  assert.equal(run('rapidAnswerText(rapidQuestions[0]).letter'),list[0].answer);
  for(const n of [64,77]){
    const q=list[n-1];assert.ok(fs.existsSync(path.join(root,'netlify-dist',q.image)));
    run(`openRapidQuestionSet([QuestionRepository.getById('${q.id}')],"Tabela")`);
    assert.match(node('rapid-list').innerHTML,/<img /);
  }
  assert.match(list[98].officialComment,/incompleta/i);
});

test('tutoring Week 01: source keys, comments, caveats and existing study modes',async()=>{
  const {run,node}=setup();
  const qs=run('QuestionRepository.getEdition("tutoria-semana-01").questions');
  assert.equal(qs.length,20);
  assert.equal(qs.map(q=>q.answer).join(''),'DBCDCBDBCBD CDBCB DCBD'.replace(/ /g,''));
  for(const q of qs){assert.equal(q.opts.length,4);assert.ok(q.officialComment.includes('Por que as demais'));assert.ok(q.sourceCommentImported);}
  for(const area of run('Object.keys(AreaRepository.areas)')) assert.equal(run(`AreaRepository.filter({area:'${area}',exam:'tutoria-semana-01'}).length`),4);
  for(const n of [9,19]){assert.match(qs[n-1].officialComment,/Ressalva/);assert.match(qs[n-1].answerNote,/ressalva/);}
  run('selectedMode="year";selectedYear="tutoria-semana-01";startQuiz()');assert.equal(run('questions.length'),20);
  run('handleAnswer(questions[0].answer,document.createElement("button"),questions[0])');assert.equal(run('correct'),1);
  run('goHome();openRapidAnswers("tutoria-semana-01")');assert.equal(run('rapidQuestions.length'),20);assert.match(node('rapid-list').innerHTML,/não é um gabarito oficial/);
  run(fs.readFileSync(path.join(root,'netlify-dist/js/resolver.js'),'utf8'));
  const resolved=await run('QuestionEoResolver.resolve("tutoria-semana-01-009")');assert.equal(resolved.ok,true);assert.match(resolved.view.comment,/Ressalva/);
});

test('quiz clock hooks: answer, navigation, retry, menu pause, reload resume and completion',()=>{
  const a=setup();
  a.run('startQuiz(QuestionRepository.getAllQuestions().filter(q=>!QuestionRepository.isAnnulled(q)).slice(0,2))');
  a.advance(12000);a.run('handleAnswer(questions[0].answer,document.createElement("button"),questions[0])');
  assert.equal(a.node('quiz-time-average').textContent,'00:00:12');
  a.advance(5000);assert.equal(a.node('quiz-time-question').textContent,'00:00:12');
  a.run('nextQuestion()');a.advance(4000);a.run('goHome()');a.advance(60000);
  const b=setup(Object.fromEntries(a.saved));b.run('resumeQuiz()');
  assert.equal(b.run('currentIndex'),1);assert.equal(b.run('correct'),1);
  assert.equal(b.run('QuizClock.snapshot().totalMs'),21000);
  b.advance(6000);b.run('handleAnswer(questions[1].answer,document.createElement("button"),questions[1])');
  assert.equal(b.node('quiz-time-average').textContent,'00:00:11');
  b.run('retryCurrentQuestion()');b.advance(2000);b.run('handleAnswer(questions[1].answer,document.createElement("button"),questions[1])');
  assert.equal(b.node('quiz-time-average').textContent,'00:00:07');
  b.run('showResult()');assert.equal(b.clockLoops.size,0);
  assert.equal(b.run('RevalidaStorage.loadSession().timing.finished'),true);
  b.run('restartQuiz()');assert.equal(b.run('QuizClock.snapshot().totalMs'),0);
  assert.equal(b.clockLoops.size,1);
});
test('released cloud/account quiz state cannot replay answers or erase a resumable session',()=>{
  const a=setup();
  a.run('startQuiz(QuestionRepository.getAllQuestions().filter(q=>!QuestionRepository.isAnnulled(q)).slice(0,1))');
  a.run('handleAnswer(questions[0].answer,document.createElement("button"),questions[0]);goHome();releaseQuizState()');
  const before=JSON.stringify(a.run('RevalidaStorage.loadSession()'));
  a.run('goHome()');assert.equal(JSON.stringify(a.run('RevalidaStorage.loadSession()')),before);
  a.run('RevalidaStorage.useAccount("another");goHome()');assert.equal(a.run('Object.keys(RevalidaStorage.loadProgress()).length'),0);
});
test('all IDs audited once; five actual counts; original content, keys, comments and media untouched',()=>{
  const {run}=setup();
  const report=JSON.parse(fs.readFileSync(path.join(root,'netlify-dist/data/question-classification-report.json')));
  assert.equal(run('AreaRepository.all.length'),1420);
  assert.equal(new Set(report.questions.map(q=>q.id)).size,1420);
  assert.equal(report.classified+report.pending,1420);
  assert.equal(run('AreaRepository.pending().length'),report.pending);
  for (const area of Object.keys(report.distribution)) {
    assert.equal(run(`AreaRepository.filter({area:'${area}'}).length`),report.distribution[area]);
    assert.ok(run(`AreaRepository.filter({area:'${area}'}).every(q=>QuestionRepository.getById(q.id).text===q.text && QuestionRepository.getById(q.id).opts===q.opts && QuestionRepository.getById(q.id).image===q.image && QuestionRepository.getById(q.id).officialComment===q.officialComment)`));
  }
  assert.equal(run('AreaRepository.metadata("future-question").classificacaoPendente'),true);
  assert.equal(run('AreaRepository.metadata("2021-043").grandeArea'),'pediatria');
  assert.equal(run('AreaRepository.metadata("facisa-008").grandeArea'),'clinica_medica');
  assert.equal(run('AreaRepository.metadata("2026-2-064").grandeArea'),'medicina_preventiva');
});
test('filters intersect area, subarea, theme, exam, year and accent-insensitive search',()=>{
  const {run}=setup();
  assert.equal(run('AreaRepository.filter({area:"clinica_medica",subarea:"Cardiologia",tema:"Arritmias e ECG",exam:"facisa"}).length'),9); // FACISA 74 is a pediatric case, not adult cardiology.
  assert.equal(run('AreaRepository.filter({area:"clinica_medica",subarea:"Cardiologia",tema:"Arritmias e ECG",exam:"facisa",status:"unanswered"}).length'),9);
  assert.equal(run('AreaRepository.filter({area:"cirurgia",exam:"2022-1",year:"2023"}).length'),0);
  assert.ok(run('AreaRepository.filter({area:"clinica_medica",query:"hipertensao"}).length')>0);
  assert.equal(run('AreaRepository.filter({area:"clinica_medica",status:"answered"}).length'),0);
});
test('area is a home study mode: requires selection, starts selected questions and preserves other modes',()=>{
  const {run,node}=setup();
  run('selectMode("area",document.createElement("button"))');
  assert.equal(node('area-selector').style.display,'block');
  assert.equal(node('year-selector').style.display,'none');
  assert.equal(node('start-btn').disabled,true);
  assert.equal(node('start-btn').textContent,'Iniciar estudo por área');
  run('startQuiz()');assert.equal(run('questions.length'),0);
  for (const area of run('Object.keys(AreaRepository.areas)')) {
    run(`AreaStudy.selectHomeArea('${area}');startQuiz()`);
    assert.equal(node('start-btn').disabled,false);
    assert.ok(run(`questions.every(q=>AreaRepository.metadata(q.id).grandeArea==='${area}')`));
    assert.equal(run('questions.length'),run(`AreaRepository.filter({area:'${area}'}).length`));
    run('AreaStudy.home()');
  }
  run('selectMode("year",document.createElement("button"))');
  assert.equal(node('area-selector').style.display,'none');
  assert.equal(node('year-selector').style.display,'block');
  assert.equal(node('start-btn').disabled,true);
});
test('legacy migration, correct/wrong stats, persistence and skipped/annulled exclusion',()=>{
  const legacy={questions:[{id:'2021-003'},{id:'2021-005'},{id:'2021-008'}],questionStatus:['correct','wrong','skipped'],userAnswers:['B','A',null]};
  const {run,saved}=setup({'revalida.sim.v1.session':JSON.stringify(legacy)});
  assert.equal(run('Object.keys(RevalidaStorage.loadProgress()).length'),2);
  assert.equal(setup(Object.fromEntries(saved)).run('RevalidaStorage.loadProgress()["2021-003"].answer'),'B');
  assert.equal(run('AreaRepository.filter({area:"clinica_medica",status:"answered"}).length'),2);
  assert.equal(run('AreaRepository.stats(AreaRepository.filter({area:"clinica_medica"})).accuracy'),50);
  run('RevalidaStorage.saveSession({questions:[{id:"2021-003"}],questionStatus:["pending"],userAnswers:[null]})');
  assert.equal(run('RevalidaStorage.loadProgress()["2021-003"].answer'),'B');
  run('RevalidaStorage.clearSession()');
  assert.equal(run('Object.keys(RevalidaStorage.loadProgress()).length'),2);
  assert.equal(setup({'revalida.sim.v1.session':'invalid','revalida.sim.v1.progress':'invalid'}).run('Object.keys(RevalidaStorage.loadProgress()).length'),0);
  assert.equal(setup({'revalida.sim.v1.session':'{"questions":[null]}','revalida.sim.v1.progress':'[]'}).run('Object.keys(RevalidaStorage.loadProgress()).length'),0);
});
test('same quiz engine: answer by area, restore in original exam, retry and return navigation',()=>{
  const {run,node}=setup();
  run('AreaStudy.choose("clinica_medica"); AreaStudy.question("2021-003")');
  assert.equal(run('questions[currentIndex].id'),'2021-003');
  assert.equal(node('screen-quiz').style.display,'block');
  run('handleAnswer("B", document.createElement("button"),questions[currentIndex])');
  assert.equal(run('RevalidaStorage.loadProgress()["2021-003"].status'),'correct');
  run('AreaStudy.original()');
  assert.equal(run('questions.length'),100);
  assert.equal(run('questions[currentIndex].id'),'2021-003');
  assert.equal(run('questionStatus[currentIndex]'),'correct');
  run('retryCurrentQuestion();handleAnswer("A",document.createElement("button"),questions[currentIndex])');
  assert.equal(run('RevalidaStorage.loadProgress()["2021-003"].status'),'wrong');
  run('goHome()');
  assert.equal(node('screen-areas').style.display,'block');
  assert.match(node('area-stats').innerHTML,/Respondidas<\/span><strong>1/);
  run('AreaStudy.home(); selectedMode="year";selectedYear="2021";startQuiz()');
  assert.equal(run('questionStatus[2]'),'wrong');
  run('goHome()');assert.equal(node('screen-home').style.display,'flex');
});
test('rapid mode is one original question per page, origin, media and unchanged official answer',()=>{
  const {run,node}=setup();
  run('AreaStudy.choose("cirurgia");AreaStudy.start("rapid")');
  assert.equal(run('rapidQuestions.length'),run('AreaRepository.filter({area:"cirurgia"}).length'));
  assert.match(node('rapid-list').innerHTML,/Revalida 2021/);
  assert.equal((node('rapid-list').innerHTML.match(/<article/g)||[]).length,1);
  assert.equal(run('rapidAnswerText(rapidQuestions[0]).letter'),run('rapidQuestions[0].answer'));
  run('nextRapidQuestion(1);closeRapidAnswers()');assert.equal(node('screen-areas').style.display,'block');
  run('const photo=AreaRepository.all.find(q=>q.image); openRapidQuestionSet([photo],"Imagem")');
  assert.match(node('rapid-list').innerHTML,/<img /);
});
test('educational resolver retrieves the same comments, rationales and images for all five areas',async()=>{
  const {run,c}=setup();
  c.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'netlify-dist',String(url).split('?')[0]),'utf8'))});
  for(const f of ['eo-repository.js','resolver.js'])run(fs.readFileSync(path.join(root,'netlify-dist/js',f),'utf8'));
  for (const area of run('Object.keys(AreaRepository.areas)')) {
    const id=run(`AreaRepository.filter({area:'${area}'}).find(q=>q.year==='2021').id`);
    const resolved=await run(`QuestionEoResolver.resolve('${id}')`);
    assert.ok(resolved.view.comment); assert.ok(resolved.view.correctRationale);
  }
  const resolved=await run('QuestionEoResolver.resolve("2026-2-006")');
  assert.equal(resolved.view.comment,run('QuestionRepository.getById("2026-2-006").officialComment'));
  const quinzena=await run('QuestionEoResolver.resolve("quinzena-01-001")');
  assert.equal(quinzena.view.comment,run('QuestionRepository.getById("quinzena-01-001").officialComment'));
  assert.equal(quinzena.view.correctRationale,run('QuestionRepository.getById("quinzena-01-001").explanation'));
});
test('statistics: no fabricated history, empty state and navigation back to home',()=>{
  const {run,node}=setup();
  run('StudyStatistics.open()');
  assert.equal(run('StudyStatistics.snapshot().overall.answered'),0);
  assert.equal(run('StudyStatistics.snapshot().overall.accuracy'),null);
  assert.equal(node('statistics-empty').hidden,false);
  assert.match(node('statistics-storage').textContent,/Salvamento automático ativo/);
  assert.equal(node('screen-home').style.display,'none');
  assert.equal(node('screen-statistics').style.display,'block');
  run('StudyStatistics.home()');
  assert.equal(node('screen-home').style.display,'flex');
  assert.equal(node('screen-statistics').style.display,'none');
});
test('statistics survive a new browser runtime, changing study modes and repeated answers',()=>{
  const {run,saved}=setup();
  run('AreaStudy.choose("clinica_medica");AreaStudy.question("2021-003");handleAnswer("B",document.createElement("button"),questions[currentIndex])');
  run('AreaStudy.home();selectedMode="year";selectedYear="2021";startQuiz();goToQuestion(4);handleAnswer("A",document.createElement("button"),questions[currentIndex])');
  const before=run('StudyStatistics.snapshot().overall');
  assert.equal(before.answered,2);assert.equal(before.correct,1);assert.equal(before.wrong,1);assert.equal(before.accuracy,50);
  const reopened=setup(Object.fromEntries(saved));
  assert.equal(reopened.run('StudyStatistics.snapshot().overall.answered'),2);
  reopened.run('selectedMode="year";selectedYear="2021";startQuiz();goToQuestion(2);retryCurrentQuestion();handleAnswer("A",document.createElement("button"),questions[currentIndex])');
  assert.equal(reopened.run('StudyStatistics.snapshot().overall.answered'),2);
  assert.equal(reopened.run('StudyStatistics.snapshot().overall.correct'),0);
  assert.equal(reopened.run('StudyStatistics.snapshot().overall.wrong'),2);
});
test('statistics include pending classification and exclude invalid IDs and annulled answers',()=>{
  const {run}=setup();
  run('const pending=AreaRepository.pending().find(q=>!QuestionRepository.isAnnulled(q));const cancelled=AreaRepository.all.find(q=>QuestionRepository.isAnnulled(q)); RevalidaStorage.saveSession({questions:[pending,cancelled,{id:"not-in-bank"}],questionStatus:["correct","correct","correct"],userAnswers:[pending.answer,"A","B"]})');
  const snapshot=run('StudyStatistics.snapshot()');
  assert.equal(snapshot.overall.answered,1);
  assert.equal(snapshot.overall.correct,1);
  assert.equal(snapshot.areas.find(r=>r.name==='Classificação pendente').answered,1);
  assert.equal(snapshot.areas.reduce((total,row)=>total+row.answered,0),snapshot.overall.answered);
  assert.equal(snapshot.exams.reduce((total,row)=>total+row.answered,0),snapshot.overall.answered);
});
test('statistics warn on blocked storage without deleting existing records',()=>{
  const {run,node,saved,c}=setup({'revalida.sim.v1.progress':'{"2021-003":{"status":"correct","answer":"B"}}'});
  const before=saved.get('revalida.sim.v1.progress');
  c.localStorage.setItem=()=>{throw Error('storage unavailable');};
  run('StudyStatistics.open()');
  assert.match(node('statistics-storage').textContent,/não permite salvar/);
  assert.equal(saved.get('revalida.sim.v1.progress'),before);
  assert.equal(run('StudyStatistics.snapshot().overall.answered'),1);
  assert.equal(run('RevalidaStorage.saveSession({questions:[{id:"2021-003"}],questionStatus:["wrong"],userAnswers:["A"]})'),false);
  c.localStorage.setItem=(k,v)=>saved.set(k,v);
  run('StudyStatistics.render()');
  assert.match(node('statistics-storage').textContent,/não permite salvar/); // A small probe must not hide a failed answer write.
  assert.equal(saved.get('revalida.sim.v1.progress'),before);
});
test('statistics update when answers change in another tab',()=>{
  const {run,node,saved,listeners}=setup();
  run('StudyStatistics.open()');
  saved.set('revalida.sim.v1.progress','{"2021-003":{"status":"correct","answer":"B"}}');
  listeners.get('storage')({key:'revalida.sim.v1.progress'});
  assert.match(node('statistics-summary').innerHTML,/Respondidas<\/span><strong>1/);
  assert.equal(node('statistics-empty').hidden,true);
});

test('time statistics: 100-question projection, correct-only area comparison, persistence across exams',()=>{
  const a=setup();
  a.run(`const timedA=AreaRepository.filter({area:'clinica_medica'}).find(q=>!QuestionRepository.isAnnulled(q));
    const timedB=AreaRepository.filter({area:'cirurgia'}).find(q=>!QuestionRepository.isAnnulled(q));
    const timedWrong=AreaRepository.filter({area:'cirurgia'}).find(q=>!QuestionRepository.isAnnulled(q) && q.id!==timedB.id);
    const wrongLetter=timedWrong.answer==='A'?'B':'A';
    RevalidaStorage.saveSession({questions:[timedA,timedB,timedWrong],questionStatus:['correct','correct','wrong'],userAnswers:[timedA.answer,timedB.answer,wrongLetter],timing:{answeredMs:{[timedA.id]:60000,[timedB.id]:120000,[timedWrong.id]:180000}}});`);
  const t=a.run('StudyStatistics.snapshot().timing');
  assert.equal(t.count,3);assert.equal(t.meanMs,120000);assert.equal(t.exam100Ms,12000000);
  assert.equal(t.slowest[0].name,'Cirurgia');assert.equal(t.fastest[0].name,'Clínica Médica');
  assert.equal(t.areas.find(row=>row.name==='Cirurgia').count,1);
  // Navigating or starting another exam must not erase earlier recorded timing.
  a.run('RevalidaStorage.saveSession({questions:[timedA],questionStatus:["correct"],userAnswers:[timedA.answer]})');
  const b=setup(Object.fromEntries(a.saved));
  assert.equal(b.run('StudyStatistics.snapshot().timing.exam100Ms'),12000000);
  b.run('StudyStatistics.open()');assert.match(b.node('statistics-timing-summary').innerHTML,/03:20:00/);
  assert.match(b.node('statistics-timing-insight').textContent,/Maior tempo.*Cirurgia.*Menor tempo.*Clínica Médica/);
  assert.match(b.node('statistics-outcomes-chart').innerHTML,/2 acertos e 1 erros entre 3 questões respondidas/);
  assert.match(b.node('statistics-outcomes-chart').innerHTML,/66,7%/);
  assert.match(b.node('statistics-area-chart').innerHTML,/width="50"/); // Surgery: one correct of two answered.
  assert.match(b.node('statistics-time-chart').innerHTML,/width="50"/); // Clinical: 60s compared with surgery's 120s.
  assert.match(b.node('statistics-time-chart').innerHTML,/width="100"/);
  assert.match(b.node('statistics-exam-chart').innerHTML,/respondidas ·/);
  assert.doesNotMatch(b.node('statistics-time-chart').innerHTML,/NaN|Infinity/);
});

test('time statistics exclude legacy, invalid timing, unknown IDs and cancelled answers; zero and ties are valid',()=>{
  const a=setup();
  a.run(`const qa=AreaRepository.filter({area:'clinica_medica'}).find(q=>!QuestionRepository.isAnnulled(q));
    const qb=AreaRepository.filter({area:'pediatria'}).find(q=>!QuestionRepository.isAnnulled(q));
    const cancelled=AreaRepository.all.find(q=>QuestionRepository.isAnnulled(q));
    RevalidaStorage.saveSession({questions:[qa,qb,cancelled,{id:'unknown'}],questionStatus:['correct','correct','correct','correct'],userAnswers:[qa.answer,qb.answer,'A','A'],timing:{answeredMs:{[qa.id]:0,[qb.id]:0,[cancelled.id]:3000,unknown:2000}}});`);
  assert.equal(a.run('StudyStatistics.snapshot().timing.count'),2);
  assert.equal(a.run('StudyStatistics.snapshot().timing.slowest.length'),2);
  a.run('StudyStatistics.open()');assert.match(a.node('statistics-timing-insight').textContent,/empatadas/);
  a.run(`const p=RevalidaStorage.loadProgress();p[qa.id].elapsedMs=-1;p[qb.id].elapsedMs='60000';RevalidaStorage.set(RevalidaStorage.keys.progress,p)`);
  assert.equal(a.run('StudyStatistics.snapshot().timing.exam100Ms'),null);
  a.run('StudyStatistics.render()');assert.match(a.node('statistics-timing-summary').innerHTML,/Sem dados/);
  assert.match(a.node('statistics-timing-summary').innerHTML,/Respostas cronometradas<\/span><strong>0/);
  assert.doesNotMatch(a.node('statistics-time-chart').innerHTML,/NaN|Infinity/);
  assert.match(a.node('statistics-time-chart').innerHTML,/Sem dados/);
});

test('new answer replaces recorded time; untimed changed answer cannot reuse old duration',()=>{
  const a=setup();a.run(`const q=QuestionRepository.getById('2021-003');
    RevalidaStorage.saveSession({questions:[q],questionStatus:['correct'],userAnswers:[q.answer],timing:{answeredMs:{[q.id]:40000}}});
    RevalidaStorage.saveSession({questions:[q],questionStatus:['correct'],userAnswers:[q.answer],timing:{answeredMs:{[q.id]:20000}}});`);
  assert.equal(a.run('StudyStatistics.snapshot().timing.meanMs'),20000);
  a.run(`RevalidaStorage.saveSession({questions:[q],questionStatus:['wrong'],userAnswers:[q.answer==='A'?'B':'A']})`);
  assert.equal(a.run('StudyStatistics.snapshot().timing.count'),0);
});

test('portable backup transfers real answers/times to a new browser; no session or unrelated fields',()=>{
  const a=setup();a.run(`RevalidaStorage.set(RevalidaStorage.keys.progress,{'2021-003':{answer:'B',status:'wrong',elapsedMs:45000,token:'DO-NOT-EXPORT'}})`);
  const backup=a.run('ResultsTransfer.backup()');
  assert.deepEqual(Object.keys(backup).sort(),['app','exportedAt','results','version']);
  assert.equal(backup.results['2021-003'].status,'correct');
  assert.equal(backup.results['2021-003'].elapsedMs,45000);
  assert.doesNotMatch(JSON.stringify(backup),/token|DO-NOT-EXPORT|session/);
  const b=setup();b.c.backup=JSON.parse(JSON.stringify(backup));
  b.run('ResultsTransfer.apply(ResultsTransfer.validate(backup).results)');
  assert.equal(b.run('StudyStatistics.snapshot().overall.correct'),1);
  assert.equal(b.run('StudyStatistics.snapshot().timing.meanMs'),45000);
  assert.equal(setup(Object.fromEntries(b.saved)).run('StudyStatistics.snapshot().overall.correct'),1);
});

test('import defaults keep duplicates, replace is explicit, unrelated results preserved and resumable quiz reconciled',()=>{
  const a=setup();a.run(`startQuiz([QuestionRepository.getById('2021-003')]);handleAnswer('A',document.createElement('button'),questions[0]);goHome();
    var imported=ResultsTransfer.validate({app:'REVALIDDA',version:1,results:{'2021-003':{answer:'B',elapsedMs:5000},'2021-005':{answer:'A'}}}).results;`);
  assert.equal(a.run('ResultsTransfer.apply(imported).kept'),1);
  assert.equal(a.run('RevalidaStorage.loadProgress()["2021-003"].answer'),'A');
  a.run(`ResultsTransfer.apply(ResultsTransfer.validate({app:'REVALIDDA',version:1,results:{'2021-003':{answer:'B',elapsedMs:5000}}}).results,true);resumeQuiz()`);
  assert.equal(a.run('userAnswers[0]'),'B');assert.equal(a.run('correct'),1);
  assert.equal(a.run('RevalidaStorage.loadProgress()["2021-005"].answer'),'A');
  assert.equal(a.run('QuizClock.snapshot().answeredMs["2021-003"]'),5000);
});

test('import rejects malformed, invalid answer/timing/version; unknown and annulled IDs ignored safely',()=>{
  const a=setup();
  for(const data of ['null','{app:"other",version:1,results:{}}','{app:"REVALIDDA",version:2,results:{}}','{app:"REVALIDDA",version:1,results:[]}',`{app:'REVALIDDA',version:1,results:{'2021-003':{answer:'Z'}}}`,`{app:'REVALIDDA',version:1,results:{'2021-003':{answer:'B',elapsedMs:-1}}}`]) assert.throws(()=>a.run(`ResultsTransfer.validate(${data})`));
  a.run(`var annulledQ=AreaRepository.all.find(q=>QuestionRepository.isAnnulled(q));var v=ResultsTransfer.validate({app:'REVALIDDA',version:1,results:{unknown:{answer:'A'},[annulledQ.id]:{answer:'A'},'2021-003':{answer:'B'}}})`);
  assert.equal(a.run('v.ignored'),2);assert.equal(a.run('Object.keys(v.results).length'),1);
  assert.equal(a.run(`ResultsTransfer.validate(JSON.parse('{"app":"REVALIDDA","version":1,"results":{"__proto__":{"polluted":true}}}')).ignored`),1);
});

test('file selection is preview-only; cancellation, invalid JSON, size cap and blocked storage leave results intact',async()=>{
  const a=setup();const text=JSON.stringify({app:'REVALIDDA',version:1,results:{'2021-003':{answer:'B'}}});
  a.c.input={files:[{size:text.length,text:async()=>text}],value:'file'};
  await a.run('ResultsTransfer.selectFile(input)');
  assert.equal(a.run('StudyStatistics.snapshot().overall.answered'),0);
  assert.equal(a.node('results-import-preview').hidden,false);
  a.run('ResultsTransfer.cancel()');assert.equal(a.node('results-import-preview').hidden,true);
  a.c.input={files:[{size:3,text:async()=>'{bad'}],value:'file'};await a.run('ResultsTransfer.selectFile(input)');assert.match(a.node('results-transfer-status').textContent,/JSON válido/);
  a.c.input={files:[{size:3*1024*1024,text:async()=>text}],value:'file'};await a.run('ResultsTransfer.selectFile(input)');assert.match(a.node('results-transfer-status').textContent,/2 MB/);
  a.c.input={files:[{size:text.length,text:async()=>text}],value:'file'};await a.run('ResultsTransfer.selectFile(input)');
  const before=a.saved.get('revalida.sim.v1.progress');a.c.localStorage.setItem=()=>{throw Error('blocked');};
  a.run('ResultsTransfer.confirm()');assert.match(a.node('results-transfer-status').textContent,/não permitiu/);
  assert.equal(a.saved.get('revalida.sim.v1.progress'),before);
});
