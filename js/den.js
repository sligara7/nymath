/* EMBER'S DEN — the bright room she comes home to.

   The lessons are a cave at dusk; this is daylight. She dresses Ember,
   furnishes the room, and feeds her, and every one of those things is bought
   from the hoard — which only TEACHING fills. So the den is the reward for
   the lessons rather than a way round them, and the shop is a lesson of its
   own: Pip takes exact money and has no change, so paying 1 silver and 8
   copper with two silvers means breaking one into ten copper first.

   Furniture is moved with one finger. Nothing here can be got wrong; the only
   thing that can go wrong is the money, and Pip says so kindly. */

const Den = (function () {

  const $ = id => document.getElementById(id);
  const ITEMS = {};
  DEN.items.forEach(it => { ITEMS[it.id] = it; });
  const SLOTS = ["head", "face", "neck"];
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let el = null;
  let tab = "wear";
  let onLeave = null;
  let shop = null;              /* { it, purse, counter } while Pip's sheet is open */
  let emberEl = null;
  let sayTimer = null, moodTimer = null;

  function els() {
    if (el) return el;
    el = {
      den: $("den"), back: $("denBack"), purse: $("purseMini"), room: $("room"),
      items: $("roomItems"), says: $("denSays"), drawer: $("drawer"),
      tabWear: $("tabWear"), tabRoom: $("tabRoom"), tabFood: $("tabFood"),
      shopWrap: $("shopWrap"), shop: $("shop")
    };
    return el;
  }

  /* ---- her den, in the save ---------------------------------------------- */

  /* Set the den up the first time anything touches it. A save from before the
     den existed has already taught some stages, and those are paid for here,
     once, at the first-time rate — she earned them. */
  function ensure() {
    if (Save.den()) return Save.den();
    return Save.den(() => {
      const s = Save.get();
      const paid = [];
      let coins = Hoard.purse(DEN.pays.starter);
      GRADE3.lessons.forEach((l, i) => {
        const done = s.learned.includes(l.id) || i < s.lesson;
        const upto = done ? l.stages.length : (i === s.lesson ? s.stage : 0);
        for (let k = 0; k < upto; k++) {
          paid.push(l.id + ":" + k);
          coins = Hoard.add(coins, Hoard.purse(DEN.pays.firstTime));
        }
      });
      return {
        coins, paid,
        owned: DEN.start.owned.slice(),
        placed: JSON.parse(JSON.stringify(DEN.start.placed)),
        outfit: {}, pantry: {}, wall: DEN.start.wall, emberAt: null, visited: false
      };
    });
  }

  /* What teaching a stage pays: the first time, or again. Called by the lesson
     the moment a stage is right, and nowhere else — this is the only income. */
  function payForStage(key) {
    ensure();
    let got = null;
    Save.den(d => {
      const first = !d.paid.includes(key);
      got = Hoard.purse(first ? DEN.pays.firstTime : DEN.pays.again);
      if (first) d.paid.push(key);
      d.coins = Hoard.add(Hoard.purse(d.coins), got);
      return d;
    });
    return got;
  }

  /* Put her clothes on her, wherever she is about to be drawn. */
  function dressEmber() {
    const d = Save.den();
    const o = (d && d.outfit) || {};
    const wear = {};
    SLOTS.forEach(s => { const it = ITEMS[o[s]]; wear[s] = it && it.slot === s ? it.art : ""; });
    Ember.dress(wear);
  }

  /* ---- coins, drawn ------------------------------------------------------ */

  const COIN = { gold: ["#f7c948", "#d9a52a"], silver: ["#eef2f5", "#b4c0ca"], copper: ["#ec9a62", "#c4703a"] };

  function coinSvg(kind) {
    const c = COIN[kind];
    return '<svg class="coin" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10" fill="' + c[0] + '" stroke="#5b3a2e" stroke-width="1.8"/>' +
      '<circle cx="12" cy="12" r="6.4" fill="none" stroke="' + c[1] + '" stroke-width="1.5"/>' +
      '<path d="M12 8.3 l1.1 2.3 2.4 .3 -1.8 1.6 .5 2.4 -2.2 -1.2 -2.2 1.2 .5 -2.4 -1.8 -1.6 2.4 -.3 z" fill="' + c[1] + '"/>' +
      "</svg>";
  }

  /* "[silver] 2  [copper] 3": coins drawn, the count beside each. */
  function coinsHtml(p, all) {
    p = Hoard.purse(p);
    const kinds = Hoard.KINDS.filter(k => all || p[k] > 0);
    if (!kinds.length) return '<span class="coinset none">nothing</span>';
    return kinds.map(k =>
      '<span class="coinset ' + k + '">' + coinSvg(k) + "<b>" + p[k] + "</b></span>").join("");
  }

  /* Coins laid out one by one, so she can SEE ten copper next to one silver. */
  function pileHtml(n, kind, act) {
    let s = "";
    for (let i = 0; i < Math.min(n, 20); i++) s += coinSvg(kind);
    if (n > 20) s += "<b>+" + (n - 20) + "</b>";
    return '<button class="pile ' + kind + '" data-act="' + act + '" data-k="' + kind + '" aria-label="' + n + " " + kind + '">' + s + "</button>";
  }

  function paintPurse() {
    const d = Save.den();
    if (d && els().purse) el.purse.innerHTML = coinsHtml(d.coins, true);
  }

  /* ---- the room ---------------------------------------------------------- */

  const itemSvg = it => '<svg viewBox="' + it.view + '" width="100%" aria-hidden="true">' + it.art + "</svg>";
  const iconSvg = it => it.tab === "wear"
    ? '<svg viewBox="' + it.box + '" width="100%" aria-hidden="true">' + it.art + "</svg>"
    : itemSvg(it);

  /* Things nearer the bottom of the room are nearer to her, so they stand in
     front. Rugs are always underfoot. */
  function place(n, at, w) {
    n.style.left = at[0] + "%";
    n.style.top = at[1] + "%";
    if (w) n.style.width = (w * 100) + "%";
    n.style.zIndex = n.classList.contains("rug") ? "1" : String(10 + Math.round(at[1] * 10));
  }

  function anchorOf(id) {
    const d = Save.den();
    return id === "ember" ? (d.emberAt || DEN.emberAt) : d.placed[id];
  }

  function paintRoom() {
    const d = Save.den();
    el.room.className = "room " + (ITEMS[d.wall] ? d.wall : DEN.start.wall);
    el.items.innerHTML = "";
    Object.keys(d.placed)
      .filter(id => ITEMS[id] && d.owned.includes(id) && ITEMS[id].kind !== "wall")
      .forEach(id => {
        const it = ITEMS[id];
        const n = document.createElement("div");
        n.className = "thing" + (it.kind === "rug" ? " rug" : "");
        n.innerHTML = itemSvg(it);
        place(n, d.placed[id], it.w);
        draggable(n, id);
        el.items.appendChild(n);
      });
    emberEl = document.createElement("div");
    emberEl.className = "thing ember-home";
    place(emberEl, anchorOf("ember"), 0.34);
    Ember.draw(emberEl, "curious");
    draggable(emberEl, "ember");
    el.items.appendChild(emberEl);
  }

  /* One finger, anywhere: Toca Boca's rule. A touch that barely moves is a
     tap, and a tap on Ember makes her giggle. */
  function draggable(n, id) {
    let g = null;
    n.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      const at = anchorOf(id) || [50, 80];
      g = { x: ev.clientX, y: ev.clientY, r: el.room.getBoundingClientRect(), from: at.slice(), at: null };
      try { n.setPointerCapture(ev.pointerId); } catch (e) {}
      n.classList.add("held");
    });
    n.addEventListener("pointermove", ev => {
      if (!g) return;
      const dx = ev.clientX - g.x, dy = ev.clientY - g.y;
      if (!g.at && Math.hypot(dx, dy) < 6) return;
      g.at = [clamp(g.from[0] + dx / g.r.width * 100, 4, 96), clamp(g.from[1] + dy / g.r.height * 100, 8, 100)];
      place(n, g.at);
    });
    n.addEventListener("pointerup", () => {
      if (!g) return;
      n.classList.remove("held");
      const to = g.at;
      g = null;
      if (to) {
        Save.den(d => { if (id === "ember") d.emberAt = to; else d.placed[id] = to; return d; });
        Ambience.stone();
      } else if (id === "ember") {
        react("delighted", pick(DEN.says.poke));
      } else {
        n.classList.remove("wiggle"); void n.offsetWidth; n.classList.add("wiggle");
        Ambience.lift();
      }
    });
    n.addEventListener("pointercancel", () => { g = null; n.classList.remove("held"); });
  }

  /* Somewhere sensible for a thing she has just put out: up on the wall if it
     hangs, on the floor if it stands. She will move it anyway. */
  function spot(it) {
    const r = (lo, hi) => Math.round(lo + Math.random() * (hi - lo));
    if (it.kind === "rug") return [50, 97];
    if (it.hang) return [r(18, 82), r(24, 40)];
    return [r(14, 86), r(74, 96)];
  }

  /* ---- what Ember says and how she looks ----------------------------------- */

  function say(line) {
    if (!line || !el.says) return;
    el.says.innerHTML = Lessons.fill(line);
    el.says.hidden = false;
    el.says.classList.remove("pop"); void el.says.offsetWidth; el.says.classList.add("pop");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { el.says.hidden = true; }, 3800);
  }

  function react(mood, line) {
    if (emberEl) Ember.draw(emberEl, mood);
    say(line);
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => { if (emberEl) Ember.draw(emberEl, "curious"); }, 1800);
  }

  /* ---- the drawer -------------------------------------------------------- */

  const isOn = (it, d) =>
    it.tab === "wear" ? d.outfit[it.slot] === it.id :
    it.kind === "wall" ? d.wall === it.id :
    it.tab === "room" ? !!d.placed[it.id] : false;

  function paintDrawer() {
    const d = Save.den();
    [["wear", el.tabWear], ["room", el.tabRoom], ["food", el.tabFood]]
      .forEach(([k, b]) => b && b.classList.toggle("on", k === tab));
    el.drawer.innerHTML = "";
    DEN.items.filter(it => it.tab === tab).forEach(it => {
      const owned = d.owned.includes(it.id);
      const have = d.pantry[it.id] || 0;
      const on = isOn(it, d);
      let tag = "";
      if (it.tab === "food" && have > 0) tag = '<span class="tag count">×' + have + "</span>";
      else if (it.tab === "food" || !owned) tag = '<span class="tag price">' + coinsHtml(Hoard.coins(it.price)) + "</span>";
      else if (on) tag = '<span class="tag using">✓</span>';
      const n = document.createElement("button");
      n.className = "tile" + (on ? " using" : "") + (!owned && it.tab !== "food" ? " forsale" : "");
      n.innerHTML = '<span class="tile-art">' + iconSvg(it) + '</span><span class="tile-name">' + it.name + "</span>" + tag;
      n.addEventListener("click", () => choose(it));
      el.drawer.appendChild(n);
    });
  }

  function choose(it) {
    const d = Save.den();
    if (it.tab === "food") { (d.pantry[it.id] || 0) > 0 ? feed(it) : openShop(it); return; }
    if (!d.owned.includes(it.id)) { openShop(it); return; }
    use(it);
  }

  /* Wear it or take it off; put it out or put it away; paper the wall. */
  function use(it) {
    let line = "", happy = true;
    Save.den(d => {
      if (it.tab === "wear") {
        if (d.outfit[it.slot] === it.id) { d.outfit[it.slot] = ""; line = DEN.says.takeOff; happy = false; }
        else { d.outfit[it.slot] = it.id; line = DEN.says.wear[it.slot]; }
      } else if (it.kind === "wall") {
        d.wall = it.id; line = DEN.says.placed;
      } else if (d.placed[it.id]) {
        delete d.placed[it.id]; line = DEN.says.putAway; happy = false;
      } else {
        d.placed[it.id] = spot(it); line = DEN.says.placed;
      }
      return d;
    });
    if (it.tab === "wear") dressEmber();
    paintRoom();
    paintDrawer();
    react(happy ? "delighted" : "curious", line);
    Ambience.lift();
  }

  function feed(it) {
    Save.den(d => { d.pantry[it.id] = Math.max(0, (d.pantry[it.id] || 0) - 1); return d; });
    paintDrawer();
    react("delighted", it.line);
    Ambience.row();
    /* The snack appears at her mouth and is gone — after react(), which
       redraws her and would otherwise take the snack with it. */
    if (emberEl) {
      const bite = document.createElement("div");
      bite.className = "bite";
      bite.innerHTML = itemSvg(it);
      emberEl.appendChild(bite);
      setTimeout(() => { try { bite.remove(); } catch (e) {} }, 900);
    }
  }

  /* ---- Pip's Trading Post ------------------------------------------------- */

  function openShop(it) {
    shop = { it, purse: Hoard.purse(Save.den().coins), counter: Hoard.purse(null) };
    el.shopWrap.hidden = false;
    paintShop();
  }

  /* Closing without paying gives every coin back, trades undone. */
  function closeShop() {
    shop = null;
    if (el && el.shopWrap) el.shopWrap.hidden = true;
  }

  function paintShop() {
    const it = shop.it, P = DEN.pip;
    const total = Hoard.value(shop.purse) + Hoard.value(shop.counter);
    const onCounter = Hoard.value(shop.counter);
    const verdict = Hoard.judge(shop.counter, it.price);
    const afford = total >= it.price;
    const pipSays = !afford ? P.broke : onCounter === 0 ? P.empty : P[verdict];

    const head =
      '<div class="shop-head">' +
        '<span class="pip"><svg viewBox="0 0 60 52" width="100%" aria-hidden="true">' + P.art + "</svg></span>" +
        "<h2>" + P.name + "</h2>" +
        '<button class="shop-x" data-act="close" aria-label="Close">×</button>' +
      "</div>" +
      '<div class="shop-item">' +
        '<span class="shop-art">' + iconSvg(it) + "</span>" +
        "<div><b>" + it.name + "</b>" +
        '<span class="price">' + coinsHtml(Hoard.coins(it.price)) + "</span>" +
        '<span class="words">' + Hoard.words(Hoard.coins(it.price)) + "</span></div>" +
      "</div>";

    if (!afford) {
      el.shop.innerHTML = head +
        '<p class="pip-says">' + pipSays + "</p>" +
        '<div class="shop-mine">You have ' + coinsHtml(shop.purse) + "</div>" +
        '<button class="big" data-act="lessons">Go and teach Ember</button>';
      return;
    }

    /* Ten coins in a stack can be swapped for one of the next coin up, and one
       coin can be broken into ten of the next one down. Nothing is lost
       either way — which is exactly what she is learning. */
    const trades =
      '<div class="trades">' +
        '<button class="trade" data-act="break" data-k="gold"' + (shop.purse.gold ? "" : " disabled") + ">" +
          "1" + coinSvg("gold") + " → 10" + coinSvg("silver") + "</button>" +
        '<button class="trade" data-act="break" data-k="silver"' + (shop.purse.silver ? "" : " disabled") + ">" +
          "1" + coinSvg("silver") + " → 10" + coinSvg("copper") + "</button>" +
        '<button class="trade" data-act="make" data-k="copper"' + (shop.purse.copper >= 10 ? "" : " disabled") + ">" +
          "10" + coinSvg("copper") + " → 1" + coinSvg("silver") + "</button>" +
        '<button class="trade" data-act="make" data-k="silver"' + (shop.purse.silver >= 10 ? "" : " disabled") + ">" +
          "10" + coinSvg("silver") + " → 1" + coinSvg("gold") + "</button>" +
      "</div>";

    const counter = Hoard.KINDS.filter(k => shop.counter[k] > 0).map(k => pileHtml(shop.counter[k], k, "back")).join("");
    const purse = Hoard.KINDS.map(k =>
      '<div class="stack"><span class="stack-name">' + k + "</span>" +
        (shop.purse[k] ? pileHtml(shop.purse[k], k, "give") : '<span class="pile empty">none</span>') +
      "</div>").join("");

    el.shop.innerHTML = head +
      '<div class="counter' + (verdict === "exact" ? " exact" : verdict === "over" ? " over" : "") + '">' +
        '<span class="label">On the counter</span>' +
        (counter || '<span class="hint">tap your coins to put them here</span>') +
      "</div>" +
      '<p class="pip-says">' + pipSays + "</p>" +
      '<div class="purse-big"><span class="label">Your coins</span>' + purse + "</div>" +
      trades +
      '<button class="big pay" data-act="pay"' + (verdict === "exact" ? "" : " disabled") + ">Pay Pip</button>";
  }

  function onShopTap(ev) {
    const b = ev.target && ev.target.closest ? ev.target.closest("[data-act]") : null;
    if (!b || !shop || b.disabled) return;
    const act = b.getAttribute("data-act"), k = b.getAttribute("data-k");
    if (act === "give" && shop.purse[k] > 0) { shop.purse[k]--; shop.counter[k]++; Ambience.stone(); }
    else if (act === "back" && shop.counter[k] > 0) { shop.counter[k]--; shop.purse[k]++; Ambience.lift(); }
    else if (act === "break" || act === "make") {
      const q = act === "break" ? Hoard.breakOne(shop.purse, k) : Hoard.makeOne(shop.purse, k);
      if (q) { shop.purse = q; Ambience.coin(); }
    }
    else if (act === "pay") { pay(); return; }
    else if (act === "close") { closeShop(); return; }
    else if (act === "lessons") { closeShop(); leave(); return; }
    paintShop();
  }

  function pay() {
    if (Hoard.judge(shop.counter, shop.it.price) !== "exact") return;
    const it = shop.it, left = shop.purse;
    Save.den(d => {
      d.coins = left;   /* what is still in her purse, trades and all */
      if (it.tab === "food") d.pantry[it.id] = (d.pantry[it.id] || 0) + 1;
      else if (!d.owned.includes(it.id)) d.owned.push(it.id);
      return d;
    });
    Ambience.coin();
    closeShop();
    paintPurse();
    /* The moment she buys a thing is the moment she wants to see it. */
    if (it.tab === "food") paintDrawer(); else use(it);
    react("delighted", pick(DEN.says.bought));
  }

  /* ---- coming and going --------------------------------------------------- */

  function open(leaveFn) {
    els();
    ensure();
    onLeave = leaveFn;
    el.den.hidden = false;
    paintPurse();
    paintRoom();
    paintDrawer();
    const d = Save.den();
    if (!d.visited) {
      Save.den(x => { x.visited = true; return x; });
      say(DEN.says.firstVisit);
    } else {
      say(pick(DEN.says.hello));
    }
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function leave() {
    closeShop();
    el.den.hidden = true;
    if (el.says) el.says.hidden = true;
    if (onLeave) onLeave();
  }

  /* Wired once, at load. Nothing is drawn until she opens the door. */
  (function init() {
    els();
    if (el.back) el.back.addEventListener("click", leave);
    [["wear", el.tabWear], ["room", el.tabRoom], ["food", el.tabFood]].forEach(([k, b]) => {
      if (b) b.addEventListener("click", () => { tab = k; paintDrawer(); Ambience.lift(); });
    });
    if (el.shop) el.shop.addEventListener("click", onShopTap);
    if (el.shopWrap) el.shopWrap.addEventListener("click", ev => { if (ev.target === el.shopWrap) closeShop(); });
    dressEmber();
  })();

  return { open, leave, payForStage, coinsHtml, dressEmber, ensure };
})();
