# TRUE NORTH

**The daily chart.** One hand-drawn sea chart a day. Five things are missing from it, and
you fix them by eye — no rulers, no numbers, no going back. Then you sign the piece and find
out how many leagues off course you were.

Built from [`true-north-spec.md`](./true-north-spec.md), milestones M0–M9. V1 has **no
server, no accounts, and no analytics**: charts are generated from the date, and everything
you do lives in your own browser.

---

## Play

- One chart a day, seeded from the UTC date. The same chart for everyone, everywhere.
- Five tasks: a **length** along a rhumb line, an **angle** of a bearing, a **centre** of the
  rose's ring, a **proportion** of a shoal, and the even **spacing** of soundings.
- Fix each by dragging the handle, or with the arrow keys / `A`–`D` / `Home`–`End`.
- Wager per task with `W`: **SKETCH** (×0.70) plays it safe; **SURVEY** (×1.60 if you are
  right, ×0.20 if you are not) has teeth. `SIGN` seals it — and there is no going back.
- Then the reveal: the truth is drawn in gold, your error in red, and the chart is titled.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the built site
npm test           # vitest (unit + jsdom smoke)
npm run typecheck  # tsc --noEmit
npm run lint:prompts
```

No runtime dependencies: Vite, TypeScript and Vitest are dev-only.

## How it is put together

```
index.html            single page, PWA meta, one module entry
public/               icon.svg, icon-*.png, og.png, manifest, 404.html, sw.js, robots.txt
scripts/
  lint-prompts.mjs    the copy linter: <= 46 chars, no numerals, one sentence
  make-og.ts          authoring tool: renders the social card from a real chart
src/
  main.ts             boot, routing, midnight ticker, cross-tab safety, SW registration
  state.ts            Store schema (truenorth:v1), streak + one-attempt logic, migration
  a11y.ts             the aria-live region; every announcement is spoken in words
  daily/
    seed.ts           fnv1a + mulberry32 + utcDateKey + dateInWords/numberWord/roman
    generate.ts       date -> Chart (composition rules in spec section 7)
    names.ts          chart names, weekday accents, sea names
    banks/            one module per sense: >= 20 references and prompts + helpers
  tasks/              the five widgets (length, angle, centre, proportion, spacing)
  chart/              geometry, ink (rough filters, rose, seal, doodles), path, render
  game/               play, reveal, score, progress, share, reconstruct, sound
  ui/                 router, session (the one live Store), components, strings, screens
  styles/             tokens.css (theme + accent rotation) and app.css
