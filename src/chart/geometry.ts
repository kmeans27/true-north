/* ------------------------------------------------------------------
   Chart geometry — the physical layout of one hand-drawn chart.

   Everything a task can point at lives here: the frame the player
   measures against, the rhumb lines, the compass rose, the coastline,
   the doodles, and the reserved annotation zones that keep five task
   annotations from ever colliding.
   ------------------------------------------------------------------ */

import type { Rng } from "../daily/seed";
import { rf, ri, clamp } from "../daily/seed";
import type { Pt, Zone } from "../tasks/types";

export const VIEW_W = 1000;
export const VIEW_H = 1250;

/** The chart's nominal frame rect; the ink edge wobbles around this. */
export const FRAME = { x: 46, y: 46, w: VIEW_W - 92, h: VIEW_H - 92 };

/** Right-hand limit for full-width annotations (the inner rule). */
export const BAND_RIGHT = 938;

export interface Rhumb {
  a: Pt;
  b: Pt;
  /** the eight principal winds are drawn stronger */
  strong: boolean;
  node: number;
  deg: number;
}

export interface Landmass {
  outline: Pt[];
  mainland: boolean;
  name?: string;
}

export type DoodleKind = "serpent" | "whale" | "windhead" | "ship" | "gull";

export interface Doodle {
  kind: DoodleKind;
  at: Pt;
  scale: number;
  /** mirror the creature horizontally (odd days face the other way) */
  flip?: boolean;
  /** the drawn extent, usable as a length reference */
  a: Pt;
  b: Pt;
}

export interface Rose {
  c: Pt;
  r: number;
  /** rotation of the star, degrees */
  rot: number;
}

export interface ChartZone extends Zone {
  id: string;
  row: number;
  col: "left" | "right" | "mid";
}

export interface ChartGeometry {
  frame: Pt[];
  inner: Pt[];
  rhumbs: Rhumb[];
  nodes: Pt[];
  lands: Landmass[];
  rose: Rose;
  cartouche: Zone;
  doodles: Doodle[];
  soundings: Pt[];
  /** one guaranteed pair of soundings a measurable step apart */
  soundingStep: [Pt, Pt];
  shoals: { at: Pt; angle: number }[];
  zones: ChartZone[];
  /** the frame's half-diagonal, the centre task's unit of error */
  frameHalfDiag: number;
  /** the two ends of the frame's top edge, as the ink actually runs */
  frameTop: [Pt, Pt];
}

/* ---------------------------------- noise --------------------------- */

/** Smooth, periodic pseudo-noise in [-1,1], deterministic from rng. */
export function smoothNoise(rng: Rng): (t: number) => number {
  const p1 = rf(rng, 0, Math.PI * 2);
  const p2 = rf(rng, 0, Math.PI * 2);
  const p3 = rf(rng, 0, Math.PI * 2);
  const k1 = ri(rng, 1, 2);
  const k2 = ri(rng, 2, 3);
  const k3 = ri(rng, 5, 7);
  return (t: number) =>
    0.62 * Math.sin(t * Math.PI * 2 * k1 + p1) +
    0.26 * Math.sin(t * Math.PI * 2 * k2 + p2) +
    0.12 * Math.sin(t * Math.PI * 2 * k3 + p3);
}

function perimeterPoint(rect: Zone, t: number): { p: Pt; n: Pt } {
  const per = 2 * (rect.w + rect.h);
  let d = t * per;
  if (d < rect.w) return { p: { x: rect.x + d, y: rect.y }, n: { x: 0, y: -1 } };
  d -= rect.w;
  if (d < rect.h) return { p: { x: rect.x + rect.w, y: rect.y + d }, n: { x: 1, y: 0 } };
  d -= rect.h;
  if (d < rect.w) return { p: { x: rect.x + rect.w - d, y: rect.y + rect.h }, n: { x: 0, y: 1 } };
  d -= rect.w;
  return { p: { x: rect.x, y: rect.y + rect.h - d }, n: { x: -1, y: 0 } };
}

