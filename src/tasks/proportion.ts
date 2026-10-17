/* ------------------------------------------------------------------
   T4 — PROPORTION widget

   A handle slides along a visible, deliberately crooked path (a coast,
   a river, a road) and must be set at the stated fraction of its
   length. Because the path bends, the fraction cannot be walked off
   with a straight edge: this is the hardest sense, and the natural
   home of a SURVEY bluff.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Value, Widget, WidgetCtx } from "./types";
import { ACCENT, buoy, caption, esc, gradeGlyph, r, stroke, SOFT, TRUTH, YOU } from "../chart/ink";
import { clamp, draggable, focusable, handleMark, hitRing, keyHandler, quantise, setAttrs, svgEl, valueIsNum } from "./dom";
import { nearestFraction, pathSlice, pointAt, shortErrorLabel } from "./geometry";
import { pathD, smoothPathD } from "../chart/path";

type ProportionScene = Extract<Scene, { kind: "proportion" }>;

const DEG = Math.PI / 180;

/** A tick across the path, perpendicular to the tangent. */
function tick(p: Pt, angle: number, len = 10, colour = ACCENT, w = 1.9): string {
  const nx = -Math.sin(angle * DEG) * len;
  const ny = Math.cos(angle * DEG) * len;
  return `<path d="M ${r(p.x - nx)} ${r(p.y - ny)} L ${r(p.x + nx)} ${r(p.y + ny)}" ${stroke(colour, w)}/>`;
}

/* ---------------------------------- static -------------------------- */

export function annotations(scene: ProportionScene): string {
  const { path, closed, caption: text } = scene;
  const d = smoothPathD(path, closed);
  const start = pointAt(path, closed, 0);
  const end = pointAt(path, closed, 1);
  const mid = pointAt(path, closed, 0.5);
  const capOff = 22;
  const capAt = { x: mid.pt.x + Math.cos(mid.angle * DEG) * 0, y: mid.pt.y - capOff };
  return `
    <path d="${d}" ${stroke(ACCENT, 2.4)} opacity="0.9"/>
    <path d="${d}" ${stroke(SOFT, 0.9)} opacity="0.3" transform="translate(0 3)"/>
    ${tick(start.pt, start.angle)}
    ${tick(end.pt, end.angle)}
    ${buoy(start.pt.x, start.pt.y)}
    ${caption(text, capAt.x, capAt.y, "middle", 12.5)}`;
}

/* ---------------------------------- widget -------------------------- */

export function createWidget(ctx: WidgetCtx): Widget {
  const scene = ctx.task.scene as ProportionScene;
  const { path, closed } = scene;
  const step = ctx.task.domain.step;

  const g = svgEl("g", { "data-widget": "proportion" });
  const guide = svgEl("path", {
    fill: "none",
    style: `stroke:${YOU}`,
    "stroke-width": 2.6,
    "stroke-linecap": "round",
    "stroke-dasharray": "7 6",
  });
  const knob = svgEl("g");
  const hit = svgEl("circle", { fill: "transparent" });
  knob.innerHTML = handleMark(0, 0);
  g.append(guide, knob, hit);
  ctx.layer.appendChild(g);

  let value = valueIsNum(ctx.initial) ? clamp(ctx.initial, 0, 1) : clamp(scene.start, 0, 1);

  function paint(): void {
    const at = pointAt(path, closed, value);
    const nx = -Math.sin(at.angle * DEG) * 15;
    const ny = Math.cos(at.angle * DEG) * 15;
    setAttrs(guide, { d: `M ${r(at.pt.x - nx)} ${r(at.pt.y - ny)} L ${r(at.pt.x + nx)} ${r(at.pt.y + ny)}` });
    setAttrs(knob, { transform: `translate(${r(at.pt.x)} ${r(at.pt.y)})` });
    hitRing(hit, at.pt.x, at.pt.y);
    ctx.onChange?.(value);
  }

  function set(next: number): void {
    const v = clamp(quantise(next, step), 0, 1);
    if (v !== value) {
      value = v;
      paint();
    }
  }

  draggable(hit, ctx.svg, {
    onMove(p) {
      set(nearestFraction(path, closed, p));
    },
  });
  keyHandler(ctx.svg, hit, {
    onStep(dir, big) {
      set(value + dir * step * (big ? 10 : 1));
    },
    onHome: () => set(0),
    onEnd: () => set(1),
  });
  focusable(hit, "the mark along the path");
  paint();

  return {
    layer: g,
    getValue: () => value,
    setValue: (v) => {
      if (valueIsNum(v)) set(v);
    },
    freeze() {
      knob.setAttribute("opacity", "0.8");
      guide.setAttribute("opacity", "0.8");
    },
    focus: () => hit.focus(),
    destroy: () => g.remove(),
  };
}

/* ---------------------------------- reveal -------------------------- */

export function revealMarkup(scene: ProportionScene, value: Value, truth: Value, err: ErrorReport): string {
  const v = valueIsNum(value) ? value : 0;
  const t = valueIsNum(truth) ? truth : 0;
  const { path, closed } = scene;
  const pv = pointAt(path, closed, v);
  const pt = pointAt(path, closed, t);
  const shade = pathD(pathSlice(path, closed, v, t, 28), false);
  const label = shortErrorLabel("proportion", err.e);
  const side = t >= v ? 1 : -1;
  return `
    <g>
      <path d="${shade}" fill="none" style="stroke:${YOU}" stroke-width="9" stroke-linecap="round" opacity="0.22"/>
      <path d="${shade}" fill="none" style="stroke:${YOU}" stroke-width="2.4" stroke-linecap="round" opacity="0.6" stroke-dasharray="2 7"/>
      ${tick(pv.pt, pv.angle, 12, YOU, 2.2)}
      <g class="reveal-draw-group">
        ${tick(pt.pt, pt.angle, 13, TRUTH, 3)}
        <path d="M ${r(pt.pt.x)} ${r(pt.pt.y)} l 0 0" ${stroke(TRUTH, 3)}/>
        <circle cx="${r(pt.pt.x)}" cy="${r(pt.pt.y)}" r="3.4" style="fill:${TRUTH}"/>
      </g>
      <g transform="translate(${r(pt.pt.x)} ${r(pt.pt.y - 30)})">${gradeGlyph("TRUE", 5, TRUTH)}</g>
      <text class="reveal-write" x="${r(pt.pt.x + side * 14)}" y="${r(pt.pt.y - 44)}"
        text-anchor="${side > 0 ? "start" : "end"}" style="fill:${TRUTH}" font-size="19">${esc(label)}</text>
    </g>`;
}

/* ---------------------------------- attention ----------------------- */

export function attention(scene: ProportionScene, value: Value): { at: Pt; deg: number } {
  const v = valueIsNum(value) ? value : 0;
  const at = pointAt(scene.path, scene.closed, v);
  return { at: at.pt, deg: at.angle - 90 };
}
