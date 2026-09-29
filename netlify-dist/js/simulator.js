// ═══════════════════════════════════════════════════════════
// GROQ AI
// ═══════════════════════════════════════════════════════════
async function callAI(systemPrompt, userPrompt, onChunk, onDone, onError, maxTokens) {
  maxTokens = maxTokens || 1000;
  if (globalThis.iMedV5AI) {
    try {
      const full = await globalThis.iMedV5AI.chat({ system: systemPrompt, user: userPrompt, maxTokens: maxTokens, context: 'emergencia', type: 'opinion' });
      if (onChunk) onChunk(full, full);
      if (onDone) onDone(full);
      return full;
    } catch(e) { if (onError) onError(e); throw e; }
  }
  throw new Error('IA indisponível');
}

let currentEduView = null;

function hideEduSurfaces() {
  const aiBox = document.getElementById('ai-box');
  const aiBody = document.getElementById('ai-box-body');
  const btnJ = document.getElementById('btn-justify');
  if (aiBox) aiBox.classList.remove('visible');
  if (aiBody) { aiBody.classList.remove('ai-typing'); aiBody.textContent = ''; }
  if (btnJ) {
    btnJ.classList.remove('loading', 'active');
    btnJ.textContent = '✦ Justificar Resposta';
    btnJ.setAttribute('aria-expanded', 'false');
  }
  ['macete-panel', 'comment-panel', 'takehome-panel', 'refs-panel', 'alt-rationales', 'keypoints-panel'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const kpList = document.getElementById('keypoints-list');
  if (kpList) kpList.innerHTML = '';
  const btnM = document.getElementById('btn-macete');
  const btnC = document.getElementById('btn-comment');
  const btnR = document.getElementById('btn-refs');
  if (btnM) { btnM.classList.remove('active'); btnM.setAttribute('aria-expanded', 'false'); }
  if (btnC) { btnC.classList.remove('active'); btnC.setAttribute('aria-expanded', 'false'); }
  if (btnR) { btnR.classList.remove('active'); btnR.setAttribute('aria-expanded', 'false'); btnR.style.display = 'none'; }
}

async function loadEduForCurrent() {
  const q = questions[currentIndex];
  if (!q || !q.id) {
    currentEduView = null;
    return null;
  }
  try {
    const resolved = await QuestionEoResolver.resolve(q.id);
    currentEduView = resolved.view;
    if (currentEduView && currentEduView.references && currentEduView.references.length) {
      currentEduView.resolvedRefs = await QuestionEoResolver.enrichReferences(currentEduView);
    } else if (currentEduView) {
      currentEduView.resolvedRefs = [];
    }
    return currentEduView;
  } catch (e) {
    currentEduView = {
      comment: q.officialComment || '',
      takeHome: '',
      mnemonic: q.mnemonic || null,
      hasMnemonic: !!(q.mnemonic && String(q.mnemonic).trim()),
      correctRationale: q.explanation || '',
      alternativeRationales: {},
      references: [],
      resolvedRefs: [],
      annulled: QuestionRepository.isAnnulled(q),
      officialAnswer: q.answer,
    };
    return currentEduView;
  }
}

async function justifyAnswer() {
  const btn = document.getElementById('btn-justify');
  const aiBox = document.getElementById('ai-box');
  const aiBody = document.getElementById('ai-box-body');
  if (aiBox.classList.contains('visible') && !btn.classList.contains('loading')) {
    aiBox.classList.remove('visible');
    btn.textContent = 'Justificar resposta';
    btn.setAttribute('aria-expanded', 'false');
    return;
  }
  btn.classList.add('loading');
  btn.textContent = 'Carregando...';
  const view = currentEduView || (await loadEduForCurrent());
  const text = (view && view.correctRationale) || (questions[currentIndex] && questions[currentIndex].explanation) || '';
  aiBox.classList.add('visible');
  aiBody.classList.remove('ai-typing');
  setProse(aiBody, text || 'Justificativa indisponível para esta questão.');
  btn.classList.remove('loading');
  btn.textContent = 'Ocultar justificativa';
  btn.setAttribute('aria-expanded', 'true');
  renderTakeHome(view);
  renderKeyPoints(view);
  renderAltRationales(view);
  syncRefButton(view);
}

function toggleMacete() {
  const panel = document.getElementById('macete-panel');
  const btn = document.getElementById('btn-macete');
  const view = currentEduView;
  const body = view && view.hasMnemonic ? view.mnemonic : null;
  if (!body || !panel) return;
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    setProse(document.getElementById('macete-panel-body'), body);
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  }
}

