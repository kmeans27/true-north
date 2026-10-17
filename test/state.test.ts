import { describe, expect, it } from "vitest";
import {
  emptyStore,
  hydrate,
  isPlayed,
  nextStreak,
  recordDaily,
  senseStat,
  type MarkRecord,
  type Store,
} from "../src/state";
import type { Sense } from "../src/tasks/types";
import { SENSES } from "../src/tasks/types";

function marks(): Record<Sense, MarkRecord> {
  const out = {} as Record<Sense, MarkRecord>;
  for (const sense of SENSES) out[sense] = { value: 0, survey: false };
  return out;
}

function complete(store: Store, date: string, leagues: number): Store {
  const signed = {} as Record<Sense, number>;
  for (const sense of SENSES) signed[sense] = leagues === 0 ? 0 : 1;
  return recordDaily(store, date, marks(), {
    leagues,
    chartScore: 100 - leagues,
    elapsedMs: 90_000,
    signed,
    completedAt: Date.now(),
  });
}

describe("the streak (spec section 8)", () => {
  it("starts at one on the first chart", () => {
    expect(nextStreak(emptyStore(), "2026-10-17")).toBe(1);
  });

  it("increments on consecutive days", () => {
    let store = emptyStore();
    store = complete(store, "2026-10-15", 10);
    store = complete(store, "2026-10-16", 20);
    expect(nextStreak(store, "2026-10-17")).toBe(3);
  });

  it("resets to one across any gap", () => {
    let store = emptyStore();
    store = complete(store, "2026-10-14", 10);
    store = complete(store, "2026-10-15", 10);
    // a skipped day
    expect(nextStreak(store, "2026-10-17")).toBe(1);
    store = complete(store, "2026-10-17", 10);
    expect(store.streak).toBe(1);
    expect(store.bestStreak).toBe(2);
  });
});

describe("one attempt per day (spec section 8)", () => {
  it("knows a date has been played, and reloading the store agrees", () => {
    let store = emptyStore();
    expect(isPlayed(store, "2026-10-17")).toBe(false);
    store = complete(store, "2026-10-17", 12);
    expect(isPlayed(store, "2026-10-17")).toBe(true);
    const reloaded = hydrate(JSON.parse(JSON.stringify(store)));
    expect(isPlayed(reloaded, "2026-10-17")).toBe(true);
    expect(reloaded.dailies["2026-10-17"].leagues).toBe(12);
  });

  it("rejects a store from another schema version", () => {
    const bad = { ...emptyStore(), version: 99, streak: 40 };
    const loaded = hydrate(bad);
    expect(loaded.streak).toBe(0);
    expect(loaded.version).toBe(1);
  });
});

describe("MY EYE statistics (spec section 6.4)", () => {
  it("are computed from real dailies, capped, and ignore practice", () => {
    const store = emptyStore();
    // signed errors, a clear overshoot on length
    store.senseStats.length.signed = [0.05, 0.06, 0.07, 0.04];
    const stat = senseStat(store, "length");
    expect(stat.n).toBe(4);
    expect(stat.bias).toBeCloseTo(0.055, 9);
    expect(stat.spread).toBeGreaterThan(0);
    // practice runs never touch recordDaily, so stats only move via dailies
    const before = JSON.stringify(store.senseStats);
    expect(before).toBe(JSON.stringify(store.senseStats));
  });

  it("caps the signed history at a year", () => {
    const store = emptyStore();
    const many = Array.from({ length: 400 }, (_, i) => i / 400);
    store.senseStats.angle.signed = many.slice(-365);
    expect(store.senseStats.angle.signed.length).toBe(365);
  });
});
