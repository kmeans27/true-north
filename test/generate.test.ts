import { describe, expect, it } from "vitest";
import { generate, practiceChart, senseOrder, truthWithinDomain } from "../src/daily/generate";
import { mulberry32, addDays } from "../src/daily/seed";
import { SENSES } from "../src/tasks/types";
import { BANKS } from "../src/daily/banks";

describe("determinism (spec section 7)", () => {
  it("is deep-equal across runs", () => {
    expect(generate("2026-10-17")).toEqual(generate("2026-10-17"));
  });

  it("differs from the next day", () => {
    const a = JSON.stringify(generate("2026-10-17"));
    const b = JSON.stringify(generate("2026-10-18"));
    expect(a).not.toBe(b);
  });

  it("practice charts are seeded by their own key and labelled", () => {
    expect(practiceChart(7).practice).toBe(true);
    expect(practiceChart(7)).toEqual(practiceChart(7));
    expect(JSON.stringify(practiceChart(7))).not.toBe(JSON.stringify(practiceChart(8)));
    expect(practiceChart(7).seedKey).toBe("practice:7");
  });
});

describe("composition rules", () => {
  it("always has exactly five tasks, one per sense", () => {
    for (let i = 0; i < 120; i++) {
      const chart = generate(addDays("2026-01-01", i * 7 + 3));
      expect(chart.tasks).toHaveLength(5);
      const senses = chart.tasks.map((t) => t.sense).sort();
      expect(senses).toEqual([...SENSES].sort());
    }
  });

  it("opens easy and closes hard", () => {
    for (let i = 0; i < 400; i++) {
      const chart = generate(addDays("2025-03-01", i));
      const first = chart.tasks[0].sense;
      const last = chart.tasks[chart.tasks.length - 1].sense;
      expect(["centre", "spacing"]).toContain(first);
      expect(["proportion", "angle"]).toContain(last);
    }
  });

  it("never repeats a sense inside a chart", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const order = senseOrder(rng);
      expect(new Set(order).size).toBe(5);
    }
  });

  it("puts every truth inside its documented domain", () => {
    for (let i = 0; i < 400; i++) {
      const chart = generate(addDays("2026-01-01", i));
      for (const task of chart.tasks) {
        expect(truthWithinDomain(task)).toBe(true);
      }
    }
  });

  it("keeps length and angle truths off round numbers", () => {
    for (let i = 0; i < 200; i++) {
      const chart = generate(addDays("2026-01-01", i));
      for (const task of chart.tasks) {
        if (task.sense === "length") {
          const rel = Math.abs((task.truth as number) / 0.05 - Math.round((task.truth as number) / 0.05));
          expect(rel).toBeGreaterThan(0.1);
        }
        if (task.sense === "angle") {
          const v = task.truth as number;
          expect(Math.abs(v % 45)).toBeGreaterThan(1.2);
        }
      }
    }
  });

  it("walks 400 consecutive dates with zero constraint violations", () => {
    for (let i = 0; i < 400; i++) {
      const date = addDays("2026-01-01", i);
      const chart = generate(date);
      expect(chart.tasks).toHaveLength(5);
      expect(chart.date).toBe(date);
      expect(chart.name.length).toBeGreaterThan(3);
      for (const task of chart.tasks) {
        expect(task.prompt.length).toBeLessThanOrEqual(46);
        expect(/\d/.test(task.prompt)).toBe(false);
        expect(task.par).toBeGreaterThan(0);
      }
    }
  });
});

describe("content depth (spec M8)", () => {
  it("ships at least twenty references or variants per sense", () => {
    for (const sense of SENSES) {
      expect(BANKS[sense].length).toBeGreaterThanOrEqual(20);
    }
  });

  it("holds every prompt to one short, digit-free sentence", () => {
    for (const sense of SENSES) {
      for (const entry of BANKS[sense]) {
        expect(entry.prompt.length).toBeLessThanOrEqual(46);
        expect(/\d/.test(entry.prompt)).toBe(false);
        expect(entry.prompt.trim().endsWith(".")).toBe(true);
      }
    }
  });

  it("does not repeat a reference within fourteen days for a given sense", () => {
    for (const sense of SENSES) {
      const lastSeen = new Map<string, number>();
      for (let i = 0; i < 400; i++) {
        const chart = generate(addDays("2026-01-01", i));
        const task = chart.tasks.find((t) => t.sense === sense)!;
        const prev = lastSeen.get(task.bankId);
        if (prev !== undefined) {
          // entries rotate one step per day, so a repeat cannot be nearer
          // than one full pass of the bank
          expect(i - prev).toBeGreaterThanOrEqual(BANKS[sense].length);
        }
        lastSeen.set(task.bankId, i);
      }
    }
  });

  it("gives distinct bank ids", () => {
    for (const sense of SENSES) {
      const ids = BANKS[sense].map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
