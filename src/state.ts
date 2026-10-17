/* ------------------------------------------------------------------
   Persistence (spec section 8)

   One versioned localStorage key holds everything: the streak, the
   results, the signed errors that feed MY EYE, and the preferences.
   Nothing leaves the browser; there is no anti-cheat budget beyond
   keeping the truth out of the DOM.
   ------------------------------------------------------------------ */

import type { Sense, Value } from "./tasks/types";
import { SENSES } from "./tasks/types";
import { addDays, daysBetween, utcDateKey } from "./daily/seed";
import { iqr, median } from "./tasks/geometry";

export const STORE_KEY = "truenorth:v1";

export interface MarkRecord {
  value: Value;
  survey: boolean;
}

export interface DailyResult {
  date: string;
  leagues: number;
  chartScore: number;
  marks: Record<Sense, MarkRecord>;
  elapsedMs: number;
  completedAt: number;
}

export interface Prefs {
  reducedMotion: boolean;
  sound: boolean;
  theme: "day" | "night";
  /** the first-run overlay has been shown */
  onboarded: boolean;
}

export interface Store {
  version: 1;
  streak: number;
  bestStreak: number;
  lastDailyDate: string | null;
  dailies: Record<string, DailyResult>;
  senseStats: Record<Sense, { signed: number[] }>;
  prefs: Prefs;
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function emptyStore(): Store {
  return {
    version: 1,
    streak: 0,
    bestStreak: 0,
    lastDailyDate: null,
    dailies: {},
    senseStats: {
      length: { signed: [] },
      angle: { signed: [] },
      centre: { signed: [] },
      proportion: { signed: [] },
      spacing: { signed: [] },
    },
    prefs: { reducedMotion: prefersReducedMotion(), sound: false, theme: "day", onboarded: false },
  };
}

/** Merge a stored blob over a fresh store, ignoring anything malformed. */
export function hydrate(raw: unknown): Store {
  const base = emptyStore();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<Store>;
  if (s.version !== 1) return base;
  if (typeof s.streak === "number" && s.streak >= 0) base.streak = Math.floor(s.streak);
  if (typeof s.bestStreak === "number" && s.bestStreak >= 0) base.bestStreak = Math.floor(s.bestStreak);
  if (typeof s.lastDailyDate === "string" || s.lastDailyDate === null) base.lastDailyDate = s.lastDailyDate ?? null;
  if (s.dailies && typeof s.dailies === "object") base.dailies = s.dailies;
  if (s.senseStats && typeof s.senseStats === "object") {
    for (const sense of SENSES) {
      const arr = (s.senseStats as Store["senseStats"])[sense]?.signed;
      if (Array.isArray(arr)) base.senseStats[sense].signed = arr.filter((n) => Number.isFinite(n)).slice(-365);
    }
  }
  if (s.prefs && typeof s.prefs === "object") {
    base.prefs = { ...base.prefs, ...s.prefs };
    if (base.prefs.theme !== "night") base.prefs.theme = "day";
    base.prefs.sound = !!base.prefs.sound;
    base.prefs.reducedMotion = !!base.prefs.reducedMotion;
    base.prefs.onboarded = !!base.prefs.onboarded;
  }
  return base;
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return hydrate(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* private mode, quota: play on regardless */
  }
}

export function clearStore(): Store {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
  return emptyStore();
}

/* ---------------------------------- rules --------------------------- */

export function isPlayed(store: Store, date: string): boolean {
  return Object.prototype.hasOwnProperty.call(store.dailies, date);
}

/** The stored result for a date, or null. */
export function resultFor(store: Store, date: string): DailyResult | null {
  return store.dailies[date] ?? null;
}

/** Consecutive completed dailies, resetting on any gap. */
export function nextStreak(store: Store, date: string): number {
  const last = store.lastDailyDate;
  if (!last) return 1;
  const gap = daysBetween(last, date);
  if (gap === 1) return store.streak + 1;
  if (gap === 0) return store.streak;
  return 1;
}

export interface Outcome {
  leagues: number;
  chartScore: number;
  elapsedMs: number;
  signed: Record<Sense, number>;
  completedAt: number;
}

/**
 * Record a completed daily. Only real dailies touch the streak and the
 * MY EYE statistics; practice runs never reach this function.
 */
export function recordDaily(store: Store, date: string, marks: Record<Sense, MarkRecord>, outcome: Outcome): Store {
  const streak = nextStreak(store, date);
  store.dailies[date] = {
    date,
    leagues: outcome.leagues,
    chartScore: outcome.chartScore,
    marks,
    elapsedMs: outcome.elapsedMs,
    completedAt: outcome.completedAt,
  };
  store.streak = streak;
  store.bestStreak = Math.max(store.bestStreak, streak);
  store.lastDailyDate = date;
  for (const sense of SENSES) {
    const s = outcome.signed[sense];
    if (Number.isFinite(s)) {
      const arr = store.senseStats[sense].signed;
      arr.push(s);
      if (arr.length > 365) arr.splice(0, arr.length - 365);
    }
  }
  saveStore(store);
  return store;
}

/* ---------------------------------- MY EYE -------------------------- */

export interface SenseStat {
  n: number;
  /** median signed error, in the sense's natural units */
  bias: number;
  /** inter-quartile range of the signed error: precision, not accuracy */
  spread: number;
}

export function senseStat(store: Store, sense: Sense): SenseStat {
  const xs = store.senseStats[sense].signed;
  if (xs.length === 0) return { n: 0, bias: 0, spread: 0 };
  return { n: xs.length, bias: median(xs), spread: iqr(xs) };
}

/** The last `n` real dailies, oldest first. */
export function recentDailies(store: Store, n = 30): DailyResult[] {
  return Object.values(store.dailies)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-n);
}

export function totalCharts(store: Store): number {
  return Object.keys(store.dailies).length;
}

export function yesterdayKey(date = utcDateKey()): string {
  return addDays(date, -1);
}
