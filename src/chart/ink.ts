/* ------------------------------------------------------------------
   The ink (spec section 9.4)

   Hand-inked lines come from one feTurbulence + feDisplacementMap with
   a *frozen* seed, defined exactly once (section 9.4 budget). Nothing
   in here is machine-perfect: circles are drawn as two arcs of
   slightly different radius, seals are slightly out of round.
   ------------------------------------------------------------------ */

import type { Doodle, DoodleKind, Rose } from "./geometry";

const I = "var(--ink)";
const SOFT = "var(--ink-soft)";
const FAINT = "var(--ink-faint)";
const TRUTH = "var(--truth)";
const YOU = "var(--you)";
const ACCENT = "var(--accent)";
const PARCH = "var(--parchment-2)";

const stroke = (c: string, w: number, extra = "") =>
  `fill="none" style="stroke:${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;

/** Filters and static gradients. Emitted once, never per task. */
export function defs(): string {
  return `<defs>
    <filter id="tn-rough" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.014 0.019" numOctaves="2" seed="17" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="tn-ink" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.021 0.026" numOctaves="2" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="tn-blot" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="29" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
}

/* ---------------------------------- doodles ------------------------- */

export function doodle(d: Doodle): string {
  const t = `translate(${r(d.at.x)} ${r(d.at.y)}) scale(${r(d.scale)}) ${d.flip ? "scale(-1 1)" : ""}`;
  return `<g transform="${t}">${DOODLES[d.kind]()}</g>`;
}

const DOODLES: Record<DoodleKind, () => string> = {
  serpent: () => `
    <path d="M -70 4 C -56 -14 -42 10 -28 -4 C -14 -18 0 8 14 -6 C 24 -16 34 -6 40 -2"
      ${stroke(SOFT, 2.4)}/>
    <path d="M 40 -2 q 10 -3 14 -10 q 2 9 -2 14 q 8 1 12 -3" ${stroke(SOFT, 2.2)}/>
    <circle cx="47" cy="-10" r="1.6" style="fill:${SOFT}"/>
    <path d="M -70 4 q -6 -4 -8 -10" ${stroke(SOFT, 2)}/>
    <path d="M -46 -6 q 6 -9 12 -3" ${stroke(SOFT, 1.8)}/>
    <path d="M 8 -12 q 5 -8 11 -4" ${stroke(SOFT, 1.8)}/>`,
  whale: () => `
    <path d="M -56 2 C -46 -14 -20 -20 4 -12 C 20 -7 34 -2 44 2 C 50 5 54 2 56 -6 C 58 4 54 10 48 12 C 26 16 -8 16 -30 12 C -44 9 -52 6 -56 2 Z"
      style="fill:${FAINT};stroke:${SOFT}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="30" cy="-2" r="1.7" style="fill:${SOFT}"/>
    <path d="M 12 6 q 8 4 16 2" ${stroke(SOFT, 1.6)}/>
    <path d="M 22 -14 q 2 -10 -4 -16 M 28 -14 q 6 -9 12 -12" ${stroke(SOFT, 1.6)}/>`,
  windhead: () => `
    <circle cx="-6" cy="0" r="17" style="fill:${FAINT};stroke:${SOFT}" stroke-width="2.2"/>
    <path d="M -30 -12 C -22 -22 -6 -25 6 -19" ${stroke(SOFT, 2)}/>
    <circle cx="-12" cy="-4" r="1.8" style="fill:${SOFT}"/>
    <circle cx="0" cy="-4" r="1.8" style="fill:${SOFT}"/>
    <ellipse cx="-6" cy="7" rx="4" ry="5" style="fill:${SOFT}"/>
    <path d="M 16 -8 q 10 0 16 -4 M 18 2 q 12 2 18 -2 M 16 10 q 9 3 14 0" ${stroke(SOFT, 1.9)}/>`,
  ship: () => `
    <path d="M -30 4 q 30 12 62 0 l -7 10 q -24 8 -48 0 Z" style="fill:${FAINT};stroke:${SOFT}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M -2 -40 v 44 M 20 -30 v 34" ${stroke(SOFT, 1.9)}/>
    <path d="M -4 -38 q -20 12 -22 26 q 14 4 22 0 Z" style="fill:${FAINT};stroke:${SOFT}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 18 -28 q -16 10 -16 22 q 12 3 16 0 Z" style="fill:${FAINT};stroke:${SOFT}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M -2 -44 l 8 5 l -8 5 Z" style="fill:${ACCENT}"/>`,
  gull: () => `
    <path d="M -18 2 q 6 -7 10 -1 q 4 -6 10 -1" ${stroke(SOFT, 2)}/>
    <path d="M 6 -14 q 5 -6 9 -1 q 4 -5 9 -1" ${stroke(SOFT, 1.8)}/>`,
};

/* ---------------------------------- rose ---------------------------- */

