/* ------------------------------------------------------------------
   T5 — EVEN SPACING widget

   N marks along one path. The two outer marks are already placed for
   you; only the interior is uncertain, and any handle may be dragged.
   Scoring measures the spread of the gaps, so a set that is uniformly
   displaced but perfectly even still scores well: this is a rhythm
   task, not a position task.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Value, Widget, WidgetCtx } from "./types";
import { ACCENT, caption, esc, gradeGlyph, r, stroke, TRUTH, YOU } from "../chart/ink";
import { clamp, draggable, focusable, handleMark, keyHandler, quantise, setAttrs, svgEl } from "./dom";
import { evenMarks, nearestFraction, pathSlice, pointAt, shortErrorLabel } from "./geometry";
import { smoothPathD } from "../chart/path";
import { fnv1a, mulberry32 } from "../daily/seed";
import { jitterEven } from "./opening";

type SpacingScene = Extract<Scene, { kind: "spacing" }>;

const DEG = Math.PI / 180;
const GAP = 0.012;

function tick(p: Pt, angle: number, len = 11, colour = ACCENT, w = 2, dash = ""): string {
  const nx = -Math.sin(angle * DEG) * len;
  const ny = Math.cos(angle * DEG) * len;
  const extra = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<path d="M ${r(p.x - nx)} ${r(p.y - ny)} L ${r(p.x + nx)} ${r(p.y + ny)}" ${stroke(colour, w, extra)}/>`;
}

/* ---------------------------------- static -------------------------- */

export function annotations(scene: SpacingScene): string {
  const { path, closed, caption: text } = scene;
  const d = smoothPathD(path, closed);
  const a = pointAt(path, closed, 0);
  const b = pointAt(path, closed, 1);
  const mid = pointAt(path, closed, 0.5);
  return `
    <path d="${d}" ${stroke(ACCENT, 2.2)} opacity="0.9"/>
    ${tick(a.pt, a.angle, 9)}
    ${tick(b.pt, b.angle, 9)}
    <circle cx="${r(a.pt.x)}" cy="${r(a.pt.y)}" r="3.2" style="fill:${ACCENT}"/>
    <circle cx="${r(b.pt.x)}" cy="${r(b.pt.y)}" r="3.2" style="fill:${ACCENT}"/>
    ${caption(text, mid.pt.x, mid.pt.y - 24, "middle", 12.5)}`;
}

/* ---------------------------------- widget -------------------------- */

function initialInterior(ctx: WidgetCtx, n: number): number[] {
  const rng = mulberry32(fnv1a(`open|${ctx.task.id}|${ctx.task.bankId}`));
  if (Array.isArray(ctx.initial) && ctx.initial.length === n) {
    return ctx.initial.slice(1, n - 1).map((x) => clamp(x, 0, 1));
  }
  return jitterEven(n, rng).slice(1, n - 1);
}

