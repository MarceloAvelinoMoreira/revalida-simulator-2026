// Offline metadata generation. Never changes question content or calls an AI API.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), bank = vm.createContext({});
for (const f of ['questions.js', 'questions-2026-2.js', 'questions-facisa.js', 'questions-quinzena-01.js', 'questions-tutoria-semana-01.js']) vm.runInContext(fs.readFileSync(path.join(root, 'netlify-dist/js', f), 'utf8'), bank);
const exams = vm.runInContext('EXAMS', bank);
const overrides = JSON.parse(fs.readFileSync(path.join(root,'netlify-dist/data/area-overrides.json'),'utf8'));
const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f\u00ad]/g, '').toLowerCase();
const areas = { 'Clínica Médica':'clinica_medica', 'Cirurgia Geral':'cirurgia', 'Pediatria':'pediatria', 'Ginecologia e Obstetrícia':'ginecologia_obstetricia', 'Ginecologia':'ginecologia_obstetricia', 'Obstetrícia':'ginecologia_obstetricia', 'Saúde Coletiva':'medicina_preventiva', 'Medicina de Família e Comunidade':'medicina_preventiva', 'Medicina Preventiva e Social':'medicina_preventiva' };
// FACISA topics are hints, corroborated against each stem and its correct answer.
const topics = [
  [/corrimento|cervicite/, 'ginecologia_obstetricia','Ginecologia', /vagin|candida|cervic|corrimento/],
  [/câncer de colo/, 'ginecologia_obstetricia','Ginecologia', /colo|citologia|citopatolog|hpv/],
  [/contracep/, 'ginecologia_obstetricia','Planejamento reprodutivo', /contracep|diu|implante|gesta|anticoncepc/],
  [/sangramento uterino/, 'ginecologia_obstetricia','Ginecologia', /uter|menarc|sangramento|menstrual/],
  [/rastreamento, testes/, 'medicina_preventiva','Prevenção e rastreamento', /rastreamento|assintomatic|sensibilidade|especificidade/],
  [/mama:/, 'ginecologia_obstetricia','Mastologia', /mama|mamari|bi-rads|mamograf/],
  [/apendicite/, 'cirurgia','Abdome agudo', /abdom|apendic|fossa iliaca/],
  [/arritmias/, 'clinica_medica','Cardiologia', /cardio|taquic|bradic|pulso|palpit|fibril/],
  [/vias biliares/, 'cirurgia','Cirurgia hepatobiliopancreática', /cole|biliar|vesicul|colang/],
  [/trauma torácico/, 'cirurgia','Traumatologia', /torac|pneumotorax|traqueia|murmurio|torax/],
  [/puberdade/, 'pediatria','Endocrinologia Pediátrica', /puber|tanner|menina|menino|telarc/],
  [/sangramento na primeira/, 'ginecologia_obstetricia','Obstetrícia', /gesta|abort|hcg|embriao/],
  [/diabetes:/, 'clinica_medica','Endocrinologia', /diabet|glic|metformina/],
  [/hipertensão/, 'clinica_medica','Cardiologia', /pressao|hiperten/],
  [/estudos epidemiológicos/, 'medicina_preventiva','Epidemiologia', /estudo|pesquisa|epidemiol|coorte|transversal/],
  [/climatério/, 'ginecologia_obstetricia','Climatério', /menopaus|fogacho|climater|osteopor|estrogen|estradiol/],
  [/neoplasias hematológicas/, 'clinica_medica','Hematologia', /leucem|linfom|mielom|hematol|linfonod/],
  [/declaração de óbito/, 'medicina_preventiva','Medicina Legal', /obito|morte|morre|morto|legal/],
  [/disfunção tireoidiana/, 'clinica_medica','Endocrinologia', /tireo|tireoid|tiroxina|hormonio estimulante/],
  [/saúde do idoso/, 'clinica_medica','Geriatria', /idos|polifarma|anos|fragil/],
];
const mapping = {}, rows = [];
for (const [edition, exam] of Object.entries(exams)) for (const q of exam.questions) {
  const eoPath = path.join(root, 'netlify-dist/data/eo', q.id + '.json');
  const eo = fs.existsSync(eoPath) ? JSON.parse(fs.readFileSync(eoPath, 'utf8')) : null;
  const answer = q.opts?.[String(q.answer).charCodeAt(0) - 65] || '';
  const clinical = normalize(q.text + ' ' + answer);
  const taxonomy = eo?.metadata?.taxonomy || (q.commentTopic ? q.commentTopic.split(' › ') : []);
  let grandeArea = areas[taxonomy[0] || eo?.metadata?.specialty] || null;
  let subarea = taxonomy[1] || (eo?.metadata?.specialty === 'Obstetrícia' ? 'Obstetrícia' : eo?.metadata?.specialty === 'Ginecologia' ? 'Ginecologia' : '');
  let tema = taxonomy[2] || '';
  let fonte = taxonomy.length ? 'Taxonomia individual existente' : 'Especialidade individual do objeto educacional';
  let motivo = '';
  if (q.topic) {
    const hint = topics.find(([re]) => re.test(q.topic.toLowerCase()));
    if (hint && hint[3].test(clinical)) {
      [, grandeArea, subarea] = hint; tema = q.topic;
      fonte = 'Tema individual corroborado pelo enunciado e alternativa correta';
      if (grandeArea === 'clinica_medica' && /crianca|menino|menina|na infancia|lactente/.test(clinical)) {
        grandeArea = 'pediatria'; subarea += ' Pediátrica';
      }
    } else { grandeArea = null; motivo = 'Tema não corroborado pelo problema e resposta'; }
  }
  // Don't silently force a primary area for an interdisciplinary source or obvious conflict.
  if (taxonomy[0]?.includes(' · ') || taxonomy[1]?.includes(' · ')) {
    grandeArea = null; motivo = 'Taxonomia interdisciplinar: revisar conhecimento predominante';
  }
  if (!taxonomy.length && !q.topic && grandeArea === 'clinica_medica' && /^(uma? )?(crianca|menino|menina|lactente|recem-nascido)|^(uma? )?gestante/.test(clinical)) {
    grandeArea = null; motivo = 'Especialidade existente conflita com o contexto do paciente';
  }
  // Legacy broad specialties are not equivalent to a clinical review. Corroborate
  // them against the case/answer; contradictions or insufficient evidence stay pending.
  if (!taxonomy.length && !q.topic && grandeArea) {
    const evidence = {
      pediatria: /crianca|menino|menina|lactente|neonat|recem.nascid|pediatr|escolar|puericult|meses de idade/,
      ginecologia_obstetricia: /gesta|gravidez|prenatal|pre-natal|parto|uter|vagin|menstrual|menopaus|mama|contracep|obstetr|ginecol|amenorreia/,
      cirurgia: /cirurg|trauma|fratura|apendic|colecist|hernia|abdome agudo|pos.operator|pneumotorax|queimadur|obstrucao intestinal|drenagem|postectomia/,
      medicina_preventiva: /epidemiol|sus\b|saude da familia|vigilancia|populac|rastreamento|notifica|obito|bioetica|etica medica|prevencao|estudo|territori|politica|atencao primaria/,
      clinica_medica: /diabet|hiperten|cardia|pulmon|pneumonia|tireo|renal|nefro|hiv|aids|hepat|anemia|leucem|linfom|asma|depress|psiquiatr|avc|parkinson|artrite|reumat|mening|cefaleia|neurolog|cutane|dermat|antibiot|infec|seps|convuls|tubercul|sindrome/,
    };
    if (!evidence[grandeArea].test(clinical)) {grandeArea=null;motivo='Especialidade legada sem evidência suficiente no problema e resposta';}
    else if (grandeArea === 'clinica_medica' && /crianca|menino|menina|lactente|recem.nascid|escolar de|queimadur|gestante/.test(clinical.slice(0,250))) {grandeArea=null;motivo='Contexto conflita com especialidade legada';}
  }
  if (overrides[q.id]) {
    [grandeArea,subarea,tema] = overrides[q.id];
    fonte='Revisão individual do enunciado, problema predominante e alternativa correta'; motivo='';
  }
  if (!grandeArea && !motivo) motivo = 'Sem metadados suficientes para classificação segura';
  mapping[q.id] = { grandeArea, subarea, tema, classificacaoPendente: !grandeArea, fonte, ...(motivo ? {motivo} : {}) };
  rows.push({ id:q.id, prova:exam.label, edicao:edition, numero:q.n, ...mapping[q.id] });
}
const distribution = {};
for (const m of Object.values(mapping)) if (m.grandeArea) distribution[m.grandeArea] = (distribution[m.grandeArea] || 0) + 1;
const report = { total:rows.length, classified:rows.filter(r=>!r.classificacaoPendente).length, pending:rows.filter(r=>r.classificacaoPendente).length, distribution, method:'Taxonomia individual existente, especialidade legada corroborada pelo problema/alternativa correta, temas FACISA corroborados e revisões individuais explícitas em area-overrides.json. A triagem automatizada não equivale a uma revisão médica completa dos metadados legados. Evidência insuficiente ou conflitante fica pendente; subárea/tema ausentes não são inventados.', questions:rows };
fs.writeFileSync(path.join(root,'netlify-dist/js/question-classification.js'), '// Generated by scripts/classify-areas.cjs; separate metadata, original questions untouched.\nconst QuestionClassification = ' + JSON.stringify(mapping, null, 2) + ';\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/question-classification-report.json'), JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/area-pending.json'), JSON.stringify(rows.filter(r=>r.classificacaoPendente),null,2)+'\n');
console.log(JSON.stringify({total:report.total,classified:report.classified,pending:report.pending,distribution}));