/** A 16-point portolan rose, two rings of slightly different radius. */
export function rose(star: Rose): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const radius = star.r;
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = star.rot + i * 22.5;
    const len = i % 2 === 0 ? radius : radius * 0.62;
    const half = 22.5 / 2;
    const bx = radius * 0.2;
    const lx = r(bx * Math.cos(rad(a - half)));
    const ly = r(bx * Math.sin(rad(a - half)));
    const rx = r(bx * Math.cos(rad(a + half)));
    const ry = r(bx * Math.sin(rad(a + half)));
    const tx = r(len * Math.cos(rad(a)));
    const ty = r(len * Math.sin(rad(a)));
    const dark = i % 2 === 0;
    points.push(
      `<path d="M 0 0 L ${tx} ${ty} L ${lx} ${ly} Z" style="fill:${dark ? ACCENT : I}" opacity="${dark ? 0.92 : 0.72}"/>`,
      `<path d="M 0 0 L ${tx} ${ty} L ${rx} ${ry} Z" style="fill:${PARCH}" opacity="0.5"/>`,
      `<path d="M 0 0 L ${tx} ${ty} L ${lx} ${ly} Z M 0 0 L ${tx} ${ty} L ${rx} ${ry} Z" ${stroke(SOFT, 0.9)}/>`,
    );
  }
  // the eight intermediate points, half as long, in soft ink
  const minor: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = star.rot + 11.25 + i * 45;
    const half = 11.25 / 2;
    const len = radius * 0.44;
    const bx = radius * 0.1;
    const lx = r(bx * Math.cos(rad(a - half)));
    const ly = r(bx * Math.sin(rad(a - half)));
    const rx2 = r(bx * Math.cos(rad(a + half)));
    const ry2 = r(bx * Math.sin(rad(a + half)));
    const tx = r(len * Math.cos(rad(a)));
    const ty = r(len * Math.sin(rad(a)));
    minor.push(
      `<path d="M 0 0 L ${tx} ${ty} L ${lx} ${ly} Z" style="fill:${SOFT}"/>`,
      `<path d="M 0 0 L ${tx} ${ty} L ${rx2} ${ry2} Z" style="fill:${PARCH}" opacity="0.4"/>`,
    );
  }
  const outer = radius * 1.06;
  const inner = radius * 0.5;
  const ring = `<path d="M ${r(outer)} 0 A ${r(outer)} ${r(outer * 0.99)} 0 1 1 ${r(-outer)} ${r(0.4)} A ${r(outer * 1.01)} ${r(outer)} 0 1 1 ${r(outer)} 0" ${stroke(SOFT, 1.5)}/>
    <path d="M ${inner} 0 A ${inner} ${r(inner * 1.02)} 0 1 0 ${r(-inner)} ${r(-0.5)} A ${r(inner * 0.98)} ${inner} 0 1 0 ${inner} 0" ${stroke(SOFT, 1.1)}/>`;
  // fleur-de-lis on the first point
  const a0 = rad(star.rot);
  const fx = r(radius * 1.16 * Math.cos(a0));
  const fy = r(radius * 1.16 * Math.sin(a0));
  const fleur = `<g transform="translate(${fx} ${fy}) rotate(${r(star.rot)})">
      <path d="M 0 0 q -5 -6 0 -12 q 5 6 0 12 Z M -6 -4 q -4 -5 0 -8 q 4 3 0 8 Z M 6 -4 q 4 -5 0 -8 q -4 3 0 8 Z"
        style="fill:${ACCENT}" opacity="0.85"/>
    </g>`;
  return `<g>${ring}${points.join("")}${minor.join("")}${fleur}</g>`;
}

/* ---------------------------------- marks --------------------------- */

/** Grade glyphs, drawn as ink rather than emoji (spec 6.1). */
export function gradeGlyph(grade: string, size = 9, colour = I): string {
  switch (grade) {
    case "TRUE":
      return `<path d="M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z" style="fill:${colour}"/>`;
    case "CLOSE":
      return `<path d="M 0 ${-size} L ${size} ${size * 0.8} L ${-size} ${size * 0.8} Z" style="fill:${colour}"/>`;
    case "OFFSET":
      return `<path d="M ${-size} ${-size * 0.34} L ${size} ${-size * 0.34} L ${size} ${size * 0.34} L ${-size} ${size * 0.34} Z" style="fill:${colour}"/>`;
    default:
      return `<path d="M ${-size} ${-size} L ${size} ${size} M ${size} ${-size} L ${-size} ${size}" ${stroke(colour, size * 0.42)}/>`;
  }
}

