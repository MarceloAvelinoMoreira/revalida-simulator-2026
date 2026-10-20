'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const incoming=JSON.parse(read('tmp/pdfs/tpi1-extracted.json'));
assert.equal(incoming.length,100);
const id='tpi-2026-2-tpi1',label='TPI 2026.2 - TPI 1';
const exam={label,questions:incoming.map(row=>({id:id+'-'+String(row.n).padStart(3,'0'),n:row.n,questionNumber:row.n,year:id,edition:id,text:row.text,statement:row.text,opts:row.opts,alternatives:row.opts,answer:row.answer,correctAnswer:row.answer,answerStatus:'supplied-pdf-key',answerNote:'Gabarito e comentários transcritos do material fornecido, sem revisão clínica independente. As opções "NÃO MARCAR" foram preservadas para manter as letras originais.',officialComment:row.comment,explanation:row.comment,sourceCommentImported:true,commentStatus:'source-imported',commentTopic:row.taxonomy.join(' › '),source:'TPI 2026.2 - TPI 1',sourceFile:'TPI_2026-2_PROVA1_Diagramada_v2.pdf',sourceQuestionNumber:row.n,tags:['TPI',row.taxonomy[1],row.taxonomy[2]],...(row.image?{image:row.image}:{})}))};
fs.writeFileSync(path.join(root,'netlify-dist/js/questions-tpi-2026-2-tpi1.js'),'// Supplied TPI 1 statements, keys, commentary and images. Original alternative letters preserved.\nEXAMS["'+id+'"] = '+JSON.stringify(exam,null,2)+';\n');
const ctx=vm.createContext({});vm.runInContext(read('netlify-dist/js/question-classification.js'),ctx);
const classification=vm.runInContext('QuestionClassification',ctx);
const report=JSON.parse(read('netlify-dist/data/question-classification-report.json'));
report.questions=report.questions.filter(q=>q.edicao!==id);
for(const row of incoming){
 const key=id+'-'+String(row.n).padStart(3,'0');
 const metadata={grandeArea:row.area,subarea:row.taxonomy[1],tema:row.taxonomy[2],classificacaoPendente:false,fonte:'Seção da prova e tema do comentário no PDF TPI_2026-2_PROVA1_Diagramada_v2.pdf'};
 classification[key]=metadata;report.questions.push({id:key,prova:label,edicao:id,numero:row.n,...metadata});
}
report.total=report.questions.length;report.classified=report.questions.filter(q=>!q.classificacaoPendente).length;report.pending=report.total-report.classified;
report.distribution={};for(const q of report.questions)if(!q.classificacaoPendente)report.distribution[q.grandeArea]=(report.distribution[q.grandeArea]||0)+1;
fs.writeFileSync(path.join(root,'netlify-dist/js/question-classification.js'),'// Individual classification; IDs and existing metadata preserved.\nconst QuestionClassification = '+JSON.stringify(classification,null,2)+';\n');
fs.writeFileSync(path.join(root,'netlify-dist/data/question-classification-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(label+': 100 questions and source comments; bank '+report.total);
