'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const incoming=JSON.parse(read('tmp/pdfs/quinzena02-extracted.json'));
assert.equal(incoming.length,100);
const id='quinzena-02',label='Tutoria Quizenal 2';
const normalize=s=>s.normalize('NFD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const exam={label,questions:incoming.map(row=>{
  assert.equal(normalize(row.opts[row.answer.charCodeAt(0)-65]),normalize(row.providedAnswer),'Source answer mismatch: '+row.n);
  const notice='Gabarito e comentário transcritos do material fornecido, sem revisão clínica independente.'+(row.provisional?' Esta resposta está marcada com asterisco/preliminar no PDF e pode sofrer alteração.':'');
  return {id:id+'-'+String(row.n).padStart(3,'0'),n:row.n,questionNumber:row.n,year:id,edition:id,text:row.text,statement:row.text,opts:row.opts,alternatives:row.opts,answer:row.answer,correctAnswer:row.answer,answerStatus:row.provisional?'supplied-preliminary-key':'supplied-pdf-key',answerNote:notice,officialComment:row.comment,explanation:row.comment,sourceCommentImported:true,commentStatus:'source-imported',commentTopic:row.taxonomy.join(' › '),source:row.source,sourceFile:'Quinzena_02.pdf',sourceQuestionNumber:Number(row.source.match(/Q(\d+)$/)[1]),tags:[label,row.subarea,row.topic]};
})};
fs.writeFileSync(path.join(root,'netlify-dist/js/questions-quinzena-02.js'),'// Supplied booklet statements, keys and commentary; source preliminary markers preserved.\nEXAMS["'+id+'"] = '+JSON.stringify(exam,null,2)+';\n');
const ctx=vm.createContext({});vm.runInContext(read('netlify-dist/js/question-classification.js'),ctx);
const classification=vm.runInContext('QuestionClassification',ctx);
const report=JSON.parse(read('netlify-dist/data/question-classification-report.json'));
report.questions=report.questions.filter(q=>q.edicao!==id);
for(const row of incoming){
  const key=id+'-'+String(row.n).padStart(3,'0');
  const metadata={grandeArea:row.area,subarea:row.subarea,tema:row.topic,classificacaoPendente:false,fonte:'Área e tema informados na resolução comentada do PDF Quinzena_02.pdf'};
  classification[key]=metadata;report.questions.push({id:key,prova:label,edicao:id,numero:row.n,...metadata});
}
report.total=report.questions.length;report.classified=report.questions.filter(q=>!q.classificacaoPendente).length;report.pending=report.total-report.classified;
report.distribution={};for(const q of report.questions)if(!q.classificacaoPendente)report.distribution[q.grandeArea]=(report.distribution[q.grandeArea]||0)+1;
fs.writeFileSync(path.join(root,'netlify-dist/js/question-classification.js'),'// Individual classification; IDs and existing metadata preserved.\nconst QuestionClassification = '+JSON.stringify(classification,null,2)+';\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/question-classification-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(label+': 100 questions, 438 alternatives and 100 source comments imported; bank '+report.total);
