// Persistence helpers for REVALIDDA simulator (LocalStorage on Netlify domain)

const RevalidaStorage = (() => {
  const PREFIX = "revalida.sim.v1.";
  const keys = {
    session: PREFIX + "session",
    prefs: PREFIX + "prefs",
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
    return set(keys.session, { ...payload, updatedAt: new Date().toISOString() });
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

  return { keys, get, set, clear, saveSession, loadSession, clearSession, savePrefs, loadPrefs };
})();
