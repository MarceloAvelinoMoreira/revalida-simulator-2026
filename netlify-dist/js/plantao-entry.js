'use strict';
// Only the entry cross pulses; no timers, and no animation outside the viewport.
(() => {
  const entry = document.querySelector('.plantao-entry');
  if (!entry || typeof IntersectionObserver === 'undefined') return;
  let visible = false;
  const sync = () => entry.classList.toggle('pulse-visible', visible && !document.hidden);
  const observer = new IntersectionObserver(([record]) => {
    visible = record.isIntersecting;
    sync();
  });
  observer.observe(entry);
  document.addEventListener('visibilitychange', sync);
})();
