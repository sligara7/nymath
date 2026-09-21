/* GRADE 3 — The Hatchling.

   This file is DATA. There is no logic in it, deliberately: adding a grade
   should mean writing one of these, not touching the game. Every stage names
   the New York standard codes it serves, so a grown-up can check the coverage
   against the PDF without reading any code.

   Three things every stage must have:

     emberSays  — what he gets WRONG, in his own voice. The mistake is always
                  his. She is never the one who failed at something.
     task       — one line. If it needs two lines it is two stages.
     check      — a named rule plus its numbers. The rule lives in the engine.

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
  subtitle: "He cannot fly yet. He cannot count either.",

  lessons: [

    /* ---------------------------------------------------------------- 1 -- */
    {
      id: "g3-ragged-nest",
      name: "The first nest",
      standards: ["NY-3.OA.1", "NY-3.MD.5"],
      stages: [{
        mood: "muddled",
        emberSays: "I built my nest! It took me <em>ages</em>. I counted every single stone, one at a time, and I got eleven. Then I counted again and got thirteen.",
        task: "Move his stones so every row has the same number.",
        grid: { rows: 5, cols: 6 },
        /* His attempt: twelve stones in ragged rows. A real mistake — this is
           what a pile looks like before anybody thinks of rows. */
        his: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0]],
        check: { rule: "equalRows", total: 12, minRows: 2 },
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
        task: "Lay 4 rows of 5 stones for him.",
        grid: { rows: 5, cols: 6 },
        check: { rule: "exact", rows: 4, cols: 5 },
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
        task: "Build it the other way round: 8 rows of 3.",
        grid: { rows: 8, cols: 5 },
        check: { rule: "exact", rows: 8, cols: 3 },
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
          task: "Put a twig on every edge around the nest.",
          grid: { rows: 3, cols: 4 },
          /* The floor is already laid and cannot be touched. This stage is
             about the OUTSIDE — the two ideas must not be muddled by letting
             her rebuild the floor halfway through. */
          fill: { rows: 3, cols: 4 },
          locked: true,
          mode: "rim",
          check: { rule: "rim" },
          reveal: {
            sentence: "4 + 4 + 3 + 3 = 14",
            said: "Fourteen twigs round the edge. But only twelve stones on the floor. Those aren't the same number at all!",
            learned: "The distance round is perimeter. The space inside is area. NY-3.MD.8"
          }
        },
        {
          mood: "thinking",
          emberSays: "So a <em>longer</em> rim always means a <em>bigger</em> floor. Obviously. More twigs, more room. That's just how it works.",
          task: "Same 14 twigs round it — but fewer stones inside.",
          grid: { rows: 5, cols: 7 },
          hint: "Long and thin.",
          check: { rule: "samePerimeterLessArea", perimeter: 14, lessThan: 12 },
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
          task: "Start with what he does know: 6 rows of 5.",
          grid: { rows: 6, cols: 7 },
          check: { rule: "exact", rows: 6, cols: 5 },
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
          task: "Now add 2 more to the end of every row.",
          grid: { rows: 6, cols: 7 },
          /* Her first thirty stones stay on the board and stay marked, so the
             two pieces are visible at the same time. That is the whole idea:
             she can SEE 30 and 12 sitting next to each other. */
          carry: true,
          check: { rule: "exact", rows: 6, cols: 7 },
          reveal: {
            sentence: "30 + 12 = 42",
            said: "Six sevens is forty-two. I <em>did</em> know it. I just had to break it into a bit I knew and a bit I could count.",
            learned: "A hard fact splits into two easy ones. NY-3.OA.5"
          }
        }
      ]
    }

  ],

  /* What he can do once she is finished, and what is waiting after it. */
  finale: {
    title: "He has a nest.",
    line: "Ember can lay out a nest, count it the fast way, turn it round without losing anything, tell the rim from the floor, and break a hard number into two easy ones.",
    next: "Wings come next. They only work if both sides match — which turns out to be a thing you can measure."
  }
};
