/* ------------------------------------------------------------------
   T2 — ANGLE bank (spec section 4)
   Three variants, one gesture: rotate a needle about a vertex.

     bisect        — split the channel between two arms
     perpendicular — strike square across a straight wall
     copy          — open the needle to an angle shown nearby

   The needle always opens *near* but never at the truth, so the
   direction of the ray is never in doubt (a ray at T+180 is the same
   line but it is not the same answer). This is the one deliberate
   kindness in the game.
   ------------------------------------------------------------------ */

import { nonRound, rf } from "../seed";
import type { Pt, AngleVariant, Scene, AngleSource } from "../../tasks/types";
import type { BankCtx, Built, Entry } from "./types";

const PAR: Record<AngleVariant, number> = {
  bisect: 3.5,
  perpendicular: 5.0,
  copy: 4.0,
};

const DOMAIN = { min: 0, max: 360, step: 0.25 };

function wrap(a: number): number {
  const d = a % 360;
  return d < 0 ? d + 360 : d;
}

export function bearing(a: Pt, b: Pt): number {
  return wrap((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
}

function armLen(ctx: BankCtx, factor: number): number {
  return Math.min(ctx.zone.w, ctx.zone.h) * factor;
}

/** The needle opens somewhere near the truth, never on it. */
function openNear(rng: () => number, truth: number): number {
  const sign = rng() < 0.5 ? -1 : 1;
  return wrap(truth + sign * rf(rng, 26, 58));
}

function buildBisect(ctx: BankCtx, halfRange: [number, number], where: "left" | "right" | "centre"): Built {
  // Neither the wedge's opening nor the fair line may be a "nice"
  // number: round targets can be constructed by eye instead of judged.
  const half = nonRound(ctx.rng, halfRange[0], halfRange[1], 7.5, 0.22);
  const mid = nonRound(ctx.rng, 0, 360, 45, 0.06);
  const vertex = ctx.at(
    where === "left" ? 0.2 : where === "right" ? 0.8 : rf(ctx.rng, 0.36, 0.64),
    rf(ctx.rng, 0.44, 0.74),
  );
  const scene: Scene = {
    kind: "angle",
    variant: "bisect",
    zone: ctx.zone,
    vertex,
    arms: [wrap(mid - half), wrap(mid + half)],
    armLength: armLen(ctx, 0.4),
    start: openNear(ctx.rng, mid),
  };
  return { scene, truth: wrap(mid), par: PAR.bisect, domain: DOMAIN };
}

function buildPerpendicular(ctx: BankCtx): Built {
  // A straight wall (a breakwater), and a sight taken from open water.
  const zone = ctx.zone;
  const horizontal = ctx.rng() < 0.55;
  const wallLen = Math.min(zone.w, zone.h) * 0.44;
  const cx = zone.x + zone.w * (horizontal ? 0.5 : rf(ctx.rng, 0.36, 0.64));
  const cy = zone.y + zone.h * (horizontal ? 0.68 : 0.5);
  const wallDir = wrap((horizontal ? 0 : 90) + nonRound(ctx.rng, -14, 14, 45, 0.07));
  const rad = (wallDir * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const wall: [Pt, Pt] = [
    { x: cx - dx * wallLen, y: cy - dy * wallLen },
    { x: cx + dx * wallLen, y: cy + dy * wallLen },
  ];
  const side = wrap(wallDir + 90) + (ctx.rng() < 0.5 ? 180 : 0);
  const dist = rf(ctx.rng, 92, 148);
  const vertex = ctx.ray({ x: cx, y: cy }, side, dist);
  const length = dist * (ctx.rng() < 0.5 ? 0.6 : 1.55);
  const truth = bearing(vertex, { x: cx, y: cy });
  const scene: Scene = {
    kind: "angle",
    variant: "perpendicular",
    zone,
    vertex,
    arms: [],
    wall,
    armLength: length,
    start: openNear(ctx.rng, truth),
  };
  return { scene, truth, par: PAR.perpendicular, domain: DOMAIN };
}

function buildCopy(ctx: BankCtx, opening: [number, number]): Built {
  const length = armLen(ctx, 0.34);
  const sign = ctx.rng() < 0.5 ? -1 : 1;
  const vertex = ctx.at(0.22, rf(ctx.rng, 0.52, 0.74));
  // The target arm points away from the source wedge, so the needle
  // opens into clear water and the two wedges never overlap.
  const targetArm = wrap(180 + rf(ctx.rng, -22, 22));
  // The angle to copy must not be a "nice" one: pick until the resulting
  // bearing is clear of the round grid.
  let size = sign * rf(ctx.rng, opening[0], opening[1]);
  let truth = wrap(targetArm + size);
  for (let attempt = 0; attempt < 8; attempt++) {
    if (Math.abs(truth - Math.round(truth / 15) * 15) > 2.2) break;
    size = sign * rf(ctx.rng, opening[0], opening[1]);
    truth = wrap(targetArm + size);
  }
  const sourceArm = wrap(rf(ctx.rng, 0, 360));
  const source: AngleSource = {
    vertex: ctx.at(0.78, rf(ctx.rng, 0.34, 0.54)),
    arms: [sourceArm, wrap(sourceArm + size)],
    armLength: length * 0.86,
    caption: "the angle to copy",
  };
  const scene: Scene = {
    kind: "angle",
    variant: "copy",
    zone: ctx.zone,
    vertex,
    arms: [targetArm],
    source,
    armLength: length,
    start: openNear(ctx.rng, truth),
  };
  return { scene, truth, par: PAR.copy, domain: DOMAIN };
}

export const ANGLE_BANK: Entry[] = [
  { id: "bisect-channel", prompt: "Bisect the channel.", variant: "bisect", build: (c) => buildBisect(c, [24, 52], "centre") },
  { id: "bisect-harbour", prompt: "Halve the harbour mouth.", variant: "bisect", build: (c) => buildBisect(c, [26, 58], "centre") },
  { id: "bisect-wide", prompt: "Cut the wide strait in two.", variant: "bisect", build: (c) => buildBisect(c, [52, 76], "left") },
  { id: "bisect-creek", prompt: "Split the narrow creek.", variant: "bisect", build: (c) => buildBisect(c, [16, 30], "right") },
  { id: "bisect-cape", prompt: "Halve the angle at the cape.", variant: "bisect", build: (c) => buildBisect(c, [30, 60], "right") },
  { id: "bisect-fork", prompt: "Bisect the river fork.", variant: "bisect", build: (c) => buildBisect(c, [22, 44], "left") },
  { id: "bisect-fairway", prompt: "Draw the fair line between the arms.", variant: "bisect", build: (c) => buildBisect(c, [28, 54], "centre") },
  { id: "bisect-bay", prompt: "Split the bay's mouth evenly.", variant: "bisect", build: (c) => buildBisect(c, [34, 62], "left") },
  { id: "bisect-inlet", prompt: "Bisect the inlet's mouth.", variant: "bisect", build: (c) => buildBisect(c, [20, 40], "right") },
  { id: "perp-shore", prompt: "Strike a perpendicular to the shore.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-wall", prompt: "Strike square across the harbour wall.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-jetty", prompt: "Square the needle to the jetty.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-lane", prompt: "Cut the sea lane at a right angle.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-bank", prompt: "Raise the perpendicular to the bank.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-quay", prompt: "Set the sight square to the quay.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-meridian", prompt: "Strike the perpendicular to the meridian.", variant: "perpendicular", build: buildPerpendicular },
  { id: "perp-boom", prompt: "Square the needle to the boom.", variant: "perpendicular", build: buildPerpendicular },
  { id: "copy-trade", prompt: "Copy the trade wind's angle.", variant: "copy", build: (c) => buildCopy(c, [22, 62]) },
  { id: "copy-offshore", prompt: "Match the angle shown offshore.", variant: "copy", build: (c) => buildCopy(c, [24, 58]) },
  { id: "copy-bearing", prompt: "Set the needle to the shown bearing.", variant: "copy", build: (c) => buildCopy(c, [20, 70]) },
  { id: "copy-headland", prompt: "Match the angle off the headland.", variant: "copy", build: (c) => buildCopy(c, [26, 66]) },
  { id: "copy-opening", prompt: "Copy the harbour mouth's opening.", variant: "copy", build: (c) => buildCopy(c, [18, 50]) },
  { id: "copy-wind", prompt: "Set the same angle as the far wind.", variant: "copy", build: (c) => buildCopy(c, [30, 72]) },
  { id: "copy-creek", prompt: "Match the creek's opening.", variant: "copy", build: (c) => buildCopy(c, [16, 46]) },
];
