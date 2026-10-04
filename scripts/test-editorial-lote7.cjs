"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict"),{test}=require("node:test");
const root=path.resolve(__dirname,"..");
for(const file of fs.readdirSync(root).filter(f=>/^editorial-lote[0-9]+\.json$/.test(f))){
const batch=JSON.parse(fs.readFileSync(path.join(root,file)));
test(file+": original answers, every alternative, references and attention blocks",()=>{
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,"netlify-dist/js/questions.js"),"utf8"),context);
  const exams=vm.runInContext("EXAMS",context);
  const references=JSON.parse(fs.readFileSync(path.join(root,"netlify-dist/data/references.json"))).references;
  assert.equal(new Set(batch.questions.map(q=>q.id)).size,batch.questions.length);
  if(file==="editorial-lote10.json")assert.equal(batch.questions.length,43);
  for(const item of batch.questions){
    const question=Object.values(exams).flatMap(exam=>exam.questions).find(q=>q.id===item.id);
    const eo=JSON.parse(fs.readFileSync(path.join(root,"netlify-dist/data/eo",item.id+".json")));
    assert.equal(eo.officialAnswer,question.answer);
    assert.equal(eo.metadata.editorialReview.batchId,batch.batchId);
    assert.equal(eo.clinicalRationale.correctRationale,item.rationale);
    for(const text of Object.values(item.alternatives))assert.ok(eo.educationalContent.comment.body.includes(text));
    assert.equal(eo.metadata.taxonomy.length,3);
    assert.equal(eo.clinicalRationale.alternativeRationales.length,question.opts.length-1);
    question.opts.forEach((_,i)=>assert.ok(eo.educationalContent.comment.body.includes("A alternativa "+String.fromCharCode(65+i))));
    assert.ok(!eo.educationalContent.comment.body.includes("Leia o caso como encontro clínico"));
    for(const ref of eo.references)assert.ok(references[ref.referenceId]);
    if(item.attention)assert.ok(eo.educationalContent.comment.body.includes("PONTO DE ATENÇÃO"));
    if(item.disputed){assert.equal(eo.metadata.editorialReview.status,"needs-manual-review");assert.ok(!eo.educationalContent.comment.body.includes("está correta"));}
  }
});
}
