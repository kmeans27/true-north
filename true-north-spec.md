# TRUE NORTH — build spec

*The daily chart. Trust your eye, then find out how far off you were.*

A 60–120 second daily browser game. No download, no account, no timer, no numbers.
One gesture, one score, one beautiful lie exposed per day.

This document is the full brief for a build agent. Sections 1–2 are context, sections 3–13 are
the design contract, sections 14–16 are the step-by-step build order with acceptance criteria.

---

## 1. Research snapshot — what is actually winning in 2026

The browser-game scene has consolidated into a handful of winning shapes.

**A. The `.dle` (daily normie puzzle) machine.** Wordle's descendants number in the thousands —
directories track 700+ (`dlehunt.com`), 416 word games alone (`alldle.net`), 154 curated titles
(`dailydles.com`). The formula is ruthlessly consistent: same puzzle for everyone, once a day, one
shareable artefact, no account, no install. It is now a saturated commodity market — the
differentiation is almost entirely *subject matter* (movies, Pokémon, Costco prices, real-estate
listings, Minecraft blocks). Lesson: **the daily ritual is table stakes, not a feature.**

**B. Krillion — the rarity twist.** Krillion (krillion.io and a large tribute swarm) is the biggest
new *mechanic* of the era: 7 open-answer prompts, ~20s each, and you are scored on **how few other
players typed your answer**, mapped onto an ocean descent (Plankton 10 → One in a Krillion 100;
10 m per point; ~700 pts = trench floor). Its genius is that it changes the question from "do you
know it?" to "can you predict what everyone else will *not* think of?" — a meta-game about the
crowd. Note the clone swarm (krillion.org, krilliongame.org, krillion.games, krillionplay.com…) and
the inverse variant `Noillirk` ("most common answer wins", 15s). Lesson: **the crowd is the
content.**

**C. Kinda Hard Golf — the daily skill gauntlet.** One procedurally generated vertical hole per
day, drag-to-aim, checkpoints, "Kinda Infuriating Mode" (no checkpoints), score = few strokes,
Wordle-style share text. It fuses golf with platforming physics. Its stickiness is *mastery under
retry*: 5 failures then a lucky bounce. Lesson: **a daily level people can fail at, badly, and
describe to each other, beats a daily puzzle people solve quietly.**

**D. Perceptle / Sensorium / Perception Lab — the perception-measurement wave.** Perceptle is
literally "five tiny tests of perception — angles, rhythm, counts — one score".
`playsens.com` (Inertia Stop, Tempo Split, Flash Count, Peripheral Blink…) and
`perceptionlabs.kraftcompany.tech` (46 micro-tests → 6 traits → one score) show a whole new genre:
**measured human error in real units** (degrees, ms, cents, count error, colour distance) rather
than arbitrary arcade points. These are *identity* products — they tell you something about
yourself. Weakness: they are static batteries; you play once, get a number, leave.

**E. neal.fun — the viral toy.** 38+ single-page projects, no accounts, no ads, no multiplayer, one
idea executed perfectly per page. `Draw a Perfect Circle` (one gesture, instant honest score),
`The Password Game`, `Infinite Craft`, `Asteroid Launcher`, `Size of Life`, `Internet Roadtrip`,
`Stimulation Clicker`. Everything is *shareable by default* because the output is a claim about the
player ("I got 94.1%").

**F. The estimation/auction boom.** `Size It Up` (stretch a whale to the size you think),
`Fermi`, `Overbid` (bid on "how many tennis balls fit in a shipping container"; go over → zero),
`Housle` (guess the list price), `PricedIn`, `Costcodle`, `Headcount`, `Amountle`.
Humans are confident and terrible at magnitude; the reveal is the dopamine.

**G. The drama dailies.** `Moralia` (a real moral dilemma, you choose blind, then see what really
happened *and how everyone else chose*), `Let's Settle This`, `Absurd Trolley Problems`,
`scrandle`. The payoff is the **distribution reveal** — seeing where you sit in the crowd.

**H. The "one weird number" hook.** `The 0.1 Second Song Challenge`, `Temvo` (time perception),
`Weightle` (guess a weight), `Betweenle`, `Semantle`, `Contexto`. A single strange axis of human
judgement, isolated and scored.

### Patterns to steal, patterns to avoid

| Steal | Why |
| --- | --- |
| One puzzle per day, global seed, share text | creates a shared conversation; free distribution |
| A score expressed in real, physical units | "3° off", "41 leagues" beats "7400 points" |
| The crowd reveal after commitment | the single strongest retention mechanic in this list |
| One gesture, zero instructions | understood in <1s, works on any device, no tutorial |
| A metaphor that makes the score a place | Krillion's depth, K.H.Golf's tower |
| No account, no install, no ads | neal.fun proved it wins long-term |

| Avoid | Why |
| --- | --- |
| Another guess-the-entity dle | thousands exist, zero differentiation |
| Multiple-choice trivia | saturated and shallow |
| A timer as the core tension | Wordle has none; pressure kills nuance |
| Points with no physical meaning | unshareable, unmemorable |
| Retry-until-you-ace skill levels | that niche is Kinda Hard Golf's and is crowded |
| Showing numeric readouts while playing | destroys this game's entire premise |

