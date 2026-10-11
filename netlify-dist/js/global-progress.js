// Same question-ID progress as statistics. Repeated answers never count twice.
const GlobalStudyProgress = (() => {
  const all = QuestionRepository.getAllQuestions();
  function refresh() {
    const progress = RevalidaStorage.loadProgress();
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
