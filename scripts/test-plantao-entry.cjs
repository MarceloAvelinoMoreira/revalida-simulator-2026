const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Entry cross pulses only onscreen and in visible tab; no timer or data write',()=>{
 let callback,listener,active=false;
 const entry={classList:{toggle:(name,state)=>{assert.equal(name,'pulse-visible');active=state;}}};
 const document={hidden:false,querySelector:()=>entry,addEventListener:(name,fn)=>{assert.equal(name,'visibilitychange');listener=fn;}};
 const source=fs.readFileSync('netlify-dist/js/plantao-entry.js','utf8');
 vm.runInNewContext(source,{document,IntersectionObserver:class{constructor(cb){callback=cb;}observe(node){assert.equal(node,entry);}}});
 callback([{isIntersecting:true}]);assert.equal(active,true);
 document.hidden=true;listener();assert.equal(active,false);
 document.hidden=false;listener();assert.equal(active,true);
 callback([{isIntersecting:false}]);assert.equal(active,false);
 assert.doesNotMatch(source,/localStorage|setInterval|requestAnimationFrame/);
 const css=fs.readFileSync('netlify-dist/css/plantao-entry.css','utf8');
 assert.match(css,/plantao-cross-pulse 2\.4s ease-in-out infinite/);
 assert.match(css,/prefers-reduced-motion:reduce.*animation:none/s);
 vm.runInNewContext(source,{document:{querySelector:()=>null}});
});