test/                 8 suites, 71 tests
```

- **Determinism.** `fnv1a` hashes the date into a `mulberry32` stream; the chart, its
  references, its prompts and every handle's opening position all come from that one seed.
  Nothing needs a server, and two devices agree exactly.
- **Scoring.** `u = error / par`, `base(u) = 100·e^(−0.65u)`, `score = base·wager`,
  `leagues = round((100 − chart)·1.4)`.
- **The one live store.** `ui/session.ts` owns the single `Store`; screens read through it,
  and a `storage` event keeps tabs in step.

## The hard rules

| Rule | How it is enforced |
| --- | --- |
| **No digits while playing** | the play DOM is built from words: dates via `dateInWords`, chart numbers via `roman`, the streak as tally marks, progress as ink pips, and announcements via `numberWord`. `test/play.test.ts` asserts the mounted play screen contains no `[0-9]`. |
| **One attempt per UTC day** | `recordDaily` + `isPlayed`; replaying today routes to the end card, another tab finishing moves this one out of play. |
| **No per-task timer** | elapsed time is measured once, only for badges; nothing is shown during play. |
| **Deterministic art** | one frozen `feTurbulence` seed in `chart/ink.ts`; the same chart renders identically everywhere. |
| **Offline after one visit** | `public/sw.js` caches the shell; charts come from the date, so the game works with the network gone. |
| **Keyboard-complete** | a full five-task run, the reveal and the share are all reachable from the keyboard (`W` wagers, Enter/Space signs). |
| **Reduced motion** | honoured via `prefers-reduced-motion`, `data-motion="reduced"`, and a stored preference; the reveal then draws in a single frame. |

## Accessibility

- The chart SVG is `role="img"` with a written description; controls are real buttons with
  `aria-label`s and a ≥ 44 px tap target.
- A single polite live region narrates prompts, verdicts and screens — in words, never digits.
- Focus is moved deliberately between screens and returned on destroy.
- Night theme, reduced motion, optional sound and a data reset are in **About**; day/parchment
  is the default.

## Deployment

Any static host. The app is a plain folder of files; `index.html` is the entry and
`public/404.html` is the not-found page.

- **Cloudflare Pages / Netlify:** publish `dist`. Add a SPA rewrite (`/* -> /index.html`) so
  deep links survive, and keep `404.html` for hard misses.
- **GitHub Pages:** publish `dist` to the Pages branch. If it is served from a sub-path, set
  `base` in `vite.config.ts` and adjust the absolute `/icon.svg` link in `public/404.html`.
  `.github/workflows/deploy.yml` builds, tests and deploys `dist` on every push to `main`;
  switch the repo's Pages source to **GitHub Actions** once and it takes over from there.

---

## Deviations from the spec (and why)

Everything below is a deliberate, small departure; the spec is otherwise followed to the
letter. Each is either noted in the source or covered by a test.

1. **Banks are split per sense.** The spec sketches a single `daily/banks.ts`; it ships as
   `daily/banks/{length,angle,centre,proportion,spacing}.ts` plus `helpers`, `types` and an
   `index`. Same content, ≥ 20 references per sense (22–26 each; 120 variants, 123 prompts),
   just easier to author and review. The linter walks them all.
2. **System serif stack, no webfont.** The spec allows one self-hosted subset (IM Fell
   English). Shipping the reader's own serif instead costs zero bytes, has no FOUT, and
   respects their font settings. `--ui-font` in `styles/tokens.css` is the single switch: drop
   a `woff2` into `public/fonts/` and point it there to restore the spec's face.
3. **How the weighted mean is read.** The spec writes
   `weighted = Σ(scoreᵢ·wᵢ) / Σ(wᵢ)`. Read literally the wager cancels out of a uniformly
   wagered chart, and a *missed* survey (weight 0.20) would help by shrinking its own
   denominator — the opposite of section 6.2's intent. It is therefore read as
   `mean(baseᵢ·wᵢ)` over the five tasks, clamped to `0..100`, which is also what section
   6.3's "[0, ~164]" range implies. Section 6.2's table is matched within ±1 on the three
   cells that disagree with its own formula; the reasoning is written up in `game/score.ts`
   and asserted in `test/score.test.ts`.
4. **Handles never open on the truth.** `tasks/opening.ts` derives each opening value from the
   chart seed so that it is deterministic for everyone but always away from the answer, and
   the angle needle is never drawn at the true bearing.
5. **`W` is the wager key, so `W`/`S` are not movement keys.** Movement is arrows, `A`/`D`,
   `Home`/`End` only (spec section 5's key table).

### The spec's three open questions, resolved

1. **Name:** `TRUE NORTH` (cartouche, icon and OG card all use it).
2. **World stats:** V1 ships **without** them. M10's worker, histograms and percentiles are
   not built — and nothing is faked to stand in for them.
3. **Theme:** **day/parchment is the default**; night is one tap away and remembered.

## Notes

- **Social card.** `public/og.png` is a real chart (chart CCXC, 17 October) rendered through
  the game's own art pipeline and sealed, at the spec's 1080 × 1350. Regenerate with
  `npx vite-node scripts/make-og.ts -- 2026-10-17 /tmp/og.svg` then
  `rsvg-convert -w 1080 -h 1350 -b '#efe3c8' /tmp/og.svg -o public/og.png`. Because it is 4:5,
  very wide `summary_large_image` placements may centre-crop it — the chart always survives,
  the title block may not.
- **Budget.** The production bundle is about 39 KB gzipped of JS + CSS, inside the spec's
  120 KB shell budget; images are the only other payload.
- **Testing.** `npm test` runs the unit suites and jsdom smoke tests for the play phase and
  every screen. jsdom is a devDependency only.