**The gap:** every one of the hot mechanics scores a *typed word*, a *guess*, a *retry*, or a
*single static measurement*. Nobody has built **a daily game where the crowd reveal is applied to a
silent, numeric, by-eye calibration act with a real skill ceiling and a personal-bias payoff.**

That is the game below.

Sources: `dlehunt.com`, `alldle.net`, `dailydles.com`, `listdle.com`, `dlegames.org`,
`playdaily.org`, `krillion.org` / `.io` / `.to` / `.me` (About + How to play), `kindahardgolf.com`,
`perceptle.com` via `joystumble.com`, `playsens.com/games/inertia-stop`,
`perceptionlabs.kraftcompany.tech`, `neal.fun` (index + `Draw a Perfect Circle`, `The Password Game`,
`Infinite Craft` on Wikipedia), `joystumble.com`, `thinkygames.com`.

---

## 2. The idea

### Pitch

> **TRUE NORTH.** Every day you get one hand-drawn sea chart that is 95% finished. Five things on
> it are left to you, and there are no rulers and no numbers — only your eye. Draw them, sign the
> chart, and find out how far off you really were. The chart's five errors compound into one number:
> how many leagues off course your ship lands.

### Why it works

- **One gesture everywhere.** Drag a handle. Tap to sign. That is the entire control scheme.
- **Silence is the tension.** No clock, no digits, no hints. The only feedback is the truth,
  revealed all at once at the end.
- **The reveal is doubly satisfying:** *where the truth was* (your gap, in real degrees / percent)
  and *how the rest of the world did* (V2; personal history in V1).
- **A skill ceiling you can feel improve.** Angles, ratios, midpoints, proportions, spacing — all
  trainable. Day 30 you are measurably better than day 1, and the game can prove it.
- **The personal-bias payoff.** The game accumulates your signed errors over time and tells you
  what your eye *always* does ("you overshoot lengths by 6%; you tilt everything 3° clockwise").
  That is a fact about the player. Facts about the player get screenshotted.
- **No content treadmill.** Charts are procedurally generated from a seed + curated parameter
  banks. The whole back catalogue is replayable offline, forever, with zero server cost.
- **Beauty is the product.** Parchment, iron-gall ink, a compass rose, rhumb lines. It looks like
  nothing else in the dle directory.

### The name

Working title **TRUE NORTH**. Alternates: `BY EYE`, `DEAD RECKONING`, `PLUMB`, `CHARTED`.
Domain idea: `truenorth.day` / `truenorthgame.com` / `byeye.games`.

### Anti-goals (explicit)

- Not a quiz. Nothing to know, nothing to look up, nothing to type.
- Not a timer game.
- Not a physics/skill-retry game.
- Not another ocean-depth metaphor — Krillion owns that.
- Never shows a number while playing.

---

## 3. Core loop

```
                +----------------------------------------------+
   open  -----> |  DAILY CHART card (name, date, streak)       |
                +----------------------+-----------------------+
                                       | tap BEGIN
                                       v
        +----------------------------------------------------------+
        |  For each of 5 tasks (order fixed by seed):              |
        |    1. prompt line fades in (one sentence, no numbers)     |
        |    2. the chart highlights the piece you must place       |
        |    3. you drag the handle until it feels right            |
        |    4. optional: toggle SKETCH / SURVEY (the wager)        |
        |    5. press SIGN -> ink dries, piece locks, next task     |
        +----------------------+-----------------------------------+
                               | after 5th SIGN
                               v
        +----------------------------------------------------------+
        |  THE REVEAL, animated, ~20s, skipped by tap:              |
        |   - each piece animates from your value to the truth      |
        |   - your mark stays behind as a red ghost with the error  |
        |     in real units (2.4 deg - 7.1% - 3.2 leagues)          |
        |   - per piece grade: TRUE / CLOSE / OFFSET / ADRIFT       |
        |   - SURVEY wagers resolve with a stamp or a blight        |
        +----------------------+-----------------------------------+
                               v
        +----------------------------------------------------------+
        |  THE CHART card:                                          |
        |   - big number: leagues off course  (0 = a true chart)    |
        |   - seal, title, streak, elapsed time                     |
        |   - "your eye, so far" one-line bias note (from history)  |
        |   - SHARE | VIEW CHART | PRACTICE | MY EYE                |
        +----------------------------------------------------------+
```

**Timings (design targets)**

| Phase | Target |
| --- | --- |
| Read the prompt + make the gesture, per task | 8–20 s |
| All five tasks | 60–100 s |
| Reveal animation | 16–22 s (skippable) |
| End card + share | 10–20 s |
| **Total session** | **90 s – 3 min** |

No per-task timer. A hidden `elapsedMs` is recorded only for the "Swift Chart" badge (< 60 s).

**One attempt per day**, keyed on the UTC date. Practice charts are unlimited, use random seeds,
never touch the streak, and are labelled `PRACTICE` in the UI at all times.

---

## 4. The five senses (task types)

Design constraints that make this game work:

1. **Every task must be scale-invariant.** A player on a phone and a player on a 4K monitor must
   face the identical puzzle. So no absolute lengths or absolute positions are ever the answer —
   only ratios, angles, proportions, and relative spacing.
