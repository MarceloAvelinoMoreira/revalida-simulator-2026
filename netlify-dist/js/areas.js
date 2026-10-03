const AreaStudy = (() => {
  let currentArea = null, homeArea = null, studying = false, limit = 20;
  const el = id => document.getElementById(id);
  const esc = value => rapidEscape(value);
  const pct = value => value === null ? 'Sem respostas' : value.toLocaleString('pt-BR',{maximumFractionDigits:1}) + '%';
  const names = {correct:'Correta', wrong:'Incorreta', unanswered:'Não respondida', annulled:'Anulada'};
  function renderHomeChoices() {
    el('home-area-choices').innerHTML = Object.entries(AreaRepository.areas).map(([id,name])=>`<button type="button" class="year-btn${id===homeArea?' selected':''}" aria-pressed="${id===homeArea}" onclick="AreaStudy.selectHomeArea('${id}')">${esc(name)}<span class="yb-sub">${AreaRepository.filter({area:id}).length} questões</span></button>`).join('');
    el('home-area-details').disabled = !homeArea;
  }
  function selectHomeArea(id) {
    if (!AreaRepository.areas[id]) return;
    homeArea=id; renderHomeChoices(); updateStartBtn();
  }
  function detailsFromHome() { if (homeArea) choose(homeArea); }
  function startFromHome() { if (homeArea) {choose(homeArea); start('');} }
  function screens(active) {
    ['home','areas','quiz','rapid','result'].forEach(name=>el('screen-'+name).style.display = name === active ? (name === 'home' ? 'flex' : 'block') : 'none');
  }
  function open() {
    studying = false; screens('areas');
    const pending = AreaRepository.pending().length;
    el('areas-summary').innerHTML = `${AreaRepository.all.length-pending} questões organizadas · ${pending} aguardam revisão de classificação. <a href="data/question-classification-report.json" target="_blank" rel="noopener">Consultar auditoria</a>`;
    el('area-cards').innerHTML = Object.entries(AreaRepository.areas).map(([id,name])=>`<button type="button" class="area-card${id===currentArea?' selected':''}" aria-pressed="${id===currentArea}" onclick="AreaStudy.choose('${id}')"><span>${esc(name)}</span><strong>${AreaRepository.filter({area:id}).length}</strong><small>questões disponíveis</small></button>`).join('');
    if (currentArea) renderDetail();
    window.scrollTo(0,0);
  }
  function options(id, items, label) {
    el(id).innerHTML = `<option value="">${esc(label)}</option>` + items.map(([value,name])=>`<option value="${esc(value)}">${esc(name)}</option>`).join('');
  }
  function choose(id) {
    if (!AreaRepository.areas[id]) return;
    currentArea = id; limit = 20;
    const list = AreaRepository.filter({area:id});
    const subs = [...new Set(list.map(q=>AreaRepository.metadata(q.id).subarea).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    options('area-subarea',subs.map(s=>[s,s]),'Todas as subáreas');
    options('area-exam',[...new Set(list.map(q=>q.year))].map(y=>[y,QuestionRepository.getEdition(y).label]),'Todas as provas');
    options('area-year',[...new Set(list.map(q=>/^\d{4}/.exec(q.year)?.[0]).filter(Boolean))].sort().map(y=>[y,y]),'Todos os anos');
    el('area-status').value=''; el('area-query').value='';
    changeSubarea(); open(); el('area-title').focus();
  }
  function changeSubarea() {
    const list = AreaRepository.filter({area:currentArea,subarea:el('area-subarea').value});
    const topics = [...new Set(list.map(q=>AreaRepository.metadata(q.id).tema).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    options('area-topic',topics.map(s=>[s,s]),'Todos os temas');
    renderDetail();
  }
  function filters() {
    return {area:currentArea, subarea:el('area-subarea').value, tema:el('area-topic').value, exam:el('area-exam').value, year:el('area-year').value, status:el('area-status').value, query:el('area-query').value.trim()};
  }
  function renderDetail() {
    if (!currentArea) return;
    el('area-detail').hidden = false;
    el('area-title').textContent = AreaRepository.areas[currentArea];
    const progress = RevalidaStorage.loadProgress(), all = AreaRepository.filter({area:currentArea},progress), stats = AreaRepository.stats(all,progress);
    el('area-stats').innerHTML = [['Total',stats.total],['Respondidas',stats.answered],['Acertos',stats.correct],['Erros',stats.wrong],['Não respondidas',stats.unanswered],['Anuladas',stats.annulled],['Taxa de acerto',pct(stats.accuracy)],['Progresso',pct(stats.progress)]].map(([label,n])=>`<div><span>${label}</span><strong>${n}</strong></div>`).join('');
    const subs = new Map();
    all.forEach(q=>{ const name=AreaRepository.metadata(q.id).subarea || 'Subárea não especificada'; if (!subs.has(name)) subs.set(name,[]); subs.get(name).push(q); });
    el('area-subareas').innerHTML = [...subs].sort(([a],[b])=>a.localeCompare(b,'pt-BR')).map(([name,list])=>{const s=AreaRepository.stats(list,progress); return `<p><span>${esc(name)}</span><span>${s.total} questões · ${s.answered} respondidas · ${pct(s.accuracy)}</span></p>`;}).join('');
    const list = AreaRepository.filter(filters(),progress);
    el('area-match-count').textContent = `${list.length} questões nesta seleção`;
    el('area-results').innerHTML = list.length ? list.slice(0,limit).map(q=>`<article><div><small>${esc(q.label)} — Questão ${esc(q.n)} · ${names[AreaRepository.status(q,progress)]}</small><p>${esc(String(q.text).replace(/\u00ad/g,'').slice(0,180))}${q.text.length>180?'…':''}</p><small>${esc(AreaRepository.metadata(q.id).tema || AreaRepository.metadata(q.id).subarea || 'Tema não especificado')}</small></div><button type="button" onclick="AreaStudy.question('${esc(q.id)}')" aria-label="Abrir ${esc(q.label)} questão ${esc(q.n)}">Abrir questão</button></article>`).join('') : '<p>Nenhuma questão corresponde aos filtros. Escolha outro status ou remova os filtros.</p>';
    el('area-more').hidden = list.length <= limit;
  }
  function study(list, rapid) {
    if (!list.length) { el('area-match-count').textContent='Nenhuma questão para este modo com os filtros atuais.'; return; }
    studying = true; screens(rapid?'rapid':'quiz');
    if (rapid) openRapidQuestionSet(list,AreaRepository.areas[currentArea]);
    else startQuiz(list);
    window.scrollTo(0,0);
  }
  function start(mode) {
    const f=filters(); if (mode && mode !== 'rapid') {f.status=mode; el('area-status').value=mode;}
    study(AreaRepository.filter(f),mode==='rapid');
  }
  function question(id) {
    const list=AreaRepository.filter(filters()), q=list.find(q=>q.id===id);
    if (!q) return;
    study(list,false); goToQuestion(list.indexOf(q));
  }
  function original() {
    const q=questions[currentIndex]; if (!q) return;
    const list=AreaRepository.all.filter(item=>item.year===q.year);
    study(list,false); goToQuestion(list.findIndex(item=>item.id===q.id));
  }
  function returnToArea() { if (!studying) return false; open(); return true; }
  function home() { studying=false; screens('home'); updateStartBtn(); }
  return {open,choose,changeSubarea,renderDetail,start,question,original,returnToArea,home,renderHomeChoices,selectHomeArea,detailsFromHome,startFromHome,homeSelection:()=>homeArea,isStudying:()=>studying,leaveStudy:()=>{studying=false;},more:()=>{limit+=20;renderDetail();}};
})();
