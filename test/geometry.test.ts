import { describe, expect, it } from "vitest";
import {
  angleDelta,
  errorOf,
  evenMarks,
  halfDiagonal,
  iqr,
  median,
  nearestFraction,
  pathLength,
  pathSlice,
  pointAt,
  spacingCv,
  wrap360,
} from "../src/tasks/geometry";
import { jitterEven, openingValue } from "../src/tasks/opening";
import { generate } from "../src/daily/generate";
import { addDays, mulberry32 } from "../src/daily/seed";

describe("angle wrapping (spec M2)", () => {
  it("wraps 359 deg and 1 deg to a two-degree gap", () => {
    expect(Math.abs(angleDelta(1, 359))).toBeCloseTo(2, 9);
    expect(Math.abs(angleDelta(359, 1))).toBeCloseTo(2, 9);
  });

  it("wraps the short way round, signed", () => {
    expect(angleDelta(10, 350)).toBeCloseTo(20, 9);
    expect(angleDelta(350, 10)).toBeCloseTo(-20, 9);
    expect(angleDelta(0, 180)).toBeCloseTo(180, 9);
    expect(angleDelta(0, 181)).toBeCloseTo(179, 9);
    expect(wrap360(-10)).toBeCloseTo(350, 9);
    expect(wrap360(370)).toBeCloseTo(10, 9);
  });

  it("scores an angle error in degrees, symmetrically", () => {
    expect(errorOf("angle", 101, 99).e).toBeCloseTo(2, 9);
    expect(errorOf("angle", 99, 101).e).toBeCloseTo(2, 9);
  });
});

describe("centre normalisation (spec M2)", () => {
  it("quotes error as a percentage of the half-diagonal", () => {
    const region = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(halfDiagonal(region)).toBeCloseTo(Math.hypot(4, 4) / 2, 9);
    const hd = halfDiagonal(region);
    // a point one half-diagonal away is a hundred per cent off
    const r = errorOf("centre", { x: hd, y: 0 }, { x: 0, y: 0 }, { halfDiag: hd });
    expect(r.e).toBeCloseTo(100, 9);
    expect(r.unit).toBe("%");
    expect(Number.isNaN(r.signed)).toBe(true);
  });
});

describe("spacing coefficient of variation (spec M2)", () => {
  it("is zero for perfectly even marks, whatever the shift", () => {
    expect(spacingCv([0, 0.5, 1])).toBeCloseTo(0, 9);
    expect(spacingCv([0.2, 0.4, 0.6, 0.8])).toBeCloseTo(0, 9);
  });

  it("matches a hand-computed fixture", () => {
    // gaps 0.25 and 0.75: mean 0.5, sd 0.25, CV 0.5
    expect(spacingCv([0, 0.25, 1])).toBeCloseTo(0.5, 9);
    // gaps 0.2, 0.4, 0.4: mean 1/3, CV = 0.2828427...
    expect(spacingCv([0, 0.2, 0.6, 1])).toBeCloseTo(0.2828427, 6);
  });

  it("treats a pile-up as maximal scatter rather than dividing by zero", () => {
    expect(spacingCv([0.5, 0.5, 0.5])).toBe(1);
  });

  it("is order-independent and reads the truth as even", () => {
    expect(spacingCv([1, 0, 0.5])).toBeCloseTo(0, 9);
    expect(spacingCv(evenMarks(6))).toBeCloseTo(0, 9);
  });
});

describe("paths", () => {
  const straight = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ];

  it("walks arc length", () => {
    expect(pathLength(straight)).toBeCloseTo(10, 9);
    expect(pointAt(straight, false, 0.5).pt.x).toBeCloseTo(5, 9);
    expect(pointAt(straight, false, 1).pt.x).toBeCloseTo(10, 9);
  });

  it("slices between two fractions", () => {
    const slice = pathSlice(straight, false, 0.2, 0.8, 2);
    expect(slice).toHaveLength(3);
    expect(slice[0].x).toBeCloseTo(2, 9);
    expect(slice[1].x).toBeCloseTo(5, 9);
    expect(slice[2].x).toBeCloseTo(8, 9);
  });

  it("projects a point back onto the path", () => {
    expect(nearestFraction(straight, false, { x: 3, y: 40 })).toBeCloseTo(0.3, 9);
  });
});

describe("opening values never hand the player the answer", () => {
  it("jitters even marks while pinning the endpoints and keeping order", () => {
    for (let seed = 0; seed < 200; seed++) {
      const marks = jitterEven(6, mulberry32(seed));
      expect(marks[0]).toBe(0);
      expect(marks[marks.length - 1]).toBe(1);
      for (let i = 1; i < marks.length; i++) {
        expect(marks[i]).toBeGreaterThan(marks[i - 1]);
      }
    }
  });

  it("opens every task away from its truth, across 200 days", () => {
    for (let i = 0; i < 200; i++) {
      const chart = generate(addDays("2026-01-01", i * 3));
      for (const task of chart.tasks) {
        expect(JSON.stringify(openingValue(task))).not.toBe(JSON.stringify(task.truth));
      }
    }
  });
});

describe("small statistics", () => {
  it("computes median and IQR", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(iqr([1, 2, 3, 4, 5])).toBeCloseTo(2, 9);
  });
});