2. **Every task must be blind.** The truth is never visible on screen, and the target is never
   marked. The reference is always a *different, visible* feature.
3. **Every task must be resolvable by one scalar value** driven by one drag handle.

Notation: `T` = truth, `V` = the player's value, `e = |V - T|` in the task's natural unit,
`P` = par error (the error a median player makes — used only for scoring; the values below are seed
estimates and must be re-tuned against real data before launch).

### T1 — LENGTH RATIO (`length`)

*Prompt: "Draw the bar to the span of the chart's top edge."*

A bar handle the player drags outward from a fixed origin. The reference is a visible feature
elsewhere on the chart (the frame width, the distance between two rhumb lines, the height of the
compass rose). `V` and `T` are both expressed as a fraction of that reference, so the puzzle is
identical on every screen.

- Unit: relative error, `e = |V - T| / T`
- `T` range: 0.25 – 0.8 of the reference
- **Seeded par `P = 0.10`** (median human ~10% off reproducing a length)
- Grades by `u = e / P`: `u <= 0.15` TRUE, `<= 0.6` CLOSE, `<= 1.3` OFFSET, else ADRIFT

### T2 — BISECTION / PERPENDICULAR / ANGLE COPY (`angle`)

*Prompt: "Bisect the channel."* / *"Strike the perpendicular."* / *"Copy the trade wind."*

A line pivots about a fixed vertex. Three variants:
- **bisect**: rotate the line to split the shown angle in two. `T = (a1+a2)/2`.
- **perpendicular**: rotate to 90° to the shown line. `T = a + 90°`.
- **copy**: rotate to match a shown angle drawn elsewhere on the chart.

- Unit: degrees, `e = |delta|` (shortest way round, wrapped to [0°, 180°])
- **Seeded par `P = 3.5°` (bisect), `5.0°` (perpendicular), `4.0°` (copy)**
- Rotate in 0.25° steps; hold for 0.05° steps after 800 ms.

### T3 — CENTRE POINT (`centre`)

*Prompt: "Set the sighting mark at the exact centre of the frame."*

A draggable crosshair on an empty part of the chart. The frame's centre is deliberately not marked,
and the frame is deliberately *not* a perfect rectangle — a hand-drawn border wobbles, so you cannot
just find the geometric average of the page.

- Unit: `e = distance(V, T)` normalised as a percentage of the frame's **half-diagonal**
  (half-diagonal = `sqrt(w^2+h^2)/2`), so it is resolution-independent.
- **Seeded par `P = 3.5` (% of half-diagonal)**
- Known human centre bias is slight, which makes this the "easy" task — a useful *safe anchor* in
  the wager economy.

### T4 — PROPORTION (`proportion`)

*Prompt: "Name the bay 35% up the coastline."* / *"Place the border where the river meets the road."*

A handle slides along a visible path (a coastline, a road, a river) or along a bar, and must be set
at a stated fraction of it. The path is deliberately non-straight so length cannot be eyeballed
geometrically.

- Unit: percentage points, `e = |V - T|` where both are fractions in `[0,1]`, quoted as pp
- `T` range: 0.15 – 0.85 (avoid the trivially-shaped ends)
- **Seeded par `P = 7.0` pp**
- The hardest of the five, and the most likely target for a `SURVEY` bluff.

### T5 — EVEN SPACING (`spacing`)

*Prompt: "Mark six soundings, evenly."*

N handles (3–7) slide along an arc, a bar, or a coastline and must be evenly distributed. The player
may drag any handle; total advance is shared. Scoring measures *variance*, so a player who is
uniformly shifted but perfectly even scores well — this is a rhythm task, not a position task.

- Unit: coefficient of variation of the N-1 gaps, `CV = sigma(gaps) / mean(gaps)`
- **Seeded par `P = 0.18`** (18% CV)
- Visible reference: the endpoints are pre-placed for you, so only the interior is uncertain.

### Optional rotating 6th sense (`count`) — V2 only

*"How many grid squares does the island cover?"* — quantity estimation, `P = 0.22` relative error.
Held back from V1 so the chart always has exactly five tasks and a stable 0–100 scale.

### Task definition contract

```ts
type Sense = "length" | "angle" | "centre" | "proportion" | "spacing";

interface Task {
  id: string;            // "length-3"
  sense: Sense;
  variant?: string;      // "bisect" | "perpendicular" | "copy"
  prompt: string;        // one sentence, no numerals where avoidable
  par: number;           // P, in natural units
  // Natural-unit truth; semantics depend on `sense`.
  // length: ratio | angle: degrees | centre: {x,y} normalised frame space
  // proportion: fraction in [0,1] (scalar along the path)
  // spacing: [fraction, ...] strictly increasing
  truth: number | { x: number; y: number } | number[];
  domain: { min: number; max: number; step: number };   // keyboard + handle bounds
  scene: SceneSpec;      // what the chart draws for this task (see section 9)
  revealText: (v: Value, t: Truth) => string;           // "2.4 deg off true"
}
```

---

## 5. Interaction model

**One gesture, everywhere.**

| Action | Pointer | Touch | Keyboard |
| --- | --- | --- | --- |
| Set the value | drag the handle | drag the handle | arrows (or A/D), x10 with Shift |
| Wager | tap `SKETCH / SURVEY` | tap | `W` |
| Sign the piece | tap `SIGN` | tap | Enter / Space |
| Skip the reveal | tap anywhere | tap | Enter / Space |

