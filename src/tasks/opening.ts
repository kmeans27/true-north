/* ------------------------------------------------------------------
   Where each handle sits when a task opens (spec section 5).

   The start position is deterministic per chart, so two players see the
   same puzzle, but it is never the truth and never a "hint": it is
   simply somewhere else on the path. Length opens well short or well
   long; angle, centre and proportion open wherever the bank placed
   them; spacing opens as a hand-drawn handful of marks, jittered off
   even but not by much.
   ------------------------------------------------------------------ */

import { clamp, fnv1a, mulberry32 } from "../daily/seed";
import type { Rng } from "../daily/seed";
import type { Scene, Task, Value } from "./types";

type AngleScene = Extract<Scene, { kind: "angle" }>;
type CentreScene = Extract<Scene, { kind: "centre" }>;
type ProportionScene = Extract<Scene, { kind: "proportion" }>;
type SpacingScene = Extract<Scene, { kind: "spacing" }>;

/**
 * N marks, endpoints exactly on zero and one, interior marks jittered
 * off even and then pushed apart so they can never cross.
 */
export function jitterEven(n: number, rng: Rng): number[] {
  const mid: number[] = [];
  for (let i = 1; i <= n - 2; i++) mid.push(i / (n - 1) + (rng() * 2 - 1) * 0.055);
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < mid.length; i++) {
      const lo = (i === 0 ? 0 : mid[i - 1]) + 0.018;
      const hi = (i === mid.length - 1 ? 1 : mid[i + 1]) - 0.018;
      mid[i] = clamp(mid[i], Math.min(lo, hi), Math.max(lo, hi));
    }
  }
  return [0, ...mid, 1];
}

/** The opening value for a task, always away from the truth. */
export function openingValue(task: Task): Value {
  const rng = mulberry32(fnv1a(`open|${task.id}|${task.bankId}`));
  switch (task.sense) {
    case "length": {
      const { min, max } = task.domain;
      const t = task.truth as number;
      const span = max - min;
      const away = span * (0.22 + rng() * 0.18);
      let v = rng() < 0.5 ? t + away : t - away;
      if (v < min || v > max) v = t - (v - t);
      if (v < min || v > max) v = min + span * rng();
      return clamp(v, min, max);
    }
    case "angle":
      return (task.scene as AngleScene).start;
    case "centre":
      return { ...(task.scene as CentreScene).start };
    case "proportion":
      return (task.scene as ProportionScene).start;
    case "spacing":
      return jitterEven((task.scene as SpacingScene).n, rng);
  }
}
