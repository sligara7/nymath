/* EMBER — a hatchling drake, drawn rather than downloaded.

   He is inline SVG for two reasons. He scales to any phone without a second
   asset, and his FACE is data: the moods below are just different eyes and
   mouths swapped into the same body, so giving him a new expression costs
   four lines, not a new drawing.

   The moods matter more than they look. He is the one who is confused, so
   she is never the one who is confused — and a nine-year-old reads a face
   long before she reads a sentence. */

const Ember = (function () {

  const EYES = {
    /* Big, wide, everything is interesting. */
    curious:
      '<ellipse cx="48" cy="45" rx="8.5" ry="9.5" fill="#fffaf0"/>' +
      '<ellipse cx="72" cy="45" rx="8.5" ry="9.5" fill="#fffaf0"/>' +
      '<circle cx="49.5" cy="46" r="4.6" fill="#241a12"/>' +
      '<circle cx="73.5" cy="46" r="4.6" fill="#241a12"/>' +
      '<circle cx="51" cy="44" r="1.7" fill="#fff"/>' +
      '<circle cx="75" cy="44" r="1.7" fill="#fff"/>',

    /* Pupils going two different ways. Reads as "lost" instantly. */
    muddled:
      '<ellipse cx="48" cy="45" rx="8.5" ry="9" fill="#fffaf0"/>' +
      '<ellipse cx="72" cy="45" rx="8.5" ry="9" fill="#fffaf0"/>' +
      '<circle cx="45" cy="47" r="4.2" fill="#241a12"/>' +
      '<circle cx="75" cy="43" r="4.2" fill="#241a12"/>',

    /* Looking up and off to one side — the face of working something out. */
    thinking:
      '<ellipse cx="48" cy="45" rx="8" ry="8.5" fill="#fffaf0"/>' +
      '<ellipse cx="72" cy="45" rx="8" ry="8.5" fill="#fffaf0"/>' +
      '<circle cx="50" cy="41" r="4.2" fill="#241a12"/>' +
      '<circle cx="74" cy="41" r="4.2" fill="#241a12"/>',

    worried:
      '<ellipse cx="48" cy="46" rx="8" ry="8.5" fill="#fffaf0"/>' +
      '<ellipse cx="72" cy="46" rx="8" ry="8.5" fill="#fffaf0"/>' +
      '<circle cx="48" cy="47" r="4" fill="#241a12"/>' +
      '<circle cx="72" cy="47" r="4" fill="#241a12"/>' +
      '<path d="M40 35 Q48 32 55 36" stroke="#241a12" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M65 36 Q72 32 80 35" stroke="#241a12" stroke-width="2.4" fill="none" stroke-linecap="round"/>',

    /* Happy eyes are arcs, not circles. Nothing else says delighted so fast. */
    delighted:
      '<path d="M40 47 Q48 37 56 47" stroke="#241a12" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M64 47 Q72 37 80 47" stroke="#241a12" stroke-width="4" fill="none" stroke-linecap="round"/>',

    sleepy:
      '<path d="M41 46 Q48 51 55 46" stroke="#241a12" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M65 46 Q72 51 79 46" stroke="#241a12" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
  };

  const MOUTH = {
    curious:   '<path d="M54 62 Q60 67 66 62" stroke="#241a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    muddled:   '<path d="M53 63 q3 -3 6 0 t6 0" stroke="#241a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    thinking:  '<path d="M55 63 h10" stroke="#241a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    worried:   '<path d="M54 65 Q60 60 66 65" stroke="#241a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    delighted: '<path d="M50 60 Q60 71 70 60" stroke="#241a12" stroke-width="3" fill="#2a1d14" stroke-linecap="round"/>',
    sleepy:    '<ellipse cx="60" cy="63" rx="3.5" ry="2.6" fill="#241a12"/>'
  };

  function svg(mood) {
    const m = EYES[mood] ? mood : "curious";
    return (
'<svg viewBox="0 0 124 128" width="100%" aria-hidden="true">' +
  '<defs>' +
    '<linearGradient id="hide" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ff9a4d"/><stop offset="1" stop-color="#e05f28"/>' +
    '</linearGradient>' +
    '<linearGradient id="wing" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffb877"/><stop offset="1" stop-color="#d4551f"/>' +
    '</linearGradient>' +
  '</defs>' +

  /* Tail with a spade on the end, swung out to one side so it reads as a
     tail and not as a shadow. */
  '<path d="M86 104 q26 4 24 -16 q-2 -14 -13 -13" fill="none" stroke="#d4551f" stroke-width="9" stroke-linecap="round"/>' +
  '<path d="M97 76 l10 -5 l-1 11 z" fill="#d4551f"/>' +

  /* Stub wings. Scalloped along the bottom, because that edge is most of what
     makes a shape read as a wing — and they are far too small to lift him,
     which is the whole of Grade 3. */
  '<path d="M27 78 q-19 -17 -18 2 q9 -3 5 6 q7 -3 6 5 q6 -4 10 1 z" fill="url(#wing)"/>' +
  '<path d="M97 78 q19 -17 18 2 q-9 -3 -5 6 q-7 -3 -6 5 q-6 -4 -10 1 z" fill="url(#wing)"/>' +

  /* Body */
  '<ellipse cx="62" cy="88" rx="32" ry="26" fill="url(#hide)"/>' +
  '<ellipse cx="62" cy="94" rx="19" ry="16" fill="#ffd9a8"/>' +
  '<path d="M47 96 h30 M49 104 h26" stroke="#f0bd84" stroke-width="2.2" stroke-linecap="round"/>' +

  /* Feet */
  '<ellipse cx="47" cy="112" rx="10" ry="6" fill="#c8501f"/>' +
  '<ellipse cx="77" cy="112" rx="10" ry="6" fill="#c8501f"/>' +
  '<path d="M41 112 h3 M46 112 h3 M51 112 h3" stroke="#a03c14" stroke-width="1.6" stroke-linecap="round"/>' +
  '<path d="M71 112 h3 M76 112 h3 M81 112 h3" stroke="#a03c14" stroke-width="1.6" stroke-linecap="round"/>' +

  /* Two horns, swept back and clear of the skull so they are horns rather
     than ears. */
  '<path d="M46 28 q-6 -16 -11 -21 q11 2 17 17 z" fill="#f2d9b8"/>' +
  '<path d="M78 28 q6 -16 11 -21 q-11 2 -17 17 z" fill="#f2d9b8"/>' +

  /* A little ridge of spines down the back of the head. */
  '<path d="M62 19 l5 8 h-10 z" fill="#c8501f"/>' +

  /* Head */
  '<circle cx="62" cy="52" r="27" fill="url(#hide)"/>' +
  '<ellipse cx="62" cy="64" rx="15" ry="11" fill="#ffd9a8"/>' +
  '<circle cx="57" cy="60" r="1.9" fill="#b8481a"/>' +
  '<circle cx="67" cy="60" r="1.9" fill="#b8481a"/>' +

  /* The face is drawn against the old head centre; one translate keeps all
     six moods in register instead of editing thirty coordinates. */
  '<g transform="translate(2,4)">' + EYES[m] + MOUTH[m] + '</g>' +
'</svg>');
  }

  /* One extra flourish for the very end of the grade, when he curls up in the
     nest she built him. */
  function sleeping() {
    return svg("sleepy").replace('</svg>',
      '<text x="92" y="30" font-size="13" fill="#a8b6c2" opacity="0.8">z</text>' +
      '<text x="102" y="18" font-size="10" fill="#a8b6c2" opacity="0.6">z</text></svg>');
  }

  return {
    draw(el, mood) { el.innerHTML = svg(mood); },
    drawSleeping(el) { el.innerHTML = sleeping(); },
    moods: Object.keys(EYES)
  };
})();
