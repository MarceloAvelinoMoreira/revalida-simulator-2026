const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const incoming=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const context=vm.createContext({});
for(const f of ['questions.js','questions-2026-2.js','questions-facisa.js','questions-quinzena-01.js','questions-tutoria-semana-01.js','question-repository.js','question-classification.js'])vm.runInContext(read('netlify-dist/js/'+f),context);
const existing=vm.runInContext('EXAMS["tutoria-semana-01"]',context);
const originalCount=existing.questions.length;
const originals=JSON.stringify(existing.questions);
const all=vm.runInContext('QuestionRepository.getAllQuestions()',context);
const classification=vm.runInContext('QuestionClassification',context);
const report=JSON.parse(read('netlify-dist/data/question-classification-report.json'));
const areas={CM:'clinica_medica',CG:'cirurgia',GO:'ginecologia_obstetricia',PED:'pediatria',SC:'medicina_preventiva'};
const topics=['Tuberculose: avaliação de contato e infecção latente','Hipertensão sem lesão aguda de órgão-alvo','Diabetes tipo 2 e doença cardiovascular','Hérnia inguinal encarcerada','Obstrução intestinal por aderências','Trauma pélvico e choque','Rastreamento do colo uterino: DNA-HPV','Assistência ao terceiro período do parto','Pré-eclâmpsia','Prevenção da infecção pelo vírus sincicial respiratório','Desidratação e reidratação enteral','Icterícia neonatal e incompatibilidade ABO','Rastreamento mamográfico e decisão compartilhada','Saúde do trabalhador: notificação e Comunicação de Acidente de Trabalho','Declaração de óbito: morte natural com assistência domiciliar'];
const note='Gabarito elaborado para estudo no PDF fornecido; não é uma publicação oficial da instituição. O arquivo não apresenta comentários ou justificativas.';
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const row of incoming){
  const n=20+row.number,id='tutoria-semana-01-'+String(n).padStart(3,'0');
  if(existing.questions.some(q=>q.id===id)){const q=existing.questions.find(q=>q.id===id);if(q.text!==row.text||q.answer!==row.answer||JSON.stringify(q.opts)!==JSON.stringify(row.opts))throw Error('Conflicting existing question '+id);continue;}
  if(all.some(q=>normalize(q.text)===normalize(row.text)))throw Error('Duplicate source statement '+row.number);
  const extraNote=row.number===3?' Nota do PDF: hemoglobina glicada corrigida para 8,3%.':'';
  const q={id,n,questionNumber:n,year:'tutoria-semana-01',edition:'tutoria-semana-01',text:row.text,statement:row.text,opts:row.opts,alternatives:row.opts,answer:row.answer,correctAnswer:row.answer,answerStatus:'supplied-study-key',answerNote:note+extraNote,explanation:note+extraNote+' Gabarito: '+row.answer+' — '+row.opts[row.answer.charCodeAt(0)-65],commentStatus:'not-provided',source:'Tutoria ENAMED · Semana 01 · P9 + P10',sourceFile:'questoes_enamed_estilo_revalida.pdf',sourceQuestionNumber:row.number,tags:['Tutoria Primeira Semana',topics[row.number-1]]};
  existing.questions.push(q);
  const metadata={grandeArea:areas[row.area],subarea:topics[row.number-1],tema:topics[row.number-1],classificacaoPendente:false,fonte:'Área CM/CG/GO/PED/SC explicitada no PDF Tutoria ENAMED Semana 01 · P9 + P10'};
  classification[id]=metadata;
  report.questions.push({id,prova:'Tutoria Primeira Semana',edicao:'tutoria-semana-01',numero:n,...metadata});
}
if(existing.questions.length!==20+incoming.length||JSON.stringify(existing.questions.slice(0,originalCount))!==originals)throw Error('Original questions changed');
report.total=report.questions.length;report.classified=report.questions.filter(q=>!q.classificacaoPendente).length;report.pending=report.total-report.classified;
report.distribution={};for(const q of report.questions)if(!q.classificacaoPendente)report.distribution[q.grandeArea]=(report.distribution[q.grandeArea]||0)+1;
fs.writeFileSync(path.join(root,'netlify-dist/js/questions-tutoria-semana-01.js'),'// Source PDFs and study keys; externally researched editorial comments identified individually.\nEXAMS["tutoria-semana-01"] = '+JSON.stringify(existing,null,2)+';\n');
fs.writeFileSync(path.join(root,'netlify-dist/js/question-classification.js'),'// Individual metadata; original question IDs are preserved.\nconst QuestionClassification = '+JSON.stringify(classification,null,2)+';\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/question-classification-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('Tutoria Primeira Semana: '+existing.questions.length+' questions; '+(existing.questions.length-originalCount)+' added. Bank total: '+report.total);
