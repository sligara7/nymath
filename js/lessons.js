/* THE LESSON ENGINE.

   Content is data; the rules that judge it live here. There are four rules so
   far and adding a fifth is the only reason this file should ever grow.

   Two things this file is careful about.

   It never says she is wrong. When what she has built does not satisfy the
   rule yet, the readout describes WHAT IS THERE — "rows of 4, 2, 5, 1, not the
   same yet" — and lets her see the difference herself. Nothing goes red.

   And it never shows the arithmetic sentence before she has built the thing.
   The whole design rests on that order. */

const Lessons = (function () {

  /* ---- the rules ---------------------------------------------------------
     Each takes what the nest reports plus the numbers from the content, and
     answers one question: has she shown him yet? */

  const RULES = {

    /* Any solid rectangle of the right size. She chooses the shape — 3 by 4,
       4 by 3, 2 by 6 are all genuinely correct and the reveal reads back
       whichever one she actually built. */
    equalRows(rep, p) {
      const s = rep.shape;
      return s.ok && s.total === p.total &&
             s.rows >= (p.minRows || 2) && s.cols >= (p.minCols || 2);
    },

    exact(rep, p) {
      const s = rep.shape;
      return s.ok && s.rows === p.rows && s.cols === p.cols;
    },

    rim(rep) {
      return rep.rimNeeded > 0 && rep.rim === rep.rimNeeded;
    },

    /* The standard asks, in as many words, for rectangles with the same
       perimeter and different areas. This is that, as a thing she does. */
    samePerimeterLessArea(rep, p) {
      const s = rep.shape;
      if (!s.ok || !s.total) return false;
      return 2 * (s.rows + s.cols) === p.perimeter && s.rows * s.cols < p.lessThan;
    }
  };

  function passes(check, rep) {
    const fn = RULES[check.rule];
    return fn ? !!fn(rep, check) : false;
  }

  /* ---- what the readout says while she works ---------------------------- */

  function chips(rows, cols) {
    let out = "";
    for (let i = 1; i <= rows; i++) {
      out += '<span class="chip' + (i === rows ? " last" : "") + '">' + (i * cols) + "</span>";
    }
    return out;
  }

  function describe(check, rep) {
    const s = rep.shape;

    if (check.rule === "rim") {
      if (!rep.rim) return "Tap the edges to lay the twigs.";
      return "<b>" + rep.rim + "</b> of <b>" + rep.rimNeeded + "</b> twigs round the outside";
    }

    if (!rep.total) return "";

    if (check.rule === "samePerimeterLessArea") {
      if (!s.ok) return "<b>" + rep.total + "</b> stones — make it a full rectangle";
      return "round the outside <b>" + (2 * (s.rows + s.cols)) + "</b> · inside <b>" + (s.rows * s.cols) + "</b>";
    }

    /* Not a rectangle yet: show her the rows as they stand. This is the most
       important line in the file — it is the moment she sees "4, 2, 5, 1" and
       works out for herself what is wrong with it. */
    if (!s.ok) {
      const rc = rep.rowCounts;
      /* One span, because the readout is a flex row and loose text nodes
         between the numbers get the flex gap put in front of every comma. */
      if (rc.length > 1) return "<span>rows of <b>" + rc.join("</b>, <b>") + "</b> — not the same yet</span>";
      return "<b>" + rep.total + "</b> stones";
    }

    return chips(s.rows, s.cols) +
      '<span style="width:100%"></span>' +
      "<span><b>" + s.rows + "</b> rows of <b>" + s.cols + "</b> · <b>" + s.total + "</b> stones</span>";
  }

  /* ---- filling the reveal ----------------------------------------------- */

  function fill(text, rep) {
    const s = rep.shape;
    return String(text || "")
      .replace(/\{rows\}/g, s.rows)
      .replace(/\{cols\}/g, s.cols)
      .replace(/\{total\}/g, s.total)
      .replace(/\{area\}/g, s.rows * s.cols)
      .replace(/\{perimeter\}/g, 2 * (s.rows + s.cols));
  }

  return { RULES, passes, describe, fill, chips };
})();