function toggleComment() {
  const panel = document.getElementById('comment-panel');
  const btn = document.getElementById('btn-comment');
  const view = currentEduView;
  const body = view && view.comment ? view.comment : null;
  if (!body || !panel) return;
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    setProse(document.getElementById('comment-panel-body'), body);
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  }
}

async function toggleRefs() {
  const panel = document.getElementById('refs-panel');
  const btn = document.getElementById('btn-refs');
  const body = document.getElementById('refs-panel-body');
  if (!panel || !btn || !body) return;
  if (panel.style.display === 'none') {
    const view = currentEduView || (await loadEduForCurrent());
    const rows = (view && view.resolvedRefs) || [];
    if (!rows.length) {
      body.innerHTML = '<p class="refs-empty">Nenhuma referência catalogada para esta questão.</p>';
    } else {
      body.innerHTML = rows.map((r) => {
        const role = r.role ? `<span class="ref-role">${escapeHtml(r.role)}</span>` : '';
        const lvl = r.hierarchyLevel != null ? `<span class="ref-level">Nível ${escapeHtml(String(r.hierarchyLevel))}</span>` : '';
        const conf = r.confidenceLevel ? `<span class="ref-conf">${escapeHtml(r.confidenceLevel)}</span>` : '';
        const cite = r.citation ? `<div class="ref-cite">${escapeHtml(r.citation)}</div>` : '';
        const sid = r.resolved ? '' : ' <span class="ref-unresolved">(não resolvida)</span>';
        return `<article class="ref-item"><div class="ref-title">${escapeHtml(r.title || r.referenceId)}${sid}</div>${cite}<div class="ref-meta">${role}${lvl}${conf}</div></article>`;
      }).join('');
    }
    panel.style.display = 'block';
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Soft hyphens for display only — make CSS justify visibly stretch Portuguese clinical prose. */
function insertSoftHyphens(text) {
  return String(text || '').replace(/[A-Za-zÀ-ÖØ-öø-ÿ]{8,}/gu, (word) => {
    if (word === word.toUpperCase() && word.length <= 12) return word;
    let out = '';
    let since = 0;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      out += ch;
      since++;
      const remaining = word.length - i - 1;
      if (since < 5 || remaining < 3) continue;
      const cur = ch.toLowerCase();
      const next = word[i + 1].toLowerCase();
      const vowel = /[aeiouáéíóúâêôãõàü]/;
      const cons = /[bcdfghjklmnpqrstvwxyzç]/;
      if ((vowel.test(cur) && cons.test(next)) || since >= 7) {
        out += '\u00AD';
        since = 0;
      }
    }
    return out;
  });
}

function formatProseHtml(text) {
  return escapeHtml(insertSoftHyphens(text)).replace(/\n/g, '<br>');
}

function setProse(el, text) {
  if (!el) return;
  const raw = String(text || '').trim();
  if (!raw) {
    el.textContent = '';
    return;
  }
  // ABNT-like paragraphs: split blank lines; keep official/educational text escaped
  const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    el.textContent = insertSoftHyphens(raw);
    return;
  }
  el.innerHTML = parts.map((p) => `<p>${formatProseHtml(p)}</p>`).join('');
}

function renderKeyPoints(view) {
  const panel = document.getElementById('keypoints-panel');
  const list = document.getElementById('keypoints-list');
  if (!panel || !list) return;
  const pts = (view && Array.isArray(view.keyPoints)) ? view.keyPoints.filter((x) => (x || '').trim()) : [];
  if (!pts.length) {
    panel.style.display = 'none';
    list.innerHTML = '';
    return;
  }
  list.innerHTML = pts.map((p) => `<li>${escapeHtml(insertSoftHyphens(p))}</li>`).join('');
  panel.style.display = 'block';
}

