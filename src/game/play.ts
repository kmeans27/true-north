/* ------------------------------------------------------------------
   The play phase (spec sections 3, 5, 9.5, 10.2)

   One chart, five tasks, one gesture each. Nothing numeric ever reaches
   the DOM here — progress is ink dots and words, the date is spelled
   out, the chart number is a roman numeral. SIGN arms only after a
   250 ms guard, and once a piece is signed it is frozen for good.
   ------------------------------------------------------------------ */

import type { Chart } from "../daily/generate";
import type { ErrorReport, Sense, Value, Widget } from "../tasks/types";
import { MODULES, errorForTask, openingValue } from "../tasks";
import { renderChart } from "../chart/render";
import type { ChartView } from "../chart/render";
import { attentionMarkup, onboardingMarkup } from "../chart/render";
import { button, el, pips } from "../ui/components";
import { t } from "../ui/strings";
import { announce } from "../a11y";
import { numberWord } from "../daily/seed";
import { svgEl } from "../tasks/dom";
import { clickSound, quillSound } from "./sound";

export interface PlayMark {
  value: Value;
  survey: boolean;
}

export interface PlayOutcome {
  marks: Record<Sense, PlayMark>;
  errors: Record<Sense, ErrorReport>;
  elapsedMs: number;
}

export interface PlayOptions {
  streak: number;
  firstRun: boolean;
  onComplete(outcome: PlayOutcome): void;
  onMenu?(): void;
}

export interface PlayController {
  destroy(): void;
}

type Wager = "SKETCH" | "SURVEY";

