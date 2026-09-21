/* THE WINTER STORE — the quest Ember takes alone.

   She does not play this one. She watches. Everything he does here is
   something she taught him, and he names the lesson each time he reaches for
   it — which is what makes this the proof rather than a cutscene: the only
   things he can do are the things that got through.

   There is one wobble, deliberately placed on the hardest idea in the grade
   (the rim is not the floor). He catches himself. A pupil who never falters
   proves nothing; a pupil who falters and recovers proves the teaching went
   deep enough to be reached for under pressure.

   {name} is filled with whatever she typed at the door. */

const QUEST3 = {
  id: "q3-winter-store",
  name: "The Winter Store",
  standards: ["NY-3.OA.1", "NY-3.OA.3", "NY-3.OA.5", "NY-3.MD.8"],
  grid: { rows: 7, cols: 7 },

  beats: [

    { mood: "worried",
      says: "You're not coming, {name}?",
      go: "Let him go" },

    { mood: "thinking",
      says: "...All right. I'll do it myself.",
      go: "Watch" },

    { mood: "curious",
      says: "Winter store. Forty-two fish, up on the cold shelf, before the frost comes.",
      readout: "42 fish",
      go: "Go on" },

    { mood: "worried",
      says: "Forty-two. I am <em>not</em> counting forty-two fish one at a time. I did that once and got eleven.",
      go: "Go on" },

    { mood: "thinking",
      says: "Rows. All the same size. That's the first thing you ever showed me.",
      recalls: "The first nest",
      go: "Go on" },

    { mood: "worried",
      says: "Six rows of seven. But I still don't know my sevens.",
      go: "Go on" },

    { mood: "curious",
      says: "So I break it. Six rows of <em>five</em> — I know fives.",
      recalls: "Breaking it apart",
      build: { rows: 6, cols: 5 },
      readout: "6 × 5 = 30",
      go: "Go on" },

    { mood: "thinking",
      says: "Thirty. Then two more on the end of every row — that's six twos, twelve.",
      build: { rows: 6, cols: 7 },
      readout: "30 + 12 = 42",
      go: "Go on" },

    { mood: "delighted",
      says: "Forty-two! Six sevens is forty-two and I <em>never</em> counted a fish.",
      recalls: "The fast count",
      go: "Go on" },

    { mood: "worried",
      says: "Except — the shelf. It's only six fish deep and I've laid it seven across.",
      go: "Go on" },

    { mood: "thinking",
      says: "Turn it. Turning it doesn't lose anything, you proved that to me with my own nest.",
      recalls: "Turning the nest",
      turn: true,
      readout: "7 × 6 = 6 × 7 = 42",
      go: "Go on" },

    { mood: "curious",
      says: "Now a lip round the edge, or the whole lot slides off in the night.",
      rim: true,
      readout: "7 + 7 + 6 + 6 = 26",
      go: "Go on" },

    /* The wobble. He reaches for the wrong idea and then finds the right one. */
    { mood: "muddled",
      says: "Twenty-six pieces of lip. Twenty-six is smaller than forty-two — so the lip is too <em>small</em> for the shelf—",
      go: "Go on" },

    { mood: "thinking",
      says: "...No. No, wait.",
      go: "Go on" },

    { mood: "curious",
      says: "The lip goes <em>round</em>. The fish go <em>inside</em>. Those were never the same number and they were never supposed to be. You showed me that with the twigs.",
      recalls: "The rim",
      go: "Go on" },

    { mood: "delighted",
      says: "Forty-two fish, six deep, seven across, walled all the way round. Before the frost.",
      readout: "42 inside · 26 round the outside",
      go: "Go on" },

    { mood: "delighted",
      says: "I did the whole thing on my own, {name}.",
      go: "Go on" },

    { mood: "sleepy",
      says: "Well — on my own with everything you put in my head first. Which I think is how it works.",
      last: true,
      go: "Go home" }
  ],

  end: {
    title: "He did it without you.",
    line: "Everything Ember reached for out there, you put there. That is the whole of it.",
    next: "Wings next. They only work if both sides match — which turns out to be something you can measure."
  }
};
