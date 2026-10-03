/* The page: what she opens, and what happens in what order. */

(function () {

  const $ = id => document.getElementById(id);

  const el = {
    bar: $("bar"), lessonName: $("lessonName"), lessonStd: $("lessonStd"),
    soundBtn: $("soundBtn"), soundIcon: $("soundIcon"), denBtn: $("denBtn"),
    door: $("door"), doorArt: $("doorArt"), startBtn: $("startBtn"), doorFoot: $("doorFoot"),
    scene: $("scene"), emberHolder: $("emberHolder"), bubble: $("bubble"), emberSays: $("emberSays"),
    task: $("task"), surface: $("surface"), readout: $("readout"), recalls: $("recalls"),
    naming: $("naming"), namingArt: $("namingArt"), nameInput: $("nameInput"), nameBtn: $("nameBtn"),
    clearBtn: $("clearBtn"), nextBtn: $("nextBtn"), clueBtn: $("clueBtn"), clueText: $("clueText"),
    revealWrap: $("revealWrap"), revealBody: $("revealBody"), revealNext: $("revealNext"), revealDen: $("revealDen"),
    stopWrap: $("stopWrap"), stopArt: $("stopArt"), stopSays: $("stopSays"), stopReview: $("stopReview"), stopDen: $("stopDen")
  };

  /* Which build is actually running, in her console. When somebody says the
     page is stale, this is the one question worth asking. */
  try {
    const b = document.querySelector('meta[name="build"]');
    console.log("Ember — build " + (b ? b.content : "?"));
  } catch (e) {}

  const G = GRADE3;
  let li = 0, si = 0;         /* which lesson, which stage */
  let stage = null, lesson = null;
  let passed = false;          /* so the reveal fires once, not on every tap */
  let onQuest = false;

  /* ---- the door ---------------------------------------------------------- */

  Ember.draw(el.doorArt, "sleepy");

  if (Save.started()) {
    el.startBtn.textContent = "Back to Ember";
    el.doorFoot.textContent = "She remembers what you taught her.";
  }

  /* A deep link straight to one lesson: #l3 opens the third one, #l4.2 its
     second stage. For checking a lesson without replaying the four in front
     of it — hers is the front door, this is the side one. */
  function deepLink() {
    const m = /^#l(\d+)(?:\.(\d+))?$/.exec(location.hash || "");
    if (!m) return null;
    const l = Math.max(1, Math.min(G.lessons.length, Number(m[1]))) - 1;
    const st = Math.max(1, Math.min(G.lessons[l].stages.length, Number(m[2] || 1))) - 1;
    return { l, st };
  }

  function enter(from) {
    Ambience.wake();
    Ambience.setMuted(Save.get().muted);
    paintSound();
    el.door.hidden = true;
    el.bar.hidden = false;
    el.scene.hidden = false;
    li = from.l; si = from.st;
    if (li >= G.lessons.length) { finale(); return; }
    loadStage();
  }

  /* ---- she tells Ember her name ------------------------------------------

     Her name goes into the page title and into Ember's mouth. It is never in
     this repository, which is why it is typed rather than written in. */

  function applyName() {
    const n = Save.get().name;
    Lessons.setName(n);
    if (n) document.title = "The Adventures of " + n + " and Ember";
  }

  function askName() {
    el.door.hidden = true;
    el.naming.hidden = false;
    Ember.draw(el.namingArt, "curious");
    /* Focus after the screen is up, or a phone keyboard opens over a door
       that is still on its way out. */
    setTimeout(() => { try { el.nameInput.focus(); } catch (e) {} }, 60);
  }

  function takeName() {
    const n = Save.setName(el.nameInput.value);
    if (!n) { try { el.nameInput.focus(); } catch (e) {} return; }
    applyName();
    el.naming.hidden = true;
    goFromSave();
  }

  /* Where her save says she should be: mid-lesson, at the quest, or past it. */
  function goFromSave() {
    const s = Save.get();
    if (s.questDone) { enter({ l: G.lessons.length, st: 0 }); return; }
    if (s.lesson >= G.lessons.length) {
      el.door.hidden = true; el.bar.hidden = false; el.scene.hidden = false;
      startQuest();
      return;
    }
    const l = Math.min(s.lesson, G.lessons.length - 1);
    enter({ l: l, st: Math.min(s.stage, G.lessons[l].stages.length - 1) });
  }

  applyName();

  el.nameBtn.addEventListener("click", takeName);
  el.nameInput.addEventListener("keydown", ev => { if (ev.key === "Enter") takeName(); });

  el.startBtn.addEventListener("click", () => {
    /* Her first tap is the only moment a browser will let sound begin, so it
       does both jobs at once and she never sees the second one. */
    const s = Save.get();
    /* Waking the sound must ride her very first tap, whichever screen it lands
       on, because no browser gives a second chance at it. */
    Ambience.wake();
    Ambience.setMuted(s.muted);
    paintSound();
    Save.persist();
    if (!s.name) { askName(); return; }
    /* Every session starts with teaching. The den is the celebration after
       a lesson, never the first stop (short sessions, decorating at the end). */
    goFromSave();
  });

  /* ---- sound ------------------------------------------------------------- */

  function paintSound() {
    const m = Save.get().muted;
    el.soundIcon.textContent = m ? "◌" : "◈";
    el.soundBtn.classList.toggle("off", m);
  }
  paintSound();

  el.soundBtn.addEventListener("click", () => {
    const m = !Save.get().muted;
    Save.setMuted(m);
    Ambience.setMuted(m);
    paintSound();
  });

  /* ---- Ember's den --------------------------------------------------------

     Out of the cave and into daylight — reached at the END of a lesson, as the
     celebration, and from the end of the grade. Never from the middle of a
     lesson. Leaving by "‹ Lessons" puts her where her save says she was. */

  function openDen() {
    el.door.hidden = true;
    el.revealWrap.hidden = true;
    el.stopWrap.hidden = true;
    el.scene.hidden = true;
    el.bar.hidden = true;
    const back = () => {
      el.bar.hidden = false;
      el.scene.hidden = false;
      el.bubble.hidden = false;
    };
    /* Two ways out: back to where she was, or — "get more coins" — straight
       into the lesson that pays, even from the end of the grade. */
    Den.open(() => { back(); goFromSave(); }, at => {
      back();
      el.surface.innerHTML = "";
      enter(at);
    });
    Keep.offer();
  }

  el.denBtn.addEventListener("click", openDen);

  /* ---- a stage ----------------------------------------------------------- */

  const stageKey = () => lesson.id + ":" + si;

  function loadStage() {
    lesson = G.lessons[li];
    stage = lesson.stages[si];
    passed = false;

    /* The one she asked to stop on rests until another day. */
    if (Save.isParked(stageKey())) { showStop(); return; }

    Save.at(li, si);
    Save.attempt(stageKey());

    el.lessonName.textContent = lesson.name;
    el.lessonStd.textContent = lesson.standards.join(" · ");

    Ember.draw(el.emberHolder, stage.mood || "curious");
    el.emberSays.innerHTML = stage.emberSays;
    el.task.textContent = stage.task + (stage.hint ? "  (" + stage.hint + ")" : "");

    el.nextBtn.hidden = true;
    el.clearBtn.hidden = stage.mode === "rim";
    el.recalls.innerHTML = "";
    el.denBtn.hidden = true;          /* the den comes after the lesson */
    onQuest = false;
    resetClues();

    Nest.mount(el.surface, {
      rows: stage.grid.rows,
      cols: stage.grid.cols,
      mode: stage.mode || "floor",
      his: stage.his,
      fill: stage.fill,
      locked: !!stage.locked,
      carry: !!stage.carry
    });
  }

  Nest.onChange(rep => {
    if (!stage) return;
    el.readout.innerHTML = Lessons.describe(stage.check, rep);
    if (passed) return;
    if (Lessons.passes(stage.check, rep)) {
      passed = true;
      el.clueBtn.hidden = true;
      Ambience.learned();
      Ember.draw(el.emberHolder, "delighted");
      /* A beat before the reveal, so she gets to look at the thing she just
         built before anything covers it up. */
      setTimeout(() => showReveal(rep), 620);
    }
  });

  el.clearBtn.addEventListener("click", () => {
    if (stage) Save.note(stageKey(), "restart");
    passed = false;
    Nest.clear();
  });

  /* ---- "Want a clue?" ------------------------------------------------------

     Help in three steps, and only when she asks: a nudge in words, then a
     clearer picture (hollows glow to show where), then a worked example (the
     glow is a whole correct shape, which she still builds herself). Clues
     never cost coins. How many she needed is written down quietly and never
     shown to her. After the third, the button asks whether she is still
     stuck — and if she is, Ember stops kindly for today. */

  let clueStep = 0;

  function resetClues() {
    clueStep = 0;
    el.clueText.hidden = true;
    el.clueText.innerHTML = "";
    el.clueBtn.textContent = "Want a clue?";
    el.clueBtn.hidden = !(stage && stage.clues && stage.clues.length);
  }

  function hideClues() {
    el.clueBtn.hidden = true;
    el.clueText.hidden = true;
  }

  el.clueBtn.addEventListener("click", () => {
    if (!stage || passed || !stage.clues) return;
    if (clueStep < stage.clues.length) {
      const c = stage.clues[clueStep++];
      Save.note(stageKey(), "clue");
      el.clueText.innerHTML = Lessons.fill(c.say);
      el.clueText.hidden = false;
      Nest.glow(c.show || null);
      el.clueBtn.textContent = clueStep < stage.clues.length ? "Another clue?" : "Still stuck?";
      Ambience.lift();
      return;
    }
    Save.note(stageKey(), "stopped");
    Save.park(stageKey());
    showStop();
  });

  /* ---- Ember stops kindly --------------------------------------------------

     It is Ember who is tired, never the player who failed. The hard one waits
     until tomorrow; today she can teach Ember something already taught
     (which still pays) or go home to the den. */

  function previousStage() {
    if (si > 0) return { l: li, st: si - 1 };
    if (li > 0) return { l: li - 1, st: G.lessons[li - 1].stages.length - 1 };
    return null;
  }

  function showStop() {
    hideClues();
    Ember.draw(el.stopArt, "sleepy");
    el.stopSays.innerHTML = Lessons.fill(
      "Phew. This one's really tricky for me too, {name}. Let's come back to it tomorrow — my brain needs a sleep first.");
    el.stopReview.hidden = !previousStage();
    el.stopWrap.hidden = false;
  }

  el.stopReview.addEventListener("click", () => {
    const back = previousStage();
    el.stopWrap.hidden = true;
    if (back) enter(back);
  });
  el.stopDen.addEventListener("click", () => { el.stopWrap.hidden = true; openDen(); });

  /* ---- the reveal -------------------------------------------------------- */

  function showReveal(rep) {
    const r = stage.reveal || {};
    /* Teaching is the only thing that fills Ember's hoard. Paid here, the
       moment she has shown Ember, and nowhere else. */
    const got = Den.payForStage(stageKey());
    Save.note(stageKey(), "solved");
    el.revealBody.innerHTML =
      '<div style="width:96px;margin:0 auto 6px">' + el.emberHolder.innerHTML + "</div>" +
      '<p class="sentence">' + Lessons.fill(r.sentence, rep) + "</p>" +
      '<p class="said">' + Lessons.fill(r.said, rep) + "</p>" +
      (r.learned ? '<p class="learned">' + r.learned + "</p>" : "") +
      '<p class="earned">Ember found ' + Den.coinsHtml(got) + " for you!</p>";
    el.revealNext.textContent = nextLabel();
    /* The den is offered only once a whole lesson is done. */
    el.revealDen.hidden = si !== lesson.stages.length - 1;
    el.revealWrap.hidden = false;
    setTimeout(() => Ambience.coin(), 450);
  }

  el.revealNext.addEventListener("click", () => advance(false));
  el.revealDen.addEventListener("click", () => advance(true));

  function nextLabel() {
    const last = si === lesson.stages.length - 1;
    if (!last) return "Go on";
    if (li === G.lessons.length - 1) return "See what she can do";
    return "Next lesson";
  }

  /* On to what comes next — or, at the end of a lesson, home to the den
     first, with her place already moved on so "‹ Lessons" picks up there. */
  function advance(toDen) {
    el.revealWrap.hidden = true;
    if (si === lesson.stages.length - 1) {
      Save.taught(lesson.id);
      li++; si = 0;
    } else {
      si++;
    }
    if (li >= G.lessons.length) {
      Save.at(G.lessons.length, 0);
      if (toDen) openDen(); else startQuest();
      return;
    }
    if (toDen) { Save.at(li, si); openDen(); return; }
    loadStage();
  }

  /* ---- the quest Ember takes alone ---------------------------------------- */

  function startQuest(fromBeat) {
    onQuest = true;
    stage = null;
    el.revealWrap.hidden = true;
    el.bubble.hidden = false;
    el.lessonName.textContent = QUEST3.name;
    el.lessonStd.textContent = QUEST3.standards.join(" · ");
    el.task.textContent = "";
    el.clearBtn.hidden = true;
    el.nextBtn.hidden = true;
    el.denBtn.hidden = true;          /* she is watching; home can wait */
    hideClues();

    Quest.start(QUEST3, {
      ember: el.emberHolder, says: el.emberSays, recalls: el.recalls,
      surface: el.surface, readout: el.readout, go: el.nextBtn
    }, () => { Save.questDone(); finale(); }, fromBeat);
  }

  el.nextBtn.addEventListener("click", () => {
    if (onQuest) Quest.next();
  });

  /* ---- the end of the grade ---------------------------------------------- */

  function finale() {
    stage = null;
    el.lessonName.textContent = G.title;
    el.lessonStd.textContent = "NY-3.OA · NY-3.MD";
    el.task.textContent = "";
    el.readout.innerHTML = "";
    el.clearBtn.hidden = true;
    el.nextBtn.hidden = true;
    el.bubble.hidden = true;
    el.recalls.innerHTML = "";
    el.denBtn.hidden = false;         /* the grade is done: home is earned */
    onQuest = false;
    hideClues();

    Ember.drawSleeping(el.emberHolder);

    const taught = G.lessons.map(l => "<span>" + l.name + " — " + l.standards.join(", ") + "</span>").join("");

    const E = QUEST3.end;
    el.surface.innerHTML =
      '<div class="finale">' +
        "<h2>" + E.title + "</h2>" +
        "<p>" + Lessons.fill(E.line) + "</p>" +
        '<div class="taught">' + taught + "</div>" +
        "<p>" + E.next + "</p>" +
        '<button class="big" id="denFromEnd">Take Ember home to her den</button>' +
        '<button class="ghost" id="questAgainBtn">Watch her do it again</button>' +
        '<button class="ghost" id="againBtn">Teach her all of it again</button>' +
      "</div>";

    $("denFromEnd").addEventListener("click", openDen);

    $("questAgainBtn").addEventListener("click", () => {
      el.bubble.hidden = false;
      el.surface.innerHTML = "";
      startQuest();
    });

    $("againBtn").addEventListener("click", () => {
      Save.reset();                 /* the lessons start over; her name and her den do not */
      li = 0; si = 0;
      el.bubble.hidden = false;
      el.surface.innerHTML = "";
      loadStage();
    });
  }

  /* Last, deliberately: entering a stage paints the readout, and the readout
     cannot paint until the nest's change listener above exists. */
  const qm = /^#quest(?:\.(\d+))?$/.exec(location.hash || "");
  if (qm) {
    Ambience.wake(); paintSound();
    el.door.hidden = true; el.bar.hidden = false; el.scene.hidden = false;
    startQuest(Number(qm[1] || 0));
  } else {
    const jump = deepLink();
    if (jump) enter({ l: jump.l, st: jump.st });
  }

})();
