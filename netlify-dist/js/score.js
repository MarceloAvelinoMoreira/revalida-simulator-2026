// Score helpers — used by showResult() in simulator.js
// Kept as thin helpers matching original calculation logic.

function calcScorePercent(correctCount, wrongCount) {
  const answered = correctCount + wrongCount;
  return answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
}

function scoreTitleForPercent(pct) {
  const titles = [
    [90, '🏆 Excelente!', 'Desempenho extraordinário nesta prova.'],
    [75, '👏 Muito bom!', 'Você está bem preparado para o Revalida.'],
    [60, '📈 Bom trabalho!', 'Continue revisando os pontos de atenção.'],
    [0, '💪 Continue praticando!', 'A prática leva à perfeição.']
  ];
  return titles.find(([min]) => pct >= min);
}