Rules:

- The chart fills the viewport in a fixed aspect box scaled to fit (never scrolls during play).
- Handle hit areas are >= 44 x 44 CSS px even when the visual handle is small.
- A piece may be re-adjusted freely until `SIGN`. After `SIGN` it is frozen and dimmed.
- **No numeric readout anywhere during play.** No grid, no tick labels, no angle readout.
  (Test for this: assert the play-phase DOM contains no digits.)
- Pointer events with `setPointerCapture`, so a drag never "escapes" the handle.
  `touch-action: none` on the chart.
- `SIGN` is disabled for 250 ms after the prompt appears, so a reflexive tap cannot skip a task.

**First run only:** a single overlay, three lines, dismissed by tap:
*"Five things are missing from today's chart. Fix them by eye. No rulers. No numbers. No going
back."* Plus one animated arrow on the first handle.

**Returning players get a 1-line reminder** on the daily card only: "No rulers."

---

## 6. Scoring

### 6.1 Per task

```
u          = error / par                    // normalised error; par => median player
base(u)    = round(100 * exp(-0.65 * u))    // u=0 -> 100 | u=0.5 -> 72 | u=1 -> 52
                                            // u=2 -> 27  | u=3.5 -> 10 | u>=5 -> 4
score      = clamp(base(u), 0, 100)
bullseye   = u <= 0.15                      // "TRUE" grade, gets a seal
```

`base` is monotone, never reaches 0 (so a bad guess is a story, not a void), and is trivial to tune
by changing a single constant.

Grade labels (shown on the reveal, never during play):

| `u` | Glyph | Grade |
| --- | --- | --- |
| <= 0.15 | diamond | TRUE |
| <= 0.60 | triangle | CLOSE |
| <= 1.30 | bar | OFFSET |
| > 1.30 | cross | ADRIFT |

### 6.2 The wager (this is what makes it a *game*)

Before signing each piece, the player sets a confidence tag:

| Tag | Weight | Risk |
| --- | --- | --- |
| `SKETCH` (default) | x0.70 | none |
| `SURVEY` | x1.60 if `u <= 0.70` | x0.20 if `u > 0.70` |

Worked examples, per task:

| Player accuracy | `base` | SKETCH | SURVEY |
| --- | --- | --- | --- |
| `u = 0.3` (very good) | 82 | 58 | **132** |
| `u = 0.6` (good) | 68 | 47 | **108** |
| `u = 0.7` (edge) | 63 | 44 | **101** |
| `u = 0.8` (just missed) | 59 | 41 | **12** (blighted) |
| `u = 1.0` (par) | 52 | 36 | **10** (blighted) |
| `u = 2.0` (bad) | 27 | 19 | **5** (blighted) |

A `SURVEY` bet pays roughly +70 weighted points when right and costs ~-35 when wrong. You must
*know which senses you trust* — the angle bisection you have done 40 times, or the proportion you
always miss. A blighted survey stamps `BLIGHTED` across the piece in oxblood with a small ink-blot
animation.

### 6.3 Chart total

```
weighted   = sum(score_i * w_i) / sum(w_i)     // w in {0.70, 1.60, 0.20} -> [0, ~164]
chartScore = clamp(round(weighted), 0, 100)
league     = round((100 - chartScore) * 1.4)   // 0 -> a perfect chart | 50 -> 70 leagues off
```

`league` is the headline number. Everything else is decoration.

Titles by `league`:

| Leagues | Title | Seal |
| --- | --- | --- |
| 0 | **THE CHART IS TRUE** | gold rosette, ink confetti |
| 1–5 | Dead Reckoning | gold rosette |
| 6–15 | Sound Waters | silver seal |
| 16–30 | Within Sight of Land | silver seal |
| 31–55 | A Wide Berth | plain wax seal |
| 56–80 | Off the Chart | cracked seal |
| 81+ | **HERE BE DRAGONS** | a small sea serpent doodle appears in the corner |

Extra badges (end card, no score effect): `FIVE TRUES` (all bullseyes), `ALL SURVEYS PAID`,
`SWIFT CHART` (< 60 s), `NO HINTS` (always, it is a joke badge), `STREAK 7/30/100`.

### 6.4 Your Eye So Far (the retention hook)

Across all *real* daily runs, accumulate signed errors per sense and derive:

- **Bias** per sense: median of `(V - T)` signed, in natural units.
  e.g. *"You overshoot length by 6% on average."*
- **Precision**: IQR of signed error. e.g. *"Your angle work is tight (+/-1.7 deg); your
  proportions scatter (+/-11 pp)."*
- **Best/worst sense** by mean `u` over the last 30 days.
- Show one line on the end card and a full profile on a `MY EYE` screen.

Only ever computed from real dailies. Practice runs are excluded, and the screen says so.

---

## 7. Daily generation (no server required)

The chart for a given UTC date is a **pure function** of that date.

```
seed = fnv1a("truenorth:" + YYYY + "-" + MM + "-" + DD)   // UTC
rng  = mulberry32(seed)
```

