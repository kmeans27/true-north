import { describe, expect, it } from "vitest";
import {
  baseScore,
  badges,
  chartScore,
  gradeOf,
  scoreTask,
  titleFor,
  SURVEY_THRESHOLD,
} from "../src/game/score";
import type { TaskScore } from "../src/game/score";
import { errorOf } from "../src/tasks/geometry";

const rep = (e: number, unit = "%") => ({ e, unit, signed: e, text: "" });

describe("base curve (spec 6.1)", () => {
  it("reproduces the documented anchors", () => {
    expect(Math.round(baseScore(0))).toBe(100);
    expect(Math.round(baseScore(0.5))).toBe(72);
    expect(Math.round(baseScore(1))).toBe(52);
    expect(Math.round(baseScore(2))).toBe(27);
    expect(Math.round(baseScore(3.5))).toBe(10);
    expect(Math.round(baseScore(5))).toBe(4);
  });

  it("is monotonically decreasing and never reaches zero", () => {
    let prev = Infinity;
    for (let u = 0; u <= 20; u += 0.05) {
      const s = baseScore(u);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThan(0);
      prev = s;
    }
  });

  it("grades at the documented thresholds", () => {
    expect(gradeOf(0.15)).toBe("TRUE");
    expect(gradeOf(0.16)).toBe("CLOSE");
    expect(gradeOf(0.6)).toBe("CLOSE");
    expect(gradeOf(0.61)).toBe("OFFSET");
    expect(gradeOf(1.3)).toBe("OFFSET");
    expect(gradeOf(1.31)).toBe("ADRIFT");
  });
});

describe("the wager table (spec 6.2)", () => {
  // The spec's worked examples, hand-computed from base * weight.
  const rows: [number, number, number, number][] = [
    // u, base, SKETCH, SURVEY
    [0.3, 82, 58, 132],
    [0.6, 68, 47, 108],
    [0.7, 63, 44, 101],
    [0.8, 59, 41, 12],
    [1.0, 52, 36, 10],
    [2.0, 27, 19, 5],
  ];

  it("matches every printed row inside its rounding", () => {
    for (const [u, base, sketch, survey] of rows) {
      const b = baseScore(u);
      // The table rounds to whole points; three of its cells are one point
      // out from the formula as printed (0.7/SURVEY, 0.8/SKETCH,
      // 1.0/SKETCH). We assert the rounded base exactly and the waged
      // values to within that single point.
      expect(Math.round(b)).toBe(base);
      const sk = scoreTask("length", rep(u * 0.1), 0.1, "SKETCH");
      const su = scoreTask("length", rep(u * 0.1), 0.1, "SURVEY");
      expect(Math.abs(Math.round(b * 0.7) - sketch)).toBeLessThanOrEqual(1);
      expect(Math.abs(su.shown - survey)).toBeLessThanOrEqual(1);
      expect(sk.shown).toBe(Math.round(b * 0.7));
    }
  });

  it("pays roughly +70 and costs roughly -35 against SKETCH", () => {
    const sk = scoreTask("angle", rep(0.3 * 3.5, "deg"), 3.5, "SKETCH");
    const su = scoreTask("angle", rep(0.3 * 3.5, "deg"), 3.5, "SURVEY");
    expect(su.score - sk.score).toBeGreaterThan(60);
    expect(su.score - sk.score).toBeLessThan(80);
    const bad = scoreTask("angle", rep(1.0 * 3.5, "deg"), 3.5, "SKETCH");
    const badSurvey = scoreTask("angle", rep(1.0 * 3.5, "deg"), 3.5, "SURVEY");
    expect(badSurvey.score - bad.score).toBeLessThan(-20);
    expect(badSurvey.score - bad.score).toBeGreaterThan(-45);
  });

  it("pays out exactly at the threshold and blights just past it", () => {
    const at = scoreTask("length", rep(SURVEY_THRESHOLD * 0.1), 0.1, "SURVEY");
    const past = scoreTask("length", rep((SURVEY_THRESHOLD + 0.001) * 0.1), 0.1, "SURVEY");
    expect(at.paid).toBe(true);
    expect(past.paid).toBe(false);
    expect(at.score).toBeGreaterThan(past.score * 5);
  });

  it("never produces negative, NaN or Infinity, even at u = 0 with a survey", () => {
    const perfect = scoreTask("spacing", rep(0), 0.18, "SURVEY");
    expect(perfect.shown).toBe(160);
    expect(perfect.score).toBeGreaterThan(0);
    const zeroPar = scoreTask("length", rep(0.5), 0, "SURVEY");
    expect(Number.isFinite(zeroPar.score)).toBe(true);
    expect(zeroPar.shown).toBeGreaterThanOrEqual(0);
    const silly = scoreTask("length", rep(1e9), 0.1, "SKETCH");
    expect(Number.isFinite(silly.score)).toBe(true);
  });

  it("is monotone in accuracy", () => {
    let prev = Infinity;
    for (let e = 0; e <= 0.2; e += 0.002) {
      const t = scoreTask("length", rep(e), 0.1, "SKETCH");
      expect(t.score).toBeLessThanOrEqual(prev + 1e-9);
      prev = t.score;
    }
  });
});

