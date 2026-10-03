/* KEEPING HER SAVE — on an iPhone, where it is most at risk.

   iPhone Safari may delete what a website saved after about a week without a
   visit. An app on the home screen is exempt — but it gets storage of its
   OWN, empty, so adding Ember to the home screen would start her over. Two
   things answer that:

   - While she plays in Safari on an iPhone, the address carries her save
     after a # (#save=...). That part of an address never leaves the phone,
     not even to GitHub, and it is what "Add to Home Screen" keeps — so the
     new app opens holding her save and takes it in. Only ever into an empty
     save: a code never overwrites progress.
   - The den shows a tip, until she taps "Got it", telling a grown-up how.

   Anywhere else this does nothing. Loaded straight after save.js, so a save
   arriving in the address is taken in before anything else reads the save. */

const Keep = (function () {

  const nav = typeof navigator !== "undefined" ? navigator : {};
  const iPhone = /iPhone|iPad|iPod/.test(nav.userAgent || "") ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);   /* an iPad says it is a Mac */
  let installed = nav.standalone === true;
  try { installed = installed || matchMedia("(display-mode: standalone)").matches; } catch (e) {}
  const carrying = iPhone && !installed;

  function setHash(h) {
    try { history.replaceState(null, "", location.pathname + location.search + h); } catch (e) {}
  }

  /* Keep the address holding her latest save, so whenever the grown-up adds
     it to the home screen, what they add is her. */
  function carry() {
    if (carrying) setHash("#save=" + Save.code());
  }

  /* Arriving with a save in the address — the home-screen app's first open.
     Take it in if this phone has nothing yet, then tidy the address. */
  (function arrive() {
    const m = /^#save=(.+)$/.exec(location.hash || "");
    if (!m) return;
    Save.adopt(m[1]);
    setHash("");
  })();

  Save.onWrite(carry);

  /* The den asks, each time it opens, whether to show the tip. */
  function offer() {
    carry();
    const tip = document.getElementById("keepTip");
    if (tip) tip.hidden = !carrying || Save.get().keepTipSeen;
  }

  (function init() {
    const ok = document.getElementById("keepTipOk");
    if (ok) ok.addEventListener("click", () => {
      Save.keepTipSeen();
      const tip = document.getElementById("keepTip");
      if (tip) tip.hidden = true;
    });
  })();

  return { offer, carrying };
})();
