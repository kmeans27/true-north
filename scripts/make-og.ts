/* ------------------------------------------------------------------
   Build the social card (spec M9): a real chart, rendered through the
   game's own art pipeline, sealed and titled.

   Run:  npx vite-node scripts/make-og.ts -- 2026-10-17 /tmp/og.svg
   Then: rsvg-convert -w 1080 -h 1350 -b '#efe3c8' /tmp/og.svg -o public/og.png

   This is a one-off authoring tool, not part of the build: the PNG is
   committed so the site stays a pure static bundle with no image
   toolchain at deploy time.
   ------------------------------------------------------------------ */

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='host'></div></body></html>");
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.Node = dom.window.Node;
g.SVGElement = dom.window.SVGElement;

const { generate } = await import("../src/daily/generate");
const { renderChart } = await import("../src/chart/render");
const { seal } = await import("../src/chart/ink");

const date = process.argv[2] ?? "2026-10-17";
const chart = generate(date);
const host = dom.window.document.getElementById("host")!;
const view = renderChart(host as unknown as HTMLElement, chart, { streak: 3 });

// Inline the palette: librsvg does not resolve CSS custom properties.
const palette: Record<string, string> = {
  "--ink": "#1e2a38",
  "--ink-soft": "rgba(30,42,56,0.44)",
  "--ink-faint": "rgba(30,42,56,0.15)",
  "--truth": "#b8860b",
  "--you": "#8c2f2f",
  "--accent": chart.accent,
  "--parchment": "#efe3c8",
  "--parchment-2": "#e6d6b4",
};

let svg = view.svg.outerHTML;
for (const [name, hex] of Object.entries(palette)) {
  svg = svg.replaceAll(`var(${name})`, hex);
}
const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const accent = chart.accent;
const SEAL_R = 58;
const serif = "Georgia, 'Times New Roman', serif";

// 1080 x 1350: the chart (1000 x 1250, its own 4:5 box) scaled to fill,
// with a title block and the day's seal laid over the lower water.
const cardRaw = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#efe3c8"/>
  <g transform="scale(1.08)">${inner}</g>
  <g>
    <rect x="0" y="1014" width="1080" height="336" fill="#efe3c8"/>
    <path d="M 40 1022 H 1040" stroke="#1e2a38" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 40 1034 H 1040" stroke="${accent}" stroke-width="1.1" opacity="0.8"/>
    <text x="52" y="1116" font-family="${serif}" font-size="44" letter-spacing="11" fill="${accent}" font-variant-caps="all-small-caps">True North</text>
    <text x="54" y="1184" font-family="${serif}" font-size="31" fill="#1e2a38">One hand-drawn chart a day.</text>
    <text x="54" y="1230" font-family="${serif}" font-size="31" fill="#1e2a38">Five things left to your eye.</text>
    <text x="54" y="1298" font-family="${serif}" font-size="23" letter-spacing="1.5" fill="#1e2a38" opacity="0.62" font-variant-caps="all-small-caps">No rulers. No numbers. One score.</text>
    <g transform="translate(934 1178) rotate(-8)">${seal("gold-rosette", 0, 0, SEAL_R)}</g>
  </g>
</svg>`;

const out = process.argv[3] ?? "/tmp/og.svg";
let card = cardRaw;
for (const [name, hex] of Object.entries(palette)) {
  card = card.replaceAll(`var(${name})`, hex);
}
const { writeFileSync } = await import("node:fs");
writeFileSync(out, card);
console.log(`wrote ${out} (${card.length} bytes) for chart "${chart.name}" on ${date}`);
