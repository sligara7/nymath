/* EMBER'S DEN — everything she can wear, put in her room, or eat, and what
   teaching her pays.

   Data, like the lessons: adding a hat is adding an entry here, never code.

   The look is daylight and Toca Boca-ish ON PURPOSE — pastels, a warm-brown
   outline round everything, flat colour — because the den is the reward for
   leaving the cave. Every drawing here is our own. Theirs are not ours to use.

   Prices are in COPPER (ten copper = a silver, ten silver = a gold) and the
   shop shows them as coins, never as a bare number: 18 is "1 silver and
   8 copper", and paying it is the point.

   Wearables are drawn in Ember's own coordinates (viewBox 0 0 124 128) so they
   sit on her wherever she is drawn; `box` is the crop used for the drawer
   icon. Room things and food carry their own `view`; `w` is how much of the
   room's width they take, and `hang` puts them up on the wall when first
   placed. */

const DEN = (function () {

  /* The outline. One colour, one weight, on everything she can own. */
  const INK = ' stroke="#5b3a2e" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  const THIN = ' stroke="#5b3a2e" stroke-width="1.5" stroke-linejoin="round"';

  return {

    /* What teaching pays. Only teaching pays: the quest is watched, and
       watching earns nothing, and nothing here is ever paid for speed. */
    pays: {
      firstTime: { silver: 2, copper: 3 },  /* a stage she has never taught Ember */
      again:     { silver: 1 },             /* teaching it again is still teaching */
      starter:   { copper: 12 }             /* so the shop makes sense on day one */
    },

    /* What she owns before she has bought anything. */
    start: {
      owned: ["cushion", "wall-pink"],
      placed: { cushion: [24, 92] },
      wall: "wall-pink"
    },

    /* Ember stands here (as % of the room) until she is moved. */
    emberAt: [52, 90],

    items: [

      /* ---- to wear: head ------------------------------------------------ */

      { id: "bow", tab: "wear", slot: "head", name: "Pink bow", price: 9, box: "42 8 40 28",
        art:
          '<path d="M62 22 L49 13 Q44 22 49 31 Z" fill="#ff8fb1"' + INK + '/>' +
          '<path d="M62 22 L75 13 Q80 22 75 31 Z" fill="#ff8fb1"' + INK + '/>' +
          '<circle cx="62" cy="22" r="4.5" fill="#ff6f9c"' + INK + '/>' },

      { id: "flowers", tab: "wear", slot: "head", name: "Flower crown", price: 18, box: "32 14 60 24",
        art:
          '<path d="M37 34 Q62 14 87 34" fill="none" stroke="#5aa55a" stroke-width="3.5" stroke-linecap="round"/>' +
          '<ellipse cx="47" cy="28" rx="3.5" ry="2" fill="#7cc77c"' + THIN + '/>' +
          '<ellipse cx="77" cy="28" rx="3.5" ry="2" fill="#7cc77c"' + THIN + '/>' +
          '<circle cx="42" cy="31" r="5" fill="#ffb3c7"' + INK + '/><circle cx="42" cy="31" r="1.8" fill="#f2a65a"/>' +
          '<circle cx="52" cy="25.5" r="5" fill="#fff3a8"' + INK + '/><circle cx="52" cy="25.5" r="1.8" fill="#f2a65a"/>' +
          '<circle cx="62" cy="23" r="5.5" fill="#ff8fb1"' + INK + '/><circle cx="62" cy="23" r="2" fill="#f2a65a"/>' +
          '<circle cx="72" cy="25.5" r="5" fill="#fff3a8"' + INK + '/><circle cx="72" cy="25.5" r="1.8" fill="#f2a65a"/>' +
          '<circle cx="82" cy="31" r="5" fill="#ffb3c7"' + INK + '/><circle cx="82" cy="31" r="1.8" fill="#f2a65a"/>' },

      { id: "partyhat", tab: "wear", slot: "head", name: "Party hat", price: 12, box: "44 -6 36 38",
        art:
          '<path d="M62 0 L49 27 Q62 32 75 27 Z" fill="#7dd3c8"' + INK + '/>' +
          '<path d="M57 11 L66 13 M53 20 L71 23" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.85"/>' +
          '<circle cx="62" cy="1" r="4.5" fill="#ffd166"' + INK + '/>' },

      { id: "wizard", tab: "wear", slot: "head", name: "Starry wizard hat", price: 26, box: "38 -10 48 44",
        art:
          '<path d="M47 28 Q56 6 70 -6 Q72 8 77 28 Z" fill="#9b7fe0"' + INK + '/>' +
          '<ellipse cx="62" cy="28" rx="20" ry="5.5" fill="#8a6dd6"' + INK + '/>' +
          '<path d="M63 9.5 l1.3 2.8 3 .4 -2.2 2.1 .6 3 -2.7 -1.5 -2.7 1.5 .6 -3 -2.2 -2.1 3 -.4 z" fill="#ffd166"/>' +
          '<path d="M56 17.5 l1 2.1 2.3 .3 -1.7 1.6 .5 2.3 -2.1 -1.1 -2.1 1.1 .5 -2.3 -1.7 -1.6 2.3 -.3 z" fill="#ffd166"/>' },

      { id: "crown", tab: "wear", slot: "head", name: "Golden crown", price: 45, box: "38 0 48 38",
        art:
          '<path d="M46 29 L44 11 L54 19 L62 6 L70 19 L80 11 L78 29 Q62 33 46 29 Z" fill="#f7c948"' + INK + '/>' +
          '<circle cx="62" cy="22" r="3" fill="#ff6f9c"' + INK + '/>' +
          '<circle cx="52" cy="25" r="2.2" fill="#7dd3c8"/><circle cx="72" cy="25" r="2.2" fill="#7dd3c8"/>' +
          '<circle cx="44" cy="11" r="2" fill="#fff3a8"/><circle cx="62" cy="6" r="2" fill="#fff3a8"/><circle cx="80" cy="11" r="2" fill="#fff3a8"/>' },

      /* ---- to wear: face ------------------------------------------------ */

      { id: "specs", tab: "wear", slot: "face", name: "Round glasses", price: 11, box: "30 36 64 26",
        art:
          '<circle cx="50" cy="49" r="10" fill="#ffffff" fill-opacity="0.25" stroke="#5b3a2e" stroke-width="2.6"/>' +
          '<circle cx="74" cy="49" r="10" fill="#ffffff" fill-opacity="0.25" stroke="#5b3a2e" stroke-width="2.6"/>' +
          '<path d="M60 48 Q62 46 64 48 M40 48 L34 45 M84 48 L90 45" stroke="#5b3a2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>' },

      { id: "shades", tab: "wear", slot: "face", name: "Sunglasses", price: 15, box: "28 36 68 24",
        art:
          '<path d="M38 46 L32 43 M86 46 L92 43" stroke="#5b3a2e" stroke-width="2.4" stroke-linecap="round"/>' +
          '<rect x="38" y="41" width="23" height="15" rx="7" fill="#2d2a3e"' + INK + '/>' +
          '<rect x="63" y="41" width="23" height="15" rx="7" fill="#2d2a3e"' + INK + '/>' +
          '<path d="M61 46 H63" stroke="#5b3a2e" stroke-width="2.4"/>' +
          '<path d="M42 45 L47 45 M67 45 L72 45" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>' },

      { id: "hearts", tab: "wear", slot: "face", name: "Heart glasses", price: 21, box: "28 36 68 26",
        art:
          '<path d="M39 46 L33 43 M85 46 L91 43" stroke="#5b3a2e" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M50 58 C38 51 39 41 45.5 41 C48.5 41 50 43.5 50 43.5 C50 43.5 51.5 41 54.5 41 C61 41 62 51 50 58 Z" fill="#ff6f9c" fill-opacity="0.9"' + INK + '/>' +
          '<path d="M74 58 C62 51 63 41 69.5 41 C72.5 41 74 43.5 74 43.5 C74 43.5 75.5 41 78.5 41 C85 41 86 51 74 58 Z" fill="#ff6f9c" fill-opacity="0.9"' + INK + '/>' },

      /* ---- to wear: neck ------------------------------------------------ */

      { id: "bowtie", tab: "wear", slot: "neck", name: "Bow tie", price: 8, box: "44 68 36 26",
        art:
          '<path d="M62 81 L49 73 L49 89 Z" fill="#5aa9e6"' + INK + '/>' +
          '<path d="M62 81 L75 73 L75 89 Z" fill="#5aa9e6"' + INK + '/>' +
          '<circle cx="62" cy="81" r="3.6" fill="#3d8bd0"' + INK + '/>' +
          '<circle cx="54" cy="81" r="1.3" fill="#ffffff"/><circle cx="70" cy="81" r="1.3" fill="#ffffff"/>' },

      { id: "scarf", tab: "wear", slot: "neck", name: "Cosy scarf", price: 14, box: "30 68 64 42",
        art:
          '<path d="M72 86 L76 106 L85 104 L80 85 Z" fill="#ef6f6c"' + INK + '/>' +
          '<path d="M37 74 Q62 92 87 74 L88 83 Q62 101 36 83 Z" fill="#ef6f6c"' + INK + '/>' +
          '<path d="M47 81 L46 89 M62 84 L62 91 M77 81 L78 89 M76 96 L83 95" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.75"/>' },

      { id: "pearls", tab: "wear", slot: "neck", name: "Pearl necklace", price: 32, box: "36 70 52 32",
        art:
          ['44,78', '48.5,81.9', '53,84.8', '57.5,86.4', '62,87', '66.5,86.4', '71,84.8', '75.5,81.9', '80,78']
            .map(p => { const [x, y] = p.split(","); return '<circle cx="' + x + '" cy="' + y + '" r="2.8" fill="#fff8ef"' + THIN + '/>'; }).join("") +
          '<path d="M62 89 l4 4 -4 5 -4 -5 z" fill="#ff6f9c"' + INK + '/>' },

      /* ---- for the room -------------------------------------------------- */

      { id: "cushion", tab: "room", name: "Nest cushion", price: 20, view: "0 30 100 58", w: 0.40,
        art:
          '<ellipse cx="50" cy="68" rx="46" ry="18" fill="#c98b5b"' + INK + '/>' +
          '<path d="M10 64 Q50 86 90 64" fill="none" stroke="#a86d43" stroke-width="2.5"/>' +
          '<ellipse cx="50" cy="60" rx="36" ry="13" fill="#ffb3c7"' + INK + '/>' +
          '<path d="M30 58 Q50 66 70 58" fill="none" stroke="#ff8fb1" stroke-width="3" stroke-linecap="round"/>' },

      { id: "rug", tab: "room", kind: "rug", name: "Round rug", price: 16, view: "0 33 100 34", w: 0.56,
        art:
          '<ellipse cx="50" cy="50" rx="47" ry="15" fill="#fff1c9"' + INK + '/>' +
          '<ellipse cx="50" cy="50" rx="34" ry="10" fill="none" stroke="#f2a65a" stroke-width="3"/>' +
          '<ellipse cx="50" cy="50" rx="18" ry="5" fill="#ffd1dc"/>' },

      { id: "plant", tab: "room", name: "Big leafy plant", price: 13, view: "0 0 100 100", w: 0.22,
        art:
          '<ellipse cx="34" cy="38" rx="13" ry="24" transform="rotate(-28 34 38)" fill="#5cb85c"' + INK + '/>' +
          '<ellipse cx="66" cy="36" rx="13" ry="24" transform="rotate(28 66 36)" fill="#4caf50"' + INK + '/>' +
          '<ellipse cx="50" cy="26" rx="12" ry="24" fill="#66c26a"' + INK + '/>' +
          '<ellipse cx="26" cy="58" rx="9" ry="16" transform="rotate(-62 26 58)" fill="#4caf50"' + INK + '/>' +
          '<ellipse cx="74" cy="58" rx="9" ry="16" transform="rotate(62 74 58)" fill="#5cb85c"' + INK + '/>' +
          '<path d="M50 50 V12 M50 58 L36 40 M50 58 L64 38" stroke="#3e8e41" stroke-width="2" fill="none"/>' +
          '<path d="M33 70 L67 70 L62 97 L38 97 Z" fill="#e07a5f"' + INK + '/>' +
          '<rect x="29" y="62" width="42" height="9" rx="3" fill="#e8906f"' + INK + '/>' },

      { id: "lamp", tab: "room", name: "Tall lamp", price: 19, view: "0 0 60 140", w: 0.13,
        art:
          '<circle cx="30" cy="26" r="26" fill="#fff3a8" opacity="0.45"/>' +
          '<rect x="28" y="38" width="4" height="92" fill="#5b3a2e"/>' +
          '<ellipse cx="30" cy="132" rx="18" ry="6" fill="#8d6e63"' + INK + '/>' +
          '<path d="M14 8 L46 8 L56 40 L4 40 Z" fill="#ffe08a"' + INK + '/>' +
          '<path d="M12 18 H48" stroke="#f2c14e" stroke-width="2"/>' },

      { id: "teddy", tab: "room", name: "Teddy bear", price: 15, view: "0 0 60 64", w: 0.13,
        art:
          '<circle cx="16" cy="14" r="8" fill="#b07a4f"' + INK + '/><circle cx="44" cy="14" r="8" fill="#b07a4f"' + INK + '/>' +
          '<ellipse cx="30" cy="48" rx="17" ry="14" fill="#b07a4f"' + INK + '/>' +
          '<ellipse cx="30" cy="51" rx="9" ry="7" fill="#f1d3b3"/>' +
          '<circle cx="30" cy="24" r="15" fill="#c48a5c"' + INK + '/>' +
          '<ellipse cx="30" cy="29" rx="6" ry="4.5" fill="#f1d3b3"/>' +
          '<circle cx="30" cy="27.5" r="1.8" fill="#5b3a2e"/>' +
          '<circle cx="24" cy="21" r="1.8" fill="#5b3a2e"/><circle cx="36" cy="21" r="1.8" fill="#5b3a2e"/>' +
          '<path d="M30 39 l-7 -4 v8 z M30 39 l7 -4 v8 z" fill="#ff6f9c"' + THIN + '/>' },

      { id: "ball", tab: "room", name: "Bouncy ball", price: 7, view: "0 0 40 40", w: 0.09,
        art:
          '<circle cx="20" cy="20" r="17" fill="#ff6f9c"/>' +
          '<path d="M4 16 Q20 24 36 16 L36 22 Q20 30 4 22 Z" fill="#ffd166"/>' +
          '<circle cx="20" cy="20" r="17" fill="none" stroke="#5b3a2e" stroke-width="2.2"/>' +
          '<ellipse cx="13" cy="11" rx="4" ry="2.5" fill="#ffffff" opacity="0.6"/>' },

      { id: "beanbag", tab: "room", name: "Beanbag", price: 29, view: "0 0 100 80", w: 0.28,
        art:
          '<path d="M10 72 Q2 40 30 22 Q52 8 72 24 Q98 40 90 72 Z" fill="#7dd3c8"' + INK + '/>' +
          '<path d="M30 40 Q50 52 70 40" fill="none" stroke="#5fbfb3" stroke-width="3" stroke-linecap="round"/>' +
          '<ellipse cx="40" cy="30" rx="8" ry="4" fill="#ffffff" opacity="0.5"/>' },

      { id: "table", tab: "room", name: "Table with tulips", price: 25, view: "0 0 80 100", w: 0.2,
        art:
          '<path d="M34 50 L30 26 M40 50 V22 M46 50 L50 27" stroke="#3e8e41" stroke-width="2.4"/>' +
          '<path d="M25 26 Q30 14 35 26 Q30 30 25 26 Z" fill="#ff6f9c"' + INK + '/>' +
          '<path d="M35 22 Q40 10 45 22 Q40 26 35 22 Z" fill="#ffd166"' + INK + '/>' +
          '<path d="M45 27 Q50 15 55 27 Q50 31 45 27 Z" fill="#ff8fb1"' + INK + '/>' +
          '<path d="M32 51 Q29 38 34 36 L46 36 Q51 38 48 51 Z" fill="#a9c7ff"' + INK + '/>' +
          '<ellipse cx="40" cy="54" rx="32" ry="7" fill="#f2c14e"' + INK + '/>' +
          '<rect x="37" y="59" width="6" height="31" fill="#c98b5b"' + INK + '/>' +
          '<ellipse cx="40" cy="92" rx="16" ry="5" fill="#c98b5b"' + INK + '/>' },

      { id: "bookshelf", tab: "room", name: "Bookshelf", price: 34, view: "0 0 80 104", w: 0.26,
        art:
          '<rect x="6" y="96" width="8" height="6" fill="#8d5a35"/><rect x="66" y="96" width="8" height="6" fill="#8d5a35"/>' +
          '<rect x="4" y="4" width="72" height="94" rx="4" fill="#d9a066"' + INK + '/>' +
          '<rect x="10" y="10" width="60" height="82" fill="#b97a45"/>' +
          '<rect x="13" y="17" width="7" height="20" fill="#ef6f6c"' + THIN + '/><rect x="21" y="14" width="6" height="23" fill="#7dd3c8"' + THIN + '/>' +
          '<rect x="28" y="19" width="8" height="18" fill="#ffd166"' + THIN + '/><rect x="37" y="15" width="6" height="22" fill="#9b7fe0"' + THIN + '/>' +
          '<circle cx="60" cy="23" r="6" fill="#5cb85c"' + THIN + '/><rect x="55" y="27" width="11" height="10" fill="#e07a5f"' + THIN + '/>' +
          '<rect x="13" y="44" width="12" height="21" fill="#5aa9e6"' + THIN + '/><rect x="26" y="48" width="7" height="17" fill="#ff8fb1"' + THIN + '/>' +
          '<rect x="34" y="44" width="6" height="21" fill="#ffd166"' + THIN + '/><circle cx="58" cy="58" r="7" fill="#ff6f9c"' + THIN + '/>' +
          '<rect x="13" y="72" width="30" height="20" rx="2" fill="#fff1c9"' + THIN + '/>' +
          '<rect x="48" y="70" width="7" height="22" fill="#ef6f6c"' + THIN + '/><rect x="56" y="73" width="6" height="19" fill="#7dd3c8"' + THIN + '/>' +
          '<path d="M10 37 H70 M10 65 H70" stroke="#5b3a2e" stroke-width="3"/>' },

      { id: "painting", tab: "room", hang: true, name: "Painting of a drake", price: 27, view: "0 0 80 64", w: 0.24,
        art:
          '<rect x="3" y="3" width="74" height="58" rx="3" fill="#f2c14e"' + INK + '/>' +
          '<rect x="11" y="11" width="58" height="42" fill="#bfe6ff"/>' +
          '<circle cx="56" cy="22" r="6" fill="#ffd166"/>' +
          '<path d="M11 53 L11 40 Q25 28 40 40 Q52 30 69 41 L69 53 Z" fill="#8fd18f"/>' +
          '<path d="M26 34 l-2 -5 M34 34 l2 -5" stroke="#5b3a2e" stroke-width="1.6" stroke-linecap="round"/>' +
          '<circle cx="30" cy="38" r="5.5" fill="#ff8a3d"/>' +
          '<rect x="11" y="11" width="58" height="42" fill="none" stroke="#5b3a2e" stroke-width="2"/>' },

      { id: "lights", tab: "room", hang: true, name: "String lights", price: 24, view: "0 0 120 36", w: 0.6,
        art:
          '<path d="M2 8 Q20 26 40 12 Q60 -2 80 12 Q100 26 118 8" fill="none" stroke="#5b3a2e" stroke-width="2"/>' +
          [["12", "21", "#ffd166"], ["28", "23", "#ff8fb1"], ["44", "15", "#7dd3c8"], ["60", "10", "#ffd166"],
           ["76", "15", "#ff8fb1"], ["92", "23", "#7dd3c8"], ["108", "21", "#ffd166"]]
            .map(b => '<ellipse cx="' + b[0] + '" cy="' + b[1] + '" rx="4" ry="5.5" fill="' + b[2] + '"' + THIN + '/>').join("") },

      { id: "star", tab: "room", hang: true, name: "Star nightlight", price: 17, view: "0 0 50 50", w: 0.12,
        art:
          '<circle cx="25" cy="25" r="22" fill="#fff3a8" opacity="0.45"/>' +
          '<path d="M25 7 L29.7 18.5 L42.1 19.4 L32.6 27.5 L35.6 39.6 L25 33 L14.4 39.6 L17.4 27.5 L7.9 19.4 L20.3 18.5 Z" fill="#ffd166"' + INK + '/>' +
          '<circle cx="21.5" cy="24" r="1.5" fill="#5b3a2e"/><circle cx="28.5" cy="24" r="1.5" fill="#5b3a2e"/>' +
          '<path d="M22 28 Q25 31 28 28" fill="none" stroke="#5b3a2e" stroke-width="1.5" stroke-linecap="round"/>' },

      /* ---- the walls: buying one changes the room ---------------------- */

      { id: "wall-pink", tab: "room", kind: "wall", name: "Pink dots", price: 10, view: "0 0 40 40",
        art: '<rect x="2" y="2" width="36" height="36" rx="6" fill="#ffe1e8"' + INK + '/>' +
             '<circle cx="12" cy="12" r="3" fill="#ffc2d1"/><circle cx="28" cy="20" r="3" fill="#ffc2d1"/><circle cx="14" cy="29" r="3" fill="#ffc2d1"/>' },

      { id: "wall-mint", tab: "room", kind: "wall", name: "Mint stripes", price: 22, view: "0 0 40 40",
        art: '<rect x="2" y="2" width="36" height="36" rx="6" fill="#d6f5ec"' + INK + '/>' +
             '<path d="M11 4 V36 M20 4 V36 M29 4 V36" stroke="#a9e8d6" stroke-width="4"/>' },

      { id: "wall-lilac", tab: "room", kind: "wall", name: "Lilac stars", price: 28, view: "0 0 40 40",
        art: '<rect x="2" y="2" width="36" height="36" rx="6" fill="#ece3fd"' + INK + '/>' +
             '<path d="M13 9 l1.5 3 3.3 .5 -2.4 2.3 .6 3.3 -3 -1.6 -3 1.6 .6 -3.3 -2.4 -2.3 3.3 -.5 z" fill="#cdb8f8"/>' +
             '<path d="M27 21 l1.5 3 3.3 .5 -2.4 2.3 .6 3.3 -3 -1.6 -3 1.6 .6 -3.3 -2.4 -2.3 3.3 -.5 z" fill="#cdb8f8"/>' },

      { id: "wall-sky", tab: "room", kind: "wall", name: "Sky and clouds", price: 35, view: "0 0 40 40",
        art: '<rect x="2" y="2" width="36" height="36" rx="6" fill="#cfeaff"' + INK + '/>' +
             '<path d="M8 18 q0 -5 5 -5 q2 -4 7 -2 q5 -1 6 4 q4 0 4 3 z" fill="#ffffff"/>' +
             '<path d="M16 30 q0 -4 4 -4 q2 -3 6 -1 q4 0 4 3 q3 0 3 2 z" fill="#ffffff"/>' },

      /* ---- to eat ------------------------------------------------------- */

      { id: "berries", tab: "food", name: "Berries", price: 3, view: "0 0 40 40",
        line: "Mmm, juicy! My mouth is purple now.",
        art:
          '<path d="M20 12 Q24 4 30 7" stroke="#3e8e41" stroke-width="2.4" fill="none"/>' +
          '<ellipse cx="26" cy="8" rx="5" ry="2.5" fill="#5cb85c"' + THIN + '/>' +
          '<circle cx="14" cy="21" r="7" fill="#7b6cf0"' + INK + '/><circle cx="26" cy="21" r="7" fill="#9b7fe0"' + INK + '/>' +
          '<circle cx="20" cy="31" r="7" fill="#6a5ae0"' + INK + '/>' +
          '<circle cx="12" cy="19" r="1.6" fill="#ffffff" opacity="0.7"/><circle cx="24" cy="19" r="1.6" fill="#ffffff" opacity="0.7"/>' },

      { id: "pepper", tab: "food", name: "Fire pepper", price: 4, view: "0 0 40 40",
        line: "SPICY! I can almost breathe fire!",
        art:
          '<path d="M9 13 Q6 30 22 36 Q36 38 34 31 Q20 28 18 13 Z" fill="#ef4f4c"' + INK + '/>' +
          '<ellipse cx="13.5" cy="12" rx="6.5" ry="3" fill="#5cb85c"' + THIN + '/>' +
          '<path d="M13 10 Q13 4 19 3" stroke="#3e8e41" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<path d="M13 18 Q13 26 18 30" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>' },

      { id: "fish", tab: "food", name: "Fish", price: 5, view: "0 0 40 40",
        line: "Fish! My favourite!",
        art:
          '<path d="M30 20 L39 12 L39 28 Z" fill="#5aa9e6"' + INK + '/>' +
          '<ellipse cx="18" cy="20" rx="15" ry="9" fill="#7ec3f0"' + INK + '/>' +
          '<circle cx="10" cy="18" r="1.8" fill="#5b3a2e"/>' +
          '<path d="M19 14 Q22 20 19 26" stroke="#5aa9e6" stroke-width="2" fill="none"/>' },

      { id: "cupcake", tab: "food", name: "Cupcake", price: 8, view: "0 0 40 40",
        line: "A whole cupcake? Best day ever.",
        art:
          '<path d="M8 22 L32 22 L28 37 L12 37 Z" fill="#7dd3c8"' + INK + '/>' +
          '<path d="M14 23 L15 36 M20 23 V36 M26 23 L25 36" stroke="#5fbfb3" stroke-width="1.6"/>' +
          '<path d="M6 23 Q4 14 12 13 Q14 5 22 7 Q30 5 32 13 Q37 15 34 23 Z" fill="#ffd1dc"' + INK + '/>' +
          '<path d="M13 17 l2 -1 M22 12 l2 1 M27 17 l1 -2 M18 19 l1 1" stroke="#9b7fe0" stroke-width="1.8" stroke-linecap="round"/>' +
          '<circle cx="21" cy="6" r="3.5" fill="#ef4f4c"' + THIN + '/>' }
    ],

    /* What Ember says in her den. {name} is whatever the player typed at the
       door, filled in by the same code that fills the lessons. */
    says: {
      hello: [
        "You're home, {name}! Come and see my den.",
        "Hello again, {name}! Shall we make it cosy?",
        "My den! It's my favourite place. After you.",
      ],
      firstVisit: "This is my den, {name}. It's a bit empty. Teach me things and I'll find coins — then we can make it lovely!",
      bought: ["For me? Thank you!", "Ooh, I love it!", "That's going to look SO good."],
      wear: {
        head: "Do I look fancy?",
        face: "Everything looks different through these!",
        neck: "So cosy."
      },
      takeOff: "Ahh. That's comfier.",
      placed: "Ooh, I like it there.",
      putAway: "Tidy!",
      hungry: "My tummy's rumbling. Have we got any snacks?",
      poke: ["Hee hee! That tickles.", "What shall we do next?", "I'm so glad you're here.", "Rawr! (That's dragon for hello.)"]
    },

    /* Pip the mole keeps the shop. Pip has no change, ever, which is the
       mathematics: she has to make the price exactly. */
    pip: {
      name: "Pip's Trading Post",
      art:
        '<ellipse cx="18" cy="46" rx="7" ry="4" fill="#f1c9d6"' + THIN + '/><ellipse cx="42" cy="46" rx="7" ry="4" fill="#f1c9d6"' + THIN + '/>' +
        '<ellipse cx="30" cy="30" rx="24" ry="18" fill="#8d7b8f"' + INK + '/>' +
        '<ellipse cx="30" cy="35" rx="12" ry="8" fill="#c9b8c9"/>' +
        '<path d="M19 25 q3 -3 6 0 M35 25 q3 -3 6 0" fill="none" stroke="#5b3a2e" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="30" cy="31" r="4.5" fill="#ff8fb1"' + INK + '/>' +
        '<path d="M22 33 l-9 -2 M22 36 l-9 2 M38 33 l9 -2 M38 36 l9 2" stroke="#5b3a2e" stroke-width="1.2" stroke-linecap="round"/>',
      exact: "That's exactly right! Thank you!",
      short: "Not quite enough yet.",
      over: "Oh dear — that's too much, and I haven't got any change!",
      empty: "Put coins on the counter until they make the price.",
      broke: "That one needs more coins than you've got. Teach Ember something and she'll find some!"
    }
  };
})();
