// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mountPlay } from "../src/game/play";
import type { PlayController, PlayOutcome } from "../src/game/play";
import { mountReveal } from "../src/game/reveal";
import { generate } from "../src/daily/generate";
import { SENSES } from "../src/tasks/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("play phase (spec M3)", () => {
  let ctrl: PlayController | { destroy(): void } | null = null;

  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    ctrl?.destroy();
    ctrl = null;
  });

  it("renders no digits anywhere in the play-phase DOM", () => {
    const chart = generate("2026-10-17");
    ctrl = mountPlay(document.body, chart, { streak: 0, firstRun: false, onComplete() {} });
    const text = document.body.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(/\d/.test(text)).toBe(false);
  });

  it("renders no digits even with a streak tally in the cartouche", () => {
    const chart = generate("2026-10-17");
    ctrl = mountPlay(document.body, chart, { streak: 13, firstRun: false, onComplete() {} });
    expect(/\d/.test(document.body.textContent ?? "")).toBe(false);
  });

  it("completes a full five-task run with the keyboard alone", async () => {
    const chart = generate("2026-10-18");
    let outcome: PlayOutcome | null = null;
    ctrl = mountPlay(document.body, chart, {
      streak: 0,
      firstRun: false,
      onComplete(o) {
        outcome = o;
      },
    });

    for (let i = 0; i < 5; i++) {
      await wait(300); // clears the 250 ms SIGN guard
      const handle = document.querySelector('[role="slider"]') as SVGElement | null;
      expect(handle).not.toBeNull();
      handle!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      handle!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    }
    await wait(600); // ink dries before the reveal

    expect(outcome).not.toBeNull();
    const marks = (outcome as unknown as PlayOutcome).marks;
    for (const sense of SENSES) expect(marks[sense]).toBeTruthy();
    expect((outcome as unknown as PlayOutcome).elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("mounts the reveal without throwing, and instantly under reduced motion", async () => {
    const chart = generate("2026-10-19");
    const marks = {} as PlayOutcome["marks"];
    const errors = {} as PlayOutcome["errors"];
    for (const task of chart.tasks) {
      const value = Array.isArray(task.truth) ? [0, 0.5, 1] : task.truth;
      marks[task.sense] = { value, survey: false };
      errors[task.sense] = { e: 0, unit: "", signed: 0, text: "" };
    }
    let done = false;
    ctrl = mountReveal(document.body, chart, {
      streak: 0,
      reducedMotion: true,
      tasks: chart.tasks,
      marks,
      errors,
      onDone() {
        done = true;
      },
    });
    expect(document.querySelectorAll("[data-reveal]").length).toBe(5);
    await wait(320);
    expect(done).toBe(true);
  });
});