export function createWidget(ctx: WidgetCtx): Widget {
  const scene = ctx.task.scene as SpacingScene;
  const { path, closed, n } = scene;
  const step = ctx.task.domain.step;
  const m = Math.max(0, n - 2);

  const g = svgEl("g", { "data-widget": "spacing" });
  ctx.layer.appendChild(g);

  let interior: number[] = initialInterior(ctx, n);

  const groups: SVGGElement[] = [];
  const hits: SVGCircleElement[] = [];
  for (let k = 0; k < m; k++) {
    const hg = svgEl("g");
    hg.innerHTML = `<g>${handleMark(0, 0)}</g><circle r="88" fill="transparent"/>`;
    const hit = hg.lastElementChild as SVGCircleElement;
    g.appendChild(hg);
    groups.push(hg);
    hits.push(hit);
  }

  function values(): number[] {
    return [0, ...interior, 1];
  }

  function paint(): void {
    const all = values();
    for (let k = 0; k < m; k++) {
      const at = pointAt(path, closed, all[k + 1]);
      setAttrs(groups[k], { transform: `translate(${r(at.pt.x)} ${r(at.pt.y)})` });
    }
    ctx.onChange?.(values());
  }

  function setInterior(k: number, frac: number): void {
    const lo = (k === 0 ? 0 : interior[k - 1]) + GAP;
    const hi = (k === m - 1 ? 1 : interior[k + 1]) - GAP;
    const v = lo >= hi ? (lo + hi) / 2 : clamp(quantise(frac, step), lo, hi);
    if (v !== interior[k]) {
      interior = interior.map((x, i) => (i === k ? v : x));
      paint();
    }
  }

  for (let k = 0; k < m; k++) {
    const hit = hits[k];
    draggable(hit, ctx.svg, { onMove: (p) => setInterior(k, nearestFraction(path, closed, p)) });
    keyHandler(ctx.svg, hit, {
      onStep: (dir, big) => setInterior(k, interior[k] + dir * step * (big ? 10 : 1)),
      onHome: () => setInterior(k, 0),
      onEnd: () => setInterior(k, 1),
    });
    focusable(hit, `sounding mark, ${ordinal(k + 1)} of ${n}`);
  }
  paint();

  return {
    layer: g,
    getValue: () => values(),
    setValue: (v) => {
      if (Array.isArray(v) && v.length === n) {
        interior = v.slice(1, n - 1).map((x) => clamp(x, 0, 1));
        paint();
      }
    },
    freeze() {
      for (const hg of groups) hg.setAttribute("opacity", "0.8");
    },
    focus: () => hits[Math.floor(m / 2)]?.focus(),
    destroy: () => g.remove(),
  };
}

function ordinal(n: number): string {
  const words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
  return words[n - 1] ?? String(n);
}

/* ---------------------------------- reveal -------------------------- */

export function revealMarkup(scene: SpacingScene, value: Value, truth: Value, err: ErrorReport): string {
  const { path, closed, n } = scene;
  const v = Array.isArray(value) && value.length === n ? value : evenMarks(n);
  const t = Array.isArray(truth) && truth.length === n ? truth : evenMarks(n);
  const label = shortErrorLabel("spacing", err.e);

  const ghosts: string[] = [];
  for (const f of v) {
    const at = pointAt(path, closed, f);
    ghosts.push(tick(at.pt, at.angle, 10, YOU, 2.2, "4 5"));
  }
  const truths: string[] = [];
  for (const f of t) {
    const at = pointAt(path, closed, f);
    truths.push(tick(at.pt, at.angle, 12, TRUTH, 2.8));
    truths.push(`<circle cx="${r(at.pt.x)}" cy="${r(at.pt.y)}" r="2.8" style="fill:${TRUTH}"/>`);
  }
  const mid = pointAt(path, closed, 0.5);
  // the even ribbons between truth marks, drawn faintly so "even" is visible
  const ribbons: string[] = [];
  for (let i = 1; i < t.length; i++) {
    ribbons.push(
      `<path d="${pathSliceD(path, closed, t[i - 1], t[i])}" ${stroke(TRUTH, 6, 'stroke-linecap="round"')} opacity="0.08"/>`,
    );
  }
  return `
    <g>
      ${ribbons.join("")}
      <g class="reveal-late">${ghosts.join("")}</g>
      <g class="reveal-draw-group">${truths.join("")}</g>
      <g transform="translate(${r(mid.pt.x)} ${r(mid.pt.y - 34)})">${gradeGlyph("TRUE", 5, TRUTH)}</g>
      <text class="reveal-write" x="${r(mid.pt.x)}" y="${r(mid.pt.y - 50)}" text-anchor="middle"
        style="fill:${TRUTH}" font-size="19">${esc(label)}</text>
    </g>`;
}

function pathSliceD(path: Pt[], closed: boolean, f0: number, f1: number): string {
  const pts = pathSlice(path, closed, f0, f1, 12);
  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${r(pts[i].x)} ${r(pts[i].y)}`;
  return d;
}

/* ---------------------------------- attention ----------------------- */

export function attention(scene: SpacingScene, value: Value): { at: Pt; deg: number } {
  const { path, closed, n } = scene;
  const v = Array.isArray(value) && value.length === n ? value : evenMarks(n);
  const k = Math.floor(v.length / 2);
  const at = pointAt(path, closed, v[k]);
  return { at: at.pt, deg: at.angle - 90 };
}
