# Ember

A math game for one fourth grader, built around a drake you have to teach.

**[Play it →](https://sligara7.github.io/nymath/)**

Grade 3 is playable: five lessons, and a quest Ember takes on her own at the
end of it. Grades 4 and 5 are designed but not written.

## What it is

Ember is a drake. She hatches unable to fly, and she is not very good at
mathematics. Neither of those is your problem to solve by feeding her — you
have to *teach* her, and you can only teach her something you understand
yourself.

She grows across three grades, and her growth is the mathematics:

| | Ember | The math |
|---|---|---|
| **Grade 3** | a hatchling, ground-bound | her nest is an array of stones — area, perimeter, multiplication within 100; she eats in equal shares — unit fractions on a number line |
| **Grade 4** | wings come in; she can turn, not yet fly | the wings must mirror or they don't work — line of symmetry; her glide angle is a real measured angle; and her **hoard** begins — 10 copper = 1 silver = 1 gold = 1 crown, which *is* place value to 1,000,000 |
| **Grade 5** | she flies | the cave that holds the hoard is volume; the map she flies is the coordinate plane; gem weights are decimals to hundredths |

Grade 3 is a gate — she can't get her wings until it's cleared. Grade 5 is a
door, open to the player if she keeps going.

## She goes alone

When the player has taught her all five, Ember goes off alone to store food
for winter, and the player watches. Ember lays it out in rows, breaks six
sevens into a thirty she knows and a twelve she can count, turns the shelf
when it does not fit, and walls it — naming the lesson each time she reaches
for one. Halfway through she nearly confuses the wall with the floor, and
catches herself.

That is the only assessment in this game, and it is the honest one: what
Ember can do out there is exactly what the player managed to teach her.

## Why it's built this way

Everything here answers to one choice: **she should understand it**, not score
well at it. That rules a lot out. No four-option taps, which can be got right
by luck. No timers, which reward speed over reasoning. She earns by building
the picture — laying the array, cutting the fraction bar, setting the tail fin
— because a construction can't be guessed.

Teaching Ember is how that gets enforced, and how we find out whether it
worked. You understand a thing if you can teach it.

## Her name

On first run Ember asks the player who she is, and she types it in. From
then on Ember uses her name and the game titles itself after her.

Her name is kept in her phone's own storage and nowhere else. **It is not in
this repository**, which is public — that is why it is typed rather than
written in.

## The standards

The content answers to the **New York State Next Generation Mathematics
Learning Standards** (NYSED, 2017), included here as
`nys-next-generation-mathematics-p-12-standards.pdf`. Every piece of content
traces to a standard code — `NY-3.*`, `NY-4.*`, `NY-5.*` — and coverage is
judged against the standards' own clusters, not a topic list we invented.

Two limits the standards set, which the game holds to: Grade 4 whole numbers
stop at 1,000,000, and Grade 4 fractions use only denominators 2, 3, 4, 5, 6,
8, 10, 12 and 100.

## The design

`docs/design/nymath.json` is the full design — every requirement, every
decision and the reasoning behind it, exported from
[reflow2](https://github.com/sligara7/reflow2). It records which parts came
from a person and which were inferred, so the two stay tellable apart.

Read it if you want to know *why* something is the way it is. `AGENTS.md` says
how to work on this repo without silently undoing a decision.

## Built with

Plain HTML, CSS and JavaScript. No server, no build step, no account, no login.
It runs on a phone, held in one hand, and it is served from GitHub Pages.

The ambience — wind, a cave drone, far-off bells — is synthesized in the
browser rather than downloaded, so no audio files ship with the page. There is
a mute button and it is remembered.

**Bump the build number in `index.html` whenever you change a file.** Every
asset is loaded with a `?v=N` stamp, because GitHub Pages sets its own cache
headers and the URL is the only thing that can tell a browser the file moved.
A stale `main.js` once left this game dead on its first screen. The tests fail
if an asset is missing its stamp, or if two of them disagree. The build number
is logged to the console at boot, which is the fastest way to find out whether
somebody is looking at an old copy.

Tests: `node test/boot.test.js` and `node test/lessons.test.js`. No dependencies. They check that every
lesson can actually be finished on the lattice it is given, and that Ember's
own attempt fails her own lesson.

Side doors, for checking one part without replaying the rest: `#l3` opens the
third lesson, `#l4.2` its second stage, `#quest` the quest, `#quest.11` one
beat of it.
