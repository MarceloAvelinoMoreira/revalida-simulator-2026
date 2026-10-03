/**
 * QuestionEoResolver — joins official question + Educational Object for render.
 */
const QuestionEoResolver = (() => {
  async function resolve(questionId) {
    const question = QuestionRepository.getById(questionId);
    if (!question) {
      return { ok: false, error: "question_not_found", questionId };
    }
    if (question.sourceCommentImported) {
      return {
        ok: true,
        questionId,
        question,
        eo: null,
        view: { ...buildFallbackView(question), compatibility: { ok: true, warnings: [] }, sourceCommentImported: true },
      };
    }
    let eo = null;
    let eoError = null;
    try {
      eo = await EducationalObjectRepository.getByQuestionId(questionId);
    } catch (e) {
      eoError = String(e && e.message ? e.message : e);
    }
    if (!eo) {
      return {
        ok: false,
        error: eoError || "eo_not_found",
        questionId,
        question,
        eo: null,
        view: buildFallbackView(question),
      };
    }
    const compatibility = validateCompatibility(question, eo);
    const view = buildView(question, eo, compatibility);
    return {
      ok: compatibility.ok,
      questionId,
      question,
      eo,
      compatibility,
      view,
      warnings: compatibility.warnings,
    };
  }

  function validateCompatibility(question, eo) {
    const warnings = [];
    const qAns = question.answer;
    const eoAns = eo.officialAnswer;
    const qAnn = QuestionRepository.isAnnulled(question) || qAns === "X";
    const eoAnn = !!eo.annulled || eoAns === "X";
    if (qAnn !== eoAnn) warnings.push("annulled_mismatch");
    if (!qAnn && !eoAnn && qAns && eoAns && qAns !== eoAns) warnings.push("answer_mismatch");
    if (eo.questionId !== question.id) warnings.push("questionId_mismatch");
    return { ok: warnings.length === 0, warnings };
  }

  function letterIndex(letter) {
    return "ABCDE".indexOf(letter);
  }

  function buildView(question, eo, compatibility) {
    const edu = eo.educationalContent || {};
    const comment = ((edu.comment || {}).body || "").trim();
    const takeHome = (edu.takeHomeMessage || "").trim();
    const mnemonic = edu.mnemonic || {};
    const mnemonicBody =
      mnemonic.applicable && (mnemonic.body || "").trim() ? mnemonic.body.trim() : null;
    const cr = (eo.clinicalRationale || {}).correctRationale || "";
    const alts = (eo.clinicalRationale || {}).alternativeRationales || [];
    const refs = eo.references || [];
    const keyPoints = Array.isArray(edu.keyPoints) ? edu.keyPoints.filter((x) => (x || "").trim()) : [];
    const annulled = QuestionRepository.isAnnulled(question) || !!eo.annulled || eo.officialAnswer === "X";

    const byAlt = {};
    alts.forEach((a) => {
      if (a && a.alternativeId) byAlt[a.alternativeId] = a;
    });

    return {
      questionId: question.id,
      annulled,
      officialAnswer: annulled ? "X" : question.answer,
      comment,
      takeHome,
      mnemonic: mnemonicBody,
      hasMnemonic: !!mnemonicBody,
      correctRationale: cr,
      alternativeRationales: byAlt,
      references: refs,
      keyPoints,
      specialty: (eo.metadata || {}).specialty || null,
      compatibility,
    };
  }

  function buildFallbackView(question) {
    const annulled = QuestionRepository.isAnnulled(question);
    return {
      questionId: question.id,
      annulled,
      officialAnswer: annulled ? "X" : question.answer,
      comment: question.officialComment || "",
      takeHome: "",
      mnemonic: question.mnemonic || null,
      hasMnemonic: !!(question.mnemonic && String(question.mnemonic).trim()),
      correctRationale: question.explanation || "",
      alternativeRationales: {},
      references: [],
      keyPoints: [],
      specialty: null,
      compatibility: { ok: false, warnings: ["eo_missing"] },
    };
  }

  async function enrichReferences(view) {
    if (!view || !view.references || !view.references.length) return [];
    const out = [];
    for (const r of view.references) {
      const cat = await EducationalObjectRepository.resolveReference(r.referenceId);
      out.push({
        referenceId: r.referenceId,
        role: r.role || null,
        supports: r.supports || [],
        title: cat ? cat.title : r.referenceId,
        citation: cat ? cat.citation : null,
        confidenceLevel: cat ? cat.confidenceLevel : null,
        hierarchyLevel: cat ? cat.hierarchyLevel : null,
        sourceType: cat ? cat.sourceType : null,
        resolved: !!cat,
      });
    }
    return out;
  }

  return { resolve, validateCompatibility, buildView, enrichReferences, letterIndex };
})();
