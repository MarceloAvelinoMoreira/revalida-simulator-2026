/**
 * EducationalObjectRepository — lazy fetch + cache for Schema 2.0 EOs and references.
 */
const EducationalObjectRepository = (() => {
  const eoCache = new Map();
  let indexPromise = null;
  let refsPromise = null;
  let index = null;
  let refs = null;

  async function loadIndex() {
    if (index) return index;
    if (!indexPromise) {
      indexPromise = fetch("data/eo-index.json", { cache: "default" })
        .then((r) => {
          if (!r.ok) throw new Error("eo-index.json HTTP " + r.status);
          return r.json();
        })
        .then((data) => {
          index = data;
          return index;
        });
    }
    return indexPromise;
  }

  async function loadReferences() {
    if (refs) return refs;
    if (!refsPromise) {
      refsPromise = fetch("data/references.json", { cache: "default" })
        .then((r) => {
          if (!r.ok) throw new Error("references.json HTTP " + r.status);
          return r.json();
        })
        .then((data) => {
          refs = data;
          return refs;
        });
    }
    return refsPromise;
  }

  async function getByQuestionId(questionId) {
    if (eoCache.has(questionId)) return eoCache.get(questionId);
    const idx = await loadIndex();
    const entry = idx.entries && idx.entries[questionId];
    if (!entry) return null;
    const res = await fetch(entry.path + (entry.path.includes("?") ? "&" : "?") + "v=professor1", { cache: "no-store" });
    if (!res.ok) throw new Error("EO fetch failed " + questionId + " " + res.status);
    const eo = await res.json();
    eoCache.set(questionId, eo);
    return eo;
  }

  async function getIndexEntry(questionId) {
    const idx = await loadIndex();
    return (idx.entries && idx.entries[questionId]) || null;
  }

  async function resolveReference(referenceId) {
    const catalog = await loadReferences();
    return (catalog.references && catalog.references[referenceId]) || null;
  }

  function hasMnemonic(eo) {
    if (!eo) return false;
    const m = (eo.educationalContent || {}).mnemonic || {};
    return !!(m.applicable && (m.body || "").trim());
  }

  return {
    loadIndex,
    loadReferences,
    getByQuestionId,
    getIndexEntry,
    resolveReference,
    hasMnemonic,
    _cache: eoCache,
  };
})();
