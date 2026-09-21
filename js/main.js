/* The page: what she opens, and what happens in what order. */

(function () {

  const $ = id => document.getElementById(id);

  const el = {
    bar: $("bar"), lessonName: $("lessonName"), lessonStd: $("lessonStd"),
    soundBtn: $("soundBtn"), soundIcon: $("soundIcon"),
    door: $("door"), doorArt: $("doorArt"), startBtn: $("startBtn"), doorFoot: $("doorFoot"),
    scene: $("scene"), emberHolder: $("emberHolder"), bubble: $("bubble"), emberSays: $("emberSays"),
    task: $("task"), surface: $("surface"), readout: $("readout"), recalls: $("recalls"),
    naming: $("naming"), namingArt: $("namingArt"), nameInput: $("nameInput"), nameBtn: $("nameBtn"),
    clearBtn: $("clearBtn"), nextBtn: $("nextBtn"),
    revealWrap: $("revealWrap"), reveal: $("reveal")
  };

  const G = GRADE3;
  let li = 0, si = 0;         /* which lesson, which stage */
  let stage = null, lesson = null;
  let passed = false;          /* so the reveal fires once, not on every tap */
  let onQuest = false;

  /* ---- the door ---------------------------------------------------------- */

  Ember.draw(el.doorArt, "sleepy");

  if (Save.started()) {
    el.startBtn.textContent = "Back to Ember";
    el.doorFoot.textContent = "He remembers what you taught him.";
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

  el.startBtn.addEventListener("click", () => {
    /* Her first tap is the only moment a browser will let sound begin, so it
       does both jobs at once and she never sees the second one. */
    const s = Save.get();
    /* Waking the sound must ride her very first tap, whichever screen it lands
       on, because no browser gives a second chance at it. */
    Ambience.wake();
    Ambience.setMuted(s.muted);
    paintSound();
    if (!s.name) { askName(); return; }
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

  /* ---- a stage ----------------------------------------------------------- */

  function loadStage() {
    lesson = G.lessons[li];
    stage = lesson.stages[si];
    passed = false;

    Save.at(li, si);

    el.lessonName.textContent = lesson.name;
    el.lessonStd.textContent = lesson.standards.join(" · ");

    Ember.draw(el.emberHolder, stage.mood || "curious");
    el.emberSays.innerHTML = stage.emberSays;
    el.task.textContent = stage.task + (stage.hint ? "  (" + stage.hint + ")" : "");

    el.nextBtn.hidden = true;
    el.clearBtn.hidden = stage.mode === "rim";
    el.recalls.innerHTML = "";
    onQuest = false;

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
      Ambience.learned();
      Ember.draw(el.emberHolder, "delighted");
      /* A beat before the reveal, so she gets to look at the thing she just
         built before anything covers it up. */
      setTimeout(() => showReveal(rep), 620);
    }
  });

  el.clearBtn.addEventListener("click", () => { passed = false; Nest.clear(); });

  /* ---- the reveal -------------------------------------------------------- */

  function showReveal(rep) {
    const r = stage.reveal || {};
    el.reveal.innerHTML =
      '<div style="width:96px;margin:0 auto 6px">' + el.emberHolder.innerHTML + "</div>" +
      '<p class="sentence">' + Lessons.fill(r.sentence, rep) + "</p>" +
      '<p class="said">' + Lessons.fill(r.said, rep) + "</p>" +
      (r.learned ? '<p class="learned">' + r.learned + "</p>" : "") +
      '<button class="big" id="revealNext">' + nextLabel() + "</button>";
    el.revealWrap.hidden = false;
    $("revealNext").addEventListener("click", advance);
  }

  function nextLabel() {
    const last = si === lesson.stages.length - 1;
    if (!last) return "Go on";
    if (li === G.lessons.length - 1) return "See what he can do";
    return "Next lesson";
  }

  function advance() {
    el.revealWrap.hidden = true;
    if (si === lesson.stages.length - 1) {
      Save.taught(lesson.id);
      li++; si = 0;
    } else {
      si++;
    }
    if (li >= G.lessons.length) { Save.at(G.lessons.length, 0); startQuest(); return; }
    loadStage();
  }

  /* ---- the quest he takes alone ------------------------------------------- */

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
    onQuest = false;

    Ember.drawSleeping(el.emberHolder);

    const taught = G.lessons.map(l => "<span>" + l.name + " — " + l.standards.join(", ") + "</span>").join("");

    const E = QUEST3.end;
    el.surface.innerHTML =
      '<div class="finale">' +
        "<h2>" + E.title + "</h2>" +
        "<p>" + Lessons.fill(E.line) + "</p>" +
        '<div class="taught">' + taught + "</div>" +
        "<p>" + E.next + "</p>" +
        '<button class="ghost" id="questAgainBtn">Watch him do it again</button>' +
        '<button class="ghost" id="againBtn">Teach him all of it again</button>' +
      "</div>";

    $("questAgainBtn").addEventListener("click", () => {
      el.bubble.hidden = false;
      el.surface.innerHTML = "";
      startQuest();
    });

    $("againBtn").addEventListener("click", () => {
      const name = Save.get().name;
      Save.reset();
      Save.setName(name);           /* he does not forget who she is */
      applyName();
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
