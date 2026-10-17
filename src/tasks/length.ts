/* ------------------------------------------------------------------
   T1 — LENGTH RATIO widget

   The bar is drawn at true scale along a full-width band; the reference
   is a real span elsewhere on the chart, flagged with end ticks and a
   quiet caption so there is never any doubt which two features are
   being compared.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Value, Widget, WidgetCtx } from "./types";
import { caption, endTicks, esc, gradeGlyph, I, r, SOFT, stroke, YOU, TRUTH } from "../chart/ink";
import { clamp, dot, draggable, focusable, handleMark, hitRing, keyHandler, quantise, setAttrs, svgEl, valueIsNum } from "./dom";
import { shortErrorLabel } from "./geometry";

type LengthScene = Extract<Scene, { kind: "length" }>;

/* ---------------------------------- static -------------------------- */

export function annotations(scene: LengthScene): string {
  const { ref, origin, dir, maxLen } = scene;
  const onFrame = ref.kind.startsWith("frame");
  const mid = { x: (ref.a.x + ref.b.x) / 2, y: (ref.a.y + ref.b.y) / 2 };
  const centre = { x: 500, y: 625 };
  // push a frame reference's dimension line inwards, so it reads as a
  // measurement of the frame rather than a second frame
  const nx = -(ref.b.y - ref.a.y);
  const ny = ref.b.x - ref.a.x;
  const L = Math.hypot(nx, ny) || 1;
  const towardCentre = Math.sign((centre.x - mid.x) * nx + (centre.y - mid.y) * ny) || 1;
  const off = onFrame ? 16 * towardCentre : 0;
  const a: Pt = { x: ref.a.x + (nx / L) * off, y: ref.a.y + (ny / L) * off };
  const b: Pt = { x: ref.b.x + (nx / L) * off, y: ref.b.y + (ny / L) * off };
  const capOff = (onFrame ? 20 : -20) * towardCentre;
  const capAt = { x: (a.x + b.x) / 2 + (nx / L) * capOff, y: (a.y + b.y) / 2 + (ny / L) * capOff };

  const end = { x: origin.x + dir.x * maxLen, y: origin.y + dir.y * maxLen };
  return `
    <path d="M ${r(a.x)} ${r(a.y)} L ${r(b.x)} ${r(b.y)}" ${stroke("var(--accent)", 1.5)} opacity="0.75"/>
    ${endTicks(a, b, 10)}
    <path d="M ${r(origin.x)} ${r(origin.y)} L ${r(end.x)} ${r(end.y)}" ${stroke(SOFT, 1)}
      stroke-dasharray="9 13" opacity="0.5"/>
    <path d="M ${r(origin.x)} ${r(origin.y - 13)} L ${r(origin.x)} ${r(origin.y + 13)}" ${stroke(I, 2.2)}/>
    ${caption(ref.caption, capAt.x, capAt.y, "middle", 12.5)}`;
}

/* ---------------------------------- widget -------------------------- */

