/* Guided iPhone installation; native prompt only when provided by the browser. */
(function () {
  'use strict';
  const button = document.getElementById('install-app-button');
  const guide = document.getElementById('install-app-guide');
  if (!button || !guide) return;
  const standalone = window.matchMedia('(display-mode: standalone)');
  let prompt = null;
  const update = () => { button.hidden = standalone.matches || navigator.standalone === true; };
  update();
  standalone.addEventListener('change', update);
  window.addEventListener('appinstalled', () => { prompt = null; button.hidden = true; });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event;
  });
  button.addEventListener('click', async () => {
    if (prompt) {
      const current = prompt;
      prompt = null;
      try { await current.prompt(); return; } catch (_) { /* Show manual guide instead. */ }
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!ios) {
      document.getElementById('install-app-intro').textContent = 'Use a opção de instalação do seu navegador, quando disponível.';
      document.getElementById('install-app-steps').textContent = 'Abra o menu do navegador e procure “Instalar aplicativo” ou “Adicionar à tela inicial”. Se essa opção não aparecer, salve este site nos favoritos. No iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de Início.';
    }
    if (!guide.open) guide.showModal();
  });
  guide.addEventListener('close', () => { button.focus(); });
}());
