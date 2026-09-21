/* What she has taught him.

   Everything stays on her phone. No account, no server, nothing sent
   anywhere. The whole store is one small object under one key.

   Every read and write is wrapped, because localStorage genuinely throws in
   private windows and when site data is blocked — and a game that white-
   screens because it could not remember a mute setting is worse than a game
   that forgets. Losing the save is survivable; refusing to start is not. */

const Save = (function () {
  const KEY = "nymath.ember.v1";

  const blank = () => ({ lesson: 0, stage: 0, learned: [], muted: false, name: "", questDone: false });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const s = JSON.parse(raw);
      return {
        lesson: Number.isInteger(s.lesson) ? s.lesson : 0,
        stage: Number.isInteger(s.stage) ? s.stage : 0,
        learned: Array.isArray(s.learned) ? s.learned : [],
        muted: !!s.muted,
        name: typeof s.name === "string" ? s.name : "",
        questDone: !!s.questDone
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

    /* Letters, spaces, hyphens and apostrophes only, and short. Sanitised on
       the way IN so that nothing downstream has to remember to — it is put
       straight into Ember's speech, which is markup. */
    setName(v) {
      state.name = String(v || "").replace(/[^\p{L}\p{M}' -]/gu, "").trim().slice(0, 14);
      flush();
      return state.name;
    },
    questDone() { state.questDone = true; flush(); },
    /* Offered on the door once there is something to come back to. */
    started: () => state.lesson > 0 || state.stage > 0 || state.learned.length > 0,
    reset() { state = blank(); flush(); }
  };
})();