export function wobblyRect(rng: Rng, rect: Zone, amp: number, steps = 140): Pt[] {
  const noise = smoothNoise(rng);
  const out: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const { p, n } = perimeterPoint(rect, t);
    const o = amp * noise(t);
    out.push({ x: p.x + n.x * o, y: p.y + n.y * o });
  }
  return out;
}

/* ---------------------------------- land ---------------------------- */

function shoreline(rng: Rng, from: Pt, to: Pt, bays: number, amp: number, detail: number): Pt[] {
  const big = smoothNoise(rng);
  const fine = smoothNoise(rng);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const dx = (to.x - from.x) / len;
  const dy = (to.y - from.y) / len;
  const nx = -dy;
  const ny = dx;
  const out: Pt[] = [];
  for (let i = 0; i <= detail; i++) {
    const t = i / detail;
    const taper = Math.sin(Math.PI * clamp(t, 0, 1)) ** 0.35;
    const off = (big(t * (bays / 3)) * amp + fine(t * 7) * amp * 0.16) * taper;
    out.push({ x: from.x + dx * len * t + nx * off, y: from.y + dy * len * t + ny * off });
  }
  return out;
}

function island(rng: Rng, c: Pt, r: number, points = 22): Pt[] {
  const noise = smoothNoise(rng);
  const rot = rf(rng, 0, Math.PI * 2);
  const squash = rf(rng, 0.62, 0.92);
  const out: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const a = rot + t * Math.PI * 2;
    const rad = r * (1 + 0.3 * noise(t));
    out.push({ x: c.x + Math.cos(a) * rad, y: c.y + Math.sin(a) * rad * squash });
  }
  return out;
}

/* ---------------------------------- layout -------------------------- */

/**
 * Reserved annotation zones. Every zone is disjoint from the cartouche,
 * the rose and the mainland, and the rows are the unit of exclusivity:
 * a full-width annotation (a length bar) claims its entire row.
 */
const ZONE_DEFS: [string, "left" | "right" | "mid", number, Zone][] = [
  ["L1", "left", 0, { x: 118, y: 236, w: 300, h: 208 }],
  ["R1", "right", 0, { x: 470, y: 236, w: 300, h: 208 }],
  ["L2", "left", 1, { x: 118, y: 486, w: 300, h: 196 }],
  ["R2", "right", 1, { x: 498, y: 486, w: 296, h: 196 }],
  ["L3", "mid", 2, { x: 138, y: 716, w: 286, h: 182 }],
  ["R3", "right", 2, { x: 622, y: 716, w: 296, h: 182 }],
  ["L4", "mid", 3, { x: 392, y: 946, w: 246, h: 166 }],
];

export const ZONES: ChartZone[] = ZONE_DEFS.map(([id, col, row, z]) => ({ id, col, row, ...z }));

/** Which zones a full-width annotation would cross, by row. */
export function rowOf(zone: Zone): ChartZone | undefined {
  return ZONES.find((z) => z.x === zone.x && z.y === zone.y);
}

