const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Six study icons: scoped finite feedback for mouse, keyboard and touch; reduced-motion fallback',()=>{
 const css=fs.readFileSync('netlify-dist/css/study-buttons.css','utf8'),html=fs.readFileSync('index.html','utf8');
 for(const name of ['book','sheet','shuffle','lightning','cross','chart'])assert(css.includes('@keyframes study-'+name));
 for(const mode of ['all','year','custom','rapid','area'])assert.match(html,new RegExp('data-mode="'+mode+'"'));
 assert.equal((html.match(/class="study-icon"/g)||[]).length,6);
 assert.match(css,/@media\(hover:hover\)/);assert.match(css,/:focus-visible \.study-icon/);assert.match(css,/:active \.study-icon/);
 assert.match(css,/var\(--study-icon-action\) \.6s ease-out 1/);
 assert.doesNotMatch(css,/infinite/);
 assert.match(css,/prefers-reduced-motion:reduce.*animation:none!important/s);
 assert.match(html,/study-buttons\.css\?v=interactive2/);
 assert.match(html,/onclick="StudyStatistics\.open\(\)"/);
 for(const mode of ['all','year','custom','rapid','area'])assert(html.includes("selectMode('"+mode+"', this)"));
});
