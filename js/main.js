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
    clearBtn: $("clearBtn"), nextBtn: $("nextBtn"),
    revealWrap: $("revealWrap"), reveal: $("reveal")
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

  /* ---- Ember's den --------------------------------------------------------

     Out of the cave and into daylight. Coming back puts her where her save
     says she was, the same as coming through the front door. */

  function openDen() {
    el.revealWrap.hidden = true;
    el.scene.hidden = true;
    el.bar.hidden = true;
    Den.open(() => {
      el.bar.hidden = false;
      el.scene.hidden = false;
      el.bubble.hidden = false;
      goFromSave();
    });
  }

  el.denBtn.addEventListener("click", openDen);

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
    el.denBtn.hidden = false;
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
    /* Teaching is the only thing that fills Ember's hoard. Paid here, the
       moment she has shown Ember, and nowhere else. */
    const got = Den.payForStage(lesson.id + ":" + si);
    el.reveal.innerHTML =
      '<div style="width:96px;margin:0 auto 6px">' + el.emberHolder.innerHTML + "</div>" +
      '<p class="sentence">' + Lessons.fill(r.sentence, rep) + "</p>" +
      '<p class="said">' + Lessons.fill(r.said, rep) + "</p>" +
      (r.learned ? '<p class="learned">' + r.learned + "</p>" : "") +
      '<p class="earned">Ember found ' + Den.coinsHtml(got) + " for you!</p>" +
      '<button class="big" id="revealNext">' + nextLabel() + "</button>";
    el.revealWrap.hidden = false;
    setTimeout(() => Ambience.coin(), 450);
    $("revealNext").addEventListener("click", advance);
  }

  function nextLabel() {
    const last = si === lesson.stages.length - 1;
    if (!last) return "Go on";
    if (li === G.lessons.length - 1) return "See what she can do";
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
    el.denBtn.hidden = false;
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
