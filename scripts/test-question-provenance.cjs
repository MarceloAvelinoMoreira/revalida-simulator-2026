const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function boot() {
  const element = tag => ({tag, children: [], textContent: '', append(...nodes) {this.children.push(...nodes);}, replaceChildren() {this.children=[];}});
  const context = vm.createContext({document:{createElement:element}});
  vm.runInContext(fs.readFileSync(path.join(root,'netlify-dist/js/question-provenance.js'),'utf8')+'\nthis.api=QuestionProvenance;',context);
  return {api:context.api, container:element('div')};
}
test('TPI 1 origins: 73 researched matches, explicit unknowns, no fabricated TPI 3 origins', () => {
  const {api}=boot(); let identified=0;
  for(let n=1;n<=100;n++) {
    const source=api.get({id:'tpi-2026-2-tpi1-'+String(n).padStart(3,'0')});
    if(source){identified++;assert(source.confidence>=75);assert.match(source.source,/^https:\/\//);}
  }
  assert.equal(identified,73);
  assert.equal(api.get({id:'tpi-2026-2-tpi1-014'}),null);
  assert.equal(api.get({id:'tpi-2026-2-tpi3-001'}),null);
});
test('origin disclosure is small by default, carries source caveat, clears when navigating away', () => {
  const {api,container}=boot();
  api.render({id:'tpi-2026-2-tpi1-001'},container);
  const details=container.children[0];
  assert.equal(details.tag,'details');assert.equal(details.open,undefined);
  assert.equal(details.children[0].textContent,'Prova-mãe: SURCE · 2018');
  assert.match(details.children[2].textContent,/não confirmada/);
  assert.equal(details.children[3].rel,'noopener noreferrer');
  api.render({id:'tpi-2026-2-tpi1-014'},container);
  assert.equal(container.children[0].textContent,'Prova-mãe não identificada');
  api.render({id:'2021-001'},container);assert.equal(container.children.length,0);
  api.render(null,null);
});
test('official-document distinction and existing quiz/rapid integration are preserved', () => {
  const {api,container}=boot();api.render({id:'tpi-2026-2-tpi1-032'},container);
  assert.match(container.children[0].children[2].textContent,/documento oficial consultado/);
  for(const name of ['simulator.js','rapid.js']) assert.match(fs.readFileSync(path.join(root,'netlify-dist/js',name),'utf8'),/QuestionProvenance\.render/);
  assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/js\/question-provenance\.js\?v=2/);
});
