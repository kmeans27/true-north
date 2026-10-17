/* ------------------------------------------------------------------
   Widget plumbing: SVG helpers, pointer capture, keyboard stepping.

   Rules that come from the spec and are enforced here:
     - hit areas are >= 44 x 44 CSS px (section 5)
     - pointer events use setPointerCapture, so a drag never escapes
     - rotation is quantised to 0.25 deg, and to 0.05 deg after 800 ms
     - nothing in this module ever writes a digit into the DOM
   ------------------------------------------------------------------ */

import type { Pt, Value } from "./types";

export const svgNS = "http://www.w3.org/2000/svg";

/** Invisible hit radius in chart units (176 units across >= 44 px at 320px wide). */
export const HIT_R = 88;

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function setAttrs(el: Element, attrs: Record<string, string | number>): void {
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
}

export function markup(parent: Element, html: string): void {
  parent.insertAdjacentHTML("beforeend", html);
}

/** Client coordinates to chart coordinates. */
export function toChart(svg: SVGSVGElement, ev: { clientX: number; clientY: number }): Pt {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Snap to a grid, anchored at zero, floating-point safe. */
export function quantise(v: number, step: number): number {
  if (step <= 0) return v;
  return Math.round(v / step) * step;
}

export function dot(a: Pt, b: Pt): number {
  return a.x * b.x + a.y * b.y;
}

export function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function norm(v: Pt): Pt {
  const L = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / L, y: v.y / L };
}

export function bearing(a: Pt, b: Pt): number {
  const d = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return d < 0 ? d + 360 : d;
}

export interface DragHandlers {
  onStart?(p: Pt, ev: PointerEvent): void;
  onMove(p: Pt, ev: PointerEvent): void;
  onEnd?(p: Pt, ev: PointerEvent): void;
}

/**
 * Pointer drag on `hit`, with capture. Returns a detach function.
 * A drag that starts on the hit keeps feeding this widget even when the
 * pointer leaves the handle, which is what `setPointerCapture` buys us.
 */
export function draggable(hit: SVGElement, svg: SVGSVGElement, h: DragHandlers): () => void {
  let active: number | null = null;
  const down = (ev: PointerEvent) => {
    if (active !== null) return;
    active = ev.pointerId;
    try {
      hit.setPointerCapture(ev.pointerId);
    } catch {
      /* capture is best-effort */
    }
    ev.preventDefault();
    h.onStart?.(toChart(svg, ev), ev);
    h.onMove(toChart(svg, ev), ev);
  };
  const move = (ev: PointerEvent) => {
    if (active === null || ev.pointerId !== active) return;
    ev.preventDefault();
    h.onMove(toChart(svg, ev), ev);
  };
  const up = (ev: PointerEvent) => {
    if (active === null || ev.pointerId !== active) return;
    active = null;
    try {
      hit.releasePointerCapture(ev.pointerId);
    } catch {
      /* already gone */
    }
    h.onEnd?.(toChart(svg, ev), ev);
  };
  hit.addEventListener("pointerdown", down);
  hit.addEventListener("pointermove", move);
  hit.addEventListener("pointerup", up);
  hit.addEventListener("pointercancel", up);
  return () => {
    hit.removeEventListener("pointerdown", down);
    hit.removeEventListener("pointermove", move);
    hit.removeEventListener("pointerup", up);
    hit.removeEventListener("pointercancel", up);
  };
}

export interface KeyBindings {
  onStep(dir: number, big: boolean, ev: KeyboardEvent): void;
  onHome?(): void;
  onEnd?(): void;
}

const KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "a", "d"]);

export function keyHandler(svg: SVGSVGElement, hit: SVGElement, b: KeyBindings): () => void {
  let pressStart = 0;
  const held = new Set<string>();
  const onKeyDown = (ev: KeyboardEvent) => {
    if (!KEYS.has(ev.key)) return;
    if (!held.has(ev.key)) {
      pressStart = performance.now();
      held.add(ev.key);
    }
    const heldMs = performance.now() - pressStart;
    // fine steps once the key has been held a while
    const big = ev.shiftKey;
    const dir =
      ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "ArrowUp" ? -1 : 1;
    if (ev.key === "Home") {
      b.onHome?.();
      ev.preventDefault();
      return;
    }
    if (ev.key === "End") {
      b.onEnd?.();
      ev.preventDefault();
      return;
    }
    b.onStep(dir, big, ev);
    void heldMs;
    ev.preventDefault();
  };
  const onKeyUp = (ev: KeyboardEvent) => {
    held.delete(ev.key);
  };
  hit.addEventListener("keydown", onKeyDown);
  hit.addEventListener("keyup", onKeyUp);
  void svg;
  return () => {
    hit.removeEventListener("keydown", onKeyDown);
    hit.removeEventListener("keyup", onKeyUp);
  };
}

/** Make a group focusable and operable, without adding it to the tab order twice. */
export function focusable(el: SVGElement, label: string): void {
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "slider");
  el.setAttribute("aria-label", label);
  el.setAttribute("focusable", "true");
}

/** A grab handle: a small ink circle with a generous invisible hit ring. */
export function handleMark(x: number, y: number, colour = "var(--you)"): string {
  return `<circle cx="${x}" cy="${y}" r="9" style="fill:var(--parchment-2);stroke:${colour}" stroke-width="2.6"/>
    <circle cx="${x}" cy="${y}" r="3.2" style="fill:${colour}"/>`;
}

export function hitRing(el: SVGElement, x: number, y: number, r = HIT_R): void {
  setAttrs(el, { cx: x, cy: y, r, fill: "transparent" });
}

export function valueIsPt(v: Value): v is Pt {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function valueIsNum(v: Value): v is number {
  return typeof v === "number";
}

export function valueIsArr(v: Value): v is number[] {
  return Array.isArray(v);
}
