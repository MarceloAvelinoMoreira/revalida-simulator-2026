// Access code is submitted only to the project RPC; never persisted or logged.
(function () {
  'use strict';
  const node = id => document.getElementById(id);
  const form = node('developer-login');
  if (!form) return;
  let code = '', offset = 0, busy = false, generation = 0;
  const client = crypto.randomUUID();
  async function load() {
    if (busy) return;
    busy = true;
    const requestGeneration = generation;
    const control = new AbortController(), timer = setTimeout(() => control.abort(), 10000);
    node('developer-status').textContent = 'Carregando registros…';
    try {
      const config = window.REVALIDDA_CLOUD_CONFIG || {};
      if (!/^https:\/\/[^/]+\.supabase\.co$/.test(config.url || '') || !config.publishableKey) throw Error();
      const response = await fetch(config.url + '/rest/v1/rpc/site_developer_activity', {
        method:'POST', credentials:'omit', signal:control.signal,
        headers:{'Content-Type':'application/json',apikey:config.publishableKey},
        body:JSON.stringify({access_code:code,client_id:client,page_offset:offset})
      });
      if (!response.ok) throw Error();
      const data = await response.json();
      if (requestGeneration !== generation) return;
      if (data.error) {
        node('developer-status').textContent = data.error === 'rate_limited' ? 'Muitas tentativas. Aguarde 15 minutos.' : 'Código incorreto.';
        logout(false); return;
      }
      if (!Array.isArray(data.rows) || data.rows.length > 100 || !['devices','visits','unmapped_visits'].every(k => Number.isSafeInteger(data[k]) && data[k] >= 0)) throw Error();
      const fragment = document.createDocumentFragment();
      for (const row of data.rows) {
        if (!/^[a-f0-9-]{36}$/.test(row.device_id) || !Number.isSafeInteger(row.visits) || row.visits < 0) throw Error();
        const tr = document.createElement('tr');
        for (const value of [row.device_id, row.visits, new Date(row.first_seen).toLocaleString('pt-BR'), new Date(row.last_seen).toLocaleString('pt-BR')]) {
          const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
        }
        fragment.appendChild(tr);
      }
      node('developer-devices').replaceChildren(fragment);
      node('developer-summary').textContent = `${data.devices} navegadores registrados · ${data.visits} visitas reais · ${data.unmapped_visits} visitas antigas sem identificação. O ajuste manual de 100 não entra neste relatório.`;
      node('developer-results').hidden = false; form.hidden = true;
      node('developer-more').hidden = data.rows.length < 100;
      node('developer-status').textContent = data.rows.length ? 'Registros carregados.' : 'Nenhum registro nesta página.';
    } catch (_) {
      if (requestGeneration !== generation) return;
      node('developer-status').textContent = 'Não foi possível carregar. Verifique a conexão e a ativação da migração no Supabase.';
      logout(false);
    } finally { clearTimeout(timer); busy = false; }
  }
  function logout(clearStatus = true) {
    generation++;
    code = ''; offset = 0; node('developer-code').value = '';
    node('developer-devices').replaceChildren(); node('developer-summary').textContent = '';
    node('developer-results').hidden = true; form.hidden = false;
    if (clearStatus) node('developer-status').textContent = 'Área bloqueada.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); if (busy) return;
    code = node('developer-code').value.trim(); node('developer-code').value = ''; offset = 0;
    if (!/^\d{8}$/.test(code)) { logout(); node('developer-status').textContent = 'Digite o código de 8 números.'; return; }
    load();
  });
  node('developer-more').addEventListener('click', () => { if (!busy) { offset += 100; load(); } });
  node('developer-logout').addEventListener('click', () => logout());
  document.addEventListener('visibilitychange', () => { if (document.hidden) logout(); });
}());