export function createWidget(ctx: WidgetCtx): Widget {
  const scene = ctx.task.scene as LengthScene;
  const { origin, dir, ref } = scene;
  const minRatio = ctx.task.domain.min;
  const maxRatio = ctx.task.domain.max;
  const refLen = ref.len;
  const step = ctx.task.domain.step;

  const g = svgEl("g", { "data-widget": "length" });
  const bar = svgEl("path", { fill: "none", style: `stroke:${TRUTH}`, "stroke-width": 3.4, "stroke-linecap": "round" });
  const tick = svgEl("path", { fill: "none", style: `stroke:${TRUTH}`, "stroke-width": 2.6, "stroke-linecap": "round" });
  const knob = svgEl("g");
  const hit = svgEl("circle", { fill: "transparent" });
  knob.innerHTML = handleMark(0, 0);
  g.append(bar, tick, knob, hit);
  ctx.layer.appendChild(g);

  let value = valueIsNum(ctx.initial) ? clamp(ctx.initial, minRatio, maxRatio) : (minRatio + maxRatio) / 2;
  const px = (ratio: number) => ratio * refLen;

  function paint(): void {
    const len = px(value);
    const ex = origin.x + dir.x * len;
    const ey = origin.y + dir.y * len;
    setAttrs(bar, { d: `M ${r(origin.x)} ${r(origin.y)} L ${r(ex)} ${r(ey)}` });
    const nx = -dir.y * 15;
    const ny = dir.x * 15;
    setAttrs(tick, { d: `M ${r(ex - nx)} ${r(ey - ny)} L ${r(ex + nx)} ${r(ey + ny)}` });
    setAttrs(knob, { transform: `translate(${r(ex)} ${r(ey)})` });
    hitRing(hit, ex, ey);
    ctx.onChange?.(value);
  }

  function set(next: number): void {
    const v = clamp(quantise(next, step), minRatio, maxRatio);
    if (v !== value) {
      value = v;
      paint();
    }
  }

  let startValue = value;
  draggable(hit, ctx.svg, {
    onStart() {
      startValue = value;
    },
    onMove(p) {
      const t = dot({ x: p.x - origin.x, y: p.y - origin.y }, dir);
      set(t / refLen);
    },
  });
  keyHandler(ctx.svg, hit, {
    onStep(dir2, big) {
      set(value + dir2 * step * (big ? 10 : 1));
      void startValue;
    },
    onHome: () => set(minRatio),
    onEnd: () => set(maxRatio),
  });
  focusable(hit, "bar handle");
  paint();

  return {
    layer: g,
    getValue: () => value,
    setValue: (v) => {
      if (valueIsNum(v)) set(v);
    },
    freeze() {
      knob.innerHTML = anchorScribble();
      knob.setAttribute("opacity", "0.75");
    },
    focus: () => hit.focus(),
    destroy: () => g.remove(),
  };
}

/** On SIGN the handle becomes a small hand-drawn anchor. */
function anchorScribble(): string {
  return `<path d="M -1 -14 v 22 M -9 -6 h 16 M -12 4 q 3 12 12 12 q 9 0 12 -12"
    fill="none" style="stroke:${YOU}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="-1" cy="-16" r="3.4" style="fill:none;stroke:${YOU}" stroke-width="2.2"/>`;
}

/* ---------------------------------- reveal -------------------------- */

export function revealMarkup(scene: LengthScene, value: Value, truth: Value, err: ErrorReport): string {
  const { origin, dir, ref } = scene;
  const vr = valueIsNum(value) ? value : 0;
  const tr = valueIsNum(truth) ? truth : 0;
  const vlen = vr * ref.len;
  const tlen = tr * ref.len;
  const vex = origin.x + dir.x * vlen;
  const vey = origin.y + dir.y * vlen;
  const tex = origin.x + dir.x * tlen;
  const tey = origin.y + dir.y * tlen;
  const angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  const label = shortErrorLabel("length", err.e);
  return `
    <g>
      <path d="M ${r(origin.x)} ${r(origin.y)} L ${r(vex)} ${r(vey)}" ${stroke(YOU, 2.6)} stroke-dasharray="10 8" opacity="0.9"/>
      <path class="reveal-draw" style="--len:${r(tlen + 40)};stroke:${TRUTH}" d="M ${r(origin.x - 20 * dir.x)} ${r(origin.y - 20 * dir.y)} L ${r(tex)} ${r(tey)}"
        fill="none" stroke-width="3.6" stroke-linecap="round"/>
      <g transform="translate(${r(tex)} ${r(tey)})">
        <circle r="5.5" style="fill:none;stroke:${TRUTH}" stroke-width="2.2"/>
        <g class="reveal-late" transform="rotate(${angle})">
          ${gradeGlyph("TRUE", 4.6, TRUTH)}
        </g>
      </g>
      <text class="reveal-write" x="${r(tex + dir.x * 16)}" y="${r(tey - 22)}" text-anchor="${dir.x > 0 ? "end" : "start"}"
        style="fill:${TRUTH}" font-size="19">${esc(label)}</text>
    </g>`;
}

/* ---------------------------------- attention ----------------------- */

export function attention(scene: LengthScene, value: Value): { at: Pt; deg: number } {
  const len = (valueIsNum(value) ? value : 0) * scene.ref.len;
  return { at: { x: scene.origin.x + scene.dir.x * len, y: scene.origin.y + scene.dir.y * len }, deg: 90 };
}