function renderTakeHome(view) {
  const panel = document.getElementById('takehome-panel');
  const body = document.getElementById('takehome-panel-body');
  if (!panel || !body) return;
  const msg = view && view.takeHome ? view.takeHome.trim() : '';
  if (!msg) {
    panel.style.display = 'none';
    body.textContent = '';
    return;
  }
  setProse(body, msg);
  panel.style.display = 'block';
}

function proseParagraphsHtml(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return `<p>${formatProseHtml(raw)}</p>`;
  return parts.map((p) => `<p>${formatProseHtml(p)}</p>`).join('');
}

function renderAltRationales(view) {
  const wrap = document.getElementById('alt-rationales');
  if (!wrap) return;
  const q = questions[currentIndex];
  if (!view || !q) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, (q.opts || []).length);
  const map = view.alternativeRationales || {};
  const correct = view.annulled ? null : (view.officialAnswer || q.answer);
  const parts = [];
  letters.forEach((ltr) => {
    const isCorrect = !view.annulled && ltr === correct;
    const entry = map[ltr];
    let title;
    let text;
    if (view.annulled) {
      title = `Alternativa ${ltr} (questão anulada)`;
      text = (entry && entry.explanation) || 'Item anulado — sem gabarito oficial A–E.';
    } else if (isCorrect) {
      title = `Por que a alternativa ${ltr} está correta?`;
      text = view.correctRationale || (entry && entry.explanation) || '';
    } else {
      title = `Por que a alternativa ${ltr} está incorreta?`;
      text = (entry && entry.explanation) || '';
    }
    if (!text) return;
    const id = `alt-rat-${ltr}`;
    parts.push(
      `<details class="alt-rationale ${isCorrect ? 'is-correct' : 'is-incorrect'}" id="${id}">` +
        `<summary>${escapeHtml(title)}</summary>` +
        `<div class="alt-rationale-body abnt-prose">${proseParagraphsHtml(text)}</div>` +
      `</details>`
    );
  });
  if (!parts.length) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = parts.join('');
  wrap.style.display = 'block';
}

function syncRefButton(view) {
  const btn = document.getElementById('btn-refs');
  if (!btn) return;
  const has = !!(view && ((view.resolvedRefs && view.resolvedRefs.length) || (view.references && view.references.length)));
  btn.style.display = has ? 'inline-flex' : 'none';
}