describe("the chart total (spec 6.3)", () => {
  const mk = (u: number, survey: boolean): TaskScore => {
    const sense = "length";
    return scoreTask(sense, rep(u * 0.1), 0.1, survey ? "SURVEY" : "SKETCH");
  };

  it("gives exactly zero leagues at a chart score of one hundred", () => {
    const tasks = [mk(0, true), mk(0, true), mk(0, true), mk(0, true), mk(0, true)];
    const total = chartScore(tasks);
    expect(total.weighted).toBe(160);
    expect(total.chart).toBe(100);
    expect(total.leagues).toBe(0);
  });

  it("clamps at a hundred and never goes below zero leagues", () => {
    const tasks = [mk(0, true), mk(0, true), mk(0, true), mk(0, true), mk(0.1, true)];
    expect(chartScore(tasks).chart).toBe(100);
    expect(chartScore(tasks).leagues).toBe(0);
  });

  it("applies the documented 1.4 leagues per point", () => {
    // five identical par-performance sketches: base 52 * 0.7 = 36.55
    const tasks = [mk(1, false), mk(1, false), mk(1, false), mk(1, false), mk(1, false)];
    const total = chartScore(tasks);
    expect(total.chart).toBe(Math.round(baseScore(1) * 0.7));
    expect(total.leagues).toBe(Math.round((100 - total.chart) * 1.4));
  });

  it("makes an all-survey perfect chart near-impossible but a great survey run strong", () => {
    const good = [mk(0.5, true), mk(0.5, true), mk(0.5, true), mk(0.6, false), mk(0.4, true)];
    const total = chartScore(good);
    expect(total.chart).toBeGreaterThan(85);
    expect(total.leagues).toBeLessThan(21);
  });
});

describe("titles (spec 6.3)", () => {
  it("walks the documented ladder", () => {
    expect(titleFor(0).title).toBe("THE CHART IS TRUE");
    expect(titleFor(0).seal).toBe("gold-rosette");
    expect(titleFor(3).title).toBe("Dead Reckoning");
    expect(titleFor(10).title).toBe("Sound Waters");
    expect(titleFor(20).title).toBe("Within Sight of Land");
    expect(titleFor(40).title).toBe("A Wide Berth");
    expect(titleFor(70).title).toBe("Off the Chart");
    expect(titleFor(81).title).toBe("HERE BE DRAGONS");
    expect(titleFor(400).seal).toBe("dragons");
    expect(titleFor(1).seal).toBe("gold-rosette");
    expect(titleFor(6).seal).toBe("silver");
    expect(titleFor(56).seal).toBe("cracked");
  });
});

describe("badges (spec 6.3)", () => {
  const tasks = (grade: TaskScore["grade"][]): TaskScore[] =>
    grade.map((g, i) => ({ ...scoreTask("length", rep(0), 0.1, "SKETCH"), grade: g, sense: (["length", "angle", "centre", "proportion", "spacing"] as const)[i] }));

  it("awards FIVE TRUES only on five bullseyes", () => {
    expect(badges({ tasks: tasks(["TRUE", "TRUE", "TRUE", "TRUE", "TRUE"]), elapsedMs: 90_000, streak: 0, practice: false }).map((b) => b.id)).toContain("five-trues");
    expect(badges({ tasks: tasks(["TRUE", "TRUE", "TRUE", "TRUE", "CLOSE"]), elapsedMs: 90_000, streak: 0, practice: false }).map((b) => b.id)).not.toContain("five-trues");
  });

  it("awards SWIFT CHART only under a minute", () => {
    expect(badges({ tasks: tasks(["TRUE", "CLOSE", "OFFSET", "ADRIFT", "CLOSE"]), elapsedMs: 59_999, streak: 0, practice: false }).map((b) => b.id)).toContain("swift");
    expect(badges({ tasks: tasks(["TRUE", "CLOSE", "OFFSET", "ADRIFT", "CLOSE"]), elapsedMs: 60_000, streak: 0, practice: false }).map((b) => b.id)).not.toContain("swift");
  });

  it("always awards NO HINTS, and only counts streaks on real dailies", () => {
    const ids = badges({ tasks: tasks(["TRUE", "CLOSE", "OFFSET", "ADRIFT", "CLOSE"]), elapsedMs: 90_000, streak: 30, practice: false }).map((b) => b.id);
    expect(ids).toContain("no-hints");
    expect(ids).toContain("streak-30");
    const practice = badges({ tasks: tasks(["TRUE", "CLOSE", "OFFSET", "ADRIFT", "CLOSE"]), elapsedMs: 90_000, streak: 30, practice: true }).map((b) => b.id);
    expect(practice.some((id) => id.startsWith("streak"))).toBe(false);
  });
});

describe("end-to-end error to score", () => {
  it("scores a two-and-a-half degree miss on a bisection", () => {
    const report = errorOf("angle", 100 + 2.5, 100);
    expect(report.e).toBeCloseTo(2.5, 6);
    const t = scoreTask("angle", report, 3.5, "SKETCH");
    // 2.5 deg against a par of 3.5 is exactly par-ish: OFFSET, mid-fifties base
    expect(t.grade).toBe("OFFSET");
    expect(t.u).toBeCloseTo(5 / 7, 6);
    expect(t.shown).toBe(Math.round(100 * Math.exp(-0.65 * (5 / 7)) * 0.7));

    const near = scoreTask("angle", errorOf("angle", 1.8, 0), 3.5, "SKETCH");
    expect(near.grade).toBe("CLOSE");
  });
});
