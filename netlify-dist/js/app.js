// Recover local study state immediately; online app opens fetch the current Pages version.
document.addEventListener('DOMContentLoaded', function () {
  if (typeof updateStartBtn === 'function') updateStartBtn();
  let registration, hidden = false, pendingReload = false, reloading = false;
  const root = new URL('../',document.baseURI);
  function studying() {
    return ['screen-quiz','screen-result'].some(id => document.getElementById(id)?.style.display === 'block');
  }
  function progress() {
    if (typeof GlobalStudyProgress !== 'undefined') GlobalStudyProgress.refresh();
  }
  function reloadSafely() {
    if (!pendingReload || reloading || document.hidden || navigator.onLine === false || studying()) return;
    reloading = true;
    // Existing pagehide handlers checkpoint time/session; localStorage is never cleared.
    window.location.reload();
  }
  async function removeLegacyWorker() {
    for (const old of await navigator.serviceWorker.getRegistrations()) {
      if (old.scope === new URL('netlify-dist/',root).href) await old.unregister();
    }
  }
  async function opened(resumed = false) {
    progress();
    if (navigator.onLine === false) return;
    if (registration) registration.update().catch(() => {});
    if (resumed) {
      pendingReload = true;
      reloadSafely();
    }
    if (!reloading && typeof CloudSync !== 'undefined') await CloudSync.sync();
    progress();
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      try { await removeLegacyWorker(); } catch (_) {}
      pendingReload = true; reloadSafely();
    });
    navigator.serviceWorker.register(new URL('service-worker.js',root).href, {scope:root.href,updateViaCache:'none'})
      .then(async next => {
        registration = next;
        await next.update();
        // Migrate the old assets-only registration only after root coverage is active.
        if (next.active) await removeLegacyWorker();
      }).catch(() => {});
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hidden = true;
    else if (hidden) { hidden = false; opened(true); }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) opened(true); });
  window.addEventListener('online', () => opened(pendingReload));
  // An update deferred during a quiz is applied after returning to the menu.
  document.addEventListener('click', () => { if (pendingReload) setTimeout(reloadSafely,0); });
  opened();
});
