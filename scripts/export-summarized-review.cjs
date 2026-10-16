// Export only public question data. Never loads app configuration or credentials.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const clean=s=>String(s||'').replace(/<<[^<>]*>>/g,'').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function summarize(text) {
  const original=clean(text);
  const segments=[...new Intl.Segmenter('pt-BR',{granularity:'sentence'}).segment(original)].filter(x=>x.segment.trim());
  const sentences=segments.map(x=>x.segment.trim());
  if(sentences.length<=3||original.length<400)return {text:original,omitted:0};
  const chosen=new Set([0,sentences.length-1]);
  const budget=Math.max(300,Math.min(900,Math.round(original.length*.55)));
  const score=s=> (/(exame|laborator|radiograf|tomograf|ultrass|eletrocard|pressão|frequência|saturação|hemoglob|glicem|creatinin|gesta|sangr|sinal|neg[ao]|sem |não )/i.test(s)?3:0)+(/\d/.test(s)?2:0);
  let used=sentences[0].length+sentences.at(-1).length;
  const ranked=sentences.slice(1,-1).map((s,i)=>({s,i:i+1,score:score(s)})).sort((a,b)=>b.score-a.score||a.i-b.i);
  // Never discard every clinical finding merely because one sentence is long.
  if(ranked.length){chosen.add(ranked[0].i);used+=ranked[0].s.length;}
  for(const row of ranked)if(!chosen.has(row.i)&&used+row.s.length<=budget){chosen.add(row.i);used+=row.s.length;}
  let previous=-1,previousEnd=0,summary='';
  sentences.forEach((sentence,i)=>{if(chosen.has(i)){
    const start=segments[i].index+segments[i].segment.indexOf(sentence);
    summary+=(summary?(i>previous+1?' […] ':original.slice(previousEnd,start)):'')+sentence;
    previous=i;previousEnd=start+sentence.length;
  }});
  return {text:summary,omitted:sentences.length-chosen.size};
}
function load() {
  const context=vm.createContext({});
  for(const file of ['questions.js','questions-2026-2.js','questions-facisa.js','questions-quinzena-01.js','questions-tutoria-semana-01.js','question-repository.js'])vm.runInContext(fs.readFileSync(path.join(root,'netlify-dist/js',file),'utf8'),context);
  return vm.runInContext('QuestionRepository.getAllQuestions()',context);
}
function rows() {
  return load().map(q=>{
    const original=clean(q.text||q.statement),summary=summarize(original);
    const answer=String(q.answer||q.correctAnswer||'').toUpperCase();
    const annulled=['X','ANULADA','ANULADO'].includes(answer);
    const correct=!annulled&&/^[A-E]$/.test(answer)?(q.opts||q.alternatives||[])[answer.charCodeAt(0)-65]:null;
    if(!annulled&&!correct)throw Error('Gabarito inválido: '+q.id);
    const images=(Array.isArray(q.image)?q.image:q.image?[q.image]:[]).filter(x=>typeof x==='string'&&/^assets\/[a-zA-Z0-9/_.-]+\.(png|jpg|jpeg|webp)$/i.test(x));
    return {id:q.id,edition:q.year,label:q.label,n:q.n,original,summary:summary.text,omitted:summary.omitted,correct:correct?clean(correct):null,annulled,note:q.answerNote||'',images};
  });
}
function build(output=path.join(root,'revisao-resumida.html')) {
  const all=rows(),editions=[...new Map(all.map(q=>[q.edition,q.label])).entries()];
  const articles=all.map(q=>`<article data-edition="${esc(q.edition)}" id="${esc(q.id)}">
<div class="origin">${esc(q.label)}</div><h2>Questão ${esc(q.n)}</h2>
<p class="statement">${esc(q.summary)}</p>
${q.images.length?'<p class="warning">Esta questão possui imagem ou tabela. Confira a figura no material original antes de interpretar o resumo.</p>':''}
<div class="answer${q.annulled?' annulled':''}"><span>${q.annulled?'Questão anulada':'Resposta correta no banco'}</span><p>${esc(q.correct||'Sem alternativa correta válida no gabarito.')}</p></div>
${q.note?`<p class="warning">${esc(q.note)}</p>`:''}
<details><summary>Conferir enunciado original${q.omitted?' · '+q.omitted+' trechos omitidos no resumo':''}</summary><p>${esc(q.original)}</p>${q.images.map((src,i)=>`<a href="netlify-dist/${esc(src)}" target="_blank" rel="noopener">Abrir figura ${i+1} no arquivo de origem</a>`).join(' · ')}</details></article>`).join('\n');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REVALIDDA · Enunciados resumidos e respostas</title>
<style>
:root{color-scheme:light;--ink:#14243b;--muted:#586b80;--blue:#2366a8}*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:var(--ink);font-family:"Segoe UI",Arial,sans-serif;line-height:1.65}main{max-width:880px;padding:40px 20px 80px;margin:auto}header{padding-bottom:26px;border-bottom:2px solid #c9d9e9}h1{font-size:clamp(28px,5vw,42px);line-height:1.15;letter-spacing:-1px;margin:8px 0 20px}header p{max-width:72ch;color:var(--muted)}.brand{color:var(--blue);font-weight:700}.filters{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;margin:24px 0}.filters label{display:flex;flex-direction:column;gap:5px;font-size:14px}input,select,button{font:inherit;border:1px solid #a8bcd1;border-radius:8px;padding:10px;background:#fff;color:var(--ink);min-height:44px;min-width:0}button{cursor:pointer;align-self:end}button:hover{background:#e3edf8}:focus-visible{outline:3px solid #327fc8;outline-offset:3px}#count{font-size:14px;color:var(--muted)}article{padding:28px 0;border-top:1px solid #cbd8e5;break-inside:avoid}article[hidden]{display:none}.origin{font-size:13px;color:var(--muted)}h2{font-size:21px;margin:4px 0 14px}.statement{font-size:17px;white-space:pre-wrap}.answer{padding:14px 18px;border-left:3px solid #3079b8;background:#e8f1fa}.answer span{font-size:12px;font-weight:600;color:#325775}.answer p{margin:5px 0 0;font-weight:600}.annulled{border-color:#997648;background:#f4ede3}.warning{font-size:13px;color:#755227}details{margin-top:16px;color:var(--muted);font-size:14px}summary{cursor:pointer;min-height:32px}details a{color:var(--blue)}footer{margin-top:24px;color:var(--muted);font-size:13px}@media(max-width:600px){main{padding:24px 16px 50px}.filters{grid-template-columns:1fr}.statement{font-size:16px}}@media print{body{background:#fff}main{max-width:none;padding:0}.filters,#count{display:none}header p{font-size:11px}article{padding:16px 0}.statement,.answer{font-size:12px}details{display:none}.warning{font-size:10px}h1{font-size:25px}h2{font-size:16px}.answer{background:none}}
</style></head><body><main><header><div class="brand">REVALIDDA · Revisão</div><h1>Enunciados resumidos.<br>Apenas a resposta correta.</h1><p>${all.length.toLocaleString('pt-BR')} questões de ${editions.length} provas. Resumos extrativos automáticos: mantêm frases do enunciado e podem omitir dados importantes. Use para revisão, não como substituto da questão completa. Os gabaritos foram copiados do banco existente, sem nova validação médica.</p><p>O símbolo […] indica cortes. Enunciados curtos foram preservados. Questões anuladas permanecem identificadas. As figuras são links locais para o material de origem.</p></header>
<div class="filters"><label for="edition">Prova<select id="edition"><option value="">Todas as provas</option>${editions.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select></label><label for="search">Buscar no enunciado ou resposta<input id="search" type="search" placeholder="Ex.: icterícia, pré-natal…"></label><button id="print" type="button">Imprimir / salvar PDF</button></div><p id="count" role="status">${all.length} questões exibidas</p><section id="questions" aria-label="Questões resumidas">${articles}</section><footer>Arquivo independente de revisão textual. Não altera o aplicativo nem o progresso do aluno. Gerado a partir do banco local do REVALIDDA.</footer></main>
<script>
const articles=[...document.querySelectorAll('article')];
const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
const searchable=new Map(articles.map(a=>[a,normalize(a.textContent)]));
function filter(){const edition=document.getElementById('edition').value,query=normalize(document.getElementById('search').value.trim());let count=0;for(const article of articles){article.hidden=!!((edition&&article.dataset.edition!==edition)||(query&&!searchable.get(article).includes(query)));if(!article.hidden)count++;}document.getElementById('count').textContent=count+' questões exibidas';}
document.getElementById('edition').addEventListener('change',filter);document.getElementById('search').addEventListener('input',filter);document.getElementById('print').addEventListener('click',()=>window.print());
</script></body></html>`;
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
  console.log(JSON.stringify({arquivo:output,questoes:all.length,anuladas:all.filter(q=>q.annulled).length,resumidas:all.filter(q=>q.omitted>0).length,caracteresOriginais:all.reduce((n,q)=>n+q.original.length,0),caracteresResumos:all.reduce((n,q)=>n+q.summary.length,0)}));
  return output;
}
if(require.main===module)build();
module.exports={clean,summarize,load,rows,build};
