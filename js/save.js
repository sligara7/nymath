/* What she has taught Ember.

   Everything stays on her phone. No account, no server, nothing sent
   anywhere. The whole store is one small object under one key.

   Every read and write is wrapped, because localStorage genuinely throws in
   private windows and when site data is blocked — and a game that white-
   screens because it could not remember a mute setting is worse than a game
   that forgets. Losing the save is survivable; refusing to start is not. */

const Save = (function () {
  const KEY = "nymath.ember.v1";

  const blank = () => ({ lesson: 0, stage: 0, learned: [], muted: false, name: "", questDone: false, den: null });

  /* Ember's den: her coins, what she owns, what she wears, where things are.
     `null` until the den first opens, so a save from before the den existed
     can be told apart from one that has simply bought nothing. */
  const denOf = d => (d && typeof d === "object") ? {
    coins: { gold: (d.coins || {}).gold | 0, silver: (d.coins || {}).silver | 0, copper: (d.coins || {}).copper | 0 },
    owned: Array.isArray(d.owned) ? d.owned.filter(x => typeof x === "string") : [],
    placed: (d.placed && typeof d.placed === "object") ? d.placed : {},
    outfit: (d.outfit && typeof d.outfit === "object") ? d.outfit : {},
    pantry: (d.pantry && typeof d.pantry === "object") ? d.pantry : {},
    paid: Array.isArray(d.paid) ? d.paid.filter(x => typeof x === "string") : [],
    wall: typeof d.wall === "string" ? d.wall : "",
    emberAt: Array.isArray(d.emberAt) ? d.emberAt : null,
    visited: !!d.visited
  } : null;

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
        questDone: !!s.questDone,
        den: denOf(s.den)
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

    /* Teach it all again: the LESSONS start over, and nothing else does. Her
       name, her sound setting, and everything she bought for Ember stay — a
       reset that emptied the den would punish her for practising. */
    reset() {
      state.lesson = 0; state.stage = 0; state.learned = []; state.questDone = false;
      flush();
    },

    /* The den's own corner of the save. Changes go through `den(fn)` so the
       write always happens; reading it returns null until the den has been
       set up once. */
    den(fn) {
      if (fn) { state.den = denOf(fn(state.den) || state.den); flush(); }
      return state.den;
    }
  };
})();
