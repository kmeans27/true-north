/* ------------------------------------------------------------------
   The reveal (spec sections 3, 9.6, 10.3)

   Each piece animates from the player's value to the truth: the truth
   line draws itself, the ghost fades in a beat later, the error writes
   on last. Survey wagers resolve with a stamp or a blight. Skippable by
   a tap or a key, and instant under reduced motion.
   ------------------------------------------------------------------ */

import type { Chart } from "../daily/generate";
import type { ErrorReport, Sense, Task } from "../tasks/types";
import { MODULES } from "../tasks";
import { renderChart } from "../chart/render";
import type { ChartView } from "../chart/render";
import { el } from "../ui/components";
import { t } from "../ui/strings";
import { announce } from "../a11y";
import { esc, r, stroke, TRUTH, YOU } from "../chart/ink";
import { SURVEY_THRESHOLD } from "./score";
import { chimeSound, stampSound } from "./sound";
import { svgEl } from "../tasks/dom";
import type { PlayMark } from "./play";

export interface RevealOptions {
  streak: number;
  reducedMotion: boolean;
  tasks: Task[];
  marks: Record<Sense, PlayMark>;
  errors: Record<Sense, ErrorReport>;
  /** announce the headline once the reveal has played */
  summary?: string;
  onDone(): void;
}

export interface RevealController {
  destroy(): void;
}

const PER = 2100;

export function mountReveal(host: HTMLElement, chart: Chart, opts: RevealOptions): RevealController {
  const root = el("div", { class: "screen reveal" });
  const stage = el("div", { class: "stage" });
  const wrap = el("div", { class: "chartwrap" });
  stage.append(wrap);
  const hint = el("div", { class: "reveal-hint smallcaps", text: t("skip"), role: "button", tabindex: "0" });
  root.append(stage, hint);
  host.append(root);

  const view: ChartView = renderChart(wrap, chart, { streak: opts.streak });
  root.style.setProperty("--accent", chart.accent);
  root.classList.toggle("reduced", opts.reducedMotion);

  const tasks = opts.tasks;
  const timers: number[] = [];
  let i = 0;
  let done = false;
  let finishing = false;

  function revealOne(task: Task, cue = false): void {
    const mark = opts.marks[task.sense];
    const err = opts.errors[task.sense];
    if (!mark || !err) return;
    const u = task.par > 0 ? err.e / task.par : 0;
    const wasPaid = u <= SURVEY_THRESHOLD;
    const g = svgEl("g", { "data-reveal": task.id });
    g.innerHTML =
      MODULES[task.sense].revealMarkup(task.scene, mark.value, task.truth, err) +
      (mark.survey ? surveyStamp(task, wasPaid) : "");
    view.layers.reveal.appendChild(g);
    if (cue && mark.survey && wasPaid) stampSound();
  }

  function surveyStamp(task: Task, wasPaid: boolean): string {
    const at = MODULES[task.sense].attention(task.scene, opts.marks[task.sense].value).at;
    const x = at.x;
    const y = Math.max(90, at.y - 54);
    if (wasPaid) {
      return `<g class="reveal-stamp" transform="translate(${r(x)} ${r(y)}) rotate(-11)">
        <path d="M -74 -20 h 148 v 40 h -148 Z" ${stroke(TRUTH, 1.6)} opacity="0.9"/>
        <path d="M -70 -16 h 140 v 32 h -140 Z" ${stroke(TRUTH, 0.8)} opacity="0.6"/>
        <text x="0" y="6" text-anchor="middle" style="fill:${TRUTH}" font-size="17"
          letter-spacing="0.24em" font-variant-caps="all-small-caps">survey paid</text>
      </g>`;
    }
    return `<g class="reveal-blight" transform="translate(${r(x)} ${r(y)}) rotate(-8)">
      <path d="M -66 -18 h 132 v 36 h -132 Z" style="fill:${YOU}" opacity="0.9" filter="url(#tn-blot)"/>
      <text x="0" y="6" text-anchor="middle" style="fill:var(--parchment)" font-size="17"
        letter-spacing="0.28em" font-variant-caps="all-small-caps">${esc("blighted")}</text>
    </g>`;
  }

  function revealAll(): void {
    for (; i < tasks.length; i++) revealOne(tasks[i]);
  }

  function scheduleFinish(ms: number): void {
    if (finishing || done) return;
    finishing = true;
    timers.push(
      window.setTimeout(() => {
        if (done) return;
        done = true;
        if (opts.summary) announce(opts.summary);
        opts.onDone();
      }, ms),
    );
  }

  function tick(): void {
    if (done) return;
    if (i >= tasks.length) {
      scheduleFinish(opts.reducedMotion ? 200 : 1200);
      return;
    }
    revealOne(tasks[i], true);
    chimeSound(i);
    i++;
    timers.push(window.setTimeout(tick, PER));
  }

  function skip(): void {
    if (done || finishing) return;
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
    revealAll();
    scheduleFinish(opts.reducedMotion ? 60 : 520);
  }

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar" || ev.key === "Escape") {
      skip();
      ev.preventDefault();
    }
  };
  root.addEventListener("click", skip);
  hint.addEventListener("click", (ev) => {
    ev.stopPropagation();
    skip();
  });
  window.addEventListener("keydown", onKey);

  // mark every reveal group as fully drawn after its animation window
  if (opts.reducedMotion) revealAll();
  tick();

  return {
    destroy() {
      done = true;
      for (const id of timers) window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      view.destroy();
      root.remove();
    },
  };
}
