/* ------------------------------------------------------------------
   Turning a run into a scored result (spec section 6). One place where
   errors, wagers, leagues, titles and badges come together, so the play
   phase, the reveal and the archive all agree.
   ------------------------------------------------------------------ */

import type { Chart } from "../daily/generate";
import type { ErrorReport, Sense } from "../tasks/types";
import { SENSES } from "../tasks/types";
import { biasPhrase } from "../tasks/geometry";
import { senseStat } from "../state";
import type { Store } from "../state";
import { badges, chartScore, scoreTask, titleFor } from "./score";
import type { Badge, TaskScore, Title, Wager } from "./score";
import type { PlayMark } from "./play";

export interface RunResult {
  chart: Chart;
  marks: Record<Sense, PlayMark>;
  errors: Record<Sense, ErrorReport>;
  tasks: TaskScore[];
  weighted: number;
  chartScore: number;
  leagues: number;
  title: Title;
  badges: Badge[];
  elapsedMs: number;
}

export function evaluate(
  chart: Chart,
  marks: Record<Sense, PlayMark>,
  errors: Record<Sense, ErrorReport>,
  elapsedMs: number,
  streak: number,
): RunResult {
  const tasks: TaskScore[] = chart.tasks.map((task) => {
    const wager: Wager = marks[task.sense]?.survey ? "SURVEY" : "SKETCH";
    return scoreTask(task.sense, errors[task.sense], task.par, wager);
  });
  const total = chartScore(tasks);
  const title = titleFor(total.leagues);
  const badgeList = badges({ tasks, elapsedMs, streak, practice: chart.practice });
  return {
    chart,
    marks,
    errors,
    tasks,
    weighted: total.weighted,
    chartScore: total.chart,
    leagues: total.leagues,
    title,
    badges: badgeList,
    elapsedMs,
  };
}

/** Per-sense signed errors, for the MY EYE statistics. */
export function signedErrors(errors: Record<Sense, ErrorReport>): Record<Sense, number> {
  const out = {} as Record<Sense, number>;
  for (const sense of Object.keys(errors) as Sense[]) out[sense] = errors[sense].signed;
  return out;
}

/** The headline line for the end card and the live announcement. */
export function headline(result: RunResult): string {
  if (result.leagues === 0) return "A true chart. Not one league off.";
  return `${result.leagues} ${result.leagues === 1 ? "league" : "leagues"} off course. ${result.title.title}.`;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * One line about the player's own habits (spec section 6.4), drawn from
 * real dailies only. Returns null until there is enough to say anything
 * honest.
 */
export function biasLine(store: Store): string | null {
  let best: { phrase: string; mag: number } | null = null;
  for (const sense of SENSES) {
    const stat = senseStat(store, sense);
    if (stat.n < 3) continue;
    const phrase = biasPhrase(sense, stat.bias);
    if (!phrase) continue;
    const mag = Math.abs(stat.bias);
    if (!best || mag > best.mag) best = { phrase, mag };
  }
  if (!best) return null;
  return `Your eye so far: ${capitalise(best.phrase)}.`;
}

/** The sense with the tightest and the widest spread over real dailies. */
export function surestAndShakiest(store: Store): { surest: Sense | null; shakiest: Sense | null } {
  let surest: { sense: Sense; spread: number } | null = null;
  let shakiest: { sense: Sense; spread: number } | null = null;
  for (const sense of SENSES) {
    const stat = senseStat(store, sense);
    if (stat.n < 3) continue;
    if (!surest || stat.spread < surest.spread) surest = { sense, spread: stat.spread };
    if (!shakiest || stat.spread > shakiest.spread) shakiest = { sense, spread: stat.spread };
  }
  return { surest: surest?.sense ?? null, shakiest: shakiest?.sense ?? null };
}
