/* ------------------------------------------------------------------
   T2 — ANGLE widget (bisect / perpendicular / copy)

   One needle, pivoting about one vertex. Dragging follows the pointer
   round the vertex, quantised to a quarter of a degree; a drag that
   lasts longer than 800 ms breathes down to a twentieth of a degree,
   which is where the last few tenths live.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Value, Widget, WidgetCtx } from "./types";
import { caption, endTicks, esc, gradeGlyph, I, r, SOFT, stroke, TRUTH, YOU } from "../chart/ink";
import { draggable, focusable, handleMark, hitRing, keyHandler, quantise, setAttrs, svgEl, valueIsNum } from "./dom";
import { polar as pointOnCircle, wrap360 as wrapDeg, shortErrorLabel } from "./geometry";

type AngleScene = Extract<Scene, { kind: "angle" }>;

/* ---------------------------------- static -------------------------- */

export function annotations(scene: AngleScene): string {
  const { vertex, arms, wall, source, armLength } = scene;
  const out: string[] = [];
  for (const deg of arms) {
    const p = pointOnCircle(vertex, deg, armLength);
    out.push(`<path d="M ${r(vertex.x)} ${r(vertex.y)} L ${r(p.x)} ${r(p.y)}" ${stroke(I, 2.4)}/>`);
  }
  if (arms.length === 2) {
    // the interior of the channel, so which side to split is never in doubt
    const a0 = arms[0];
    const a1 = arms[1];
    const half = wrapDeg(a1 - a0) > 180 ? wrapDeg(a0 - a1) : wrapDeg(a1 - a0);
    const arcR = armLength * 0.46;
    out.push(arcBetween(vertex, a0, half, arcR));
  }
  if (wall) {
    out.push(`<path d="M ${r(wall[0].x)} ${r(wall[0].y)} L ${r(wall[1].x)} ${r(wall[1].y)}" ${stroke(I, 3)}/>`);
    out.push(endTicks(wall[0], wall[1], 8, SOFT));
  }
  if (source) {
    const s0 = pointOnCircle(source.vertex, source.arms[0], source.armLength);
    const s1 = pointOnCircle(source.vertex, source.arms[1], source.armLength);
    out.push(
      `<path d="M ${r(source.vertex.x)} ${r(source.vertex.y)} L ${r(s0.x)} ${r(s0.y)}" ${stroke(SOFT, 2)}/>`,
      `<path d="M ${r(source.vertex.x)} ${r(source.vertex.y)} L ${r(s1.x)} ${r(s1.y)}" ${stroke(SOFT, 2)}/>`,
      arcBetween(source.vertex, source.arms[0], wrapDeg(source.arms[1] - source.arms[0]), source.armLength * 0.5, SOFT),
      caption(source.caption, source.vertex.x, source.vertex.y + source.armLength + 24, "middle", 12),
    );
  }
  out.push(
    `<circle cx="${r(vertex.x)}" cy="${r(vertex.y)}" r="3.6" style="fill:${I}"/>`,
    `<circle cx="${r(vertex.x)}" cy="${r(vertex.y)}" r="8" style="fill:none;stroke:${SOFT}" stroke-width="0.9"/>`,
  );
  return out.join("");
}

function arcBetween(from: Pt, startDeg: number, spanDeg: number, rad: number, colour = "var(--accent)"): string {
  const steps = Math.max(4, Math.round(Math.abs(spanDeg) / 12));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pointOnCircle(from, startDeg + (spanDeg * i) / steps, rad);
    d += `${i === 0 ? "M" : "L"} ${r(p.x)} ${r(p.y)} `;
  }
  return `<path d="${d.trim()}" fill="none" style="stroke:${colour}" stroke-width="1.2" opacity="0.6"/>`;
}

/* ---------------------------------- widget -------------------------- */

