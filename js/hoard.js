/* THE HOARD — copper, silver and gold, ten for one.

   This is the place value system with a dragon's greed attached: ten copper
   make a silver and ten silver make a gold, which is exactly "a digit in one
   place is worth ten of the place to its right". Nothing here touches the
   page. It is plain arithmetic on little purses, so the shop can trust it and
   the tests can check it without a browser.

   A purse is { gold, silver, copper }, each a whole number of coins. */

const Hoard = (function () {

  const KINDS = ["gold", "silver", "copper"];        /* biggest first */
  const WORTH = { gold: 100, silver: 10, copper: 1 }; /* in copper */
  const DOWN = { gold: "silver", silver: "copper" };  /* what one breaks into */
  const UP = { copper: "silver", silver: "gold" };    /* what ten make */

  const purse = p => ({
    gold: Math.max(0, (p && p.gold) | 0),
    silver: Math.max(0, (p && p.silver) | 0),
    copper: Math.max(0, (p && p.copper) | 0)
  });

  /* What a purse is worth, counted in copper. */
  const value = p => KINDS.reduce((n, k) => n + ((p && p[k]) | 0) * WORTH[k], 0);

  /* The fewest coins that make an amount: 47 is 4 silver and 7 copper. */
  function coins(n) {
    n = Math.max(0, n | 0);
    return { gold: Math.floor(n / 100), silver: Math.floor((n % 100) / 10), copper: n % 10 };
  }

  const add = (a, b) => ({ gold: a.gold + b.gold, silver: a.silver + b.silver, copper: a.copper + b.copper });

  /* Break ONE coin into ten of the next size down. Nothing is lost doing it,
     which is the whole lesson. Returns a new purse, or null if there is no
     such coin to break. */
  function breakOne(p, kind) {
    if (!DOWN[kind] || p[kind] < 1) return null;
    const q = purse(p);
    q[kind] -= 1;
    q[DOWN[kind]] += 10;
    return q;
  }

  /* Put TEN coins together into one of the next size up. */
  function makeOne(p, kind) {
    if (!UP[kind] || p[kind] < 10) return null;
    const q = purse(p);
    q[kind] -= 10;
    q[UP[kind]] += 1;
    return q;
  }

  /* "2 silver and 3 copper". Said the way she would say it. */
  function words(p) {
    const parts = KINDS.filter(k => p[k] > 0).map(k => p[k] + " " + k);
    if (!parts.length) return "nothing";
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }

  /* The shop takes exact money and has no change. */
  function judge(counter, price) {
    const v = value(counter);
    return v === price ? "exact" : v < price ? "short" : "over";
  }

  return { KINDS, WORTH, DOWN, UP, purse, value, coins, add, breakOne, makeOne, words, judge };
})();
