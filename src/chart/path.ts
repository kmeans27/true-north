/* SVG path string helpers. Pure, no DOM. */

import type { Pt } from "../tasks/types";

export function pathD(pts: Pt[], closed = false): string {
  if (pts.length === 0) return "";
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${f(pts[i].x)} ${f(pts[i].y)}`;
  if (closed) d += " Z";
  return d;
}

/**
 * Catmull-Rom through the points, emitted as cubic beziers. Used for
 * coastlines and the sea creatures so lines read as drawn, not plotted.
 */
export function smoothPathD(pts: Pt[], closed = false, tension = 1): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n < 3) return pathD(pts, closed);
  const at = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n];
    return pts[Math.max(0, Math.min(n - 1, i))];
  };
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  if (closed) d += " Z";
  return d;
}

export function f(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

export function rectD(x: number, y: number, w: number, h: number): string {
  return `M ${f(x)} ${f(y)} h ${f(w)} v ${f(h)} h ${f(-w)} Z`;
}