export function makeGeometry(rng: Rng, roseRot: number): ChartGeometry {
  const frame = wobblyRect(rng, FRAME, rf(rng, 2.6, 4.4));
  const inner = wobblyRect(
    rng,
    { x: FRAME.x + 13, y: FRAME.y + 13, w: FRAME.w - 26, h: FRAME.h - 26 },
    rf(rng, 1.6, 2.8),
    120,
  );

  const cartouche: Zone = { x: 70, y: 66, w: 360, h: 124 };
  const rose: Rose = { c: { x: 760, y: 1042 }, r: rf(rng, 84, 98), rot: roseRot };

  // A thin peninsula running off the bottom-left corner: a real coast to
  // measure against, without eating the sea the tasks need.
  const landFrom = { x: FRAME.x - 6, y: rf(rng, 1046, 1108) };
  const landTo = { x: rf(rng, 396, 452), y: FRAME.y + FRAME.h + 6 };
  const coast = shoreline(rng, landFrom, landTo, rf(rng, 2.4, 3.6), rf(rng, 54, 84), 34);
  const mainland: Landmass = {
    outline: [
      ...coast,
      { x: FRAME.x - 8, y: FRAME.y + FRAME.h + 8 },
      { x: FRAME.x - 8, y: landFrom.y },
    ],
    mainland: true,
    name: "the Painted Shore",
  };

  const islands: Landmass[] = [];
  const islandSlots: { c: Pt; r: number }[] = [
    { c: { x: rf(rng, 176, 214), y: rf(rng, 946, 986) }, r: rf(rng, 30, 42) },
    { c: { x: rf(rng, 640, 688), y: rf(rng, 1140, 1170) }, r: rf(rng, 26, 36) },
    { c: { x: rf(rng, 300, 352), y: rf(rng, 1156, 1186) }, r: rf(rng, 22, 30) },
  ];
  const islandCount = ri(rng, 2, 3);
  for (let i = 0; i < islandCount; i++) {
    const s = islandSlots[i];
    islands.push({ outline: island(rng, s.c, s.r, ri(rng, 18, 26)), mainland: false });
  }

  // The portolan web: a rose node and a second knot of winds.
  const nodes: Pt[] = [{ ...rose.c }, { x: rf(rng, 178, 232), y: rf(rng, 296, 344) }];
  const rhumbs: Rhumb[] = [];
  const roseCount = 16;
  for (let i = 0; i < roseCount; i++) {
    const deg = wrapDeg(rose.rot + (360 / roseCount) * i);
    rhumbs.push(lambda(nodes[0], deg, i % 2 === 0, 0));
  }
  const nodeCount = 8;
  for (let i = 0; i < nodeCount; i++) {
    const deg = wrapDeg(rf(rng, 0, 360) + (360 / nodeCount) * i);
    rhumbs.push(lambda(nodes[1], deg, false, 1));
  }

  // All five creatures are always drawn: they are length references, so a
  // chart that omitted one would silently change the day's puzzle.
  const doodles: Doodle[] = [];
  for (const s of DODDLE_SLOTS) {
    const at = { x: s.at.x + rf(rng, -12, 12), y: s.at.y + rf(rng, -12, 12) };
    const scale = rf(rng, 0.86, 1.18);
    const span = DOODLE_SPAN[s.kind];
    doodles.push({
      kind: s.kind,
      at,
      scale,
      a: { x: at.x + span.ax * scale, y: at.y + span.ay * scale },
      b: { x: at.x + span.bx * scale, y: at.y + span.by * scale },
    });
  }

  // Soundings and shoals: texture in the margins, never inside a zone.
  const soundings: Pt[] = [];
  for (let gy = 0; gy < 9; gy++) {
    for (let gx = 0; gx < 7; gx++) {
      const p = {
        x: FRAME.x + 62 + gx * 130 + rf(rng, -26, 26),
        y: FRAME.y + 46 + gy * 132 + rf(rng, -26, 26),
      };
      if (!inAnyZone(p, 18) && !inZone(cartouche, p, 30) && !nearRose(rose, p, 24) && p.y > 120) {
        soundings.push(p);
      }
    }
  }
  const shoals: { at: Pt; angle: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const p = { x: rf(rng, 120, 880), y: rf(rng, 150, 1160) };
    if (inAnyZone(p, 34) || inZone(cartouche, p, 40) || nearRose(rose, p, 36)) continue;
    if (p.y > 1000 && p.x < 460) continue; // on the peninsula
    shoals.push({ at: p, angle: rf(rng, -34, 34) });
  }

  // One guaranteed pair of soundings a measurable step apart, so the
  // "one step between soundings" reference always exists on every chart.
  const pairSpot = freeSpot(cartouche, rose, rf(rng, 0, 1));
  const stepLen = rf(rng, 122, 168);
  const soundingStep: [Pt, Pt] = [
    pairSpot,
    { x: pairSpot.x + stepLen, y: pairSpot.y + rf(rng, -7, 7) },
  ];
  soundings.push(soundingStep[0], soundingStep[1]);

  const frameTop = topEdge(frame);

  return {
    frame,
    inner,
    rhumbs,
    nodes,
    lands: [mainland, ...islands],
    rose,
    cartouche,
    doodles,
    soundings,
    soundingStep,
    shoals,
    zones: ZONES,
    frameHalfDiag: Math.hypot(FRAME.w, FRAME.h) / 2,
    frameTop,
  };
}