export function createWidget(ctx: WidgetCtx): Widget {
  const scene = ctx.task.scene as AngleScene;
  const step = ctx.task.domain.step;
  const fine = 0.05;
  const { vertex, armLength, start } = scene;

  const g = svgEl("g", { "data-widget": "angle" });
  const needle = svgEl("path", { fill: "none", style: `stroke:${YOU}`, "stroke-width": 3.2, "stroke-linecap": "round" });
  const head = svgEl("g");
  const knob = svgEl("g");
  const hit = svgEl("circle", { fill: "transparent" });
  g.append(needle, head, knob, hit);
  ctx.layer.appendChild(g);

  let value = valueIsNum(ctx.initial) ? wrapDeg(ctx.initial) : start;

  function paint(): void {
    const tip = pointOnCircle(vertex, value, armLength);
    setAttrs(needle, { d: `M ${r(vertex.x)} ${r(vertex.y)} L ${r(tip.x)} ${r(tip.y)}` });
    head.innerHTML = `<path d="M 0 -12 L 7 8 L 0 4 L -7 8 Z" style="fill:${YOU}"
      transform="translate(${r(tip.x)} ${r(tip.y)}) rotate(${r(value + 90)})"/>`;
    setAttrs(knob, { transform: `translate(${r(tip.x - Math.cos((value * Math.PI) / 180) * 16)} ${r(tip.y - Math.sin((value * Math.PI) / 180) * 16)})` });
    knob.innerHTML = handleMark(0, 0);
    hitRing(hit, tip.x, tip.y);
    ctx.onChange?.(value);
  }

  function set(next: number, granularity = step): void {
    const v = wrapDeg(quantise(wrapDeg(next), granularity));
    if (v !== value) {
      value = v;
      paint();
    }
  }

  let pointerStartDeg = 0;
  let valueStart = 0;
  let dragStart = 0;
  draggable(hit, ctx.svg, {
    onStart(p) {
      pointerStartDeg = angleTo(vertex, p);
      valueStart = value;
      dragStart = performance.now();
    },
    onMove(p) {
      const now = performance.now();
      const fine2 = now - dragStart > 800;
      const delta = shortest(wrapDeg(angleTo(vertex, p)) - pointerStartDeg);
      set(valueStart + delta, fine2 ? fine : step);
    },
  });
  keyHandler(ctx.svg, hit, {
    onStep(dir, big) {
      set(value + dir * step * (big ? 10 : 1));
    },
    onHome: () => set(scene.start),
  });
  focusable(hit, "angle needle");
  paint();

  return {
    layer: g,
    getValue: () => value,
    setValue: (v) => {
      if (valueIsNum(v)) set(v);
    },
    freeze() {
      knob.setAttribute("opacity", "0.8");
      head.setAttribute("opacity", "0.8");
      needle.setAttribute("stroke-width", "2.6");
    },
    focus: () => hit.focus(),
    destroy: () => g.remove(),
  };
}

function angleTo(from: Pt, to: Pt): number {
  return wrapDeg((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI);
}

function shortest(d: number): number {
  let v = d % 360;
  if (v > 180) v -= 360;
  if (v < -180) v += 360;
  return v;
}

/* ---------------------------------- reveal -------------------------- */

export function revealMarkup(scene: AngleScene, value: Value, truth: Value, err: ErrorReport): string {
  const v = valueIsNum(value) ? value : 0;
  const t = valueIsNum(truth) ? truth : 0;
  const { vertex, armLength } = scene;
  const vtip = pointOnCircle(vertex, v, armLength);
  const ttip = pointOnCircle(vertex, t, armLength * 1.06);
  const ahead = pointOnCircle(vertex, t, armLength * 1.3);
  const delta = shortest(v - t);
  const arcR = armLength * 0.72;
  const arc = deltaArc(vertex, t, delta, arcR);
  return `
    <g>
      <path d="M ${r(vertex.x)} ${r(vertex.y)} L ${r(vtip.x)} ${r(vtip.y)}" ${stroke(YOU, 2.4)} stroke-dasharray="10 8"/>
      <path class="reveal-draw" style="--len:${r(armLength + 30)};stroke:${TRUTH}"
        d="M ${r(vertex.x)} ${r(vertex.y)} L ${r(ttip.x)} ${r(ttip.y)}" fill="none" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M 0 -12 L 7 8 L 0 4 L -7 8 Z" style="fill:${TRUTH}" transform="translate(${r(ttip.x)} ${r(ttip.y)}) rotate(${r(t + 90)})"/>
      <path d="${arc}" fill="none" style="stroke:${YOU}" stroke-width="2" opacity="0.75"/>
      <path d="M ${r(ttip.x)} ${r(ttip.y)} L ${r(vtip.x)} ${r(vtip.y)}" ${stroke(YOU, 1.4)} stroke-dasharray="4 5" opacity="0.7"/>
      <g transform="translate(${r(ahead.x)} ${r(ahead.y)})">${gradeGlyph("TRUE", 5, TRUTH)}</g>
      <text class="reveal-write" x="${r(ahead.x)}" y="${r(ahead.y + 26)}" text-anchor="middle"
        style="fill:${TRUTH}" font-size="19">${esc(shortErrorLabel("angle", err.e))}</text>
    </g>`;
}

function deltaArc(from: Pt, startDeg: number, delta: number, rad: number): string {
  const steps = Math.max(3, Math.round(Math.abs(delta) / 10));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pointOnCircle(from, startDeg + (delta * i) / steps, rad);
    d += `${i === 0 ? "M" : "L"} ${r(p.x)} ${r(p.y)} `;
  }
  return d.trim();
}

export function attention(scene: AngleScene, value: Value): { at: Pt; deg: number } {
  const v = valueIsNum(value) ? value : 0;
  const tip = pointOnCircle(scene.vertex, v, scene.armLength * 0.86);
  return { at: tip, deg: v - 90 };
}
