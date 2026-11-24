/* Ember's bedtime: is it night when it should be, does she say her father's
   words exactly, and is the game closed afterwards?

   Each walk boots the real page with its own clock. Nothing here depends on
   what time it is when the test is run.

   Run: node test/bedtime.test.js      (no dependencies, no build) */

const { boot, read, sleep, text, playCards } = require("./page.js");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };
const tap = node => node.fire("pointerdown");
const cellAt = (p, cols, r, c) => p.box.children[r * cols + c];
const THREE = "You are beautiful, you are smart, and you are loved.";
const open = p => ["door", "naming", "bar", "scene", "den", "shopWrap"].filter(id => !p.$(id).hidden);
const named = () => ({ "nymath.ember.v1": JSON.stringify({ name: "Wren", lesson: 1 }) });

(async () => {

/* ---- when is it night? ------------------------------------------------------ */

{
  const { Bedtime } = boot("", {}).page;
  const at = (h, m) => Bedtime.isNight(new Date(2026, 10, 10, h, m));
  ok(!at(22, 29) && at(22, 30), "night begins at 10:30 pm exactly");
  ok(at(23, 59) && at(0, 0) && at(3, 0), "and runs through midnight");
  ok(at(4, 59) && !at(5, 0), "until 5:00 am exactly");
  ok(!at(7, 0) && !at(15, 0) && !at(21, 0), "morning, afternoon and evening are open");
  ok(Bedtime.THREE === THREE, "the three sentences are her father's, word for word");
  const src = read("js/bedtime.js").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(!/setInterval|setTimeout|countdown/i.test(src), "the clock is only read: nothing here counts down or runs on a timer");
}

/* ---- opened in the night ----------------------------------------------------- */

for (const answer of ["I'm okay", "Not really"]) {
  const p = boot("", named(), [23, 40]);
  p.$("startBtn").fire("click");
  ok(p.$("night").hidden === false && open(p).length === 0, answer + ": at 11:40 pm the door opens on the night, and nothing else");
  ok(p.$("nightArt").innerHTML.includes("<svg") && /asleep/i.test(p.$("nightSays").innerHTML), "Ember is asleep");
  ok(p.spoken.length === 0, "and nothing is said aloud while she sleeps");

  p.$("nightA").fire("click");
  ok(/how are you/i.test(p.$("nightSays").innerHTML) && /everything okay/i.test(p.$("nightSays").innerHTML) && p.$("nightSays").innerHTML.includes("Wren"),
     "she wakes and asks how she is, and whether everything is okay: " + p.$("nightSays").innerHTML);
  ok(p.$("nightA").textContent === "I'm okay" && p.$("nightB").textContent === "Not really" && !p.$("nightB").hidden, "with two answers to tap");

  if (answer === "I'm okay") {
    p.$("nightA").fire("click");
  } else {
    p.$("nightB").fire("click");
    ok(p.$("nightSays").innerHTML === "That sounds hard. Can you go tell Dad? He'd want to know.",
       "'Not really' gets the one fixed line that sends her to her dad");
    ok(!p.$("nightSays").innerHTML.includes(THREE) && p.$("nightB").hidden, "on its own, before anything else");
    p.$("nightA").fire("click");
  }
  ok(p.$("nightSays").innerHTML.endsWith(THREE), "then Ember sends her back to sleep with the three sentences: " + p.$("nightSays").innerHTML);
  ok(p.spoken[p.spoken.length - 1].endsWith(THREE), "said aloud as well");
  ok(/sleep/i.test(p.$("nightSays").innerHTML), "and tells her to go back to sleep");

  p.$("nightA").fire("click");
  ok(p.$("nightA").hidden && p.$("nightB").hidden && open(p).length === 0, "after goodnight there is nothing to tap and nothing open");
  p.$("nightArt").fire("click");
  ok(p.$("night").hidden === false && open(p).length === 0, "tapping sleeping Ember in the night changes nothing");
}

/* A phone that has never played: no name yet, and Ember still says goodnight. */
{
  const p = boot("", {}, [2, 15]);
  p.$("startBtn").fire("click");
  ok(p.$("night").hidden === false && p.$("naming").hidden === true, "a first-ever visit at 2:15 am gets the night, not the naming screen");
  p.$("nightA").fire("click");
  ok(!/\{name\}|[ ,…]\s*[?.,]/.test(p.$("nightSays").innerHTML.replace("…", "")) && p.$("nightSays").innerHTML.startsWith("Mmf… oh. It's"),
     "and Ember's question reads properly with no name: " + p.$("nightSays").innerHTML);
  const css = read("css/style.css");
  ok(/\.night \.ghost \{[^}]*min-width: min\(74vw, 260px\)/.test(css) && /\.big \{[^}]*min-width: min\(74vw, 260px\)/.test(css),
     "'Not really' is a button the same width as 'I'm okay', not a faint link under it");
}

/* Every way in is covered, not only the front door. */
{
  const p = boot("#l2", named(), [23, 0]);
  ok(p.$("night").hidden === false && open(p).length === 0, "a side-door link in the night meets sleeping Ember too");
  const q = boot("#quest", named(), [23, 0]);
  ok(q.$("night").hidden === false && open(q).length === 0, "and so does the quest");
}

/* ---- still playing when bedtime arrives -------------------------------------- */

{
  const p = boot("#l4.1", named(), [22, 20]);
  ok(p.$("night").hidden === true && p.$("scene").hidden === false, "at 10:20 pm she is playing as usual");

  /* The clock passes 10:30 while she is in the middle of the fence. */
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 31));
  const T = p.box.children.filter(c => c.className.split(" ")[0] === "twig");
  T.forEach(tap);
  ok(p.$("night").hidden === true && p.$("scene").hidden === false, "bedtime passing does not interrupt her build");
  await sleep(700);
  [T[0], T[9], T[1], T[8]].forEach(tap);
  await sleep(2300);
  ok(p.$("revealWrap").hidden === false && p.$("night").hidden === true, "she finishes the stage and is paid for it");
  ok(p.page.Save.den().paid.includes("g3-the-rim:0"), "the coins are hers");

  p.$("revealNext").fire("click");
  ok(p.$("night").hidden === false && open(p).length === 0, "at the break, the night takes over");
  ok(/tuck me in/i.test(p.$("nightSays").innerHTML) && p.$("nightA").textContent === "Tuck Ember in", "Ember asks to be tucked in: " + p.$("nightSays").innerHTML);
  ok(p.$("nightB").hidden, "and there is no 'not yet'");
  ok(p.page.Save.get().lesson === 3 && p.page.Save.get().stage === 1, "her place has already moved on to the next stage, for the morning");

  p.$("nightA").fire("click");
  ok(p.$("nightSays").innerHTML.endsWith(THREE), "tucked in, Ember says goodnight with the three sentences");
  p.$("nightA").fire("click");
  ok(open(p).length === 0 && p.$("nightA").hidden, "and the game is closed");

  /* The page is left open all night. In the morning a tap finds her awake. */
  p.page.Bedtime.setNow(() => new Date(2026, 10, 11, 4, 59));
  p.$("nightArt").fire("click");
  ok(p.$("night").hidden === false, "at 4:59 am she is still asleep");
  p.page.Bedtime.setNow(() => new Date(2026, 10, 11, 5, 0));
  p.$("nightArt").fire("click");
  ok(p.$("night").hidden === true && p.$("scene").hidden === false && p.$("lessonName").textContent === "The rim",
     "at 5:00 am a tap wakes her, and she is where she left off");
}

