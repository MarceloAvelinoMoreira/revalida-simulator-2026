// Supabase owns authentication/refresh; existing storage remains the offline cache.
const CloudSync = (() => {
  const config = window.REVALIDDA_CLOUD_CONFIG || {};
  const el = id => document.getElementById(id);
  const status = text => { if (el('cloud-status')) el('cloud-status').textContent = text; };
  const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(config.url || '') && /^sb_publishable_/.test(config.publishableKey || '');
  const client = configured && window.supabase ? window.supabase.createClient(config.url, config.publishableKey) : null;
  const PROFILE_KEY = 'revalida.cloud.profile';
  const readProfile = () => {
    const p = RevalidaStorage.get(PROFILE_KEY);
    return p && typeof p.id === 'string' && typeof p.name === 'string' && /^[a-f0-9]{32}$/.test(p.code || '') ? p : null;
  };
  let user = readProfile(), busy = false, timer, generation = 0, applying = false;
  const pendingKey = id => 'revalida.cloud.pending.' + id;
  const valid = results => ResultsTransfer.validate({app:'REVALIDDA',version:1,results}).results;
  function quizOpen() { return ['screen-quiz','screen-result'].some(id => el(id)?.style.display === 'block'); }
  function render() {
    if (!el('cloud-login')) return;
    el('cloud-login').hidden = !!user;
    el('cloud-account').hidden = !user;
    el('cloud-name-label').textContent = user?.name || '';
    el('cloud-recovery-code').value = user?.code || '';
    el('cloud-submit').disabled = false;
  }
  function changed() {
    if (!user || applying) return;
    const queue = RevalidaStorage.get(pendingKey(user.id)) || {};
    const progress = RevalidaStorage.loadProgress();
    for (const [id,row] of Object.entries(valid(progress))) queue[id] = {...row, updatedAt:progress[id].updatedAt || new Date(0).toISOString()};
    if (!RevalidaStorage.set(pendingKey(user.id), queue)) { status('Sem espaço no navegador. Exporte uma cópia dos resultados.'); return; }
    status('Salvo neste dispositivo. Sincronização pendente.');
    clearTimeout(timer); timer = setTimeout(sync, 1500);
  }
  async function sync() {
    if (!client || !user || busy) return;
    if (navigator.onLine === false) { status('Sem internet: resultados salvos neste dispositivo.'); return; }
    // Never overwrite the active engine with remote answers. Upload/pull resumes at the menu.
    if (quizOpen()) { status('Salvo localmente. A nuvem será atualizada ao sair do simulado.'); return; }
    busy = true;
    const id = user.id, turn = generation;
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),15000);
    try {
      await connect(user,controller.signal);
      if (generation !== turn) return;
      const sent = RevalidaStorage.get(pendingKey(id)) || {};
      const entries = Object.entries(sent).map(([question_id,row]) => ({question_id,answer:row.answer,elapsed_ms:row.elapsedMs ?? null,updated_at:row.updatedAt}));
      const {data,error} = await client.rpc('sync_study_results', {entries}).abortSignal(controller.signal);
      if (error) throw error;
      if (generation !== turn || quizOpen()) return;
      if (!Array.isArray(data)) throw Error('invalid response');
      const raw = Object.create(null), dates = Object.create(null);
      for (const row of data) {
        if (!row || typeof row.question_id !== 'string' || !Number.isFinite(Date.parse(row.updated_at))) throw Error('invalid row');
        raw[row.question_id] = {answer:row.answer};
        if (row.elapsed_ms !== null) raw[row.question_id].elapsedMs = row.elapsed_ms;
        dates[row.question_id] = row.updated_at;
      }
      const remote = valid(raw), current = RevalidaStorage.loadProgress(), imported = Object.create(null);
      // Keep edits that happened while the request was in flight.
      const queue = RevalidaStorage.get(pendingKey(id)) || {};
      for (const [key,row] of Object.entries(remote)) {
        if (queue[key] && JSON.stringify(queue[key]) !== JSON.stringify(sent[key])) continue;
        current[key] = {...row,updatedAt:dates[key]};
        imported[key] = row;
      }
      applying = true;
      try {
        ResultsTransfer.apply(imported,true);
        if (!RevalidaStorage.set(RevalidaStorage.keys.progress,current,true)) throw Error('storage');
        if (typeof releaseQuizState === 'function') releaseQuizState();
      } finally { applying = false; }
      for (const key of Object.keys(sent)) if (JSON.stringify(queue[key]) === JSON.stringify(sent[key])) delete queue[key];
      if (!RevalidaStorage.set(pendingKey(id),queue)) throw Error('storage');
      if (typeof StudyStatistics !== 'undefined') StudyStatistics.render();
      status(Object.keys(queue).length ? 'Há novos resultados aguardando sincronização.' : 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR') + '.');
    } catch (_) {
      if (generation === turn) status('Não foi possível sincronizar. Seus resultados continuam salvos aqui; tentaremos novamente.');
    } finally { clearTimeout(timeout); busy = false; }
  }
  function selectProfile(next) {
    if (next?.id === user?.id) { user = next; render(); return; }
    generation++;
    // Pause/save the previous account before changing storage scope.
    if (typeof goHome === 'function') goHome();
    if (typeof releaseQuizState === 'function') releaseQuizState();
    user = next; RevalidaStorage.useAccount(user?.id); render();
    status(user ? 'Perfil ativo. Salvamento automático neste navegador.' : 'Modo visitante. Os resultados anteriores foram preservados.');
    if (typeof StudyStatistics !== 'undefined') StudyStatistics.open();
    if (user) { changed(); setTimeout(sync,0); }
  }
  async function authenticate(event) {
    event.preventDefault();
    const name = el('cloud-username').value.trim();
    if (name.length < 2 || name.length > 40 || /[\u0000-\u001f\u007f]/.test(name)) { status('Use um nome entre 2 e 40 caracteres.'); return; }
    el('cloud-submit').disabled = true;
    try {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
      const next = {id:crypto.randomUUID(),name,code};
      if (!RevalidaStorage.set(PROFILE_KEY,next)) throw Error('storage');
      selectProfile(next); importGuest();
      if (!client) status('Perfil criado e salvo neste navegador. A nuvem ainda não foi configurada.');
      else await sync();
    } catch (_) { status('Não foi possível criar o perfil. Verifique o armazenamento do navegador.'); }
    finally { el('cloud-submit').disabled = false; }
  }
  async function hash(code) {
    const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));
    return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
  }
  async function connect(profile, signal, existing=false) {
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) { const {error} = await client.auth.signInAnonymously(); if (error) throw error; }
    const {data,error} = await client.rpc('connect_study_profile', {
      profile_id:existing ? null : profile.id, display_name:profile.name || '', recovery_hash:await hash(profile.code)
    }).abortSignal(signal);
    if (error || !data || typeof data.id !== 'string' || typeof data.name !== 'string') throw Error('profile');
    if (!existing && data.id !== profile.id) throw Error('profile mismatch');
    return {...data,code:profile.code};
  }
  async function joinDevice(event) {
    event.preventDefault();
    if (!client) { status('Configure a nuvem antes de conectar outro dispositivo.'); return; }
    if (busy || quizOpen()) { status('Volte ao menu e aguarde antes de conectar um perfil.'); return; }
    const code = el('cloud-device-code').value.trim().toLowerCase().replace(/[-\s]/g,'');
    if (!/^[a-f0-9]{32}$/.test(code)) { status('Confira o código de 32 caracteres do dispositivo de origem.'); return; }
    el('cloud-connect').disabled = true;
    const controller = new AbortController(), timeout = setTimeout(()=>controller.abort(),15000);
    try {
      const next = await connect({code},controller.signal,true);
      if (!RevalidaStorage.set(PROFILE_KEY,next)) throw Error('storage');
      selectProfile(next); el('cloud-device-code').value = ''; await sync();
    } catch (_) { status('Não foi possível conectar. Confira o código, a internet e a configuração da nuvem.'); }
    finally { clearTimeout(timeout); el('cloud-connect').disabled = false; }
  }
  async function logout() {
    if (busy || quizOpen()) { status('Volte ao menu e aguarde a sincronização antes de trocar de perfil.'); return; }
    await sync();
    RevalidaStorage.clear(PROFILE_KEY); selectProfile(null);
  }
  function importGuest() {
    if (!user) return;
    const guest = RevalidaStorage.get('revalida.sim.v1.progress') || {};
    try { const result = ResultsTransfer.apply(valid(guest)); status(result.imported + ' resultados locais adicionados à conta; existentes preservados.'); }
    catch (_) { status('Não foi possível adicionar os resultados locais.'); }
  }
  function init() {
    if (user) RevalidaStorage.useAccount(user.id);
    render();
    if (!client) status('Nuvem ainda não configurada. Você já pode criar um perfil e salvar neste navegador.');
    RevalidaStorage.subscribe(changed);
    if (user && client) setTimeout(sync,0);
    setInterval(() => { if (!document.hidden) sync(); },30000);
    window.addEventListener('online',sync);
    window.addEventListener('storage',event => {
      if (event.key === PROFILE_KEY || event.key === null) selectProfile(readProfile());
      else if (event.key === RevalidaStorage.keys.progress) changed();
    });
    document.addEventListener('visibilitychange',() => { if (!document.hidden) sync(); });
  }
  init();
  return {authenticate,logout,importGuest,sync,joinDevice};
})();
