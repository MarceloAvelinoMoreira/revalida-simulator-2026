'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const incoming=JSON.parse(read('tmp/pdfs/tpi3-extracted.json'));
if(incoming.length!==100)throw Error('Expected 100 questions');
const id='tpi-2026-2-tpi3',label='TPI 2026.2 — TPI 3';
const exam={label,questions:incoming.map(row=>({id:id+'-'+String(row.n).padStart(3,'0'),n:row.n,questionNumber:row.n,year:id,edition:id,text:row.text,statement:row.text,opts:row.opts,alternatives:row.opts,answer:row.answer,correctAnswer:row.answer,answerStatus:'supplied-pdf-key',answerNote:'Gabarito transcrito do PDF fornecido. Comentários e referências reproduzem o material de estudo, sem revisão clínica independente.',officialComment:row.comment,explanation:row.comment,sourceCommentImported:true,commentStatus:'source-imported',takeHome:row.takeHome,source:'TPI 3 · 2026.2',sourceFile:'TPI3_2026-2_INTERATIVA.pdf',sourceQuestionNumber:row.n,tags:['TPI',row.topic],...(row.image?{image:row.image}:{})}))};
fs.writeFileSync(path.join(root,'netlify-dist/js/questions-tpi-2026-2-tpi3.js'),'// Statements, keys, comments and figures transcribed from the supplied PDF.\nEXAMS["'+id+'"] = '+JSON.stringify(exam,null,2)+';\n');
const ctx=vm.createContext({});vm.runInContext(read('netlify-dist/js/question-classification.js'),ctx);
const classification=vm.runInContext('QuestionClassification',ctx);
const report=JSON.parse(read('netlify-dist/data/question-classification-report.json'));
report.questions=report.questions.filter(q=>q.edicao!==id);
for(const row of incoming){
 const key=id+'-'+String(row.n).padStart(3,'0');
 const metadata={grandeArea:row.area,subarea:row.topic,tema:row.topic,classificacaoPendente:false,fonte:'Seção por grande área e tópico do sumário do PDF TPI3_2026-2_INTERATIVA.pdf'};
 classification[key]=metadata;report.questions.push({id:key,prova:label,edicao:id,numero:row.n,...metadata});
}
report.total=report.questions.length;report.classified=report.questions.filter(q=>!q.classificacaoPendente).length;report.pending=report.total-report.classified;
report.distribution={};for(const q of report.questions)if(!q.classificacaoPendente)report.distribution[q.grandeArea]=(report.distribution[q.grandeArea]||0)+1;
fs.writeFileSync(path.join(root,'netlify-dist/js/question-classification.js'),'// Individual classification; IDs and existing metadata preserved.\nconst QuestionClassification = '+JSON.stringify(classification,null,2)+';\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/question-classification-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('TPI 2026.2 — TPI 3: 100 questions imported. Bank: '+report.total);
