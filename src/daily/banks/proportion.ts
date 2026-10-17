/* ------------------------------------------------------------------
   T4 — PROPORTION bank (spec section 4)
   "Name the bay two fifths up from the buoy."

   The stated fraction is the one number the game will name out loud,
   and it is said in words. The path is deliberately crooked, so the
   fraction cannot be walked off with a straight edge: this is the
   hardest sense and the natural place for a SURVEY bluff.
   ------------------------------------------------------------------ */

import { rf, ri } from "../seed";
import type { Pt, Scene } from "../../tasks/types";
import type { BankCtx, Built, Entry } from "./types";
import { pickFraction, wavy } from "./helpers";

const PAR = 7.0;
const DOMAIN = { min: 0, max: 1, step: 0.002 };

export type PathKind = "river" | "road" | "lane" | "sound" | "channel" | "coast";

function makePath(ctx: BankCtx, kind: PathKind): Pt[] {
  const z = ctx.zone;
  switch (kind) {
    case "river":
      return wavy(ctx.rng, { x: z.x + z.w * 0.06, y: z.y + z.h * rf(ctx.rng, 0.24, 0.42) }, { x: z.x + z.w * 0.94, y: z.y + z.h * rf(ctx.rng, 0.46, 0.72) }, rf(ctx.rng, 20, 32), 18, rf(ctx.rng, 1.6, 2.6));
    case "road":
      return wavy(ctx.rng, { x: z.x + z.w * 0.08, y: z.y + z.h * rf(ctx.rng, 0.18, 0.34) }, { x: z.x + z.w * 0.9, y: z.y + z.h * rf(ctx.rng, 0.62, 0.8) }, rf(ctx.rng, 16, 26), 16, rf(ctx.rng, 1.4, 2.2));
    case "lane":
      return wavy(ctx.rng, { x: z.x + z.w * 0.05, y: z.y + z.h * rf(ctx.rng, 0.36, 0.52) }, { x: z.x + z.w * 0.95, y: z.y + z.h * rf(ctx.rng, 0.44, 0.62) }, rf(ctx.rng, 12, 20), 16, rf(ctx.rng, 1.2, 2));
    case "sound":
      return wavy(ctx.rng, { x: z.x + z.w * rf(ctx.rng, 0.3, 0.44), y: z.y + z.h * 0.06 }, { x: z.x + z.w * rf(ctx.rng, 0.52, 0.68), y: z.y + z.h * 0.94 }, rf(ctx.rng, 18, 28), 18, rf(ctx.rng, 1.6, 2.4));
    case "channel":
      return wavy(ctx.rng, { x: z.x + z.w * 0.06, y: z.y + z.h * rf(ctx.rng, 0.58, 0.74) }, { x: z.x + z.w * 0.94, y: z.y + z.h * rf(ctx.rng, 0.26, 0.44) }, rf(ctx.rng, 24, 36), 20, rf(ctx.rng, 1.8, 2.8));
    case "coast": {
      const outline = ctx.geo.lands[0].outline;
      const span = ri(ctx.rng, 13, 17);
      const start = ri(ctx.rng, 1, Math.max(1, outline.length - span - 4));
      return outline.slice(start, start + span);
    }
  }
}

function buildProportion(ctx: BankCtx, kind: PathKind, fraction?: { f: number; words: string }): Built {
  const path = makePath(ctx, kind);
  const frac = fraction ?? pickFraction(ctx.rng);
  const start = rf(ctx.rng, 0.02, 0.98);
  // Never open the handle sitting on the answer.
  const s = Math.abs(start - frac.f) < 0.12 ? (frac.f > 0.5 ? frac.f - 0.3 : frac.f + 0.3) : start;
  const scene: Scene = {
    kind: "proportion",
    variant: kind,
    zone: ctx.zone,
    path,
    closed: false,
    caption: "the measured reach",
    start: Math.max(0.01, Math.min(0.99, s)),
  };
  return { scene, truth: frac.f, par: PAR, domain: DOMAIN };
}

function entry(
  id: string,
  kind: PathKind,
  fraction: [number, number, string],
  prompt: string,
): Entry {
  const [p, q, words] = fraction;
  return {
    id,
    prompt,
    variant: kind,
    build: (c) => buildProportion(c, kind, { f: p / q, words }),
  };
}

export const PROPORTION_BANK: Entry[] = [
  entry("prop-coast-bay", "coast", [2, 5, "two fifths"], "Name the bay two fifths up from the buoy."),
  entry("prop-coast-shoal", "coast", [3, 7, "three sevenths"], "Mark the shoal three sevenths from the buoy."),
  entry("prop-coast-narrows", "coast", [5, 8, "five eighths"], "Name the narrows five eighths from the buoy."),
  entry("prop-coast-cape", "coast", [7, 10, "seven tenths"], "Mark the cape seven tenths up from the buoy."),
  entry("prop-coast-for", "coast", [4, 9, "four ninths"], "Name the ford four ninths up from the buoy."),
  entry("prop-river-seamark", "river", [3, 10, "three tenths"], "Set the mark three tenths up the river."),
  entry("prop-river-border", "river", [5, 9, "five ninths"], "Name the border five ninths up the river."),
  entry("prop-river-crossing", "river", [6, 13, "six thirteenths"], "Mark the ford six thirteenths up the river."),
  entry("prop-river-beacon", "river", [9, 20, "nine twentieths"], "Set the beacon nine twentieths up the river."),
  entry("prop-road-toll", "road", [2, 7, "two sevenths"], "Name the toll two sevenths up the road."),
  entry("prop-road-mill", "road", [5, 12, "five twelfths"], "Mark the mill five twelfths up the road."),
  entry("prop-road-post", "road", [7, 15, "seven fifteenths"], "Set the post seven fifteenths up the road."),
  entry("prop-road-mine", "road", [3, 8, "three eighths"], "Name the mine three eighths up the road."),
  entry("prop-lane-watch", "lane", [4, 11, "four elevenths"], "Set the watch four elevenths up the lane."),
  entry("prop-lane-quay", "lane", [6, 11, "six elevenths"], "Mark the quay six elevenths up the lane."),
  entry("prop-lane-bar", "lane", [3, 5, "three fifths"], "Name the bar three fifths up the lane."),
  entry("prop-lane-reef", "lane", [11, 20, "eleven twentieths"], "Mark the reef eleven twentieths up the lane."),
  entry("prop-sound-landing", "sound", [2, 3, "two thirds"], "Set the landing two thirds up the sound."),
  entry("prop-sound-dock", "sound", [4, 7, "four sevenths"], "Mark the dock four sevenths up the sound."),
  entry("prop-sound-anchor", "sound", [8, 15, "eight fifteenths"], "Name the reef eight fifteenths up the sound."),
  entry("prop-channel-key", "channel", [5, 7, "five sevenths"], "Set the key five sevenths up the channel."),
  entry("prop-channel-harbour", "channel", [7, 12, "seven twelfths"], "Name the bar seven twelfths up the channel."),
  entry("prop-channel-opening", "channel", [9, 13, "nine thirteenths"], "Mark the opening nine thirteenths up the lane."),
  entry("prop-channel-landing", "channel", [4, 5, "four fifths"], "Set the landing four fifths up the channel."),
];
