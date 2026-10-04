// Derive statistics from the same persistent question-ID progress used by exams/areas.
// No separate scores database, fabricated dates or duplicated answer history.
const StudyStatistics = (() => {
  const el = id => document.getElementById(id);
  const esc = value => rapidEscape(String(value));
  const pct = value => value === null ? 'Sem respostas' : value.toLocaleString('pt-BR',{maximumFractionDigits:1}) + '%';
  const duration = ms => ms === null ? 'Sem dados' : QuizClock.format(Math.round(ms / 1000) * 1000);
  function timingStats(progress) {
    const samples = AreaRepository.all.filter(q => ['correct','wrong'].includes(AreaRepository.status(q,progress))
      && Number.isFinite(progress[q.id]?.elapsedMs) && progress[q.id].elapsedMs >= 0);
    const average = list => list.length ? list.reduce((sum,q)=>sum+progress[q.id].elapsedMs,0)/list.length : null;
    const meanMs = average(samples);
    const areas = Object.entries(AreaRepository.areas).map(([id,name]) => {
      const correct = samples.filter(q => AreaRepository.metadata(q.id).grandeArea === id
        && !AreaRepository.metadata(q.id).classificacaoPendente && AreaRepository.status(q,progress) === 'correct');
      return {name,count:correct.length,meanMs:average(correct)};
    });
    const comparable = areas.filter(row=>row.count > 0);
    const extreme = fn => comparable.length >= 2 ? comparable.filter(row=>row.meanMs === fn(...comparable.map(r=>r.meanMs))) : [];
    return {count:samples.length,meanMs,exam100Ms:meanMs === null ? null : meanMs*100,areas,
      slowest:extreme(Math.max),fastest:extreme(Math.min)};
  }
  function snapshot() {
    const progress = RevalidaStorage.loadProgress();
    return {
      timing: timingStats(progress),
      overall: AreaRepository.stats(AreaRepository.all, progress),
      areas: [...Object.entries(AreaRepository.areas).map(([id,name])=>({name, ...AreaRepository.stats(AreaRepository.filter({area:id},progress),progress)})),
        {name:'Classificação pendente', ...AreaRepository.stats(AreaRepository.pending(),progress)}],
      exams: QuestionRepository.listEditions().map(year=>({name:QuestionRepository.getEdition(year).label,
        ...AreaRepository.stats(AreaRepository.all.filter(q=>q.year===year),progress)}))
    };
  }
  function table(rows, caption) {
    return `<table><caption>${esc(caption)}</caption><thead><tr><th scope="col">Grupo</th><th scope="col">Respondidas / válidas</th><th scope="col">Acertos</th><th scope="col">Erros</th><th scope="col">Taxa de acerto</th><th scope="col">Progresso</th></tr></thead><tbody>` + rows.map(row=>`<tr><th scope="row">${esc(row.name)}</th><td>${row.answered} / ${row.total-row.annulled}</td><td>${row.correct}</td><td>${row.wrong}</td><td>${pct(row.accuracy)}</td><td><progress aria-label="Progresso em ${esc(row.name)}" value="${row.answered}" max="${Math.max(1,row.total-row.annulled)}"></progress><span>${pct(row.progress)}</span></td></tr>`).join('') + '</tbody></table>';
  }
  function render() {
    const data = snapshot(), s=data.overall;
    const t = data.timing;
    el('statistics-timing-summary').innerHTML = [['Média por questão',duration(t.meanMs)],['Estimativa para 100 questões',duration(t.exam100Ms)],['Respostas cronometradas',t.count]].map(([label,value])=>`<div><span>${label}</span><strong>${esc(value)}</strong></div>`).join('');
    const areaLabel = rows => rows.map(row=>`${row.name} (${duration(row.meanMs)}, ${row.count} ${row.count === 1 ? 'acerto' : 'acertos'})`).join('; ');
    el('statistics-timing-insight').textContent = t.slowest.length
      ? `Maior tempo médio para acertar: ${areaLabel(t.slowest)}. Menor tempo médio para acertar: ${areaLabel(t.fastest)}.${t.slowest.length > 1 || t.fastest.length > 1 ? ' Áreas com a mesma média aparecem empatadas.' : ''}`
      : 'Responda corretamente questões cronometradas em pelo menos duas grandes áreas para comparar a mais rápida e a mais demorada.';
    el('statistics-timing-areas').innerHTML = '<table><caption>Tempo médio apenas das respostas corretas cronometradas</caption><thead><tr><th scope="col">Grande área</th><th scope="col">Acertos com tempo</th><th scope="col">Tempo médio para acertar</th></tr></thead><tbody>'
      + t.areas.map(row=>`<tr><th scope="row">${esc(row.name)}</th><td>${row.count}</td><td>${duration(row.meanMs)}</td></tr>`).join('') + '</tbody></table>';
    el('statistics-summary').innerHTML = [['Questões no banco',s.total],['Respondidas',s.answered],['Acertos',s.correct],['Erros',s.wrong],['Não respondidas',s.unanswered],['Anuladas',s.annulled],['Taxa de acerto',pct(s.accuracy)],['Progresso',pct(s.progress)]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
    el('statistics-empty').hidden = s.answered > 0;
    el('statistics-areas').innerHTML = table(data.areas,'Questões válidas e últimas respostas por grande área');
    el('statistics-exams').innerHTML = table(data.exams,'Questões válidas e últimas respostas por prova');
    const available=RevalidaStorage.progressPersistenceAvailable();
    el('statistics-storage').textContent = available
      ? 'Salvamento automático ativo neste navegador.'
      : 'O navegador não permite salvar os dados agora. Verifique o armazenamento e as permissões do site; suas próximas respostas podem não permanecer após fechar a aba.';
    el('statistics-storage').classList[available?'remove':'add']('storage-warning');
  }
  function open() {
    AreaStudy.leaveStudy();
    ['home','areas','quiz','rapid','result'].forEach(name=>el('screen-'+name).style.display='none');
    el('screen-statistics').style.display='block';
    render(); el('statistics-title').focus(); window.scrollTo(0,0);
  }
  function home() { el('screen-statistics').style.display='none'; AreaStudy.home(); window.scrollTo(0,0); }
  if (typeof window.addEventListener === 'function') window.addEventListener('storage',event=>{
    if ((event.key === null || event.key === RevalidaStorage.keys.progress || event.key === RevalidaStorage.keys.session) && el('screen-statistics').style.display==='block') render();
  });
  return {open,home,render,snapshot};
})();
