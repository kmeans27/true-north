/* Shared geometry helpers for the parameter banks. */

import type { Rng } from "../../daily/seed";
import { rf, ri, clamp } from "../../daily/seed";
import { smoothNoise } from "../../chart/geometry";
import type { LengthRef, Pt, Zone } from "../../tasks/types";
import type { BankCtx } from "./types";

export function makeCtx(rng: Rng, geo: import("../../chart/geometry").ChartGeometry, zone: Zone): BankCtx {
  return {
    rng,
    geo,
    zone,
    at(nx, ny) {
      return { x: zone.x + nx * zone.w, y: zone.y + ny * zone.h };
    },
    anywhere(pad = 0) {
      return {
        x: zone.x + pad + rng() * (zone.w - pad * 2),
        y: zone.y + pad + rng() * (zone.h - pad * 2),
      };
    },
    ray(from, deg, len) {
      const r = (deg * Math.PI) / 180;
      return { x: from.x + Math.cos(r) * len, y: from.y + Math.sin(r) * len };
    },
  };
}

/** A hand-drawn line: mild large-scale bays plus fine tremor. */
export function wavy(rng: Rng, a: Pt, b: Pt, amp: number, detail = 14, bays = 2.5): Pt[] {
  const big = smoothNoise(rng);
  const fine = smoothNoise(rng);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const dx = (b.x - a.x) / len;
  const dy = (b.y - a.y) / len;
  const nx = -dy;
  const ny = dx;
  const out: Pt[] = [];
  for (let i = 0; i <= detail; i++) {
    const t = i / detail;
    const taper = Math.sin(Math.PI * t) ** 0.35;
    const off = (big(t * bays) * 0.75 + fine(t * 6) * 0.25) * amp * taper;
    out.push({ x: a.x + dx * len * t + nx * off, y: a.y + dy * len * t + ny * off });
  }
  return out;
}

/** A wavy closed region: what an eye reads as a blob with a centre. */
export function wobblyRegion(rng: Rng, zone: Zone, padX: number, padY: number, wobble = 0.08): Pt[] {
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  const rx = zone.w / 2 - padX;
  const ry = zone.h / 2 - padY;
  const noise = smoothNoise(rng);
  const rot = rf(rng, 0, 360);
  const verts = ri(rng, 5, 7);
  const out: Pt[] = [];
  const steps = verts * 5;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const deg = rot + t * 360;
    const r = 1 + wobble * noise(t * 0.999);
    const rad = (deg * Math.PI) / 180;
    out.push({ x: cx + Math.cos(rad) * rx * r, y: cy + Math.sin(rad) * ry * r });
  }
  return out;
}

/** A wobbly rectangle-ish region (for the frame-like centre variants). */
export function wobblyQuad(rng: Rng, zone: Zone, padX: number, padY: number, amp = 10): Pt[] {
  const x0 = zone.x + padX;
  const y0 = zone.y + padY;
  const x1 = zone.x + zone.w - padX;
  const y1 = zone.y + zone.h - padY;
  const noise = smoothNoise(rng);
  const out: Pt[] = [];
  const per = 2 * ((x1 - x0) + (y1 - y0));
  const steps = 36;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    let d = t * per;
    let p: Pt;
    let n: Pt;
    if (d < x1 - x0) {
      p = { x: x0 + d, y: y0 };
      n = { x: 0, y: -1 };
    } else if ((d -= x1 - x0) < y1 - y0) {
      p = { x: x1, y: y0 + d };
      n = { x: 1, y: 0 };
    } else if ((d -= y1 - y0) < x1 - x0) {
      p = { x: x1 - d, y: y1 };
      n = { x: 0, y: 1 };
    } else {
      d -= x1 - x0;
      p = { x: x0, y: y1 - d };
      n = { x: -1, y: 0 };
    }
    const o = amp * noise(t);
    out.push({ x: p.x + n.x * o, y: p.y + n.y * o });
  }
  return out;
}

/** Arc sampled from a0 to a1 degrees. */
export function arcPath(c: Pt, r: number, a0: number, a1: number, steps = 26): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
  }
  return out;
}

export function lengthRef(kind: string, caption: string, a: Pt, b: Pt): LengthRef {
  return { kind, caption, a, b, len: Math.hypot(b.x - a.x, b.y - a.y) };
}

/** Bounding box of a point cloud, in chart space. */
export function bbox(pts: Pt[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** A fraction written the way a chartkeeper would say it, no numerals. */
export const FRACTION_WORDS: [number, number, string][] = [
  [1, 3, "a third"],
  [2, 3, "two thirds"],
  [1, 4, "a quarter"],
  [3, 4, "three quarters"],
  [2, 5, "two fifths"],
  [3, 5, "three fifths"],
  [2, 7, "two sevenths"],
  [3, 7, "three sevenths"],
  [4, 7, "four sevenths"],
  [5, 7, "five sevenths"],
  [3, 8, "three eighths"],
  [5, 8, "five eighths"],
  [4, 9, "four ninths"],
  [5, 9, "five ninths"],
  [4, 11, "four elevenths"],
  [6, 11, "six elevenths"],
  [5, 12, "five twelfths"],
  [7, 12, "seven twelfths"],
  [3, 10, "three tenths"],
  [7, 10, "seven tenths"],
  [9, 20, "nine twentieths"],
  [11, 20, "eleven twentieths"],
  [8, 15, "eight fifteenths"],
  [7, 15, "seven fifteenths"],
  [4, 13, "four thirteenths"],
  [9, 13, "nine thirteenths"],
];

export function pickFraction(rng: Rng): { f: number; words: string } {
  const [p, q, words] = FRACTION_WORDS[Math.floor(rng() * FRACTION_WORDS.length) % FRACTION_WORDS.length];
  return { f: p / q, words };
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}