/** Seals (spec 6.3). Deliberately a little out of round. */
export function seal(kind: string, cx: number, cy: number, rad: number): string {
  const cracked = kind === "cracked";
  const colour =
    kind === "gold-rosette" ? TRUTH : kind === "silver" ? SOFT : kind === "dragons" ? YOU : YOU;
  const petals: string[] = [];
  if (kind === "gold-rosette") {
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      const px = r(cx + Math.cos(a) * rad * 0.72);
      const py = r(cy + Math.sin(a) * rad * 0.72);
      petals.push(
        `<ellipse cx="${px}" cy="${py}" rx="${r(rad * 0.2)}" ry="${r(rad * 0.11)}" transform="rotate(${i * 30} ${px} ${py})" style="fill:${colour}" opacity="0.5"/>`,
      );
    }
  }
  const wobble = `M ${r(cx + rad)} ${r(cy)} A ${r(rad)} ${r(rad * 1.03)} 0 1 1 ${r(cx - rad)} ${r(cy + 1)} A ${r(rad * 0.97)} ${r(rad)} 0 1 1 ${r(cx + rad)} ${r(cy)} Z`;
  const crack = cracked
    ? `<path d="M ${r(cx - rad * 0.5)} ${r(cy - rad)} L ${r(cx - rad * 0.3)} ${r(cy - rad * 0.2)} L ${r(cx - rad * 0.62)} ${r(cy + rad * 0.1)} L ${r(cx - rad * 0.2)} ${r(cy + rad)}"
        ${stroke(YOU, 1.6)}/>`
    : "";
  return `<g>
    ${petals.join("")}
    <path d="${wobble}" style="fill:${colour}" opacity="${kind === "gold-rosette" ? 0.14 : 0.1}"/>
    <path d="${wobble}" ${stroke(colour, 1.8)}/>
    <path d="M ${r(cx - rad * 0.62)} ${r(cy + rad * 0.1)} q ${r(rad * 0.6)} ${r(rad * 0.45)} ${r(rad * 1.24)} 0" ${stroke(colour, 1.3)}/>
    ${crack}
  </g>`;
}

/** Streak as hand-drawn tally marks: five to a group, no digits. */
export function tallies(n: number, x: number, y: number, h = 16): string {
  const shown = Math.min(n, 25);
  const out: string[] = [];
  for (let i = 0; i < shown; i++) {
    const gx = x + Math.floor(i / 5) * 26;
    const k = i % 5;
    if (k < 4) {
      const sx = gx + k * 3.4;
      out.push(`<path d="M ${r(sx)} ${r(y)} l ${r(0.6 - k * 0.3)} ${-h}" ${stroke(I, 1.6)}/>`);
    } else {
      out.push(`<path d="M ${r(gx - 3)} ${r(y - h * 0.15)} l ${r(17)} ${r(-h * 0.7)}" ${stroke(ACCENT, 1.7)}/>`);
    }
  }
  return `<g>${out.join("")}</g>`;
}

/* ---------------------------------- bits ---------------------------- */

/** A compass-needle style arrowhead, used for the draggable handles. */
export function arrowHead(x: number, y: number, deg: number, size = 11, colour = YOU): string {
  return `<path d="M 0 ${-size} L ${size * 0.66} ${size * 0.7} L 0 ${size * 0.3} L ${size * -0.66} ${size * 0.7} Z"
    transform="translate(${r(x)} ${r(y)}) rotate(${r(deg + 90)})" style="fill:${colour}"/>`;
}

/** A tiny buoy: the origin marker for the proportion and spacing tasks. */
export function buoy(x: number, y: number): string {
  return `<g transform="translate(${r(x)} ${r(y)})">
    <path d="M 0 0 L 0 -14" ${stroke(SOFT, 1.4)}/>
    <path d="M -5 -14 q 5 -7 10 0 q -5 5 -10 0 Z" style="fill:${ACCENT}" opacity="0.8"/>
    <circle cx="0" cy="0" r="3.2" style="fill:${ACCENT}"/>
  </g>`;
}

/** Small end ticks: how the chart says "this span, exactly". */
export function endTicks(a: { x: number; y: number }, b: { x: number; y: number }, len = 9, colour = ACCENT): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * len;
  const ny = (dx / L) * len;
  return `<path d="M ${r(a.x - nx)} ${r(a.y - ny)} L ${r(a.x + nx)} ${r(a.y + ny)} M ${r(b.x - nx)} ${r(b.y - ny)} L ${r(b.x + nx)} ${r(b.y + ny)}"
    ${stroke(colour, 1.8)}/>`;
}

/** A small ink caption: which feature the task means, said quietly. */
export function caption(text: string, x: number, y: number, anchor = "middle", size = 12): string {
  return `<text x="${r(x)}" y="${r(y)}" text-anchor="${anchor}" style="fill:${SOFT}"
    font-size="${size}" letter-spacing="0.06em" font-variant-caps="all-small-caps">${esc(text)}</text>`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The pointer that rides at the tip of an attention mark. */
export const ARROW = `<path d="M -7 0 L 0 13 L 7 0 Z" style="fill:var(--you)"/>`;

/** Round to 2dp: keeps the markup small without visible error. */
export function r(n: number): number {
  return Math.round(n * 100) / 100;
}

export { stroke, I, SOFT, FAINT, TRUTH, YOU, ACCENT, PARCH };
