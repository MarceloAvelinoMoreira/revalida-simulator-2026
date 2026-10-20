const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {rows,load,summarize,build,clean}=require('./export-summarized-review.cjs');
test('standalone review: all question IDs, exact keys, no invented answers for annulled questions',()=>{
  const source=load(),data=rows();assert.equal(data.length,1735);assert.equal(new Set(data.map(q=>q.id)).size,1735);
  assert.equal(data.filter(q=>q.annulled).length,73);
  data.forEach((q,i)=>{
    assert.equal(q.id,source[i].id);
    if(q.annulled)assert.equal(q.correct,null);
    else assert.equal(q.correct,clean(source[i].opts[source[i].answer.charCodeAt(0)-65]));
    assert.ok(q.summary.length>0);
    for(const fragment of q.summary.split(' […] '))assert.ok(q.original.includes(fragment));
  });
  assert.equal(summarize('Enunciado curto. Qual o diagnóstico?').text,'Enunciado curto. Qual o diagnóstico?');
});
test('standalone review: self-contained HTML, escaped source, only correct alternatives and filters',()=>{
  const html=fs.readFileSync(build(require('node:path').resolve('tmp/review-test.html')),'utf8');
  assert.equal((html.match(/<article data-edition=/g)||[]).length,1735);
  assert.equal((html.match(/Resposta correta no banco/g)||[]).length,1662);
  assert.equal((html.match(/>Questão anulada</g)||[]).length,73);
  assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+stylesheet|apiKey|Authorization|gsk_|xai-/);
  assert.match(html,/Resumos extrativos automáticos/);assert.match(html,/id="edition"/);assert.match(html,/id="search"/);
  assert.match(html,/Conferir enunciado original/);
  new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
});
