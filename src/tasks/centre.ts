/* ------------------------------------------------------------------
   T3 — CENTRE widget

   A sighting cross on open water. The region is drawn, its centre is
   not: the frame wobbles, the panel is not a rectangle, and the eye
   has nothing to measure with but itself.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Value, Widget, WidgetCtx } from "./types";
import { caption, esc, gradeGlyph, r, stroke, TRUTH, YOU } from "../chart/ink";
import { draggable, focusable, hitRing, keyHandler, quantise, setAttrs, svgEl, valueIsPt } from "./dom";
import { halfDiagonal, shortErrorLabel } from "./geometry";
import { smoothPathD } from "../chart/path";

type CentreScene = Extract<Scene, { kind: "centre" }>;

function box(region: Pt[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number; cx: number; cy: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of region) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/* ---------------------------------- static -------------------------- */

export function annotations(scene: CentreScene): string {
  const { region, caption: text, variant } = scene;
  const out: string[] = [];
  if (variant !== "frame" && variant !== "inner") {
    out.push(`<path d="${smoothPathD(region, true)}" style="fill:${TRUTH}" opacity="0.045"/>`);
    out.push(`<path d="${smoothPathD(region, true)}" ${stroke("var(--accent)", 2)}/>`);
  } else {
    // the frame itself is the region: tint its rule rather than redraw it
    out.push(`<path d="${smoothPathD(region, true)}" ${stroke("var(--accent)", 1.2)} opacity="0.5"/>`);
  }
  const b = box(region);
  out.push(caption(text, b.cx, b.minY - 18, "middle", 13));
  return out.join("");
}

/* ---------------------------------- widget -------------------------- */

export function createWidget(ctx: WidgetCtx): Widget {
  const scene = ctx.task.scene as CentreScene;
  const b = box(scene.region);
  const stepX = Math.max(1.6, b.w * ctx.task.domain.step);
  const stepY = Math.max(1.6, b.h * ctx.task.domain.step);

  const g = svgEl("g", { "data-widget": "centre" });
  const cross = svgEl("g");
  const knob = svgEl("g");
  const hit = svgEl("circle", { fill: "transparent" });
  g.append(cross, knob, hit);
  ctx.layer.appendChild(g);

  let value: Pt = valueIsPt(ctx.initial) ? { ...ctx.initial } : { ...scene.start };
  const arm = Math.min(b.w, b.h) * 0.13;

  function paint(): void {
    cross.innerHTML = `<path d="M ${r(value.x - arm)} ${r(value.y)} L ${r(value.x + arm)} ${r(value.y)}
      M ${r(value.x)} ${r(value.y - arm)} L ${r(value.x)} ${r(value.y + arm)}"
      fill="none" style="stroke:${YOU}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="${r(value.x)}" cy="${r(value.y)}" r="${r(arm * 0.52)}" fill="none"
        style="stroke:${YOU}" stroke-width="1.6" stroke-dasharray="5 4" opacity="0.9"/>`;
    knob.innerHTML = "";
    setAttrs(knob, { transform: `translate(${r(value.x)} ${r(value.y)})` });
    hitRing(hit, value.x, value.y);
    ctx.onChange?.(value);
  }

  function set(next: Pt, sx = stepX, sy = stepY): void {
    const v = {
      x: Math.min(b.maxX, Math.max(b.minX, quantise(next.x, sx))),
      y: Math.min(b.maxY, Math.max(b.minY, quantise(next.y, sy))),
    };
    if (v.x !== value.x || v.y !== value.y) {
      value = v;
      paint();
    }
  }

  draggable(hit, ctx.svg, {
    onMove(p) {
      set(p, 1, 1);
    },
  });
  keyHandler(ctx.svg, hit, {
    onStep(dir, big) {
      const k = big ? 4 : 1;
      // horizontal by default; up/down handled by the vertical arrows
      set({ x: value.x + dir * stepX * k, y: value.y }, stepX * k, stepY * k);
    },
  });
  // vertical arrows need their own mapping, so listen directly
  const vertical = (ev: KeyboardEvent) => {
    if (ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
    const dir = ev.key === "ArrowUp" ? -1 : 1;
    const k = ev.shiftKey ? 4 : 1;
    set({ x: value.x, y: value.y + dir * stepY * k }, stepX * k, stepY * k);
    ev.preventDefault();
  };
  hit.addEventListener("keydown", vertical);
  focusable(hit, "sighting mark");
  paint();

  return {
    layer: g,
    getValue: () => ({ ...value }),
    setValue: (v) => {
      if (valueIsPt(v)) set(v, 1, 1);
    },
    freeze() {
      cross.setAttribute("opacity", "0.8");
    },
    focus: () => hit.focus(),
    destroy: () => {
      hit.removeEventListener("keydown", vertical);
      g.remove();
    },
  };
}

/* ---------------------------------- reveal -------------------------- */

export function revealMarkup(scene: CentreScene, value: Value, truth: Value, err: ErrorReport): string {
  const v = valueIsPt(value) ? value : scene.start;
  const t = valueIsPt(truth) ? truth : scene.start;
  const hd = halfDiagonal(scene.region);
  const arm = Math.min(box(scene.region).w, box(scene.region).h) * 0.16;
  const label = shortErrorLabel("centre", err.e);
  return `
    <g>
      <path d="M ${r(v.x - arm)} ${r(v.y)} L ${r(v.x + arm)} ${r(v.y)} M ${r(v.x)} ${r(v.y - arm)} L ${r(v.x)} ${r(v.y + arm)}"
        ${stroke(YOU, 2.2)} stroke-dasharray="9 7"/>
      <path d="M ${r(v.x)} ${r(v.y)} L ${r(t.x)} ${r(t.y)}" ${stroke(YOU, 1.5)} stroke-dasharray="5 6" opacity="0.85"/>
      <g class="reveal-draw-group">
        <path d="M ${r(t.x - arm)} ${r(t.y)} L ${r(t.x + arm)} ${r(t.y)} M ${r(t.x)} ${r(t.y - arm)} L ${r(t.x)} ${r(t.y + arm)}"
          ${stroke(TRUTH, 2.8)}/>
        <circle cx="${r(t.x)}" cy="${r(t.y)}" r="${r(arm * 0.5)}" fill="none" style="stroke:${TRUTH}" stroke-width="2"/>
        <circle cx="${r(t.x)}" cy="${r(t.y)}" r="3.4" style="fill:${TRUTH}"/>
      </g>
      <g transform="translate(${r(t.x + arm + 14)} ${r(t.y - arm - 6)})">${gradeGlyph("TRUE", 5, TRUTH)}</g>
      <text class="reveal-write" x="${r(t.x + arm + 14)}" y="${r(t.y - arm + 20)}" style="fill:${TRUTH}" font-size="19">${esc(label)}</text>
      ${caption(scene.caption, t.x, t.y + hd * 0.9 + 22, "middle", 12)}
    </g>`;
}

export function attention(scene: CentreScene, value: Value): { at: Pt; deg: number } {
  const v = valueIsPt(value) ? value : scene.start;
  return { at: v, deg: 0 };
}
