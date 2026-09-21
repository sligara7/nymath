/* THE QUEST — Ember, working alone, while she watches.

   She has no controls here beyond "go on", and that is the point. Everything
   he does is something she taught him; the nest builds itself under his
   narration and he names the lesson each time he reaches for one.

   It is also the only place in the game where the arithmetic sentence comes
   BEFORE the picture rather than after — because here he is not learning it,
   he is USING it, and that is what using something looks like. */

const Quest = (function () {

  let beats = null, i = 0, q = null, els = null, done = null;

  async function play() {
    const b = q.beats[i];
    if (!b) { if (done) done(); return; }

    Ember.draw(els.ember, b.mood || "curious");
    els.says.innerHTML = Lessons.fill(b.says, { shape: { rows: 0, cols: 0, total: 0 } });

    /* The lesson he is reaching for, named in his own words. This is the line
       that makes the quest a proof rather than a cutscene. */
    els.recalls.innerHTML = b.recalls
      ? '<span class="recall">he remembers: <b>' + b.recalls + "</b></span>" : "";

    els.go.hidden = true;
    els.readout.innerHTML = b.readout ? "<span>" + b.readout + "</span>" : els.readout.innerHTML;

    if (b.build) await Nest.lay(b.build.rows, b.build.cols, 50);
    if (b.turn) await Nest.turnIt(40);
    if (b.rim) await Nest.layRim(45);

    if (b.build || b.turn || b.rim) Ambience.row();

    els.go.textContent = b.go || "Go on";
    els.go.hidden = false;
  }

  return {
    async start(quest, elements, onDone, fromBeat) {
      q = quest; els = elements; done = onDone;
      Nest.mount(els.surface, {
        rows: q.grid.rows, cols: q.grid.cols,
        passive: true, willRim: true
      });
      els.readout.innerHTML = "";

      /* Opening the quest partway in (#quest.8) replays what he has already
         built, instantly, so the shelf is in the state that beat expects. */
      i = Math.max(0, Math.min(quest.beats.length - 1, fromBeat || 0));
      for (let k = 0; k < i; k++) {
        const b = q.beats[k];
        if (b.build) await Nest.lay(b.build.rows, b.build.cols, 0);
        if (b.turn) await Nest.turnIt(0);
        if (b.rim) await Nest.layRim(0);
        if (b.readout) els.readout.innerHTML = "<span>" + b.readout + "</span>";
      }
      play();
    },

    next() {
      i++;
      play();
    },

    atEnd() { return i >= q.beats.length - 1; }
  };
})();
