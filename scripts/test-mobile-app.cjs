"use strict";
const {test}=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"), path=require("node:path");
const root=path.resolve(__dirname,"..");
test("iPhone installs the current app with brain icons and matching dark theme",()=>{
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(html,/apple-mobile-web-app-capable" content="yes"/);
  assert.match(html,/apple-touch-icon" sizes="180x180" href="assets\/brain-apple-touch-icon.png"/);
  assert.doesNotMatch(html,/rel="(?:icon|apple-touch-icon)"[^>]*robot/);
  for(const relative of ["manifest.webmanifest","netlify-dist/manifest.webmanifest"]){
    const manifestPath=path.join(root,relative), manifest=JSON.parse(fs.readFileSync(manifestPath));
    const directory=path.dirname(manifestPath);
    assert.equal(path.resolve(directory,manifest.start_url),path.join(root,"index.html"));
    assert.equal(path.resolve(directory,manifest.scope),root);
    assert.equal(manifest.display,"standalone");
    assert.equal(manifest.theme_color,"#0a0e1a");
    assert.equal(manifest.background_color,manifest.theme_color);
    for(const icon of manifest.icons){
      const png=fs.readFileSync(path.resolve(directory,icon.src));
      const size=Number(icon.sizes.split("x")[0]);
      assert.equal(png.readUInt32BE(16),size);
      assert.equal(png.readUInt32BE(20),size);
    }
  }
  const touch=fs.readFileSync(path.join(root,"netlify-dist/assets/brain-apple-touch-icon.png"));
  assert.equal(touch.readUInt32BE(16),180);
  assert.equal(touch.readUInt32BE(20),180);
});
test("mobile styles retain zoom, use safe insets and cache the new assets",()=>{
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const css=fs.readFileSync(path.join(root,"netlify-dist/css/mobile-app.css"),"utf8");
  const sw=fs.readFileSync(path.join(root,"netlify-dist/service-worker.js"),"utf8");
  assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1/);
  assert.match(css,/safe-area-inset-top/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/100dvh/);
  assert.match(css,/min-height: 44px/);
  assert.match(css,/font-size: 16px/);
  assert.match(sw,/mobile-app.css/);
  assert.match(sw,/brain-apple-touch-icon.png/);
});