Everything — which senses appear, their order, parameters, scene geometry, chart name, accent
palette, sea-serpent placement — is drawn from `rng` at first paint. Consequences:

- The whole game is a **static site**; no API, no DB, no content pipeline.
- **Offline works.** A service worker caches the shell; charts generate from the date alone.
- The **archive is free** — every past date is reconstructable instantly, locally.
- Determinism is a hard requirement: `same date => byte-identical chart`, unit-tested
  (`generate("2026-10-17")` deep-equals itself, and differs from `"2026-10-18"`).

**Fixed composition rules (never random):**

- Exactly 5 tasks, one per sense, so the scale is stable.
- Order: pips are shuffled, but the chart always opens with an easy one (`centre` or `spacing`) and
  closes with a hard one (`proportion` or `angle`). Predetermined opener/closer sets, then the
  middle three shuffled.

**Variety rotation (cosmetic, keeps it fresh):**

- 7 named charts per week (Mon–Sun): *The Iron Coast, Coral Verge, Sable Reef, The Long Meridian,
  Gallows Point, Glass Bay, Wyrmwater*, each with its own accent ink and coastal doodle set.
- Weekly specials (Wed = a star chart, Sun = a cave survey) are V2.

### 7.1 Parameter banks

Task generation never invents geometry from nothing; it composes curated primitives:

```ts
const LENGTH_REFERENCES = [
  { kind: "frameTop",   pick: rng => ratio(rng, 0.25, 0.8) },
  { kind: "rhumbGap",   pick: rng => ratio(rng, 0.3, 0.75) },
  { kind: "roseHeight", pick: rng => ratio(rng, 0.35, 0.7) },
  // ...
];
```

Each sense ships with **>= 20 references/variants**, so a sense does not visibly repeat inside a
month. Authoring guidance:

- Every reference must be *unambiguous* about which two features are being compared, at 320 px wide.
- Every prompt must be one sentence, <= 46 characters, and contain no numerals.
- Never make `T` a "nice" number (not 1/2, not 0.5, not 45°) — round targets invite geometry tricks
  and flatter the player for free.

---

## 8. Persistence, streak, one-attempt rule

`localStorage` under a single versioned key: `truenorth:v1`.

```ts
interface Store {
  version: 1;
  streak: number;               // consecutive completed dailies, no gaps
  bestStreak: number;
  lastDailyDate: string | null; // "2026-10-17" (UTC)
  dailies: Record<string, DailyResult>;            // keyed by UTC date
  senseStats: Record<Sense, { signed: number[] }>;  // real dailies only, capped at 365
  prefs: { reducedMotion: boolean; sound: boolean; theme: "day" | "night" };
}

interface DailyResult {
  date: string;
  leagues: number;
  chartScore: number;
  marks: Record<Sense, { value: Value; survey: boolean }>;
  elapsedMs: number;
  completedAt: number;
}
```

Rules:

- **One attempt:** if `dailies[today]` exists, the daily card shows `VIEW THE CHART` and the reveal,
  never the play phase. There is no "play anyway" button. (`PRACTICE` is one tap away and honest.)
- **Streak:** increments on the first completion of a new UTC day; resets to 1 if the previous
  `lastDailyDate` is older than yesterday. Dates are UTC strings; the UI shows a local countdown to
  the next chart.
- **Signing locally is not security.** Do not over-engineer: keep the truth in a module closure,
  never in a DOM attribute, so a casual devtools peek does not reveal it. That is the entire
  anti-cheat budget for V1.
- Multiple tabs: listen to `storage` events and move a tab out of the play phase if another tab
  completes the day.
- All state is local. One line on `ABOUT`: *"Nothing leaves your browser."*

---

## 9. Visual design

### 9.1 Concept

A **hand-inked sea chart on parchment**. Iron-gall ink lines, a knotwork border, a compass rose,
rhumb lines, a cartouche in the corner with the chart's name and date, faint sea-creature doodles in
the empty water. `TRUE NORTH` is stamped like a printer's mark.

Nothing in this aesthetic is decorative dead weight — the frame gives T1 and T3 their references,
the rhumb lines give T2 its angles, the coastline gives T4 and T5 their paths.

### 9.2 Palette

| Token | Day (default) | Night | Use |
| --- | --- | --- | --- |
| `--parchment` | `#EFE3C8` | `#171A20` | ground |
| `--parchment-2` | `#E6D6B4` | `#1E222A` | chart panel |
| `--ink` | `#1E2A38` | `#D9D2C2` | strokes, text |
| `--ink-soft` | `#1E2A3870` | `#D9D2C270` | guides, doodles |
| `--truth` | `#B8860B` (gilt) | `#D8A93B` | the true line/mark |
| `--you` | `#8C2F2F` (oxblood) | `#C4523F` | your mark, ghost, errors |
| `--paper-shadow` | `#00000014` | `#00000055` | depth |

Accent ink rotates per weekday (used for the rose petals and the cartouche): Mon `#2F5D62`,
Tue `#6B4E3D`, Wed `#3A4A7A`, Thu `#5B6B2F`, Fri `#7A3A5B`, Sat `#8A5A20`, Sun `#4A4A6B`.

Colour is **never** the only signal: grades pair a colour with a glyph; your mark pairs oxblood with
a dashed stroke; the truth pairs gilt with a solid stroke plus a tiny rosette.

