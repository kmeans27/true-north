/* ------------------------------------------------------------------
   T5 — EVEN SPACING bank (spec section 4)
   "Mark six soundings, evenly."

   The two outer marks are already placed for you: the question is only
   ever about the interior. Scoring is the coefficient of variation of
   the gaps, so a set that is uniformly displaced but perfectly even
   still scores well. This is a rhythm task, not a position task.
   ------------------------------------------------------------------ */

import { rf, ri } from "../seed";
import type { Pt, Scene } from "../../tasks/types";
import type { BankCtx, Built, Entry } from "./types";
import { arcPath, wavy } from "./helpers";

const PAR = 0.18;
const DOMAIN = { min: 0, max: 1, step: 0.002 };

type PathKind = "bar" | "arc" | "lane" | "sound" | "coastLine";

function makePath(ctx: BankCtx, kind: PathKind): Pt[] {
  const z = ctx.zone;
  switch (kind) {
    case "bar":
      return [
        { x: z.x + z.w * 0.08, y: z.y + z.h * rf(ctx.rng, 0.44, 0.6) },
        { x: z.x + z.w * 0.92, y: z.y + z.h * rf(ctx.rng, 0.4, 0.62) },
      ];
    case "arc": {
      const r = Math.min(z.w, z.h) * rf(ctx.rng, 0.36, 0.44);
      const c = { x: z.x + z.w * 0.5, y: z.y + z.h * (rf(ctx.rng, 0.5, 0.62)) };
      const span = ri(ctx.rng, 100, 168) * (ctx.rng() < 0.5 ? -1 : 1);
      const a0 = rf(ctx.rng, 0, 360);
      return arcPath(c, r, a0, a0 + span, 30);
    }
    case "lane":
      return wavy(ctx.rng, { x: z.x + z.w * 0.06, y: z.y + z.h * rf(ctx.rng, 0.4, 0.58) }, { x: z.x + z.w * 0.94, y: z.y + z.h * rf(ctx.rng, 0.42, 0.62) }, rf(ctx.rng, 10, 18), 18, rf(ctx.rng, 1.2, 2));
    case "sound":
      return wavy(ctx.rng, { x: z.x + z.w * rf(ctx.rng, 0.3, 0.44), y: z.y + z.h * 0.08 }, { x: z.x + z.w * rf(ctx.rng, 0.52, 0.68), y: z.y + z.h * 0.92 }, rf(ctx.rng, 14, 22), 18, rf(ctx.rng, 1.4, 2.2));
    case "coastLine": {
      const outline = ctx.geo.lands[0].outline;
      const span = ri(ctx.rng, 11, 15);
      const start = ri(ctx.rng, 1, Math.max(1, outline.length - span - 4));
      return outline.slice(start, start + span);
    }
  }
}

function buildSpacing(ctx: BankCtx, kind: PathKind, n: number, caption: string): Built {
  const path = makePath(ctx, kind);
  const scene: Scene = {
    kind: "spacing",
    variant: kind,
    zone: ctx.zone,
    path,
    closed: false,
    n,
    caption,
  };
  const truth: number[] = [];
  for (let i = 0; i < n; i++) truth.push(i / (n - 1));
  return { scene, truth, par: PAR, domain: DOMAIN };
}

function entry(id: string, kind: PathKind, n: number, caption: string, prompt: string): Entry {
  return { id, prompt, variant: kind, build: (c) => buildSpacing(c, kind, n, caption) };
}

export const SPACING_BANK: Entry[] = [
  entry("space-six-bar", "bar", 6, "the reach", "Mark six soundings, evenly."),
  entry("space-four-bar", "bar", 4, "the boom", "Space the buoys along the boom."),
  entry("space-five-bar", "bar", 5, "the mole", "Even out the watch lights."),
  entry("space-seven-bar", "bar", 7, "the line", "Lay the marks at even intervals."),
  entry("space-five-bar-2", "bar", 5, "the quay", "Set five stones at even steps."),
  entry("space-three-bar", "bar", 3, "the spit", "Space the ships at even berths."),
  entry("space-six-bar-2", "bar", 6, "the shelf", "Space the sounding marks evenly."),
  entry("space-four-bar-2", "bar", 4, "the piles", "Lay the four posts at even steps."),
  entry("space-five-bar-3", "bar", 5, "the berths", "Set the moorings at even spans."),
  entry("space-six-arc", "arc", 6, "the bight", "Even out the moorings."),
  entry("space-five-arc", "arc", 5, "the curve", "Space the lights along the curve."),
  entry("space-seven-arc", "arc", 7, "the bay", "Lay the floats at even gaps."),
  entry("space-three-arc", "arc", 3, "the arm", "Space the watch fires evenly."),
  entry("space-four-arc", "arc", 4, "the berth", "Distribute the buoys along the bay."),
  entry("space-six-arc-2", "arc", 6, "the hook", "Space the beacons round the hook."),
  entry("space-four-lane", "lane", 4, "the lane", "Distribute the anchors fairly."),
  entry("space-six-lane", "lane", 6, "the fairway", "Set the soundings at even spans."),
  entry("space-five-lane", "lane", 5, "the channel", "Even the depth marks along the lane."),
  entry("space-six-lane-2", "lane", 6, "the deeper cut", "Even out the channel marks."),
  entry("space-four-sound", "sound", 4, "the sound", "Space the beacons along the sound."),
  entry("space-five-sound", "sound", 5, "the reach", "Space the marks along the sound."),
  entry("space-four-coast", "coastLine", 4, "the shore", "Mark the shoals, evenly spaced."),
  entry("space-five-coast", "coastLine", 5, "the shoreline", "Even the markers along the coast."),
  entry("space-six-coast", "coastLine", 6, "the strand", "Space the soundings off the strand."),
];
