/* ------------------------------------------------------------------
   Chart rendering (spec section 9)

   One SVG per chart, in a fixed 4:5 box that is letterboxed to fit the
   viewport. Layers are built once as markup strings; per-frame work
   only mutates transforms, never re-renders the chart (section 13).
   ------------------------------------------------------------------ */

import type { Chart } from "../daily/generate";
import type { Pt } from "../tasks/types";
import { dateInWords, numberWord, roman } from "../daily/seed";
import { FRAME, VIEW_H, VIEW_W, type ChartGeometry } from "./geometry";
import {
  ACCENT,
  ARROW,
  caption,
  defs,
  doodle,
  esc,
  I,
  PARCH,
  r,
  rose as roseInk,
  SOFT,
  stroke,
  tallies,
  TRUTH,
  YOU,
} from "./ink";
import { pathD, smoothPathD } from "./path";

export type LayerName =
  | "parchment"
  | "frame"
  | "rhumbs"
  | "land"
  | "sea"
  | "rose"
  | "cartouche"
  | "annotations"
  | "you"
  | "reveal"
  | "ui";

export interface ChartView {
  svg: SVGSVGElement;
  /** per-layer groups, so the game can draw into them */
  layers: Record<LayerName, SVGGElement>;
  /** pixel scale of the svg box (for hit-area maths) */
  scale(): number;
  destroy(): void;
}

export interface RenderOptions {
  /** consecutive completed dailies, shown as tally marks in the cartouche */
  streak?: number;
}

const svgNS = "http://www.w3.org/2000/svg";

export function renderChart(host: HTMLElement, chart: Chart, opts: RenderOptions = {}): ChartView {
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("class", "chart");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    `A hand-drawn sea chart titled ${chart.name}, for ${dateInWords(chart.date)}.`,
  );
  svg.style.setProperty("--accent", chart.accent);
  svg.style.touchAction = "none";

  const geo = chart.geometry;
  const make = (name: LayerName, filter = "", markup = ""): SVGGElement => {
    const el = document.createElementNS(svgNS, "g");
    el.setAttribute("data-layer", name);
    if (filter) el.setAttribute("filter", filter);
    if (markup) el.innerHTML = markup;
    svg.appendChild(el);
    return el;
  };

  const streak = opts.streak ?? 0;

  const layers: Record<LayerName, SVGGElement> = {
    parchment: make("parchment", "", parchment(chart)),
    frame: make("frame", "url(#tn-rough)", frame(geo)),
    rhumbs: make("rhumbs", "", rhumbs(geo)),
    land: make("land", "url(#tn-ink)", land(geo)),
    sea: make("sea", "", sea(geo, chart)),
    rose: make("rose", "url(#tn-ink)", `<g transform="translate(${r(geo.rose.c.x)} ${r(geo.rose.c.y)})">${roseInk(geo.rose)}</g>`),
    cartouche: make("cartouche", "", cartouche(chart, streak)),
    annotations: make("annotations"),
    you: make("you"),
    reveal: make("reveal"),
    ui: make("ui"),
  };

  svg.insertAdjacentHTML("afterbegin", defs());
  host.appendChild(svg);

  return {
    svg,
    layers,
    scale() {
      const box = svg.getBoundingClientRect();
      return box.width > 0 ? box.width / VIEW_W : 1;
    },
    destroy() {
      svg.remove();
    },
  };
}

/* ---------------------------------- layers -------------------------- */

function parchment(chart: Chart): string {
  const practice = chart.practice
    ? `<text x="${FRAME.x + FRAME.w}" y="${FRAME.y + 26}" text-anchor="end" style="fill:${YOU}"
        font-size="17" letter-spacing="0.2em" font-variant-caps="all-small-caps">practice · not counted</text>`
    : "";
  return `<rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" style="fill:${PARCH}"/>
    <rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" style="fill:${ACCENT}" opacity="0.035"/>
    <path d="M ${FRAME.x - 16} ${FRAME.y - 16} h ${FRAME.w + 32} v ${FRAME.h + 32} h ${-FRAME.w - 32} Z"
      style="fill:${PARCH}" opacity="0.5"/>
    ${practice}`;
}

function frame(geo: ChartGeometry): string {
  return `<path d="${smoothPathD(geo.frame, true)}" ${stroke(I, 2.6)}/>
    <path d="${smoothPathD(geo.inner, true)}" ${stroke(I, 1.1)} opacity="0.75"/>
    ${cornerBlocks()}`;
}

