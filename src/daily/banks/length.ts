/* ------------------------------------------------------------------
   T1 — LENGTH RATIO bank (spec section 4)
   "Draw the bar to <a real span on this chart>."

   The bar is drawn at true scale along a full-width band, so the
   player is comparing two physical spans on the same page. The truth
   is always a fraction of the reference, never a round one.
   ------------------------------------------------------------------ */

import { nonRound, rf, ri } from "../seed";
import type { Rng } from "../seed";
import { BAND_RIGHT } from "../../chart/geometry";
import type { ChartGeometry, DoodleKind } from "../../chart/geometry";
import type { LengthRef, Pt, Zone } from "../../tasks/types";
import type { BankCtx, Built, Entry } from "./types";
import { lengthRef } from "./helpers";

const PAR = 0.10;
const DOMAIN_MIN = 0.06;
const DOMAIN_MAX = 1.18;

/** The horizontal band a length bar is drawn along. */
export function lengthBand(zone: Zone): { origin: Pt; y: number } {
  const y = zone.y + zone.h * 0.55;
  return { origin: { x: zone.x + 26, y }, y };
}

function buildLength(ctx: BankCtx, ref: LengthRef, truthRange: [number, number] = [0.25, 0.8]): Built | null {
  const { origin } = lengthBand(ctx.zone);
  const avail = BAND_RIGHT - origin.x;
  if (avail < 220 || ref.len < 30) return null;
  const maxRatio = Math.min(DOMAIN_MAX, (avail * 0.98) / ref.len);
  const hi = Math.min(truthRange[1], maxRatio - 0.09);
  const lo = truthRange[0];
  if (hi <= lo + 0.06) return null;
  const truth = nonRound(ctx.rng, lo, hi, 0.05);
  const scene: Built["scene"] = {
    kind: "length",
    variant: ref.kind,
    zone: ctx.zone,
    origin,
    dir: { x: 1, y: 0 },
    ref,
    maxLen: maxRatio * ref.len,
    refLen: ref.len,
  };
  return {
    scene,
    truth,
    par: PAR,
    domain: { min: DOMAIN_MIN, max: maxRatio, step: 0.0025 },
  };
}

/* ---------------------------------- edges --------------------------- */

type Side = "top" | "bottom" | "left" | "right";

function edgeSpan(geo: ChartGeometry, side: Side): LengthRef {
  const pts = geo.frame;
  const key = side === "top" || side === "bottom" ? "y" : "x";
  const extreme = pts.reduce(
    (acc, p) => (side === "top" || side === "left" ? Math.min(acc, p[key]) : Math.max(acc, p[key])),
    side === "top" || side === "left" ? Infinity : -Infinity,
  );
  const band = pts.filter((p) => Math.abs(p[key] - extreme) < 46);
  const sx = key === "x" ? "y" : "x";
  let lo = band[0];
  let hi = band[0];
  for (const p of band) {
    if (p[sx] < lo[sx]) lo = p;
    if (p[sx] > hi[sx]) hi = p;
  }
  const caption =
    side === "top"
      ? "the frame's top edge"
      : side === "bottom"
        ? "the frame's lower edge"
        : side === "left"
          ? "the frame's left edge"
          : "the frame's right edge";
  return lengthRef(`frame-${side}`, caption, lo, hi);
}

function doodleSpan(geo: ChartGeometry, kind: DoodleKind, caption: string): LengthRef | null {
  const d = geo.doodles.find((x) => x.kind === kind);
  if (!d) return null;
  return lengthRef(`doodle-${kind}`, caption, d.a, d.b);
}

/** Two or more rhumb lines, measured across at a given radius. */
function rhumbGap(
  rng: Rng,
  geo: ChartGeometry,
  radius: number,
  gaps: number,
  caption: string,
): LengthRef | null {
  const node = geo.nodes[0];
  const roseRhumbs = geo.rhumbs.filter((r) => r.node === 0).sort((a, b) => a.deg - b.deg);
  if (roseRhumbs.length < 4) return null;
  const i = ri(rng, 0, roseRhumbs.length - 1);
  const a = roseRhumbs[i];
  const b = roseRhumbs[(i + gaps) % roseRhumbs.length];
  const p = (r: { deg: number }, rad: number): Pt => ({
    x: node.x + Math.cos((r.deg * Math.PI) / 180) * rad,
    y: node.y + Math.sin((r.deg * Math.PI) / 180) * rad,
  });
  const pa = p(a, radius);
  const pb = p(b, radius);
  return lengthRef(`rhumb-gap-${Math.round(radius)}-${gaps}`, caption, pa, pb);
}

function soundingStepRef(geo: ChartGeometry): LengthRef {
  return lengthRef("sounding-step", "one step between soundings", geo.soundingStep[0], geo.soundingStep[1]);
}

