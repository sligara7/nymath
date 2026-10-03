/* GRADE 3 — The Hatchling.

   This file is DATA. There is no logic in it, deliberately: adding a grade
   should mean writing one of these, not touching the game. Every stage names
   the New York standard codes it serves, so a grown-up can check the coverage
   against the PDF without reading any code.

   Three things every stage must have:

     emberSays  — what Ember gets WRONG, in her own voice. The mistake is
                  always Ember's. The player is never the one who failed
                  at something.
     task       — one line. If it needs two lines it is two stages. Said
                  as a little challenge or a plea, never as an instruction
                  ("Rescue her nest!", not "Build it the other way round"),
                  and it still has to say exactly what to build.
     check      — a named rule plus its numbers. The rule lives in the engine.
     clues      — three, given one per tap of "Want a clue?": a nudge in
                  words, then a clearer picture (`show` makes some hollows
                  or twig slots glow), then a worked example whose glow is a
                  whole correct shape. She still builds it herself. Clues
                  never cost coins.

   And one thing that must come LAST:

     reveal     — the arithmetic sentence. It appears only after she has
                  built the thing. Show the sentence first and you have made
                  a worksheet with a dragon on it.

   Templates in text: {rows} {cols} {total} {perimeter} {area} — filled from
   what she actually built, because in some stages she is genuinely free to
   choose and the sentence has to be about HER nest.  */

