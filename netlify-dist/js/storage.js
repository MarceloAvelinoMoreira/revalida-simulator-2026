// Persistence helpers for REVALIDDA simulator (LocalStorage on Netlify domain)

const RevalidaStorage = (() => {
  const PREFIX = "revalida.sim.v1.";
  let progressWriteFailed = false;
  const keys = {
    session: PREFIX + "session",
    prefs: PREFIX + "prefs",
    progress: PREFIX + "progress",
  };

  function safeParse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function get(key) {
    try {
      return safeParse(localStorage.getItem(key));
    } catch (_) {
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clear(key) {
    try {
      if (key) localStorage.removeItem(key);
      else {
        Object.values(keys).forEach((k) => localStorage.removeItem(k));
      }
    } catch (_) {}
  }

  function saveSession(payload) {
    const progress = loadProgress();
    (Array.isArray(payload.questions) ? payload.questions : []).forEach((q, i) => {
      const status = payload.questionStatus && payload.questionStatus[i];
      const answer = payload.userAnswers && payload.userAnswers[i];
      if (q?.id && ['correct', 'wrong'].includes(status) && /^[A-E]$/.test(answer || '')) {
        progress[q.id] = { status, answer };
      }
    });
    const progressSaved = set(keys.progress, progress);
    progressWriteFailed = !progressSaved;
    const sessionSaved = set(keys.session, { ...payload, updatedAt: new Date().toISOString() });
    return progressSaved && sessionSaved;
  }

  function loadProgress() {
    const saved = get(keys.progress);
    const progress = Object.create(null);
    const validSaved = saved && typeof saved === 'object' && !Array.isArray(saved);
    if (validSaved) {
      Object.entries(saved).forEach(([id, value]) => {
        if (value && ['correct', 'wrong'].includes(value.status) && /^[A-E]$/.test(value.answer || '')) progress[id] = value;
      });
    }
    // Recover the available legacy session once; older overwritten sessions cannot be recovered.
    if (!validSaved) {
      const legacy = loadSession();
      (Array.isArray(legacy?.questions) ? legacy.questions : []).forEach((q, i) => {
        const status = legacy.questionStatus?.[i], answer = legacy.userAnswers?.[i];
        if (q?.id && ['correct', 'wrong'].includes(status) && /^[A-E]$/.test(answer || '')) progress[q.id] = {status, answer};
      });
      progressWriteFailed = !set(keys.progress, progress);
    }
    return progress;
  }

  function loadSession() {
    return get(keys.session);
  }

  function clearSession() {
    clear(keys.session);
  }

  function savePrefs(prefs) {
    return set(keys.prefs, prefs);
  }

  function loadPrefs() {
    return get(keys.prefs) || {};
  }

  function progressPersistenceAvailable() {
    try {
      // Verify storage without deleting data or replacing an existing progress record.
      const raw = localStorage.getItem(keys.progress);
      localStorage.setItem(keys.progress, raw === null ? '{}' : raw);
      return !progressWriteFailed;
    } catch (_) { return false; }
  }

  return { keys, get, set, clear, saveSession, loadSession, clearSession, savePrefs, loadPrefs, loadProgress, progressPersistenceAvailable };
})();
