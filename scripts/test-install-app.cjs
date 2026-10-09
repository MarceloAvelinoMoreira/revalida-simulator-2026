const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(installed = false, ios = true) {
  const events = {}, clicks = {}, nodes = {};
  for (const id of ['install-app-button', 'install-app-guide', 'install-app-intro', 'install-app-steps']) {
    nodes[id] = { hidden: false, open: false, textContent: '', addEventListener: (e, f) => { clicks[id + e] = f; }, focus() { this.focused = true; }, showModal() { this.open = true; } };
  }
  const media = { matches: installed, addEventListener: (e, f) => { events.media = f; } };
  vm.runInNewContext(fs.readFileSync('netlify-dist/js/install-app.js', 'utf8'), {
    document: { getElementById: id => nodes[id] },
    window: { matchMedia: () => media, addEventListener: (e, f) => { events[e] = f; } },
    navigator: { userAgent: ios ? 'iPhone' : 'Windows', platform: '', maxTouchPoints: 0 }
  });
  return { events, clicks, nodes, media };
}
test('installation: iPhone guide, repeated clicks, close focus and standalone hiding', async () => {
  const { nodes, clicks, events, media } = setup();
  await clicks['install-app-buttonclick']();
  assert.equal(nodes['install-app-guide'].open, true);
  await clicks['install-app-buttonclick']();
  clicks['install-app-guideclose']();
  assert.equal(nodes['install-app-button'].focused, true);
  media.matches = true; events.media();
  assert.equal(nodes['install-app-button'].hidden, true);
  assert.equal(setup(true).nodes['install-app-button'].hidden, true);
});
test('installation: native prompt, failure guide and unsupported browser instructions', async () => {
  const { nodes, clicks, events } = setup(false, false);
  let called = 0;
  events.beforeinstallprompt({ preventDefault() {}, async prompt() { called++; } });
  await clicks['install-app-buttonclick']();
  assert.equal(called, 1); assert.equal(nodes['install-app-guide'].open, false);
  events.beforeinstallprompt({ preventDefault() {}, async prompt() { throw new Error('Unavailable'); } });
  await clicks['install-app-buttonclick']();
  assert.equal(nodes['install-app-guide'].open, true);
  assert.match(nodes['install-app-steps'].textContent, /favoritos/);
  events.appinstalled(); assert.equal(nodes['install-app-button'].hidden, true);
});
