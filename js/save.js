/* What she has taught Ember.

   Everything stays on her phone. No account, no server, nothing sent
   anywhere. The whole store is one small object under one key.

   Every read and write is wrapped, because localStorage genuinely throws in
   private windows and when site data is blocked — and a game that white-
   screens because it could not remember a mute setting is worse than a game
   that forgets. Losing the save is survivable; refusing to start is not. */

const Save = (function () {
  const KEY = "nymath.ember.v1";

  const blank = () => ({ lesson: 0, stage: 0, learned: [], muted: false, name: "", questDone: false, keepTipSeen: false, den: null });

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

  /* Whatever arrives — from this phone's storage or from a save code — is
     read through the same door, so nothing malformed gets past either way. */
  const normalize = s => ({
    lesson: Number.isInteger(s.lesson) ? s.lesson : 0,
    stage: Number.isInteger(s.stage) ? s.stage : 0,
    learned: Array.isArray(s.learned) ? s.learned.filter(x => typeof x === "string") : [],
    muted: !!s.muted,
    name: typeof s.name === "string" ? s.name.replace(/[^\p{L}\p{M}' -]/gu, "").slice(0, 14) : "",
    questDone: !!s.questDone,
    keepTipSeen: !!s.keepTipSeen,
    den: denOf(s.den)
  });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      return normalize(JSON.parse(raw));
    } catch (e) {
      return blank();
    }
  }

  /* A save code: the whole save as versioned, URL-safe text. It is how her
     progress crosses into an iPhone home-screen app, which starts with
     storage of its own and nothing in it. */
  const CODE_V = "1";

  function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return CODE_V + "." + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(code) {
    try {
      const m = /^(\d+)\.([A-Za-z0-9_-]+)$/.exec(String(code || ""));
      if (!m || m[1] !== CODE_V) return null;
      const bin = atob(m[2].replace(/-/g, "+").replace(/_/g, "/"));
      const s = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
      return s && typeof s === "object" ? normalize(s) : null;
    } catch (e) {
      return null;
    }
  }

  let state = read();
  const watchers = [];

  /* Nothing on this phone yet: no name, no lesson, no den. */
  const isBlank = () => !state.name && !state.den && state.lesson === 0 && state.stage === 0 &&
    state.learned.length === 0 && !state.questDone;

  function flush() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* she plays on */ }
    watchers.forEach(fn => { try { fn(); } catch (e) {} });
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
    started: () => !isBlank(),

    /* Teach it all again: the LESSONS start over, and nothing else does. Her
       name, her sound setting, and everything she bought for Ember stay — a
       reset that emptied the den would punish her for practising. */
    reset() {
      state.lesson = 0; state.stage = 0; state.learned = []; state.questDone = false;
      flush();
    },

    isBlank,

    /* Her whole save as a code, and back. A code is only ever taken into a
       BLANK save: it must never overwrite progress made on this phone. */
    code: () => encode(state),
    adopt(code) {
      const s = decode(code);
      if (!s || !isBlank()) return false;
      state = s;
      flush();
      return true;
    },

    /* Called after every write, so whatever is keeping her save safe can see
       the latest of it. */
    onWrite(fn) { watchers.push(fn); },

    keepTipSeen() { state.keepTipSeen = true; flush(); },

    /* Ask the browser to treat her save as hers to keep, not as a cache it
       may clear when space runs low. It may say no; she plays on either way. */
    persist() {
      try {
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      } catch (e) {}
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