/** The little knots the chart's border is bound with. */
function cornerBlocks(): string {
  const corners: Pt[] = [
    { x: FRAME.x - 16, y: FRAME.y - 16 },
    { x: FRAME.x + FRAME.w + 16, y: FRAME.y - 16 },
    { x: FRAME.x + FRAME.w + 16, y: FRAME.y + FRAME.h + 16 },
    { x: FRAME.x - 16, y: FRAME.y + FRAME.h + 16 },
  ];
  return corners
    .map(
      (c) => `<g transform="translate(${c.x} ${c.y})">
        <path d="M -13 -13 h 26 v 26 h -26 Z" ${stroke(ACCENT, 1.6)} opacity="0.85"/>
        <circle cx="0" cy="0" r="5.2" ${stroke(ACCENT, 1.4)} opacity="0.8"/>
        <circle cx="0" cy="0" r="8.5" ${stroke(SOFT, 0.9)} opacity="0.6"/>
      </g>`,
    )
    .join("");
}

function rhumbs(geo: ChartGeometry): string {
  const out: string[] = [];
  for (const line of geo.rhumbs) {
    const clipped = clipSegment(line.a, line.b, FRAME.x + 10, FRAME.y + 10, FRAME.w - 20, FRAME.h - 20);
    if (!clipped) continue;
    out.push(
      `<path d="M ${r(clipped[0].x)} ${r(clipped[0].y)} L ${r(clipped[1].x)} ${r(clipped[1].y)}"
        ${stroke(SOFT, line.strong ? 1.15 : 0.8)} opacity="${line.strong ? 0.4 : 0.22}"/>`,
    );
  }
  for (const node of geo.nodes) {
    out.push(`<circle cx="${r(node.x)}" cy="${r(node.y)}" r="3.4" style="fill:${SOFT}" opacity="0.5"/>`);
  }
  return out.join("");
}

function clipSegment(a: Pt, b: Pt, x: number, y: number, w: number, h: number): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x - x, x + w - a.x, a.y - y, y + h - a.y];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
      continue;
    }
    const t = q[i] / p[i];
    if (p[i] < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy },
  ];
}

function land(geo: ChartGeometry): string {
  const out: string[] = [];
  for (const mass of geo.lands) {
    const d = smoothPathD(mass.outline, true);
    const tint = mass.mainland ? 0.14 : 0.08;
    out.push(`<path d="${d}" style="fill:${PARCH}" opacity="0.92"/>`);
    out.push(`<path d="${d}" style="fill:${TRUTH}" opacity="0.05"/>`);
    out.push(`<path d="${d}" style="fill:${SOFT}" opacity="${tint}"/>`);
    out.push(`<path d="${d}" ${stroke(I, mass.mainland ? 1.7 : 1.4)}/>`);
    // coastal tint: two short parallel strokes inside the shore
    const off = mass.mainland ? 5 : 4;
    out.push(`<path d="${d}" ${stroke(SOFT, 0.8)} opacity="0.45" transform="translate(${off} ${off})"/>`);
    out.push(`<path d="${d}" ${stroke(SOFT, 0.7)} opacity="0.3" transform="translate(${off * 2} ${off * 2})"/>`);
    out.push(hillHatch(mass.outline, mass.mainland ? 34 : 20));
  }
  return out.join("");
}

function hillHatch(poly: Pt[], step: number): string {
  const box = poly.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const hatch: string[] = [];
  for (let x = box.minX + step * 0.5; x < box.maxX; x += step) {
    for (let y = box.minY + step * 0.5; y < box.maxY; y += step) {
      if (!inside(poly, { x, y })) continue;
      hatch.push(`<path d="M ${r(x - 5)} ${r(y + 3)} l 10 -7" ${stroke(SOFT, 0.8)} opacity="0.35"/>`);
    }
  }
  return hatch.join("");
}

function inside(poly: Pt[], p: Pt): boolean {
  let isIn = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      isIn = !isIn;
    }
  }
  return isIn;
}

