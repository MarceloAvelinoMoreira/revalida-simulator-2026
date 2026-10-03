// Quick answer review: question statement + official correct alternative.
let rapidQuestions = [];
let rapidIndex = 0;

function rapidEscape(value) {
  if (typeof escapeHtml === 'function') return escapeHtml(String(value || ''));
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function rapidText(value) {
  const text = String(value || '').trim();
  return typeof insertSoftHyphens === 'function' ? insertSoftHyphens(text) : text;
}

function rapidAnswerText(question) {
  const answer = String(question.answer || question.correctAnswer || '').toUpperCase();
  if (!answer || answer === 'X' || answer === 'ANULADA') return null;
  const index = answer.charCodeAt(0) - 65;
  const options = question.opts || question.alternatives || [];
  return options[index] ? { letter: answer, text: options[index] } : null;
}

function openRapidAnswers(year) {
  const edition = QuestionRepository.getEdition(year);
  if (!edition) return;

  rapidQuestions = edition.questions.map((question) => ({
    ...question,
    year,
    label: edition.label,
  }));
  if (typeof AreaStudy !== 'undefined') AreaStudy.leaveStudy();
  openRapidQuestionSet(rapidQuestions, edition.label);
}

function openRapidQuestionSet(list, title) {
  if (!list.length) return;
  rapidQuestions = list;

  document.getElementById('screen-home').style.display = 'none';
  document.getElementById('screen-quiz').style.display = 'none';
  document.getElementById('screen-result').style.display = 'none';
  document.getElementById('screen-rapid').style.display = 'block';
  document.getElementById('rapid-title').textContent = `Respostas rápidas · ${title}`;
  document.getElementById('rapid-subtitle').textContent = 'Uma questão por tela: leia o enunciado e confira o gabarito oficial.';
  document.getElementById('rapid-jump').value = '';
  rapidIndex = 0;
  renderRapidQuestion();
  window.scrollTo(0, 0);
}

function goRapidTo(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return;
  rapidIndex = Math.max(0, Math.min(rapidQuestions.length - 1, number - 1));
  renderRapidQuestion();
}

function nextRapidQuestion(delta) {
  rapidIndex = Math.max(0, Math.min(rapidQuestions.length - 1, rapidIndex + delta));
  const jump = document.getElementById('rapid-jump');
  if (jump) jump.value = '';
  renderRapidQuestion();
  window.scrollTo(0, 0);
}

function renderRapidQuestion() {
  const list = document.getElementById('rapid-list');
  const count = document.getElementById('rapid-count');
  const pageLabel = document.getElementById('rapid-page-label');
  const previous = document.getElementById('rapid-prev');
  const next = document.getElementById('rapid-next');
  if (!list || !count || !rapidQuestions.length) {
    if (list) list.innerHTML = '<div class="rapid-empty">Nenhuma questão disponível.</div>';
    return;
  }

  const question = rapidQuestions[rapidIndex];
  const statement = question.text || question.statement || 'Enunciado não disponível.';
  const answer = rapidAnswerText(question);
  const images = !question.image ? [] : (Array.isArray(question.image) ? question.image : [question.image]);
  const mediaHtml = images.map(src => `<img src="${rapidEscape(src)}" alt="Figura da questão ${rapidEscape(question.n)}" loading="lazy" style="max-width:100%;height:auto;display:block;margin:16px auto;border-radius:8px">`).join('');
  const answerHtml = answer
    ? `<div class="rapid-answer"><span class="rapid-answer-label">Resposta ${rapidEscape(answer.letter)}</span><span class="rapid-answer-text">${rapidEscape(rapidText(answer.text))}</span></div>`
    : '<div class="rapid-answer rapid-annulled"><span class="rapid-answer-label">Questão anulada</span><span class="rapid-answer-text">Não há alternativa correta válida no gabarito oficial.</span></div>';
  list.innerHTML = `<article class="rapid-card" id="rapid-question-${rapidEscape(question.n)}">
      <div class="rapid-question-label">${rapidEscape(question.label)} — Questão ${rapidEscape(question.n)}</div>
      <p class="rapid-question-text">${rapidEscape(rapidText(statement))}</p>
      ${mediaHtml}
      ${answerHtml}
    </article>`;
  count.textContent = `${rapidIndex + 1} de ${rapidQuestions.length} questões`;
  if (pageLabel) pageLabel.textContent = `Questão ${question.n}`;
  if (previous) previous.disabled = rapidIndex === 0;
  if (next) next.disabled = rapidIndex === rapidQuestions.length - 1;
}

function closeRapidAnswers() {
  if (typeof AreaStudy !== 'undefined' && AreaStudy.returnToArea()) return;
  document.getElementById('screen-rapid').style.display = 'none';
  document.getElementById('screen-home').style.display = 'flex';
  const jump = document.getElementById('rapid-jump');
  if (jump) jump.value = '';
  window.scrollTo(0, 0);
}