### 9.3 Type

- Display: one SVG-embedded serif with chart-like character (e.g. **IM Fell English** or
  **EB Garamond**), subset to Latin-1, <= 40 KB woff2, `font-display: swap`.
- UI/numerals: system stack (`ui-serif, Georgia, serif`) with tabular figures so digits still feel
  engraved but cost no payload.
- Letter-spacing +0.04em on small-caps labels (`SIGN`, `SKETCH`, `SURVEY`). Never italicise numerals.

### 9.4 The ink look (cheap and convincing)

- SVG `feTurbulence` + `feDisplacementMap` with a **per-line frozen seed** on a `<filter>` applied
  to a group of stroke paths -> wobbling hand-inked lines. Freeze the seed so it does not crawl.
- A second high-frequency `feTurbulence` at low opacity over the parchment -> paper grain.
- Circles (compass rose, seals, bullseye rings) are drawn with 2 arcs of slightly different radius
  to avoid machine-perfect geometry.
- **Budget:** noise filters are defined once, never re-created per task.

### 9.5 Layout

```
+-----------------------------------------------+
|  cartouche: name * date * streak        [gear] |
+-----------------------------------------------+
|                                               |
|              THE CHART                        |
|        (fixed aspect 4:5, fits viewport,      |
|         letterboxed on parchment)             |
|                                               |
+-----------------------------------------------+
|  "Bisect the channel."      ooo..  1 of 5     |
|  [ SKETCH | SURVEY ]              [ SIGN ]    |
+-----------------------------------------------+
```

- Portrait-first (mobile is the primary device). In landscape the chart centres with the prompt bar
  to the right.
- Progress pips are 5 ink dots; the current one pulses gently.
- The prompt bar is the only text during play. Everything else is the chart.

### 9.6 Motion

- Prompt fades in over 220 ms, `ease-out`.
- The handle to be moved gets a single 900 ms attention pulse on entry (opacity/scale only) — never
  a bouncing arrow after that.
- On `SIGN`: the handle morphs into a small hand-drawn anchor scribble, ink "dries" (opacity 1 ->
  0.75 over 300 ms), the progress pip fills with a hand-drawn circle (`stroke-dashoffset`).
- On the reveal: the truth line draws itself (`stroke-dasharray` wipe) over 700 ms with a slight
  overshoot; your ghost fades in 120 ms later; the error calligraphy writes on last.
- `prefers-reduced-motion` and the in-app toggle: no draw-on wipes, no pulses, instant crossfades.

### 9.7 Sound (muted by default, opt-in)

Tiny, dry, physical: a quill scratch on each drag (one sample, pitch-shifted), a wax-seal thump on
`SIGN`, a soft bell on a TRUE grade, a low wooden knock on a blight. Never required, never autoplay.

---

## 10. Screens

1. **DAILY** — cartouche, chart number (days since epoch start), streak, countdown to the next
   chart, `BEGIN`. If already played -> `VIEW THE CHART`.
2. **PLAY** — the chart + prompt bar (section 9.5). Single screen, no navigation, no back.
3. **REVEAL** — animated, skippable, ends on the end card.
4. **END CARD** — leagues, title, seal, per-task grade row, badges, bias line, and
   `SHARE / VIEW CHART / PRACTICE / MY EYE`.
5. **MY EYE** — personal bias profile: per-sense bias and precision, sparkline of the last 30
   leagues, best/worst sense, total charts sailed. The most screenshottable screen in the game.
6. **ARCHIVE** — scrollable list of past charts by date with leagues; tap to re-open the reveal;
   `PRACTICE` prompts on every past date.
7. **PRACTICE** — random seed, unlimited, explicitly badged `PRACTICE * not counted`.
8. **ABOUT / SETTINGS** — how to play (4 lines), reduced motion, sound, theme, clear data,
   `"Nothing leaves your browser."`

---

## 11. Sharing

Share text (spoiler-free, no values, no answers):

```
TRUE NORTH #142 * Wed 17 Oct
12 leagues off course - Dead Reckoning
TRUE OFFSET TRUE CLOSE ADRIFT * buoyed by 2 surveys
truenorth.day
```

- One glyph per task in play order: `TRUE` diamond, `CLOSE` triangle, `OFFSET` bar, `ADRIFT` cross,
  `paid survey` spark, `blighted survey` skull.
- `navigator.share()` when available, else `navigator.clipboard.writeText()`, else a textarea
  fallback with `select()`.
- A **copy-as-image** export (canvas render of the end card, 1080 x 1350) is a V1.1 stretch.
- Always include the chart name — it is the day's identity and the hook for the group chat.

---

## 12. Tech stack and repo layout

**Recommended:** Vite + TypeScript + **vanilla DOM with SVG** for the chart. No framework. No state
library. No CSS framework. No runtime dependencies at all except one self-hosted subset font.

Rationale: the game is one screen, five widgets, deterministic generation, and hand-inked vector
art. React would add weight and build surface for zero benefit. SVG gives crisp retina strokes,
trivial hit-testing, and easy animated reveals. A tiny canvas layer is only needed for the optional
share-image export.

