# Ember

A math game for one fourth grader, built around a drake you have to teach.

**Not playable yet.** This repo currently holds the design and the standards it
has to meet. The game comes next.

## What it is

Ember is a drake. He hatches unable to fly, and he is not very good at
mathematics. Neither of those is your problem to solve by feeding him — you
have to *teach* him, and you can only teach him something you understand
yourself.

He grows across three grades, and his growth is the mathematics:

| | Ember | The math |
|---|---|---|
| **Grade 3** | a hatchling, ground-bound | his nest is an array of stones — area, perimeter, multiplication within 100; he eats in equal shares — unit fractions on a number line |
| **Grade 4** | wings come in; he can turn, not yet fly | the wings must mirror or they don't work — line of symmetry; his glide angle is a real measured angle; and his **hoard** begins — 10 copper = 1 silver = 1 gold = 1 crown, which *is* place value to 1,000,000 |
| **Grade 5** | he flies | the cave that holds the hoard is volume; the map he flies is the coordinate plane; gem weights are decimals to hundredths |

Grade 3 is a gate — he can't get his wings until it's cleared. Grade 5 is a
door, open to her if she keeps going.

## Why it's built this way

Everything here answers to one choice: **she should understand it**, not score
well at it. That rules a lot out. No four-option taps, which can be got right
by luck. No timers, which reward speed over reasoning. She earns by building
the picture — laying the array, cutting the fraction bar, setting the tail fin
— because a construction can't be guessed.

Teaching Ember is how that gets enforced, and how we find out whether it
worked. You understand a thing if you can teach it.

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