function sea(geo: ChartGeometry, chart: Chart): string {
  const out: string[] = [];
  for (const s of geo.soundings) {
    out.push(
      `<path d="M ${r(s.x - 3.4)} ${r(s.y)} h 6.8 M ${r(s.x)} ${r(s.y - 3.4)} v 6.8" ${stroke(SOFT, 1)} opacity="0.45"/>`,
    );
  }
  for (const sh of geo.shoals) {
    out.push(
      `<g transform="translate(${r(sh.at.x)} ${r(sh.at.y)}) rotate(${r(sh.angle)})">
        <path d="M -13 6 q 13 -13 26 0" ${stroke(SOFT, 1.1)} opacity="0.55"/>
        <path d="M -9 10 q 9 -9 18 0" ${stroke(SOFT, 0.9)} opacity="0.4"/>
      </g>`,
    );
  }
  for (const d of geo.doodles) out.push(doodle(d));
  out.push(caption(geo.lands[0].name ?? "the shore", FRAME.x + 30, FRAME.y + FRAME.h - 20, "start", 13));
  const seaName = chart.name === "Wyrmwater" ? "the wyrms' reach" : "open water";
  out.push(`<text x="${r(FRAME.x + FRAME.w - 36)}" y="${r(FRAME.y + 78)}" text-anchor="end"
    style="fill:${SOFT}" font-size="14" font-style="italic" letter-spacing="0.14em">${esc(seaName)}</text>`);
  return out.join("");
}

function cartouche(chart: Chart, streak: number): string {
  const c = chart.geometry.cartouche;
  const box = (inset: number): string =>
    pathD(
      [
        { x: c.x + inset, y: c.y + inset },
        { x: c.x + c.w - inset, y: c.y + inset },
        { x: c.x + c.w - inset, y: c.y + c.h - inset },
        { x: c.x + inset, y: c.y + c.h - inset },
      ],
      true,
    );
  const pad = 18;
  const x = c.x + pad;
  const out = [
    `<path d="${box(0)}" style="fill:${PARCH}" opacity="0.7"/>`,
    `<path d="${box(0)}" ${stroke(I, 1.3)}/>`,
    `<path d="${box(6)}" ${stroke(ACCENT, 0.9)} opacity="0.65"/>`,
    `<text x="${x}" y="${c.y + 30}" style="fill:${ACCENT}" font-size="13" letter-spacing="0.3em" font-variant-caps="all-small-caps">true north</text>`,
    `<text x="${x}" y="${c.y + 65}" style="fill:${I}" font-size="28">${esc(chart.name)}</text>`,
    `<text x="${x}" y="${c.y + 86}" style="fill:${SOFT}" font-size="13.5">${dateInWords(chart.date)}</text>`,
    `<text x="${x}" y="${c.y + 106}" style="fill:${SOFT}" font-size="12.5" letter-spacing="0.14em" font-variant-caps="all-small-caps">chart ${roman(chart.number)} of the year</text>`,
  ];
  if (streak > 0) {
    out.push(`<g transform="translate(${c.x + c.w - 28} ${c.y + c.h - 34}) scale(0.6)">${tallies(streak, 0, 0, 18)}</g>`);
    out.push(
      `<text x="${c.x + c.w - 26}" y="${c.y + c.h - 14}" text-anchor="end" style="fill:${SOFT}" font-size="10.5" letter-spacing="0.12em" font-variant-caps="all-small-caps">${streakLabel(streak)}</text>`,
    );
  }
  return out.join("");
}

function streakLabel(n: number): string {
  if (n <= 1) return "first chart";
  return `${numberWord(n)} charts running`;
}

/* ---------------------------------- overlays ------------------------ */

/** Drawn in the ui layer: the first-run overlay, dismissed by tap. */
export function onboardingMarkup(): string {
  return `<g class="onboard">
    <rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" style="fill:${I}" opacity="0.5"/>
    <path d="M 150 420 h 700 v 400 h -700 Z" style="fill:${PARCH}" opacity="0.98"/>
    <path d="M 150 420 h 700 v 400 h -700 Z" ${stroke(TRUTH, 1.6)}/>
    <text x="500" y="500" text-anchor="middle" style="fill:${I}" font-size="29">Five things are missing</text>
    <text x="500" y="540" text-anchor="middle" style="fill:${I}" font-size="29">from today's chart.</text>
    <text x="500" y="610" text-anchor="middle" style="fill:${SOFT}" font-size="20">Fix them by eye.</text>
    <text x="500" y="644" text-anchor="middle" style="fill:${SOFT}" font-size="20">No rulers. No numbers.</text>
    <text x="500" y="678" text-anchor="middle" style="fill:${SOFT}" font-size="20">No going back.</text>
    <text x="500" y="760" text-anchor="middle" style="fill:${ACCENT}" font-size="17" letter-spacing="0.2em" font-variant-caps="all-small-caps">tap to begin</text>
  </g>`;
}

/** The reminder arrow on the first handle of the first task. */
export function attentionMarkup(at: Pt, deg = 0): string {
  return `<g class="attention" transform="translate(${r(at.x)} ${r(at.y)}) rotate(${deg})">
    <path d="M 0 30 q 0 16 0 24" ${stroke(YOU, 2)}/>
    ${ARROW}
  </g>`;
}
