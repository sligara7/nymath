/* AMBIENCE — wind, a low cave drone, and the occasional far-off bell.

   Synthesized, not downloaded. The owner already proved this route in
   musicjug: audio files would be the heaviest thing on the page, over a phone
   connection, and a loop short enough to ship is a loop she will hear repeat.
   Noise shaped by a filter never repeats and costs nothing.

   Nothing starts until she taps, because no browser permits it — which is why
   the door exists at all. */

const Ambience = (function () {
  let ctx = null, master = null, bells = null, started = false, muted = false;

  function noiseBuffer(seconds) {
    const n = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    /* Brown-ish noise: a running sum rather than white, so it sits low and
       reads as wind rather than as static. */
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  function wind() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(6);
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.value = 0.11;

    /* A slow swell so it breathes instead of sitting there. */
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 0.055;
    lfo.connect(lfoAmt).connect(gain.gain);
    lfo.start();

    src.connect(lp).connect(gain).connect(master);
    src.start();
  }

  function drone() {
    /* Two detuned oscillators a fifth apart — a cave, not a chord. */
    [55, 82.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i ? 0.028 : 0.045;
      o.connect(g).connect(master);
      o.start();
    });
  }

  /* A soft bell every half-minute or so, from a pentatonic set so any two of
     them agree with each other however they land. */
  const PENT = [523.25, 587.33, 698.46, 783.99, 932.33];

  function bell(freq, when, vol) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 2.2);
    o.connect(g).connect(bells);
    o.start(when);
    o.stop(when + 2.4);
  }

  function scheduleBells() {
    if (!ctx) return;
    bell(PENT[(Math.random() * PENT.length) | 0], ctx.currentTime + 0.1, 0.05);
    setTimeout(scheduleBells, 22000 + Math.random() * 26000);
  }

  return {
    /* Called from her first tap, and only from there. */
    wake() {
      if (started) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ctx.destination);
        bells = ctx.createGain();
        bells.gain.value = 0.6;
        bells.connect(master);
        wind();
        drone();
        setTimeout(scheduleBells, 9000);
        started = true;
      } catch (e) { /* silence is an acceptable outcome; a crash is not */ }
    },

    setMuted(v) {
      muted = !!v;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.08);
    },

    /* A stone going down. Short, soft, and pitched a little differently every
       time so that laying twelve of them does not turn into a machine. */
    stone() {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(320 + Math.random() * 90, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.14);
    },

    lift() {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(420, t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.12);
    },

    /* A row falling into place. Small reward, often. */
    row() {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      bell(PENT[2], t, 0.07);
    },

    /* Ember understanding something. Big reward, rare — a rising fifth, which
       is the most unambiguously "yes" interval there is. */
    learned() {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      bell(523.25, t, 0.11);
      bell(783.99, t + 0.13, 0.11);
      bell(1046.5, t + 0.28, 0.08);
    }
  };
})();