```
true-north/
|- index.html
|- public/
|  |- fonts/IMFELLEnglish-subset.woff2
|  |- icon.svg
|- src/
|  |- main.ts                 // boot, screen routing, day-boundary ticker
|  |- state.ts                // Store read/write, streak, migration
|  |- daily/
|  |  |- seed.ts              // fnv1a + mulberry32 + utcDateKey()
|  |  |- generate.ts          // date -> Chart (composition rules in section 7)
|  |  |- banks.ts             // >=20 references/variants per sense
|  |  |- names.ts             // chart names, weekday accents, prompts
|  |- tasks/
|  |  |- types.ts             // Sense, Task, Value, Truth
|  |  |- geometry.ts          // error(value, truth) -> { e, unit, text }
|  |  |- length.ts  angle.ts  centre.ts  proportion.ts  spacing.ts
|  |- game/
|  |  |- play.ts              // play phase: prompt bar, sign, wager, freeze
|  |  |- reveal.ts            // animated truth reveal
|  |  |- score.ts             // section 6, pure and unit-tested
|  |  |- share.ts             // section 11
|  |- chart/
|  |  |- render.ts            // base chart art for a given Chart
|  |  |- ink.ts               // SVG filters, wobble helpers, doodles
|  |  |- layers.ts            // parchment, frame, rhumbs, coast, rose, cartouche
|  |- ui/
|  |  |- screens/*.ts
|  |  |- components.ts        // button, pip, seal, dialog
|  |  |- tokens.css           // section 9.2-9.3 tokens
|  |- a11y.ts                 // aria-live announcements, focus management
|- test/
|  |- seed.test.ts            // determinism, day boundaries, UTC
|  |- score.test.ts           // section 6 tables, wager table, monotonicity, clamps
|  |- geometry.test.ts        // angle wrap, error normalisation, spacing CV
|  |- generate.test.ts        // 5 senses, no repeats in a month, safe domains
|- README.md
```

**Deployment:** any static host (Cloudflare Pages / Netlify / GitHub Pages). Add a service worker
that caches the shell; charts generate locally so offline play works after the first visit.

---

## 13. Non-functional requirements

| Area | Requirement |
| --- | --- |
| First load | < 120 KB compressed total JS + CSS + font; LCP < 1.1 s on a 4x-throttled phone |
| Chart render | first paint of the full chart < 60 ms on a mid-range Android |
| Frame budget | drag updates < 4 ms per frame — mutate transforms, never re-render the chart |
| Device support | iOS Safari 16+, Chrome/Edge/Firefox (last 2), 320 px wide and up |
| Device pixel ratio | all SVG; the only canvas (share image) renders at 2x |
| Offline | full play works offline after the first visit |
| A11y | keyboard-only playable end-to-end; `aria-live` announces "signed, 3 of 5"; >= 4.5:1 text contrast; never colour alone; reduced motion honoured; no time pressure anywhere |
| i18n | all strings in one module; en-GB default, en-US spelling variant; "leagues" is deliberately archaic and shared |
| Privacy | zero network calls at runtime in V1; zero analytics by default |

---

## 14. Build order (milestones with acceptance criteria)

Do these in order. Each milestone ends in a working, testable artifact.

### M0 — Scaffold
Vite + TS + Vitest, no runtime deps. `tokens.css` with the section 9.2 palette and a day/night
switch. A dev route that renders a hard-coded chart with all five widgets visible for eyeballing.
**Accept:** `npm run dev` shows a parchment screen with five dummy handles; `npm test` runs.

### M1 — Deterministic daily engine
`seed.ts` (`fnv1a`, `mulberry32`, `utcDateKey`), `generate.ts` implementing section 7, `banks.ts`
seeded with 5 references per sense to start (expanded in M8).
**Accept:** `generate("2026-10-17")` is deep-equal across runs and processes; differs from the next
day; every sense's `T` is inside its documented domain; opener/closer constraints hold; the
`generate.test.ts` suite walks 400 consecutive dates and asserts zero constraint violations.

### M2 — Task widgets
One module per sense implementing `mount(scene, task) -> { getValue, setValue, destroy }` and a pure
`error(value, truth)` in `geometry.ts`. No scoring, no polish.
**Accept:** each widget is drivable by pointer and by keyboard; `geometry.test.ts` covers angle
wrapping (359 deg / 1 deg -> 2 deg), centre normalisation, and spacing CV on hand-computed fixtures.

### M3 — Play phase
Onboarding overlay, prompt bar, pips, `SIGN` freeze + 250 ms guard, `SKETCH/SURVEY` toggle, and the
hard rule that no digits are rendered during play.
**Accept:** a full 5-task run completes with the mouse only and with the keyboard only; a test
asserts the play-phase DOM contains no digits; the same run cannot be replayed after completion.

### M4 — Scoring + reveal
`score.ts` implementing section 6 exactly (base curve, wager table, weighted total, leagues, titles,
badges), plus the animated reveal.
**Accept:** `score.test.ts` reproduces every row of the 6.2 and 6.3 tables exactly; scores are
monotone in accuracy; a `u=0` task with a `SURVEY` cannot produce a negative or `NaN` value;
`leagues` at chartScore 100 is exactly 0.

