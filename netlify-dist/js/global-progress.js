// Same question-ID progress as statistics. Repeated answers never count twice.
const GlobalStudyProgress = (() => {
  const all = QuestionRepository.getAllQuestions();
  const exams = new Map();
  all.forEach(q => { if (!exams.has(q.year)) exams.set(q.year, []); exams.get(q.year).push(q); });
  function refreshExamChecks(progress) {
    const buttons = document.querySelectorAll?.('#screen-home .year-btn[data-year]') || [];
    buttons.forEach(button => {
      const stats = AreaRepository.stats(exams.get(button.dataset.year) || [], progress);
      const valid = stats.total - stats.annulled;
      const complete = valid > 0 && stats.answered === valid;
      let badge = button.querySelector('.exam-complete');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'exam-complete';
        badge.setAttribute('role', 'img');
        badge.setAttribute('aria-label', 'Prova concluída');
        badge.title = 'Todas as questões válidas desta prova foram respondidas';
        badge.innerHTML = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.appendChild(badge);
      }
      badge.hidden = !complete;
    });
  }
  function refresh() {
    const progress = RevalidaStorage.loadProgress();
    refreshExamChecks(progress);
    const stats = AreaRepository.stats(all, progress);
    const total = stats.total - stats.annulled;
    const percent = total ? stats.answered / total * 100 : 0;
    const node = id => document.getElementById(id);
    if (!node('global-progress-bar')) return;
    node('global-progress-percent').textContent = percent.toLocaleString('pt-BR', {maximumFractionDigits:1}) + '%';
    node('global-progress-count').textContent = `${stats.answered.toLocaleString('pt-BR')} / ${total.toLocaleString('pt-BR')}`;
    node('global-progress-count').title = `${stats.total} questões de todas as provas; ${stats.annulled} anuladas não entram no percentual.`;
    node('global-progress-bar').max = Math.max(1,total);
    node('global-progress-bar').value = stats.answered;
  }
  RevalidaStorage.subscribe(refresh);
  window.addEventListener('storage', refresh);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh();
  return {refresh};
})();
