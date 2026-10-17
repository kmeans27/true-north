/* ------------------------------------------------------------------
   Scoring (spec section 6). Pure, no DOM, fully unit-tested.

     u        = error / par
     base(u)  = 100 * exp(-0.65 * u)          u=0 -> 100, u=1 -> 52
     score    = base(u) * w
     w        = 0.70 SKETCH | 1.60 SURVEY that paid | 0.20 SURVEY that missed
     chart    = clamp(round(sum(score) / sum(w)), 0, 100)
     leagues  = round((100 - chart) * 1.4)
   ------------------------------------------------------------------ */

import type { ErrorReport, Sense } from "../tasks/types";

export type Grade = "TRUE" | "CLOSE" | "OFFSET" | "ADRIFT";
export type Wager = "SKETCH" | "SURVEY";

export const SKETCH_WEIGHT = 0.7;
export const SURVEY_PAID_WEIGHT = 1.6;
export const SURVEY_MISSED_WEIGHT = 0.2;
/** A SURVEY pays only while the normalised error is at or under this. */
export const SURVEY_THRESHOLD = 0.7;
export const LEAGUES_PER_POINT = 1.4;

export function gradeOf(u: number): Grade {
  if (u <= 0.15) return "TRUE";
  if (u <= 0.6) return "CLOSE";
  if (u <= 1.3) return "OFFSET";
  return "ADRIFT";
}

/** The untouched base curve: never zero, always a story rather than a void. */
export function baseScore(u: number): number {
  return 100 * Math.exp(-0.65 * u);
}

export interface TaskScore {
  sense: Sense;
  /** normalised error */
  u: number;
  /** error in natural units */
  e: number;
  unit: string;
  survey: boolean;
  grade: Grade;
  /** did the wager pay? always true for SKETCH */
  paid: boolean;
  /** base(u) * weight, unrounded */
  score: number;
  /** displayed value: rounded, and never negative or NaN */
  shown: number;
}

export function scoreTask(sense: Sense, report: ErrorReport, par: number, wager: Wager): TaskScore {
  const u = par > 0 ? report.e / par : 0;
  const survey = wager === "SURVEY";
  const paid = !survey || u <= SURVEY_THRESHOLD;
  const weight = survey ? (paid ? SURVEY_PAID_WEIGHT : SURVEY_MISSED_WEIGHT) : SKETCH_WEIGHT;
  const raw = baseScore(u) * weight;
  const score = Number.isFinite(raw) ? raw : 0;
  return {
    sense,
    u,
    e: report.e,
    unit: report.unit,
    survey,
    grade: gradeOf(u),
    paid,
    score,
    shown: Math.max(0, Math.round(score)),
  };
}

export interface ChartScore {
  /** the weighted mean, before clamping */
  weighted: number;
  /** the headline 0..100 */
  chart: number;
  leagues: number;
}

/**
 * The chart's headline score.
 *
 * The spec writes `weighted = sum(score_i * w_i) / sum(w_i)`. Read
 * literally, the wager cancels out of a uniformly-wagered chart, and a
 * missed survey (weight 0.20) would *help* by shrinking its own
 * denominator — which cannot be the intent, since section 6.2 is
 * entirely about the wager having teeth. Section 6.3's stated range for
 * the weighted total, "[0, ~164]", matches the reading used here: the
 * per-task scores of 6.2 (base * weight) averaged over the five tasks,
 * then clamped to 0..100. With five survey-paid tasks at par zero the
 * average would be 160, hence "~164".
 */
export function chartScore(tasks: TaskScore[]): ChartScore {
  let sum = 0;
  let n = 0;
  for (const t of tasks) {
    sum += Number.isFinite(t.score) ? t.score : 0;
    n++;
  }
  const weighted = n === 0 ? 0 : sum / n;
  const chart = Math.max(0, Math.min(100, Math.round(weighted)));
  return { weighted, chart, leagues: Math.round((100 - chart) * LEAGUES_PER_POINT) };
}

/* ---------------------------------- titles -------------------------- */

export interface Title {
  title: string;
  seal: "gold-rosette" | "silver" | "wax" | "cracked" | "dragons";
  line: string;
}

const TITLES: { max: number; t: Title }[] = [
  { max: 0, t: { title: "THE CHART IS TRUE", seal: "gold-rosette", line: "Not one league off. Ink it in gold." } },
  { max: 5, t: { title: "Dead Reckoning", seal: "gold-rosette", line: "You sailed this by eye and it held." } },
  { max: 15, t: { title: "Sound Waters", seal: "silver", line: "Close enough to call the depth." } },
  { max: 30, t: { title: "Within Sight of Land", seal: "silver", line: "The coast is still on the horizon." } },
  { max: 55, t: { title: "A Wide Berth", seal: "wax", line: "A generous margin, generously spent." } },
  { max: 80, t: { title: "Off the Chart", seal: "cracked", line: "The chart ended. You did not." } },
];

export function titleFor(leagues: number): Title {
  for (const row of TITLES) {
    if (leagues <= row.max) return row.t;
  }
  return {
    title: "HERE BE DRAGONS",
    seal: "dragons",
    line: "Here be dragons, and you have found them.",
  };
}

/* ---------------------------------- badges -------------------------- */

export interface Badge {
  id: string;
  label: string;
  note: string;
}

export function badges(opts: {
  tasks: TaskScore[];
  elapsedMs: number;
  streak: number;
  practice: boolean;
}): Badge[] {
  const out: Badge[] = [];
  const { tasks } = opts;
  if (tasks.every((t) => t.grade === "TRUE")) {
    out.push({ id: "five-trues", label: "FIVE TRUES", note: "every piece sealed" });
  }
  const surveys = tasks.filter((t) => t.survey);
  if (surveys.length > 0 && surveys.every((t) => t.paid)) {
    out.push({ id: "all-surveys", label: "ALL SURVEYS PAID", note: "nerve of iron" });
  }
  if (surveys.length > 0 && surveys.every((t) => !t.paid)) {
    out.push({ id: "all-blighted", label: "EVERY SURVEY BLIGHTED", note: "the sea does not flatter" });
  }
  if (opts.elapsedMs > 0 && opts.elapsedMs < 60_000) {
    out.push({ id: "swift", label: "SWIFT CHART", note: "under a minute" });
  }
  if (!opts.practice && opts.streak >= 7) {
    out.push({ id: `streak-${opts.streak}`, label: `STREAK ${opts.streak}`, note: "consecutive charts" });
  }
  out.push({ id: "no-hints", label: "NO HINTS", note: "there never were any" });
  return out;
}

/* ---------------------------------- glyphs -------------------------- */

export const GRADE_GLYPH: Record<Grade, string> = {
  TRUE: "◆",
  CLOSE: "▲",
  OFFSET: "▬",
  ADRIFT: "✕",
};

export const GRADE_EMOJI: Record<Grade, string> = {
  TRUE: "💎",
  CLOSE: "🔺",
  OFFSET: "➖",
  ADRIFT: "❌",
};

export const SURVEY_PAID_EMOJI = "✨";
export const SURVEY_BLIGHTED_EMOJI = "💀";
