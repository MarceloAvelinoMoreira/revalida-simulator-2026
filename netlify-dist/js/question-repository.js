/**
 * QuestionRepository — centralized access to official exam questions (EXAMS).
 * Does not mutate Master content; reads the baked runtime bank only.
 */
const QuestionRepository = (() => {
  const EDITIONS = [
    "2021",
    "2022-1",
    "2022-2",
    "2023-1",
    "2023-2",
    "2024-1",
    "2024-2",
    "2025-1",
    "2025-2",
    "2026-1",
    "2026-2",
    "facisa",
  ];

  function assertBank() {
    if (typeof EXAMS === "undefined" || !EXAMS) {
      throw new Error("QuestionRepository: EXAMS bank not loaded");
    }
  }

  function listEditions() {
    assertBank();
    return EDITIONS.filter((y) => EXAMS[y]);
  }

  function getEdition(year) {
    assertBank();
    return EXAMS[year] || null;
  }

  function getAllQuestions() {
    assertBank();
    const out = [];
    listEditions().forEach((y) => {
      EXAMS[y].questions.forEach((q) => {
        out.push({ ...q, year: y, label: EXAMS[y].label });
      });
    });
    return out;
  }

  function getById(questionId) {
    assertBank();
    for (const y of listEditions()) {
      const hit = EXAMS[y].questions.find((q) => q.id === questionId);
      if (hit) return { ...hit, year: y, label: EXAMS[y].label };
    }
    return null;
  }

  function count() {
    return getAllQuestions().length;
  }

  function isAnnulled(q) {
    const a = q && q.answer;
    return a === "X" || a === "Anulada" || a === "ANULADA";
  }

  return {
    EDITIONS,
    listEditions,
    getEdition,
    getAllQuestions,
    getById,
    count,
    isAnnulled,
  };
})();
