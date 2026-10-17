/* ------------------------------------------------------------------
   Task geometry and error maths — pure, side-effect free (spec 4, 6.1)

   Everything here is unit-tested. Nothing here touches the DOM.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Sense, Value } from "./types";

const DEG = Math.PI / 180;

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Signed shortest angular difference a-b, wrapped to (-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function wrap360(a: number): number {
  const d = a % 360;
  return d < 0 ? d + 360 : d;
}

/** Direction of b from a, in degrees, screen space (y down, clockwise positive). */
export function bearing(a: Pt, b: Pt): number {
  return wrap360((Math.atan2(b.y - a.y, b.x - a.x) / DEG));
}

export function polar(from: Pt, deg: number, len: number): Pt {
  return { x: from.x + Math.cos(deg * DEG) * len, y: from.y + Math.sin(deg * DEG) * len };
}

/* ---------------------------------- paths --------------------------- */

interface Seg {
  a: Pt;
  b: Pt;
  len: number;
  start: number;
}

/** Cumulative-length table for a polyline (optionally closed). */
function segments(path: Pt[], closed: boolean): { segs: Seg[]; total: number } {
  const segs: Seg[] = [];
  let total = 0;
  const n = closed ? path.length : path.length - 1;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    const len = dist(a, b);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  return { segs, total };
}

export function pathLength(path: Pt[], closed = false): number {
  return segments(path, closed).total;
}

/** Point and tangent at fraction f of a polyline's arc length. */
export function pointAt(path: Pt[], closed: boolean, f: number): { pt: Pt; angle: number } {
  const { segs, total } = segments(path, closed);
  if (segs.length === 0 || total === 0) {
    return { pt: path[0] ?? { x: 0, y: 0 }, angle: 0 };
  }
  const target = Math.max(0, Math.min(1, f)) * total;
  let seg = segs[segs.length - 1];
  for (const s of segs) {
    if (target <= s.start + s.len) {
      seg = s;
      break;
    }
  }
  const t = seg.len === 0 ? 0 : (target - seg.start) / seg.len;
  return {
    pt: { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t },
    angle: (Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x) / DEG),
  };
}

/** Sampled points of a polyline between two arc-length fractions. */
export function pathSlice(path: Pt[], closed: boolean, f0: number, f1: number, steps = 24): Pt[] {
  const lo = Math.min(f0, f1);
  const hi = Math.max(f0, f1);
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) out.push(pointAt(path, closed, lo + ((hi - lo) * i) / steps).pt);
  return out;
}

/** Project a point onto a polyline; returns the fraction along it. */
export function nearestFraction(path: Pt[], closed: boolean, p: Pt): number {
  const { segs, total } = segments(path, closed);
  if (segs.length === 0 || total === 0) return 0;
  let best = { d2: Infinity, f: 0 };
  for (const s of segs) {
    const vx = s.b.x - s.a.x;
    const vy = s.b.y - s.a.y;
    const l2 = vx * vx + vy * vy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.a.x) * vx + (p.y - s.a.y) * vy) / l2));
    const qx = s.a.x + vx * t;
    const qy = s.a.y + vy * t;
    const d2 = (p.x - qx) ** 2 + (p.y - qy) ** 2;
    if (d2 < best.d2) best = { d2, f: (s.start + s.len * t) / total };
  }
  return best.f;
}

/* ---------------------------------- stats --------------------------- */

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function iqr(xs: number[]): number {
  return quantile(xs, 0.75) - quantile(xs, 0.25);
}

/** Coefficient of variation of the gaps between ordered marks. */
export function spacingCv(marks: number[]): number {
  if (marks.length < 2) return 0;
  const s = marks.slice().sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < s.length; i++) gaps.push(s[i] - s[i - 1]);
  const m = mean(gaps);
  if (m <= 1e-9) return 1; // all handles piled on one spot: maximal scatter
  const variance = mean(gaps.map((g) => (g - m) ** 2));
  return Math.sqrt(variance) / m;
}

