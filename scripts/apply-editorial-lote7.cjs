"use strict";
// Mechanical merge of separately authored, versioned educational content.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const batchFile=process.argv[2]||"editorial-lote7.json";
const batch=JSON.parse(fs.readFileSync(path.join(root,batchFile)));
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,"netlify-dist/js/questions.js"),"utf8"),context);
const bank=vm.runInContext("EXAMS",context);
const outputs=[];
assert.equal(new Set(batch.questions.map(item=>item.id)).size,batch.questions.length,"Duplicate question IDs");
for(const item of batch.questions){
  const question=Object.values(bank).flatMap(exam=>exam.questions).find(q=>q.id===item.id);
  assert.ok(question,"Unknown question"); assert.equal(item.answer,question.answer);
  const file=path.join(root,"netlify-dist/data/eo",item.id+".json");
  const eo=JSON.parse(fs.readFileSync(file));
  assert.equal(eo.officialAnswer,item.answer);
  assert.ok(eo.educationalContent.comment.body.includes("Leia o caso como encontro clínico") || eo.metadata.editorialReview?.batchId===batch.batchId,"Refusing to replace another specific commentary");
  const letters=Array.from(question.opts,(_,i)=>String.fromCharCode(65+i));
  assert.deepEqual(Object.keys(item.alternatives),letters);
  const paragraphs=letters.map(letter=>"A alternativa "+letter+(item.disputed?" — análise crítica: ":" está "+(letter===item.answer?"correta":"incorreta")+": ")+item.alternatives[letter]);
  eo.clinicalRationale.correctRationale=item.rationale;
  eo.clinicalRationale.alternativeRationales=letters.filter(l=>l!==item.answer).map(l=>({alternativeId:l,verdict:"incorrect",explanation:item.alternatives[l]}));
  eo.educationalContent.comment.body=[
    "QUESTÃO "+question.n,
    "Resposta "+item.answer+" — "+question.opts[item.answer.charCodeAt(0)-65],
    item.taxonomy.join(" › "),item.rationale,...paragraphs,
    ...(item.attention?["⚠ PONTO DE ATENÇÃO\n"+item.attention]:[]),
    "Gabarito registrado no banco: "+item.answer+" (preservado)."
  ].join("\n\n");
  eo.educationalContent.takeHomeMessage=item.takeHome;
  eo.educationalContent.keyPoints=[item.takeHome];
  eo.educationalContent.mnemonic={applicable:false,body:null};
  const keyReference=question.edition==="2021"?"COMMENT-INEP2021-KEY":"COMMENT-INEP-"+question.edition+"-KEY";
  eo.references=[{referenceId:keyReference,role:"official-key",supports:["officialAnswer"]},...item.references.map(id=>({referenceId:id,role:"primary",supports:["correctRationale","comment","alternativeRationales"]}))];
  eo.metadata.specialty=item.taxonomy[0];
  eo.metadata.taxonomy=item.taxonomy;
  eo.metadata.editorialReview={status:item.disputed?"needs-manual-review":"reviewed",batchId:batch.batchId,reviewedAt:batch.reviewedAt,allAlternativesCovered:true,attention:!!item.attention,keyVerification:"Preserved existing answer; no new independent PDF verification in this batch.",sourceAccess:"Official pages and indexed passages consulted; some full pages blocked automated access."};
  outputs.push([file,eo]);
}
const catalogFile=path.join(root,"netlify-dist/data/references.json");
const catalog=JSON.parse(fs.readFileSync(catalogFile));
for(const [id,ref] of Object.entries(batch.references)){
  catalog.references[id]={referenceId:id,...ref,citation:ref.title,sourceType:"guideline",confidenceLevel:"high",hierarchyLevel:2};
}
for(const [,eo] of outputs)for(const ref of eo.references)assert.ok(catalog.references[ref.referenceId],"Unresolved reference: "+ref.referenceId);
// All checks precede the deterministic JSON export.
for(const [file,eo] of outputs)fs.writeFileSync(file,JSON.stringify(eo,null,2)+"\n");
fs.writeFileSync(catalogFile,JSON.stringify(catalog,null,2)+"\n");
console.log("Applied "+outputs.length+" reviewed educational records; no question bank modified.");
