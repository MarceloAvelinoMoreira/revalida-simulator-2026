"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."), context=vm.createContext({});
for(const file of ["questions.js","questions-2026-2.js","questions-facisa.js","questions-quinzena-01.js"]){
  const p=path.join(root,"netlify-dist/js",file); if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,"utf8"),context);
}
const exams=vm.runInContext("EXAMS",context);
if(process.argv.includes("--reference")){
  for(const n of [6,37,52,67,80]){
    const q=exams["2026-2"].questions.find(q=>q.n===n);
    console.log(JSON.stringify({id:q.id,topic:q.commentTopic,comment:q.officialComment||q.explanation}));
  }
  process.exit(0);
}
const pending=[];
for(const [edition,exam] of Object.entries(exams)){
  let generic=0,specific=0;
  for(const q of exam.questions){
    const p=path.join(root,"netlify-dist/data/eo",q.id+".json");
    const eo=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):null;
    const body=eo?.educationalContent?.comment?.body||"";
    if(body.includes("Leia o caso como encontro clínico")){generic++;pending.push(q);}
    else specific++;
  }
  console.log(JSON.stringify({edition,total:exam.questions.length,generic,specific}));
}
const requestedLimit=Number(process.argv.find(a=>a.startsWith("--limit="))?.split("=")[1])||5;
console.log("NEXT_PENDING",JSON.stringify(pending.filter(q=>!q.image).slice(0,requestedLimit).map(q=>({id:q.id,text:q.text,opts:q.opts,answer:q.answer}))));
