/* ------------------------------------------------------------------
   T3 — CENTRE bank (spec section 4)
   Set the sighting mark at the exact centre of a drawn region.

   The region is never a clean rectangle: it wobbles, so the geometric
   average of the page is not the answer and there is nothing to
   measure against but the shape itself. This is the chart's safe
   anchor — a task a careful eye usually gets.
   ------------------------------------------------------------------ */

import { rf, ri } from "../seed";
import type { Pt, Scene } from "../../tasks/types";
import type { BankCtx, Built, Entry } from "./types";
import { bbox, wobblyQuad, wobblyRegion } from "./helpers";

const PAR = 3.5;
const DOMAIN = { min: 0, max: 1, step: 0.004 };

type Shape = "blob" | "quad" | "tall" | "wide" | "slim" | "frame" | "inner";

function buildCentre(ctx: BankCtx, shape: Shape, caption: string): Built {
  let region: Pt[];
  switch (shape) {
    case "frame":
      region = ctx.geo.frame;
      break;
    case "inner":
      region = ctx.geo.inner;
      break;
    case "blob":
      region = wobblyRegion(ctx.rng, ctx.zone, ri(ctx.rng, 22, 44), ri(ctx.rng, 16, 34), rf(ctx.rng, 0.06, 0.1));
      break;
    case "quad":
      region = wobblyQuad(ctx.rng, ctx.zone, ri(ctx.rng, 20, 46), ri(ctx.rng, 16, 36), rf(ctx.rng, 7, 13));
      break;
    case "tall":
      region = wobblyRegion(
        ctx.rng,
        { ...ctx.zone, w: ctx.zone.w * 0.62, x: ctx.zone.x + ctx.zone.w * 0.19 },
        18,
        12,
        0.08,
      );
      break;
    case "wide":
      region = wobblyRegion(
        ctx.rng,
        { ...ctx.zone, h: ctx.zone.h * 0.6, y: ctx.zone.y + ctx.zone.h * 0.2 },
        16,
        12,
        0.08,
      );
      break;
    case "slim":
      region = wobblyQuad(
        ctx.rng,
        { ...ctx.zone, h: ctx.zone.h * 0.5, y: ctx.zone.y + ctx.zone.h * 0.25, w: ctx.zone.w * 0.8, x: ctx.zone.x + ctx.zone.w * 0.1 },
        14,
        8,
        rf(ctx.rng, 5, 9),
      );
      break;
  }
  const box = bbox(region);
  const truth: Pt = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };
  const angle = rf(ctx.rng, 0, 360);
  const mag = rf(ctx.rng, 0.26, 0.46);
  const start: Pt = {
    x: truth.x + Math.cos((angle * Math.PI) / 180) * box.w * mag,
    y: truth.y + Math.sin((angle * Math.PI) / 180) * box.h * mag,
  };
  const scene: Scene = {
    kind: "centre",
    variant: shape,
    zone: ctx.zone,
    region,
    start,
    caption,
  };
  return { scene, truth, par: PAR, domain: DOMAIN };
}

function entry(id: string, prompt: string, shape: Shape, caption: string): Entry {
  return { id, prompt, variant: shape, build: (c) => buildCentre(c, shape, caption) };
}

export const CENTRE_BANK: Entry[] = [
  entry("centre-frame", "Find the middle of the frame.", "frame", "the frame"),
  entry("centre-inner", "Set the mark at the centre of the chart.", "inner", "the inner rule"),
  entry("centre-box", "Set the mark at the centre of the box.", "quad", "the survey box"),
  entry("centre-shoal", "Mark the centre of the shoal.", "blob", "the shoal"),
  entry("centre-lagoon", "Mark the centre of the lagoon.", "blob", "the lagoon"),
  entry("centre-basin", "Set the sight at the centre of the basin.", "blob", "the basin"),
  entry("centre-bight", "Find the middle of the bight.", "wide", "the bight"),
  entry("centre-reach", "Set the mark at the centre of the reach.", "slim", "the reach"),
  entry("centre-sound", "Mark the middle of the sound.", "tall", "the sound"),
  entry("centre-fairway", "Set the sight at the centre of the fairway.", "slim", "the fairway"),
  entry("centre-calm", "Mark the centre of the calm water.", "blob", "the calm water"),
  entry("centre-panel", "Set the mark at the heart of the panel.", "quad", "the panel"),
  entry("centre-deep", "Mark the middle of the deep.", "blob", "the deep"),
  entry("centre-channel", "Set the sight at the middle of the channel.", "tall", "the channel"),
  entry("centre-pocket", "Find the centre of the pocket.", "quad", "the pocket"),
  entry("centre-anchorage", "Mark the centre of the anchorage.", "blob", "the anchorage"),
  entry("centre-strait", "Set the mark at the strait's middle.", "tall", "the strait"),
  entry("centre-offing", "Find the middle of the offing.", "wide", "the offing"),
  entry("centre-midsea", "Set the sight at the middle of the sea.", "blob", "the sea"),
  entry("centre-clearing", "Mark the centre of the open water.", "quad", "the open water"),
  entry("centre-field", "Find the middle of the chart's field.", "inner", "the chart's field"),
  entry("centre-baymouth", "Set the sight at the bay's centre.", "blob", "the bay"),
];
