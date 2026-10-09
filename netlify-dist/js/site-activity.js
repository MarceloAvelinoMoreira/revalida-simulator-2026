// Anonymous, approximate usage metrics. Never sends study data or recovery codes.
const SiteActivity = (() => {
  const config = window.REVALIDDA_CLOUD_CONFIG || {};
  const node = id => document.getElementById(id);
  let busy = false;
  function identifier(storageName,key) {
    try {
      const storage=window[storageName];
      const old = storage.getItem(key);
      if (/^[a-f0-9-]{36}$/.test(old || '')) return old;
      const value = crypto.randomUUID(); storage.setItem(key,value); return value;
    } catch (_) { return crypto.randomUUID(); }
  }
  const device = identifier('localStorage','revalidda.activity.device');
  const session = identifier('sessionStorage','revalidda.activity.session');
  function state(message) { if(node('site-activity-status')) node('site-activity-status').textContent=message; }
  async function refresh() {
    if (busy || document.hidden || navigator.onLine === false) return;
    if (!/^https:\/\/[^/]+\.supabase\.co$/.test(config.url || '') || !config.publishableKey) { state('Contadores ainda não configurados.'); return; }
    busy=true;
    const controller = new AbortController(), timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const response=await fetch(config.url+'/rest/v1/rpc/site_activity',{
        method:'POST',credentials:'omit',signal:controller.signal,
        headers:{'Content-Type':'application/json',apikey:config.publishableKey},
        body:JSON.stringify({session_id:session,device_id:device})
      });
      if(!response.ok) throw Error('unavailable');
      const data=await response.json();
      if(!Number.isSafeInteger(data.accesses)||data.accesses<0||!Number.isSafeInteger(data.online)||data.online<0) throw Error('invalid');
      if(node('site-accesses')) node('site-accesses').textContent=data.accesses.toLocaleString('pt-BR');
      if(node('site-online')) node('site-online').textContent=data.online.toLocaleString('pt-BR');
      state('Atualizado agora. Contagem iniciada com a ativação deste recurso.');
    } catch (_) { if(node('site-online')) node('site-online').textContent='—'; state('Contadores indisponíveis no momento. Os dados de estudo continuam salvos.'); }
    finally {clearTimeout(timeout);busy=false;}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) refresh();});
  window.addEventListener('online',refresh);
  window.addEventListener('offline',()=>{if(node('site-online')) node('site-online').textContent='—';state('Sem internet. Contadores indisponíveis.');});
  setInterval(refresh,30000);
  refresh();
  return {refresh};
})();
