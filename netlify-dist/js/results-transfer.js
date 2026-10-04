// Portable results only: no credentials, question content or assistant history.
const ResultsTransfer = (() => {
  const MAX_BYTES = 2 * 1024 * 1024;
  const bank = new Map(QuestionRepository.getAllQuestions().map(q=>[q.id,q]));
  let pending = null;
  let revision = 0;
  const el = id => document.getElementById(id);
  const status = message => { el('results-transfer-status').textContent = message; };
  function validate(data) {
    if (!data || data.app !== 'REVALIDDA' || data.version !== 1 || !data.results || typeof data.results !== 'object' || Array.isArray(data.results)) throw Error('Formato de backup inválido ou versão não compatível.');
    const results = Object.create(null); let ignored = 0;
    for (const [id,value] of Object.entries(data.results)) {
      const q = bank.get(id);
      if (!q || QuestionRepository.isAnnulled(q)) { ignored++; continue; }
      if (!value || typeof value !== 'object' || typeof value.answer !== 'string' || !/^[A-E]$/.test(value.answer) || !q.opts[value.answer.charCodeAt(0)-65]) throw Error('O arquivo contém uma resposta inválida. Nenhum resultado foi importado.');
      const row = {answer:value.answer,status:value.answer === q.answer ? 'correct' : 'wrong'};
      if (value.elapsedMs !== undefined) {
        if (!Number.isFinite(value.elapsedMs) || value.elapsedMs < 0) throw Error('O arquivo contém um tempo inválido. Nenhum resultado foi importado.');
        row.elapsedMs = value.elapsedMs;
      }
      results[id] = row;
    }
    return {results,ignored};
  }
  function backup() {
    const raw = RevalidaStorage.loadProgress();
    return {app:'REVALIDDA',version:1,exportedAt:new Date().toISOString(),results:validate({app:'REVALIDDA',version:1,results:raw}).results};
  }
  function exportFile() {
    try {
      const data = backup(), url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link = document.createElement('a'); link.href=url; link.download='revalidda-resultados-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('Arquivo de resultados gerado. Salve-o e transfira para o outro dispositivo.');
    } catch (_) { status('Não foi possível exportar os resultados. Verifique os dados e tente novamente.'); }
  }
  function plan(results, replace) {
    const current=RevalidaStorage.loadProgress(), merged=Object.assign(Object.create(null),current), changed=[];
    let kept=0;
    for (const [id,row] of Object.entries(results)) {
      if (current[id] && !replace) { kept++; continue; }
      merged[id]=row; changed.push(id);
    }
    return {merged,changed,kept};
  }
  function apply(results, replace = false) {
    const {merged,changed,kept}=plan(results,replace);
    if (!changed.length) return {imported:0,kept};
    const session=RevalidaStorage.loadSession();
    // Reconcile a local resumable quiz so it cannot undo the imported answers later.
    const revised=session ? JSON.parse(JSON.stringify(session)) : null;
    if (Array.isArray(revised?.questions)) {
      revised.questionStatus = revised.questionStatus || []; revised.userAnswers = revised.userAnswers || [];
      revised.questions.forEach((q,i)=>{
        if (!changed.includes(q.id)) return;
        const row=merged[q.id]; revised.questionStatus[i]=row.status; revised.userAnswers[i]=row.answer;
        if (revised.timing) {
          for (const field of ['answeredMs','questionMs']) {
            revised.timing[field] = revised.timing[field] || {};
            if (row.elapsedMs !== undefined) revised.timing[field][q.id]=row.elapsedMs;
            else delete revised.timing[field][q.id];
          }
        }
      });
      if (!RevalidaStorage.set(RevalidaStorage.keys.session,revised)) throw Error('O navegador não permitiu salvar a importação.');
    }
    if (!RevalidaStorage.set(RevalidaStorage.keys.progress,merged)) {
      if (revised) RevalidaStorage.set(RevalidaStorage.keys.session,session);
      throw Error('O navegador não permitiu salvar os resultados. Tente novamente com armazenamento disponível.');
    }
    return {imported:changed.length,kept};
  }
  async function selectFile(input) {
    cancel(false);
    const selectionRevision = revision;
    const file=input.files?.[0]; if (!file) return;
    try {
      if (file.size > MAX_BYTES) throw Error('Arquivo muito grande. O limite é 2 MB.');
      let data; try { data=JSON.parse(await file.text()); } catch (_) { throw Error('O arquivo não é um JSON válido.'); }
      if (selectionRevision !== revision) return;
      pending=validate(data);
      const current=RevalidaStorage.loadProgress();
      const duplicates=Object.keys(pending.results).filter(id=>current[id]).length;
      el('results-import-preview').hidden=false;
      el('results-import-policy').value='keep';
      el('results-import-description').textContent=`${Object.keys(pending.results).length} resultados válidos; ${duplicates} questões já existem neste navegador; ${pending.ignored} questões desconhecidas ou anuladas serão ignoradas. Confira a opção abaixo antes de importar.`;
      status('Arquivo validado. Nenhum dado foi alterado ainda.');
    } catch (error) { if (selectionRevision === revision) status(error.message); }
    finally { input.value=''; }
  }
  function confirm() {
    if (!pending) return;
    try {
      const result=apply(pending.results,el('results-import-policy').value==='replace');
      cancel(false); StudyStatistics.render();
      status(`${result.imported} resultados importados; ${result.kept} resultados existentes preservados. Os gráficos foram atualizados.`);
    } catch (error) { status(error.message); }
  }
  function cancel(announce=true) { revision++; pending=null; el('results-import-preview').hidden=true; if (announce) status('Importação cancelada. Seus resultados não foram alterados.'); }
  return {backup,validate,apply,exportFile,selectFile,confirm,cancel};
})();
