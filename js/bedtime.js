/* BEDTIME — Ember sleeps when the player does.

   Her bedtime is 10:30 at night, because that is the player's own (she said
   so herself). Night runs from then until 5:00 in the morning, by the
   phone's own clock. The clock is read to know whether it is night and for
   nothing else: nothing here times her or counts anything down.

   Three things happen, and each is a short scene with Ember:

     TUCK-IN  She is still playing when 10:30 arrives. Ember never interrupts
              a build; at the next break she yawns and asks to be tucked in.
              There is no "not yet". Tucking her in ends the night.

     LATE     The game is opened during the night. Ember is asleep. She wakes,
              asks how the player is and whether everything is okay, and
              takes one of two answers. Then she sends her back to sleep.

     NAP      In the daytime she can put Ember down from the den, and wake
              her again. Nothing closes.

   At night both roads end the same way: Ember says the three sentences
   below, and the game stays closed until morning.

   THE THREE SENTENCES ARE HER FATHER'S, WORD FOR WORD. They are why the late
   scene exists. Do not reword them.

   "NOT REALLY" IS NOT EMBER UNDERSTANDING HER. Ember cannot understand
   anything she says. The reply is one fixed line her father chose in
   advance, and what it does is send her to him. */

const Bedtime = (function () {

  const BED = 22 * 60 + 30;      /* 10:30 pm, in minutes after midnight */
  const MORNING = 5 * 60;        /* 5:00 am */

  const THREE = "You are beautiful, you are smart, and you are loved.";

  const SAY = {
    asleep: "Shh. Ember is asleep.",
    wakes: "Mmf… oh, {name}. It's the middle of the night. How are you? Is everything okay?",
    okay: "Good. I'm glad. Now back to sleep, you. " + THREE,
    notReally: "That sounds hard. Can you go tell Dad? He'd want to know.",
    afterNotReally: "And then try to sleep. " + THREE,
    tuck: "*Yaaawn.* It's my bedtime, {name}. Yours too. Will you tuck me in?",
    tucked: "Goodnight, {name}. " + THREE,
    closed: "Ember is asleep. She'll be up in the morning.",
    nap: "A nap? Mmm. Yes please. Tuck me in?",
    napping: "Zzz…"
  };

  let now = () => new Date();
  let ui = null, wired = false, onA = null, onB = null, onArt = null;

  function isNight(d) {
    d = d || now();
    const m = d.getHours() * 60 + d.getMinutes();
    return m >= BED || m < MORNING;
  }

  function wire() {
    if (wired) return;
    wired = true;
    ui.a.addEventListener("click", () => { if (onA) onA(); });
    ui.b.addEventListener("click", () => { if (onB) onB(); });
    ui.art.addEventListener("click", () => { if (onArt) onArt(); });
  }

  /* One beat of a scene: how Ember looks, what she says, and what can be
     tapped. A button with no label is not there. */
  function beat(o) {
    if (o.sleeping) Ember.drawSleeping(ui.art); else Ember.draw(ui.art, o.mood || "sleepy");
    ui.says.innerHTML = Lessons.fill(o.says);
    ui.foot.textContent = o.foot || "";
    ui.a.textContent = o.a || ""; ui.a.hidden = !o.a;
    ui.b.textContent = o.b || ""; ui.b.hidden = !o.b;
    onA = o.onA || null; onB = o.onB || null; onArt = o.onArt || null;
    if (!o.quiet) Ambience.say(Lessons.fill(o.says).replace(/\*[^*]*\*/g, ""));
  }

  /* The end of every night: Ember asleep, and nothing to tap but her. If the
     page is still open when morning comes, a tap finds her awake. */
  function closed(onMorning) {
    beat({
      sleeping: true, says: SAY.closed, quiet: true,
      onArt: () => { if (!isNight() && onMorning) onMorning(); }
    });
  }

  /* Drowsy, not yet asleep: she is the one saying it. */
  const goodnight = (says, onMorning) => beat({
    mood: "sleepy", says, a: "Goodnight, Ember", onA: () => closed(onMorning)
  });

  return {
    isNight, THREE, SAY, BED, MORNING,

    /* She was playing when bedtime came. */
    tuckIn(els, onMorning) {
      ui = els; wire();
      ui.wrap.hidden = false;
      beat({
        mood: "sleepy", says: SAY.tuck, a: "Tuck Ember in",
        onA: () => goodnight(SAY.tucked, onMorning)
      });
    },

    /* The game was opened in the night. */
    late(els, onMorning) {
      ui = els; wire();
      ui.wrap.hidden = false;
      beat({
        sleeping: true, says: SAY.asleep, quiet: true, a: "Wake her gently",
        /* Eyes open: she is asking, and she means it. */
        onA: () => beat({
          mood: "curious", says: SAY.wakes, a: "I'm okay", b: "Not really",
          onA: () => goodnight(SAY.okay, onMorning),
          onB: () => beat({
            mood: "worried", says: SAY.notReally, a: "Okay, Ember",
            onA: () => goodnight(SAY.afterNotReally, onMorning)
          })
        })
      });
    },

    /* A daytime nap, from the den. Waking her calls back. */
    nap(els, onWake) {
      ui = els; wire();
      ui.wrap.hidden = false;
      beat({
        mood: "sleepy", says: SAY.nap, a: "Tuck Ember in", b: "Not now",
        onB: onWake,
        onA: () => beat({ sleeping: true, says: SAY.napping, quiet: true, a: "Wake Ember up", onA: onWake })
      });
    },

    /* For checks: a different clock. */
    setNow(fn) { now = fn; }
  };
})();
