// One cached index over the original repository. Metadata never mutates questions.
const AreaRepository = (() => {
  const areas = {
    clinica_medica: 'Clínica Médica', cirurgia: 'Cirurgia', pediatria: 'Pediatria',
    ginecologia_obstetricia: 'Ginecologia e Obstetrícia', medicina_preventiva: 'Medicina Preventiva / Saúde Coletiva'
  };
  const all = QuestionRepository.getAllQuestions();
  const metadata = id => QuestionClassification[id] || {grandeArea:null, subarea:'', tema:'', classificacaoPendente:true};
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f\u00ad]/g,'').toLowerCase();
  const search = new Map(all.map(q => [q.id, normalize(q.text + ' ' + metadata(q.id).tema + ' ' + q.label)]));
  const index = new Map(Object.keys(areas).map(area => [area, all.filter(q=>metadata(q.id).grandeArea === area && !metadata(q.id).classificacaoPendente)]));
  function status(q, progress) {
    if (QuestionRepository.isAnnulled(q)) return 'annulled';
    const answer = progress[q.id]?.answer;
    return answer && q.opts[String(answer).charCodeAt(0)-65] ? (answer === q.answer ? 'correct' : 'wrong') : 'unanswered';
  }
  function filter(f = {}, progress = RevalidaStorage.loadProgress()) {
    return (index.get(f.area) || []).filter(q => {
      const m = metadata(q.id), st = status(q, progress);
      return (!f.subarea || m.subarea === f.subarea) && (!f.tema || m.tema === f.tema)
        && (!f.exam || q.year === f.exam) && (!f.year || /^\d{4}/.exec(q.year)?.[0] === f.year)
        && (!f.query || search.get(q.id).includes(normalize(f.query)))
        && (!f.status || (f.status === 'answered' ? ['correct','wrong'].includes(st) : st === f.status));
    });
  }
  function stats(list, progress = RevalidaStorage.loadProgress()) {
    const result = {total:list.length, correct:0, wrong:0, unanswered:0, annulled:0};
    list.forEach(q=>result[status(q,progress)]++);
    result.answered = result.correct + result.wrong;
    result.accuracy = result.answered ? result.correct / result.answered * 100 : null;
    result.progress = (result.total-result.annulled) ? result.answered / (result.total-result.annulled) * 100 : 0;
    return result;
  }
  return {areas, all, metadata, filter, stats, status, pending:()=>all.filter(q=>metadata(q.id).classificacaoPendente)};
})();