function roseTo(geo: ChartGeometry, p: Pt, caption: string, kind: string): LengthRef {
  return lengthRef(kind, caption, geo.rose.c, p);
}

function coastEnds(geo: ChartGeometry): { a: Pt; b: Pt } {
  const land = geo.lands[0];
  const a = land.outline[0];
  const b = land.outline[Math.max(0, land.outline.length - 3)];
  return { a, b };
}

function coastSteps(geo: ChartGeometry): number {
  return geo.lands[0].outline.length - 3;
}

function coastPoint(geo: ChartGeometry, i: number): Pt {
  return geo.lands[0].outline[i];
}

/* ---------------------------------- entries ------------------------- */

export const LENGTH_BANK: Entry[] = [
  {
    id: "frame-top",
    prompt: "Draw the bar to the frame's top edge.",
    variant: "frameTop",
    build: (c) => buildLength(c, edgeSpan(c.geo, "top")),
  },
  {
    id: "frame-bottom",
    prompt: "Match the bar to the frame's lower edge.",
    variant: "frameBottom",
    build: (c) => buildLength(c, edgeSpan(c.geo, "bottom")),
  },
  {
    id: "frame-left",
    prompt: "Draw the bar to the frame's left edge.",
    variant: "frameLeft",
    build: (c) => buildLength(c, edgeSpan(c.geo, "left"), [0.25, 0.62]),
  },
  {
    id: "frame-right",
    prompt: "Copy the span of the frame's right edge.",
    variant: "frameRight",
    build: (c) => buildLength(c, edgeSpan(c.geo, "right"), [0.25, 0.62]),
  },
  {
    id: "rose-width",
    prompt: "Draw the bar to the width of the rose.",
    variant: "roseWidth",
    build: (c) =>
      buildLength(
        c,
        lengthRef(
          "roseWidth",
          "the width of the compass rose",
          { x: c.geo.rose.c.x - c.geo.rose.r, y: c.geo.rose.c.y },
          { x: c.geo.rose.c.x + c.geo.rose.r, y: c.geo.rose.c.y },
        ),
      ),
  },
  {
    id: "rose-reach",
    prompt: "Draw the bar to the reach of the rose.",
    variant: "roseRadius",
    build: (c) =>
      buildLength(
        c,
        lengthRef("roseRadius", "the rose's reach", c.geo.rose.c, {
          x: c.geo.rose.c.x + c.geo.rose.r,
          y: c.geo.rose.c.y,
        }),
      ),
  },
  {
    id: "rose-berth",
    prompt: "Draw the bar to the rose's berth.",
    variant: "roseBerth",
    build: (c) =>
      buildLength(
        c,
        lengthRef(
          "roseBerth",
          "from the rose to the lower frame",
          c.geo.rose.c,
          { x: c.geo.rose.c.x, y: 1252 },
        ),
      ),
  },
  {
    id: "rose-east",
    prompt: "Match the bar to the sea east of the rose.",
    variant: "roseEast",
    build: (c) =>
      buildLength(
        c,
        lengthRef("roseEast", "from the rose to the right frame", c.geo.rose.c, {
          x: 954,
          y: c.geo.rose.c.y,
        }),
      ),
  },
  {
    id: "cartouche-width",
    prompt: "Draw the bar to the cartouche's width.",
    variant: "cartoucheWidth",
    build: (c) =>
      buildLength(
        c,
        lengthRef(
          "cartoucheWidth",
          "the width of the title box",
          { x: c.geo.cartouche.x, y: c.geo.cartouche.y + c.geo.cartouche.h / 2 },
          { x: c.geo.cartouche.x + c.geo.cartouche.w, y: c.geo.cartouche.y + c.geo.cartouche.h / 2 },
        ),
      ),
  },
  {
    id: "cartouche-height",
    prompt: "Draw the bar to the height of the title box.",
    variant: "cartoucheHeight",
    build: (c) =>
      buildLength(
        c,
        lengthRef(
          "cartoucheHeight",
          "the height of the title box",
          { x: c.geo.cartouche.x + c.geo.cartouche.w / 2, y: c.geo.cartouche.y },
          { x: c.geo.cartouche.x + c.geo.cartouche.w / 2, y: c.geo.cartouche.y + c.geo.cartouche.h },
        ),
      ),
  },
  {
    id: "shore-span",
    prompt: "Draw the bar to the span of the shore.",
    variant: "shoreSpan",
    build: (c) => {
      const { a, b } = coastEnds(c.geo);
      return buildLength(c, lengthRef("shoreSpan", "the span of the shore", a, b));
    },
  },
  {
    id: "shore-easting",
    prompt: "Match the bar to the shore's easting.",
    variant: "shoreEasting",
    build: (c) => {
      const { a, b } = coastEnds(c.geo);
      return buildLength(
        c,
        lengthRef("shoreEasting", "how far east the shore runs", { x: a.x, y: a.y }, { x: b.x, y: a.y }),
      );
    },
  },
  {
    id: "shore-reach",
    prompt: "Draw the bar to one reach of the shore.",
    variant: "shoreReach",
    build: (c) => {
      const total = coastSteps(c.geo);
      if (total < 12) return null;
      const i = ri(c.rng, 2, total - 10);
      const a = coastPoint(c.geo, i);
      const b = coastPoint(c.geo, i + 6);
      return buildLength(c, lengthRef("shoreReach", "a straight reach of the shore", a, b), [0.25, 0.8]);
    },
  },
  {
    id: "wind-gap",
    prompt: "Draw the bar to one gap between winds.",
    variant: "windGap",
    build: (c) => {
      const r = rhumbGap(c.rng, c.geo, rf(c.rng, 320, 420), 1, "one gap between winds");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "wind-gap-narrow",
    prompt: "Match the bar to a narrow wind gap.",
    variant: "windGapNarrow",
    build: (c) => {
      const r = rhumbGap(c.rng, c.geo, rf(c.rng, 210, 300), 1, "a narrow gap between winds");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "wind-gap-wide",
    prompt: "Draw the bar to two gaps between winds.",
    variant: "windGapWide",
    build: (c) => {
      const r = rhumbGap(c.rng, c.geo, rf(c.rng, 300, 380), 2, "two gaps between winds");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "wind-knots",
    prompt: "Draw the bar between the two wind knots.",
    variant: "windKnots",
    build: (c) => {
      const [n0, n1] = c.geo.nodes;
      return buildLength(c, lengthRef("windKnots", "knot to knot", n0, n1), [0.25, 0.62]);
    },
  },
  {
    id: "island-span",
    prompt: "Draw the bar to the long island's reach.",
    variant: "islandSpan",
    build: (c) => {
      const islands = c.geo.lands.filter((l) => !l.mainland);
      if (islands.length === 0) return null;
      let best: { a: Pt; b: Pt; len: number } | null = null;
      for (const isl of islands) {
        for (const p of isl.outline) {
          for (const q of isl.outline) {
            const len = Math.hypot(p.x - q.x, p.y - q.y);
            if (!best || len > best.len) best = { a: p, b: q, len };
          }
        }
      }
      if (!best) return null;
      return buildLength(c, lengthRef("islandSpan", "the long island's reach", best.a, best.b));
    },
  },
  {
    id: "island-berth",
    prompt: "Match the bar to the nearest island's width.",
    variant: "islandBerth",
    build: (c) => {
      const islands = c.geo.lands.filter((l) => !l.mainland);
      if (islands.length === 0) return null;
      const isl = islands[0];
      let minX = isl.outline[0];
      let maxX = isl.outline[0];
      for (const p of isl.outline) {
        if (p.x < minX.x) minX = p;
        if (p.x > maxX.x) maxX = p;
      }
      return buildLength(c, lengthRef("islandBerth", "the island's width", minX, maxX));
    },
  },
  {
    id: "doodle-whale",
    prompt: "Draw the bar to the whale's length.",
    variant: "whaleLength",
    build: (c) => {
      const r = doodleSpan(c.geo, "whale", "the whale's length");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "doodle-serpent",
    prompt: "Match the bar to the sea serpent's length.",
    variant: "serpentLength",
    build: (c) => {
      const r = doodleSpan(c.geo, "serpent", "the sea serpent's length");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "doodle-ship",
    prompt: "Draw the bar to the length of the ship.",
    variant: "shipLength",
    build: (c) => {
      const r = doodleSpan(c.geo, "ship", "the ship's length");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "doodle-windhead",
    prompt: "Draw the bar to the wind head's span.",
    variant: "windheadSpan",
    build: (c) => {
      const r = doodleSpan(c.geo, "windhead", "the wind head's span");
      return r ? buildLength(c, r) : null;
    },
  },
  {
    id: "rose-to-ship",
    prompt: "Draw the bar from the rose to the ship.",
    variant: "roseToShip",
    build: (c) => {
      const d = c.geo.doodles.find((x) => x.kind === "ship");
      if (!d) return null;
      return buildLength(c, roseTo(c.geo, d.at, "from the rose to the ship", "roseToShip"));
    },
  },
  {
    id: "rose-to-serpent",
    prompt: "Draw the bar from the rose to the serpent.",
    variant: "roseToSerpent",
    build: (c) => {
      const d = c.geo.doodles.find((x) => x.kind === "serpent");
      if (!d) return null;
      return buildLength(c, roseTo(c.geo, d.at, "from the rose to the serpent", "roseToSerpent"));
    },
  },
  {
    id: "sounding-step",
    prompt: "Match the bar to one step between soundings.",
    variant: "soundingStep",
    build: (c) => buildLength(c, soundingStepRef(c.geo)),
  },
];