function renderQuestionMedia(q) {
  const media = document.getElementById('question-media');
  if (!media) return;
  media.innerHTML = '';
  const imgs = !q.image ? [] : (Array.isArray(q.image) ? q.image : [q.image]);
  if (!imgs.length) {
    media.style.display = 'none';
    return;
  }
  imgs.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Figura da questão ${q.n}`;
    img.loading = 'lazy';
    media.appendChild(img);
  });
  media.style.display = 'flex';
}

function syncExtraButtons(view, q) {
  hideEduSurfaces();
  const btnM = document.getElementById('btn-macete');
  const btnC = document.getElementById('btn-comment');
  const hasM = !!(view && view.hasMnemonic) || !!(q && q.mnemonic);
  const hasC = !!(view && view.comment) || !!(q && q.officialComment);
  if (btnM) {
    btnM.style.display = hasM ? 'inline-flex' : 'none';
  }
  if (btnC) {
    btnC.style.display = hasC ? 'inline-flex' : 'none';
  }
  syncRefButton(view);
}

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let selectedMode = 'all';
let selectedYear = null;
let selectedQty = null;
let questions = [];
let currentIndex = 0;
let correct = 0;
let wrong = 0;
let annulled = 0;
let answered = false;
let lastQuestions = [];
let questionStatus = []; // 'pending' | 'correct' | 'wrong' | 'skipped' | 'annulled'
let userAnswers = [];   // letra escolhida por questão

function selectMode(mode, el) {
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('year-selector').style.display = (mode === 'year' || mode === 'rapid') ? 'block' : 'none';
  document.getElementById('custom-selector').style.display = mode === 'custom' ? 'block' : 'none';
  selectedYear = null;
  selectedQty = null;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('selected'));
  const inp = document.getElementById('custom-qty-input');
  if (inp) inp.value = '';
  const hint = document.getElementById('custom-qty-hint');
  if (hint) { hint.textContent = ''; hint.className = 'custom-qty-hint'; }
  updateStartBtn();
}

function selectYear(year, el) {
  selectedYear = year;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  updateStartBtn();
}

function selectQty(qty, el) {
  selectedQty = qty;
  document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const inp = document.getElementById('custom-qty-input');
  if (inp) inp.value = '';
  showQtyHint(qty);
  updateStartBtn();
}

function onCustomQtyInput(val) {
  // deselect preset buttons
  document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('selected'));
  const n = parseInt(val);
  if (!isNaN(n) && n >= 1) {
    selectedQty = n;
  } else {
    selectedQty = null;
  }
  showQtyHint(selectedQty);
  updateStartBtn();
}

function showQtyHint(qty) {
  const hint = document.getElementById('custom-qty-hint');
  if (!hint) return;
  const total = getTotalQuestions();
  if (!qty || qty < 1) {
    hint.textContent = ''; hint.className = 'custom-qty-hint'; return;
  }
  if (qty > total) {
    hint.textContent = `⚠️ Máximo disponível: ${total} questões`; hint.className = 'custom-qty-hint err'; return;
  }
  hint.textContent = `✓ ${qty} questões sorteadas aleatoriamente`; hint.className = 'custom-qty-hint ok';
}

function getTotalQuestions() {
  return QuestionRepository.count();
}

function updateStartBtn() {
  const btn = document.getElementById('start-btn');
  const total = getTotalQuestions();
  const lbl = document.getElementById('custom-total-label');
  if (selectedMode === 'rapid') {
    btn.textContent = 'Abrir respostas rápidas';
    btn.disabled = !selectedYear;
    return;
  }
  btn.textContent = 'Iniciar simulado';
  if (lbl) lbl.textContent = total + ' questões disponíveis';
  if (selectedMode === 'all') { btn.disabled = false; return; }
  if (selectedMode === 'year') { btn.disabled = !selectedYear; return; }
  if (selectedMode === 'custom') {
    btn.disabled = !selectedQty || selectedQty < 1 || selectedQty > total;
    return;
  }
}

// shuffle() provided by utils.js

function buildQuestions() {
  if (selectedMode === 'all') {
    questions = QuestionRepository.getAllQuestions();
  } else if (selectedMode === 'year') {
    const ed = QuestionRepository.getEdition(selectedYear);
    questions = ed.questions.map(q => ({...q, year: selectedYear, label: ed.label}));
  } else if (selectedMode === 'custom') {
    questions = shuffle(QuestionRepository.getAllQuestions()).slice(0, selectedQty);
  }
  lastQuestions = questions;
}

function persistSession() {
  if (typeof RevalidaStorage === 'undefined') return;
  RevalidaStorage.saveSession({
    selectedMode,
    selectedYear,
    selectedQty,
    currentIndex,
    correct,
    wrong,
    annulled,
    questionStatus,
    userAnswers,
    questions: questions.map(q => ({ id: q.id, year: q.year, label: q.label, n: q.n })),
  });
}

function startQuiz() {
  if (selectedMode === 'rapid') {
    if (selectedYear && typeof openRapidAnswers === 'function') openRapidAnswers(selectedYear);
    return;
  }
  buildQuestions();
  currentIndex = 0; correct = 0; wrong = 0; annulled = 0;
  questionStatus = new Array(questions.length).fill('pending');
  userAnswers = new Array(questions.length).fill(null);
  document.getElementById('screen-home').style.display = 'none';
  document.getElementById('screen-result').style.display = 'none';
  document.getElementById('screen-quiz').style.display = 'block';
  if (typeof EducationalObjectRepository !== 'undefined') {
    EducationalObjectRepository.loadIndex().catch(() => {});
    EducationalObjectRepository.loadReferences().catch(() => {});
  }
  renderQuestion();
  renderQNavGrid();
  persistSession();
}

function restartQuiz() {
  questions = lastQuestions;
  currentIndex = 0; correct = 0; wrong = 0; annulled = 0;
  questionStatus = new Array(questions.length).fill('pending');
  userAnswers = new Array(questions.length).fill(null);
  document.getElementById('screen-result').style.display = 'none';
  document.getElementById('screen-quiz').style.display = 'block';
  renderQuestion();
  renderQNavGrid();
}

function goHome() {
  document.getElementById('screen-quiz').style.display = 'none';
  document.getElementById('screen-result').style.display = 'none';
  document.getElementById('screen-rapid').style.display = 'none';
  document.getElementById('screen-home').style.display = 'flex';
  updateStartBtn();
}

function renderQuestion() {
  answered = false;
  currentEduView = null;
  const q = questions[currentIndex];
  const total = questions.length;
  const pct = ((currentIndex) / total) * 100;

  document.getElementById('quiz-meta').textContent = q.label;
  document.getElementById('quiz-counter').textContent = `${currentIndex + 1} / ${total}`;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('question-num').textContent = `Questão ${q.n} · ${q.year}`;
  document.getElementById('question-text').textContent = insertSoftHyphens(q.text);
  renderQuestionMedia(q);
  hideEduSurfaces();
  syncExtraButtons(null, q);

  const optContainer = document.getElementById('options-container');
  optContainer.innerHTML = '';
  const letters = ['A','B','C','D','E'].slice(0, (q.opts || []).length);

  // Prefetch educational layer without revealing panels
  loadEduForCurrent().then((view) => {
    if (questions[currentIndex] && questions[currentIndex].id === q.id) {
      syncExtraButtons(view, q);
    }
  });

  if (QuestionRepository.isAnnulled(q)) {
    const fb = document.getElementById('feedback-box');
    fb.className = 'feedback-box annulled';
    fb.textContent = '⚠️ Questão anulada pelo gabarito oficial. Não há letra A–E válida para pontuação.';
    if (questionStatus[currentIndex] !== 'annulled') {
      annulled++;
      questionStatus[currentIndex] = 'annulled';
    }
    document.getElementById('btn-next').style.display = 'inline-block';
    document.getElementById('btn-justify').style.display = 'inline-flex';
    document.getElementById('btn-skip').style.display = 'none';
    answered = true;
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.disabled = true;
      btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span class="option-text abnt-prose">${formatProseHtml(opt)}</span>`;
      optContainer.appendChild(btn);
    });
    loadEduForCurrent().then((view) => {
      if (questions[currentIndex] && questions[currentIndex].id === q.id) {
        syncExtraButtons(view, q);
        renderTakeHome(view);
        renderKeyPoints(view);
        renderAltRationales(view);
      }
    });
    renderQNavGrid();
    persistSession();
    return;
  }

  const fb = document.getElementById('feedback-box');
  fb.className = 'feedback-box';
  fb.textContent = '';
  document.getElementById('btn-next').style.display = 'none';

  const btnJustify = document.getElementById('btn-justify');
  const aiBox = document.getElementById('ai-box');
  btnJustify.style.display = 'none';
  btnJustify.classList.remove('loading');
  btnJustify.textContent = 'Justificar resposta';
  aiBox.classList.remove('visible');
  document.getElementById('ai-box-body').textContent = '';

  document.getElementById('btn-skip').style.display = 'inline-block';

  renderQNavGrid();

  // Restore answered state when navigating back
  const prevStatus = questionStatus[currentIndex];
  const prevAns = userAnswers[currentIndex];
  if (prevStatus === 'correct' || prevStatus === 'wrong') {
    answered = true;
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.disabled = true;
      const ltr = letters[i];
      if (ltr === q.answer) btn.classList.add(prevAns === q.answer ? 'correct' : 'reveal-correct');
      if (prevAns && ltr === prevAns && prevAns !== q.answer) btn.classList.add('wrong');
      btn.innerHTML = `<span class="option-letter">${ltr}</span><span class="option-text abnt-prose">${formatProseHtml(opt)}</span>`;
      optContainer.appendChild(btn);
    });
    fb.className = 'feedback-box ' + (prevStatus === 'correct' ? 'correct' : 'wrong');
    fb.textContent = prevStatus === 'correct'
      ? `Correto. A resposta é a alternativa ${q.answer}.`
      : `Incorreto. A resposta correta é a alternativa ${q.answer}.`;
    document.getElementById('btn-next').style.display = 'inline-block';
    document.getElementById('btn-justify').style.display = 'inline-flex';
    document.getElementById('btn-skip').style.display = 'none';
    loadEduForCurrent().then((view) => {
      if (questions[currentIndex] && questions[currentIndex].id === q.id) {
        syncExtraButtons(view, q);
        renderTakeHome(view);
        renderKeyPoints(view);
        renderAltRationales(view);
      }
    });
    return;
  }

  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span class="option-text abnt-prose">${formatProseHtml(opt)}</span>`;
    btn.onclick = () => handleAnswer(letters[i], btn, q);
    optContainer.appendChild(btn);
  });
}

function handleAnswer(chosen, clickedBtn, q) {
  if (answered) return;
  answered = true;

  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.disabled = true);

  const letters = ['A','B','C','D','E'].slice(0, (q.opts || []).length);
  const isCorrect = chosen === q.answer;

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    correct++;
    questionStatus[currentIndex] = 'correct';
    userAnswers[currentIndex] = chosen;
  } else {
    clickedBtn.classList.add('wrong');
    wrong++;
    questionStatus[currentIndex] = 'wrong';
    userAnswers[currentIndex] = chosen;
    allBtns.forEach((b, i) => {
      if (letters[i] === q.answer) b.classList.add('reveal-correct');
    });
  }

  document.getElementById('live-correct').textContent = correct;
  document.getElementById('live-wrong').textContent = wrong;

  const fb = document.getElementById('feedback-box');
  fb.className = 'feedback-box ' + (isCorrect ? 'correct' : 'wrong');
  fb.textContent = isCorrect
    ? `Correto. A resposta é a alternativa ${q.answer}.`
    : `Incorreto. A resposta correta é a alternativa ${q.answer}.`;

  document.getElementById('btn-next').style.display = 'inline-block';
  document.getElementById('btn-justify').style.display = 'inline-flex';
  document.getElementById('btn-skip').style.display = 'none';

  loadEduForCurrent().then((view) => {
    syncExtraButtons(view, q);
    renderTakeHome(view);
    renderKeyPoints(view);
    renderAltRationales(view);
  });

  renderQNavGrid();
  persistSession();
}

function skipQuestion() {
  if (answered) return;
  questionStatus[currentIndex] = 'skipped';
  renderQNavGrid();
  nextQuestion();
}

function renderQNavGrid() {
  const grid = document.getElementById('qnav-grid');
  if (!grid || !questions.length) return;
  grid.innerHTML = questions.map((q, i) => {
    let cls = 'qnav-btn';
    const st = questionStatus[i] || 'pending';
    if (i === currentIndex) cls += ' qnav-current';
    else if (st === 'correct') cls += ' qnav-correct';
    else if (st === 'wrong') cls += ' qnav-wrong';
    else if (st === 'skipped') cls += ' qnav-skipped';
    else if (st === 'annulled') cls += ' qnav-annulled';
    return `<button class="${cls}" onclick="goToQuestion(${i})" title="Questão ${q.n}">${q.n}</button>`;
  }).join('');
}

function goToQuestion(idx) {
  if (idx < 0 || idx >= questions.length) return;
  currentIndex = idx;
  renderQuestion();
  // close panel on mobile
  document.getElementById('qnav-panel').classList.remove('open');
  const body = document.querySelector('.quiz-body');
  if (body) { body.scrollTo(0, 0); window.scrollTo(0, 0); }
}

function toggleQNav() {
  document.getElementById('qnav-panel').classList.toggle('open');
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    showResult();
  } else {
    renderQuestion();
    document.querySelector('.quiz-body').scrollTo(0, 0);
    window.scrollTo(0, 0);
  }
}

function showResult() {
  document.getElementById('screen-quiz').style.display = 'none';
  document.getElementById('screen-result').style.display = 'block';

  const pct = calcScorePercent(correct, wrong);

  document.getElementById('score-pct').textContent = pct + '%';
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent = wrong;
  document.getElementById('stat-annulled').textContent = annulled;

  const [, title, sub] = scoreTitleForPercent(pct);
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-subtitle').textContent = sub;

  const circumference = 427;
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(() => {
    document.getElementById('score-circle').style.strokeDashoffset = offset;
    document.getElementById('score-circle').style.transition = 'stroke-dashoffset 1s ease';
  }, 100);
  persistSession();
}
