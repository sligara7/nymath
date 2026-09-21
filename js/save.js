/* What she has taught him.

   Everything stays on her phone. No account, no server, nothing sent
   anywhere. The whole store is one small object under one key.

   Every read and write is wrapped, because localStorage genuinely throws in
   private windows and when site data is blocked — and a game that white-
   screens because it could not remember a mute setting is worse than a game
   that forgets. Losing the save is survivable; refusing to start is not. */

const Save = (function () {
  const KEY = "nymath.ember.v1";

  const blank = () => ({ lesson: 0, stage: 0, learned: [], muted: false });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const s = JSON.parse(raw);
      return {
        lesson: Number.isInteger(s.lesson) ? s.lesson : 0,
        stage: Number.isInteger(s.stage) ? s.stage : 0,
        learned: Array.isArray(s.learned) ? s.learned : [],
        muted: !!s.muted
      };
    } catch (e) {
      return blank();
    }
  }

  let state = read();

  function flush() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* she plays on */ }
  }

  return {
    get: () => state,
    at(lesson, stage) { state.lesson = lesson; state.stage = stage; flush(); },
    taught(id) { if (!state.learned.includes(id)) state.learned.push(id); flush(); },
    hasTaught: (id) => state.learned.includes(id),
    setMuted(v) { state.muted = !!v; flush(); },
    /* Offered on the door once there is something to come back to. */
    started: () => state.lesson > 0 || state.stage > 0 || state.learned.length > 0,
    reset() { state = blank(); flush(); }
  };
})();