/** Evenly spaced marks over a span, inclusive of both endpoints. */
export function evenMarks(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i / (n - 1));
  return out;
}

/* ---------------------------------- errors -------------------------- */

function asNumber(v: Value): number {
  return typeof v === "number" ? v : 0;
}
function asPt(v: Value): Pt {
  return Array.isArray(v) ? { x: 0, y: 0 } : typeof v === "number" ? { x: 0, y: 0 } : v;
}
function asArray(v: Value): number[] {
  return Array.isArray(v) ? v : [];
}

/** Bounding-box half-diagonal of a point cloud — the centre task's unit. */
export function halfDiagonal(pts: Pt[]): number {
  if (pts.length === 0) return 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return Math.hypot(maxX - minX, maxY - minY) / 2 || 1;
}

/**
 * The error of a single task, in its natural unit, plus the signed error
 * used to build the player's bias profile over time (section 6.4).
 */
export function errorOf(
  sense: Sense,
  value: Value,
  truth: Value,
  opts: { halfDiag?: number } = {},
): ErrorReport {
  switch (sense) {
    case "length": {
      const v = asNumber(value);
      const t = asNumber(truth);
      const rel = t === 0 ? 0 : (v - t) / t;
      return {
        e: Math.abs(rel),
        unit: "%",
        signed: rel,
        text: `${pct(Math.abs(rel))} off true`,
      };
    }
    case "angle": {
      const d = angleDelta(asNumber(value), asNumber(truth));
      return { e: Math.abs(d), unit: "deg", signed: d, text: `${deg(Math.abs(d))} off true` };
    }
    case "centre": {
      const v = asPt(value);
      const t = asPt(truth);
      const hd = opts.halfDiag ?? 1;
      const e = (dist(v, t) / hd) * 100;
      return { e, unit: "%", signed: NaN, text: `${pct(e / 100)} off the mark` };
    }
    case "proportion": {
      const d = (asNumber(value) - asNumber(truth)) * 100; // percentage points
      return { e: Math.abs(d), unit: "pp", signed: d, text: `${signPp(d)} off true` };
    }
    case "spacing": {
      const cv = spacingCv(asArray(value));
      const pctScatter = cv * 100;
      return { e: cv, unit: "%", signed: NaN, text: `${pct(pctScatter / 100)} uneven` };
    }
  }
}

function trim1(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function pct(frac: number): string {
  return `${trim1(frac * 100)} per cent`;
}
function deg(d: number): string {
  return `${trim1(d)} degrees`;
}
function signPp(d: number): string {
  return `${trim1(Math.abs(d))} points`;
}

/** Compact form for the end-card grade row: "2.4°", "7.1%", "3.2 pp". */
export function shortErrorLabel(sense: Sense, e: number): string {
  switch (sense) {
    case "length":
      return `${trim1(e * 100)}%`;
    case "angle":
      return `${trim1(e)}°`;
    case "centre":
      return `${trim1(e)}%`;
    case "proportion":
      return `${trim1(e)}pp`;
    case "spacing":
      return `${trim1(e * 100)}%`;
  }
}

/** Signed, human bias phrasing for MY EYE (section 6.4). */
export function biasPhrase(sense: Sense, signed: number): string | null {
  if (!Number.isFinite(signed) || signed === 0) return null;
  const over = signed > 0;
  const mag = Math.abs(signed);
  switch (sense) {
    case "length":
      return `you ${over ? "run long" : "fall short"} by about ${trim1(mag * 100)} per cent`;
    case "angle":
      return `you tilt ${over ? "clockwise" : "anticlockwise"} by about ${trim1(mag)} degrees`;
    case "proportion":
      return `you ${over ? "overshoot" : "undershoot"} by about ${trim1(mag)} points`;
    default:
      return null;
  }
}