/* ---- a nap, in the daytime ---------------------------------------------------- */

{
  const p = boot("#l1", named(), [15, 0]);
  p.$("denBtn").fire("click");
  ok(p.$("den").hidden === false && p.$("night").hidden === true, "in the afternoon the den is open");
  p.$("denBed").fire("click");
  ok(p.$("night").hidden === false && p.$("den").hidden === true && /nap/i.test(p.$("nightSays").innerHTML), "she can put Ember down for a nap");
  p.$("nightA").fire("click");
  ok(p.$("nightA").textContent === "Wake Ember up" && !p.$("nightSays").innerHTML.includes(THREE), "Ember sleeps, and can be woken");
  p.$("nightA").fire("click");
  ok(p.$("night").hidden === true && p.$("den").hidden === false, "waking her goes back to the den: nothing was closed");

  /* The same button at night is bedtime, not a nap. */
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 45));
  p.$("denBed").fire("click");
  ok(/tuck me in/i.test(p.$("nightSays").innerHTML) && p.$("nightB").hidden, "after 10:30 the same button is bedtime, with no way back");
}

/* ---- coming back to the game in the night --------------------------------------
   dec:night-return-and-stage-directions: whatever she left open, coming back
   after bedtime is opening the game after bedtime. */

{
  /* The case the Bedtime walk found: a stage open at 9 pm, picked up at 2 am. */
  const p = boot("#l4.1", named(), [21, 0]);
  const T = p.box.children.filter(c => c.className.split(" ")[0] === "twig");
  T.slice(0, 5).forEach(tap);
  p.away(true);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 11, 2, 0));
  p.away(false);
  ok(p.$("night").hidden === false && open(p).length === 0 && /asleep/i.test(p.$("nightSays").innerHTML),
     "a stage left open at 9 pm and picked up at 2 am: Ember is asleep, at once, and nothing else is open");
  p.$("nightA").fire("click");
  ok(/how are you/i.test(p.$("nightSays").innerHTML) && /everything okay/i.test(p.$("nightSays").innerHTML) && p.$("nightB").textContent === "Not really",
     "and she wakes to ask how she is and whether everything is okay, with both answers");
  p.$("nightB").fire("click");
  ok(p.$("nightSays").innerHTML === "That sounds hard. Can you go tell Dad? He'd want to know.", "'Not really' still gets the line sending her to her dad");
  p.$("nightA").fire("click");
  ok(p.$("nightSays").innerHTML.endsWith(THREE), "then the three sentences");
  ok(p.page.Save.get().lesson === 3 && p.page.Save.get().stage === 0, "her place in the lessons is kept: the rim, from the start of the stage, in the morning");
}
{
  /* Tucked in at 10:31, the closed screen left on, picked up at 1:00 am. */
  const p = boot("#l4.1", named(), [22, 20]);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 31));
  p.$("denBtn").fire("click");
  ok(/tuck me in/i.test(p.$("nightSays").innerHTML), "at 10:31 the break brings the tuck-in, as before");
  p.$("nightA").fire("click"); p.$("nightA").fire("click");
  ok(p.$("nightA").hidden, "tucked in, the game is closed");
  p.away(true);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 11, 1, 0));
  p.away(false);
  p.$("nightA").fire("click");
  ok(/everything okay/i.test(p.$("nightSays").innerHTML), "picked up again at 1:00 am, Ember wakes and checks on her, as a fresh open would");
}
{
  /* A dream left open in the afternoon, picked up at 11 pm. */
  const p = boot("#l4.1", { "nymath.ember.v1": JSON.stringify({ name: "Wren", lesson: 3,
    cards: { best: 0, facts: { "x:4:5": { op: "x", a: 4, b: 5, lesson: "g3-fast-count", box: 0, due: "2026-11-10", seen: "", asked: 0 } } } }) }, [15, 0]);
  p.$("denBtn").fire("click"); p.$("denBed").fire("click"); p.$("nightA").fire("click");
  ok(p.$("dream").hidden === false, "an afternoon nap: Ember dreams");
  p.away(true);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 23, 0));
  p.away(false);
  ok(p.$("dream").hidden === true && p.$("dreamCards").hidden === true && p.$("night").hidden === false && /asleep/i.test(p.$("nightSays").innerHTML),
     "the dream left open and picked up at 11 pm: the night, not the dream");
}
{
  /* Safari hands back a page it kept, in the night. */
  const p = boot("#l2", named(), [16, 0]);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 23, 30));
  p.restored();
  ok(p.$("night").hidden === false && open(p).length === 0, "a page Safari restores from its cache in the night meets sleeping Ember too");
}
{
  /* What must not change. */
  const p = boot("#l2", named(), [16, 0]);
  p.away(true); p.away(false);
  ok(p.$("night").hidden === true && p.$("scene").hidden === false, "put down and picked up in the daytime: nothing changes");
  const q = boot("", named(), [23, 0]);
  q.away(true); q.away(false);
  ok(q.$("door").hidden === false && q.$("night").hidden === true, "still on the front door at night: the door stays, and her tap brings the night as before");
  const r = boot("#l4.1", named(), [22, 20]);
  r.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 31));
  ok(r.$("night").hidden === true && r.$("scene").hidden === false, "still playing across 10:30 without leaving: never interrupted");
}

/* ---- Ember's acted bits --------------------------------------------------------- */

{
  const p = boot("#l2", named(), [22, 20]);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 40));
  p.$("denBtn").fire("click");
  const s = p.$("nightSays").innerHTML;
  ok(s.startsWith('<i class="act">Yaaawn.</i> ') && !s.includes("*"), "'Yaaawn.' shows in italics, with no asterisks: " + s);
  ok(!/yaaawn|\*/i.test(p.spoken[p.spoken.length - 1]), "and is not read aloud: " + p.spoken[p.spoken.length - 1]);
}

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);

})();
