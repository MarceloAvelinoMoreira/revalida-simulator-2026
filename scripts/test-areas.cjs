const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname,'..');
function setup(initial = {}) {
  const saved = new Map(Object.entries(initial)), nodes = new Map(), listeners = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id,{style:{},classList:{add(){},remove(){}},textContent:'',innerHTML:'',value:'',hidden:false,children:[],setAttribute(){},focus(){},scrollTo(){},appendChild(child){this.children.push(child);}});
    return nodes.get(id);
  };
  const c = vm.createContext({console, setTimeout,clearTimeout, window:{scrollTo(){},addEventListener:(name,fn)=>listeners.set(name,fn)}, localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},document:{getElementById:node,createElement:()=>node('button'+Math.random()),querySelectorAll:()=>[],querySelector:()=>node('query'),addEventListener(){}},insertSoftHyphens:s=>s,formatProseHtml:s=>s});
  for (const f of ['questions.js','questions-2026-2.js','questions-facisa.js','utils.js','storage.js','question-repository.js','question-classification.js','area-repository.js','simulator.js','rapid.js','areas.js','statistics.js']) vm.runInContext(fs.readFileSync(path.join(root,'netlify-dist/js',f),'utf8'),c);
  const run = source=>vm.runInContext(source,c);
  // Tests never call a provider. Educational rendering is checked separately below.
  run('loadEduForCurrent = async () => null; syncExtraButtons = () => {}; renderTakeHome = () => {}; renderKeyPoints = () => {}; renderAltRationales = () => {};');
  return {run,node,saved,c,listeners};
}
test('all IDs audited once; five actual counts; original content, keys, comments and media untouched',()=>{
  const {run}=setup();
  const report=JSON.parse(fs.readFileSync(path.join(root,'netlify-dist/data/question-classification-report.json')));
  assert.equal(run('AreaRepository.all.length'),1300);
  assert.equal(new Set(report.questions.map(q=>q.id)).size,1300);
  assert.equal(report.classified+report.pending,1300);
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