export function mountPlay(host: HTMLElement, chart: Chart, opts: PlayOptions): PlayController {
  const root = el("div", { class: "screen play" });

  const head = el("div", { class: "play-head" }, [
    el("span", { class: "wordmark smallcaps", text: "True North" }),
    chart.practice ? el("span", { class: "practice-badge smallcaps", text: t("practiceBadge") }) : null,
    opts.onMenu ? button("☰", { variant: "quiet", className: "menu-btn", ariaLabel: "Menu", onClick: opts.onMenu }) : null,
  ].filter(Boolean) as Node[]);

  const stage = el("div", { class: "stage" });
  const wrap = el("div", { class: "chartwrap" });
  stage.append(wrap);

  const prompt = el("p", { class: "prompt", id: "tn-prompt" });
  const pipRow = el("div", { class: "pip-row" });
  const promptLine = el("div", { class: "prompt-line" }, [prompt, pipRow]);

  const wagerGroup = el("div", { class: "wager", role: "radiogroup", "aria-label": "wager" });
  const sketchBtn = button(t("sketch"), { variant: "quiet", className: "wager-tab" });
  const surveyBtn = button(t("survey"), { variant: "quiet", className: "wager-tab" });
  wagerGroup.append(sketchBtn, surveyBtn);

  const signBtn = button(t("sign"), { variant: "primary", className: "sign-btn" });
  const wagerRow = el("div", { class: "wager-row" }, [
    el("div", { class: "wager-wrap" }, [wagerGroup, el("span", { class: "wager-hint", text: t("wagerHint") })]),
    signBtn,
  ]);
  const bar = el("div", { class: "promptbar" }, [promptLine, wagerRow]);

  root.append(head, stage, bar);
  host.append(root);

  const view: ChartView = renderChart(wrap, chart, { streak: opts.streak });
  root.style.setProperty("--accent", chart.accent);

  // Pre-draw every task's annotation; only the active one is bright.
  const annos: { sense: Sense; node: SVGGElement }[] = [];
  for (const task of chart.tasks) {
    const g = svgEl("g", { "data-anno": task.id, opacity: "0.14" });
    g.innerHTML = MODULES[task.sense].annotations(task.scene);
    view.layers.annotations.appendChild(g);
    annos.push({ sense: task.sense, node: g });
  }

  const marks: Partial<Record<Sense, PlayMark>> = {};
  let index = 0;
  let widget: Widget | null = null;
  let wager: Wager = "SKETCH";
  let ready = false;
  let overlayOpen = false;
  let usedKeyboard = false;
  let armTimer = 0;
  let attentionTimer = 0;
  let destroyed = false;
  const startedAt = performance.now();

  sketchBtn.setAttribute("role", "radio");
  surveyBtn.setAttribute("role", "radio");
  sketchBtn.addEventListener("click", () => setWager("SKETCH"));
  surveyBtn.addEventListener("click", () => setWager("SURVEY"));
  signBtn.addEventListener("click", sign);

  function setWager(w: Wager): void {
    wager = w;
    sketchBtn.setAttribute("aria-checked", String(w === "SKETCH"));
    surveyBtn.setAttribute("aria-checked", String(w === "SURVEY"));
    sketchBtn.classList.toggle("is-on", w === "SKETCH");
    surveyBtn.classList.toggle("is-on", w === "SURVEY");
    announce(w === "SKETCH" ? t("sketch") : t("survey"));
    clickSound();
  }

  function updateSign(): void {
    signBtn.disabled = !ready;
    signBtn.classList.toggle("is-ready", ready);
  }

  function startTask(i: number): void {
    index = i;
    const task = chart.tasks[i];
    for (const a of annos) a.node.setAttribute("opacity", a.sense === task.sense ? "1" : "0.14");
    prompt.textContent = task.prompt;
    prompt.classList.remove("fade");
    void prompt.offsetWidth;
    prompt.classList.add("fade");
    pipRow.replaceChildren(pips(chart.tasks.length, i, i));
    setWager("SKETCH");

    widget?.destroy();
    widget = MODULES[task.sense].createWidget({
      svg: view.svg,
      layer: view.layers.you,
      task,
      initial: openingValue(task),
    });

    ready = false;
    updateSign();
    window.clearTimeout(armTimer);
    armTimer = window.setTimeout(() => {
      if (destroyed) return;
      ready = true;
      updateSign();
    }, 250);

    announce(`${task.prompt} ${numberWord(i + 1)} ${t("of")} five.`);

    if (usedKeyboard) widget?.focus();

    if (opts.firstRun && i === 0 && widget) {
      const spot = MODULES[task.sense].attention(task.scene, widget.getValue());
      showAttention(spot.at, spot.deg);
    }
  }

  function showAttention(at: { x: number; y: number }, deg: number): void {
    view.layers.ui.insertAdjacentHTML("beforeend", attentionMarkup(at, deg));
    const node = view.layers.ui.querySelector(".attention");
    window.clearTimeout(attentionTimer);
    attentionTimer = window.setTimeout(() => node?.remove(), 1300);
  }

  function sign(): void {
    if (overlayOpen || !ready || !widget) return;
    const task = chart.tasks[index];
    marks[task.sense] = { value: widget.getValue(), survey: wager === "SURVEY" };
    widget.freeze();
    quillSound();
    ready = false;
    updateSign();
    const done = index + 1;
    announce(`${t("signed")} ${numberWord(done)} ${t("of")} five.`);
    if (done >= chart.tasks.length) finish();
    else startTask(done);
  }

  function finish(): void {
    const errors = {} as Record<Sense, ErrorReport>;
    for (const task of chart.tasks) {
      const mark = marks[task.sense];
      if (mark) errors[task.sense] = errorForTask(task, mark.value);
    }
    // let the last ink dry for a beat before the reveal
    window.setTimeout(() => {
      if (destroyed) return;
      opts.onComplete({
        marks: marks as Record<Sense, PlayMark>,
        errors,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }, 420);
  }

  /* -------------------------------- onboarding ---------------------- */

  let overlayDismiss: (() => void) | null = null;

  function showOnboarding(): void {
    overlayOpen = true;
    view.layers.ui.insertAdjacentHTML("beforeend", onboardingMarkup());
    const node = view.layers.ui.querySelector(".onboard");
    const dismiss = () => {
      if (!overlayOpen) return;
      overlayOpen = false;
      node?.remove();
      startTask(0);
    };
    view.svg.addEventListener("click", dismiss, { once: true });
    overlayDismiss = dismiss;
  }

  function dismissOverlay(): boolean {
    if (!overlayOpen) return false;
    overlayDismiss?.();
    return true;
  }

  /* -------------------------------- input --------------------------- */

  function onKey(ev: KeyboardEvent): void {
    usedKeyboard = true;
    if (ev.key === "w" || ev.key === "W") {
      if (overlayOpen) return;
      setWager(wager === "SKETCH" ? "SURVEY" : "SKETCH");
      ev.preventDefault();
      return;
    }
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
      const active = document.activeElement;
      if (active instanceof HTMLButtonElement) return; // the button handles itself
      if (dismissOverlay()) {
        ev.preventDefault();
        return;
      }
      sign();
      ev.preventDefault();
    }
  }

  root.addEventListener("keydown", onKey);

  if (opts.firstRun) showOnboarding();
  else startTask(0);

  return {
    destroy() {
      destroyed = true;
      window.clearTimeout(armTimer);
      window.clearTimeout(attentionTimer);
      root.removeEventListener("keydown", onKey);
      widget?.destroy();
      view.destroy();
      root.remove();
    },
  };
}