const DODDLE_SLOTS: { kind: DoodleKind; at: Pt }[] = [
  { kind: "serpent", at: { x: 806, y: 872 } },
  { kind: "whale", at: { x: 196, y: 712 } },
  { kind: "windhead", at: { x: 868, y: 196 } },
  { kind: "ship", at: { x: 596, y: 1082 } },
  { kind: "gull", at: { x: 344, y: 176 } },
];

/** Local drawn extents, shared by the renderer and the length bank. */
export const DOODLE_SPAN: Record<DoodleKind, { ax: number; ay: number; bx: number; by: number }> = {
  serpent: { ax: -70, ay: -6, bx: 70, by: 6 },
  whale: { ax: -56, ay: -2, bx: 56, by: 8 },
  windhead: { ax: -34, ay: -32, bx: 34, by: 26 },
  ship: { ax: -30, ay: 8, bx: 36, by: 8 },
  gull: { ax: -18, ay: 0, bx: 18, by: 0 },
};

export function wrapDeg(a: number): number {
  const d = a % 360;
  return d < 0 ? d + 360 : d;
}

function lambda(from: Pt, deg: number, strong: boolean, node: number): Rhumb {
  const rad = (deg * Math.PI) / 180;
  const far = 1500;
  return {
    a: from,
    b: { x: from.x + Math.cos(rad) * far, y: from.y + Math.sin(rad) * far },
    strong,
    node,
    deg,
  };
}

/** The two ends of the frame's top edge, following the actual ink. */
function topEdge(frame: Pt[]): [Pt, Pt] {
  let minY = Infinity;
  for (const p of frame) minY = Math.min(minY, p.y);
  let left: Pt | null = null;
  let right: Pt | null = null;
  for (const p of frame) {
    if (p.y > minY + 46) continue;
    if (!left || p.x < left.x) left = p;
    if (!right || p.x > right.x) right = p;
  }
  return [left ?? frame[0], right ?? frame[0]];
}

function nearRose(rose: Rose, p: Pt, pad: number): boolean {
  return Math.hypot(p.x - rose.c.x, p.y - rose.c.y) < rose.r * 1.5 + pad;
}

/** The first clear station in the margins, for the guaranteed sounding pair. */
function freeSpot(cartouche: Zone, rose: Rose, t: number): Pt {
  const xs: number[] = [];
  for (let x = 150; x <= 600; x += 26) xs.push(x);
  const ys: number[] = [];
  for (let y = 210; y <= 1160; y += 26) ys.push(y);
  const total = xs.length * ys.length;
  const start = Math.floor(t * total);
  const blockers = DODDLE_SLOTS.map((s) => ({ c: s.at, r: 74 }));
  for (let k = 0; k < total; k++) {
    const n = (start + k) % total;
    const p = { x: xs[n % xs.length], y: ys[Math.floor(n / xs.length)] };
    const q = { x: p.x + 172, y: p.y };
    if (q.x > 930) continue;
    if (p.y > 1000 && p.x < 480) continue;
    if (inAnyZone(p, 20) || inAnyZone(q, 20)) continue;
    if (inZone(cartouche, p, 26) || inZone(cartouche, q, 26)) continue;
    if (nearRose(rose, p, 22) || nearRose(rose, q, 22)) continue;
    if (blockers.some((b) => Math.hypot(b.c.x - p.x, b.c.y - p.y) < b.r || Math.hypot(b.c.x - q.x, b.c.y - q.y) < b.r)) continue;
    return p;
  }
  return { x: 500, y: 1160 };
}

function inZone(z: Zone, p: Pt, pad: number): boolean {
  return p.x > z.x - pad && p.x < z.x + z.w + pad && p.y > z.y - pad && p.y < z.y + z.h + pad;
}

export function inAnyZone(p: Pt, pad: number): boolean {
  return ZONES.some((z) => inZone(z, p, pad));
}

/** Chart-space point from normalised zone space. */
export function zoneToChart(z: Zone, nx: number, ny: number): Pt {
  return { x: z.x + nx * z.w, y: z.y + ny * z.h };
}