const GRADE3 = {
  grade: 3,
  title: "The Hatchling",
  subtitle: "She cannot fly yet. She cannot count either.",

  lessons: [

    /* ---------------------------------------------------------------- 1 -- */
    {
      id: "g3-ragged-nest",
      name: "The first nest",
      standards: ["NY-3.OA.1", "NY-3.MD.5"],
      stages: [{
        mood: "muddled",
        emberSays: "I built my nest! It took me <em>ages</em>. I counted every single stone, one at a time, and I got eleven. Then I counted again and got thirteen.",
        task: "Her nest is a wobbly mess! Make every row match.",
        grid: { rows: 5, cols: 6 },
        /* Ember's attempt: twelve stones in ragged rows. A real mistake — this is
           what a pile looks like before anybody thinks of rows. */
        his: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0]],
        check: { rule: "equalRows", total: 12, minRows: 2 },
        clues: [
          { say: "Count all her stones first. How many has she got altogether?" },
          { say: "Her top row has 4 already. Make the next row match it.", show: { r0: 1, rows: 1, cols: 4 } },
          { say: "Like this: 3 rows of 4. Move her stones into the glowing hollows.", show: { rows: 3, cols: 4 } }
        ],
        reveal: {
          sentence: "{rows} × {cols} = {total}",
          said: "Oh! Every row is the same now. So I only have to count <em>one</em> row — then skip along. I never have to count them all again.",
          learned: "Equal rows make an array. NY-3.OA.1"
        }
      }]
    },

    /* ---------------------------------------------------------------- 2 -- */
    {
      id: "g3-fast-count",
      name: "The fast count",
      standards: ["NY-3.OA.3", "NY-3.MD.7"],
      stages: [{
        mood: "curious",
        emberSays: "I'm going to be much bigger by spring. I need four rows, with five stones in each. That's... I'll start counting. One, two, three—",
        task: "Save her from counting to twenty — lay 4 rows of 5.",
        grid: { rows: 5, cols: 6 },
        check: { rule: "exact", rows: 4, cols: 5 },
        clues: [
          { say: "Start in a corner, and lay one row of 5 first." },
          { say: "Here's one row of 5. Now three more just like it underneath.", show: { rows: 1, cols: 5 } },
          { say: "4 rows, 5 in each. Fill every glowing hollow.", show: { rows: 4, cols: 5 } }
        ],
        reveal: {
          sentence: "4 × 5 = 20",
          said: "Five, ten, fifteen, twenty. I didn't count a single stone twice.",
          learned: "Rows of equal size can be skip-counted. NY-3.OA.3"
        }
      }]
    },

    /* ---------------------------------------------------------------- 3 -- */
    {
      id: "g3-turn-it",
      name: "Turning the nest",
      standards: ["NY-3.OA.5"],
      stages: [{
        mood: "worried",
        emberSays: "My nest is 3 rows of 8. But the ledge I want is only <em>three</em> stones wide. If I turn the whole thing sideways I'll have to throw some stones off the cliff, won't I?",
        task: "Rescue her nest! Turn it into 8 rows of 3 — no stones lost.",
        grid: { rows: 8, cols: 5 },
        check: { rule: "exact", rows: 8, cols: 3 },
        clues: [
          { say: "Tall and thin now: only 3 across, and 8 rows down." },
          { say: "Every row is just 3 stones wide, like this one.", show: { rows: 1, cols: 3 } },
          { say: "8 rows of 3. Fill the glowing hollows from top to bottom.", show: { rows: 8, cols: 3 } }
        ],
        reveal: {
          sentence: "8 × 3 = 3 × 8 = 24",
          said: "Twenty-four both ways. I turned my whole nest round and I didn't lose <em>one stone</em>.",
          learned: "Turning an array does not change how many. NY-3.OA.5"
        }
      }]
    },

    /* ---------------------------------------------------------------- 4 -- */
    {
      id: "g3-the-rim",
      name: "The rim",
      standards: ["NY-3.MD.8"],
      stages: [
        {
          mood: "curious",
          emberSays: "Floor's done. Now I need twigs all the way round the outside, or I'll roll straight off it in the night.",
          task: "Fence time! A twig on every edge so she can't roll out.",
          grid: { rows: 3, cols: 4 },
          /* The floor is already laid and cannot be touched. This stage is
             about the OUTSIDE — the two ideas must not be muddled by letting
             her rebuild the floor halfway through. */
          fill: { rows: 3, cols: 4 },
          locked: true,
          mode: "rim",
          check: { rule: "rim" },
          clues: [
          { say: "Twigs go round the OUTSIDE edge, not in between the stones." },
          { say: "Start along the top: one twig above every stone.", show: { twigs: "top" } },
          { say: "Every glowing edge needs a twig: top, bottom and both sides.", show: { twigs: "all" } }
        ],
          reveal: {
            sentence: "4 + 4 + 3 + 3 = 14",
            said: "Fourteen twigs round the edge. But only twelve stones on the floor. Those aren't the same number at all!",
            learned: "The distance round is perimeter. The space inside is area. NY-3.MD.8"
          }
        },
        {
          mood: "thinking",
          emberSays: "So a <em>longer</em> rim always means a <em>bigger</em> floor. Obviously. More twigs, more room. That's just how it works.",
          task: "Prove her wrong! Same 14 twigs round it, fewer stones inside.",
          grid: { rows: 5, cols: 7 },
          hint: "Long and thin.",
          check: { rule: "samePerimeterLessArea", perimeter: 14, lessThan: 12 },
          clues: [
          { say: "Long and thin means only a few rows. What if it's just 2 rows tall?" },
          { say: "2 rows tall, like these. Now how long can it be?", show: { rows: 2, cols: 1 } },
          { say: "2 rows of 5: 5 + 5 + 2 + 2 = 14 twigs, but only 10 stones inside.", show: { rows: 2, cols: 5 } }
        ],
          reveal: {
            sentence: "{perimeter} round · only {area} inside",
            said: "The same twigs. The same rim, exactly. And it's a <em>worse nest</em>. I was completely wrong.",
            learned: "Same perimeter, different area — the standard asks for exactly this. NY-3.MD.8"
          }
        }
      ]
    },

    /* ---------------------------------------------------------------- 5 -- */
    {
      id: "g3-break-it-apart",
      name: "Breaking it apart",
      standards: ["NY-3.OA.5", "NY-3.OA.7"],
      stages: [
        {
          mood: "worried",
          emberSays: "Six rows of seven. I know my <em>fives</em>. I don't know sevens. I'm never going to know sevens.",
          task: "Start with the bit she knows — 6 rows of 5. Easy-peasy.",
          grid: { rows: 6, cols: 7 },
          check: { rule: "exact", rows: 6, cols: 5 },
          clues: [
          { say: "She knows her fives! Make every row 5 stones long." },
          { say: "One row of 5, like this. She needs 6 rows of them.", show: { rows: 1, cols: 5 } },
          { say: "6 rows of 5. Fill every glowing hollow.", show: { rows: 6, cols: 5 } }
        ],
          reveal: {
            sentence: "6 × 5 = 30",
            said: "Well, yes. I can do that bit.",
            learned: "",
            keep: true
          }
        },
        {
          mood: "curious",
          emberSays: "But that's only five in each row. I need <em>seven</em>.",
          task: "Now sneak 2 more stones onto the end of every row.",
          grid: { rows: 6, cols: 7 },
          /* Her first thirty stones stay on the board and stay marked, so the
             two pieces are visible at the same time. That is the whole idea:
             she can SEE 30 and 12 sitting next to each other. */
          carry: true,
          /* Her thirty from the stage before. Also laid down for anyone who
             opens this stage directly, so the task always makes sense. */
          fill: { rows: 6, cols: 5 },
          check: { rule: "exact", rows: 6, cols: 7 },
          clues: [
          { say: "Keep her 30 just where they are. Each row needs 2 more on the end." },
          { say: "Two more on the end of the top row, like this.", show: { r0: 0, c0: 5, rows: 1, cols: 2 } },
          { say: "Two on the end of every row: 6 rows of 2 is 12 more.", show: { r0: 0, c0: 5, rows: 6, cols: 2 } }
        ],
          reveal: {
            sentence: "30 + 12 = 42",
            said: "Six sevens is forty-two. I <em>did</em> know it. I just had to break it into a bit I knew and a bit I could count.",
            learned: "A hard fact splits into two easy ones. NY-3.OA.5"
          }
        }
      ]
    }

  ],

  /* What Ember can do once the player is finished, and what is waiting after it. */
  finale: {
    title: "She has a nest.",
    line: "Ember can lay out a nest, count it the fast way, turn it round without losing anything, tell the rim from the floor, and break a hard number into two easy ones.",
    next: "Wings come next. They only work if both sides match — which turns out to be a thing you can measure."
  }
};