### M5 — The chart art
`chart/layers.ts` + `ink.ts`: parchment, wobbling frame, rhumb lines, a procedural coastline and
islands, a compass rose, a cartouche, sea doodles. Wire the five task references to real chart
features (frame edge, rhumb gap, rose height, coastline path, arc).
**Accept:** every task's reference is visually unambiguous at 320 px; the ink filters are defined
exactly once; a redraw on resize does not flicker; the chart reads as *beautiful* in a screenshot
at 390 x 844 and 1440 x 900.

### M6 — Persistence, streak, archive, MY EYE
`state.ts` with the section 8 schema, one-attempt rule, streak maths, past-date reconstruction, the
`ARCHIVE` and `MY EYE` screens, and the bias/precision statistics.
**Accept:** completing a daily then reloading shows the end card, not the play phase; a simulated
gap day resets the streak to 1; `MY EYE` excludes practice runs; the countdown to the next UTC day
is correct in a UTC+13 and a UTC-11 timezone.

### M7 — Share
The section 11 emoji grid, `navigator.share` with clipboard fallback, and the "copied" affordance.
**Accept:** the share string contains no true values, no errors, and no answers; pasting it into a
plain text field renders correctly on iOS and Android.

### M8 — Content depth
Expand `banks.ts` to >= 20 references/variants per sense (>= 100 total), write the 7 chart names and
their accent palettes, and tune prompts to <= 46 characters with no numerals.
**Accept:** 400 generated charts produce no immediate repeat of the same reference within 14 days
for a given sense; every prompt passes the length/numerals linter.

### M9 — Polish, a11y, perf, release
Motion pass, sound (opt-in), reduced motion, night theme, service worker, meta tags, OG image
(1080 x 1350 chart screenshot with the day's seal), icon, `robots.txt`, a 404. Lighthouse and a
real-device pass against the section 13 budgets.
**Accept:** keyboard-only full playthrough; axe reports zero critical issues; LCP < 1.1 s throttled;
offline play works after one visit; totals inside the section 13 weight budget.

### M10 — V2: the world
Optional and clearly separated. A tiny Cloudflare Worker + D1 table:

```
POST /mark  { date, sense, variant, value, survey, leagues }   // anonymous, no PII
GET  /chart/:date                                              // -> per-sense histograms
```

Then per task the reveal adds: *your error's percentile*, the world's **signed** distribution fan
drawn behind your ghost, and the day's "world bias" line (*"the world tilted this coastline 2.1 deg
clockwise"*). Also unlocks `TRUE NORTH #142 * you beat 78% of cartographers`.

Guardrails: aggregate-only responses, minimum `n = 25` before a distribution is shown, no IP
storage, no accounts, and a visible disclosure. **Never ship simulated/fake crowd data** — the whole
premise of the game is honesty about error.

---

## 15. Content authoring guide (for whoever writes the banks)

Every entry answers one question: *what can a person see on this chart, and misjudge?*

- A reference must be a **pair of features**, both visible, both unambiguous on a 320 px screen.
- Reject any reference where a player can shortcut with geometry (equal halves, perfect squares,
  axis-aligned labels, a line's obvious midpoint).
- Reject any `T` that is a culturally "round" number (0.5, 45°, 90°, 25%).
- Prompts are one sentence, imperative, in chartkeeper's voice: *"Bisect the channel."*,
  *"Draw the bar to the span of the frame."*, *"Mark six soundings, evenly."*
- Never use a numeral in a prompt. Say "six", not "6".
- Par errors start from the section 4 seed values and are **re-tuned with real data** after ~2,000
  dailies per sense: set `par` to the median `u`-normalised error so the median player scores ~52.
  Store the calibration table in `banks.ts` with a comment recording the sample size.
- Every prompt and chart name is reviewed for clarity, tone, and non-ambiguity before release.

---

## 16. Risks, decisions, and open questions

**Risks**

| Risk | Mitigation |
| --- | --- |
| Blind calibration feels like a "test", not a game | the wager economy, the seal/title reveal, the bias profile, the sea-serpent failure state |
| Hard to make "no numbers" feel rich | the physical metaphor carries it: leagues, degrees, soundings, blights |
| Players game the geometry instead of their eye | reject round truths; wobbling hand-drawn frames; vary references |
| V1's lack of a world histogram weakens the reveal | the reveal's truth + personal history is strong on its own; V2 adds the crowd without faking it |
| Aesthetic cost | the ink filter + one subset serif + ~140 SVG nodes is a bounded, reusable budget |
| Too easy to get a 0-league chart | `par` tuned to real medians; an all-`SURVEY` perfect run should be near-impossible |

**Locked decisions**

- Vanilla TS + SVG, no framework, no runtime deps.
- Charts generated from the date; no server in V1; fully offline-capable.
- No timer during play; no numbers during play; one attempt per day.
- `SKETCH x0.70 / SURVEY x1.60-or-x0.20` as the sole strategic layer.
- Leagues as the headline unit; 1.4 leagues per lost point.

**Open questions for the human**

1. Domain and final name (`TRUE NORTH` vs `BY EYE` vs `PLUMB`) — affects the cartouche and OG image.
2. Ship V1 without any world stats (honest, smaller), or build M10's worker from day one?
3. Night theme as default for a late-night-dailies audience, or day/parchment default?
