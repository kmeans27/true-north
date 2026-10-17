/* ------------------------------------------------------------------
   Rebuilding a past chart from the store (spec section 10.6).

   Charts are a pure function of the date, and the stored result keeps
   the player's marks, so any past run can be scored again exactly.
   ------------------------------------------------------------------ */

import { generate } from "../daily/generate";
import { errorForTask } from "../tasks";
import type { ErrorReport, Sense } from "../tasks/types";
import type { Store } from "../state";
import { evaluate } from "./progress";
import type { RunResult } from "./progress";

export function reconstruct(store: Store, date: string): RunResult | null {
  const stored = store.dailies[date];
  if (!stored) return null;
  const chart = generate(date);
  const errors = {} as Record<Sense, ErrorReport>;
  for (const task of chart.tasks) {
    const mark = stored.marks[task.sense];
    if (mark) errors[task.sense] = errorForTask(task, mark.value);
  }
  return evaluate(chart, stored.marks, errors, stored.elapsedMs, 0);
}
