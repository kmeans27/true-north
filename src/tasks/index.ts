/* ------------------------------------------------------------------
   The sense registry (spec section 4 / M2)

   One module per sense, behind a single shape, so the play loop and the
   reveal never switch on the sense themselves.
   ------------------------------------------------------------------ */

import type { ErrorReport, Pt, Scene, Sense, Task, Value, Widget, WidgetCtx } from "./types";
import { errorOf, halfDiagonal } from "./geometry";
import * as length from "./length";
import * as angle from "./angle";
import * as centre from "./centre";
import * as proportion from "./proportion";
import * as spacing from "./spacing";

export interface SenseModule {
  /** the non-interactive chart annotation that shows what is being asked */
  annotations(scene: Scene): string;
  /** the draggable widget, appended to a layer by its caller */
  createWidget(ctx: WidgetCtx): Widget;
  /** the truth reveal for one task, as SVG markup */
  revealMarkup(scene: Scene, value: Value, truth: Value, err: ErrorReport): string;
  /** where to point the first-run attention arrow, and at what angle */
  attention(scene: Scene, value: Value): { at: Pt; deg: number };
}

/**
 * The modules are structurally identical; TS cannot prove it across the
 * narrowed scene types, so the cast is deliberate and local to here.
 */
export const MODULES = {
  length,
  angle,
  centre,
  proportion,
  spacing,
} as unknown as Record<Sense, SenseModule>;

export function moduleFor(sense: Sense): SenseModule {
  return MODULES[sense];
}

/**
 * The error of one task against its truth, in the sense's natural unit.
 * The centre task measures against the region's half-diagonal, which
 * only the scene knows.
 */
export function errorForTask(task: Task, value: Value): ErrorReport {
  const halfDiag =
    task.sense === "centre"
      ? halfDiagonal((task.scene as Extract<Scene, { kind: "centre" }>).region)
      : undefined;
  return errorOf(task.sense, value, task.truth, { halfDiag });
}

export { openingValue, jitterEven } from "./opening";
export type { Sense, Task, Value, Widget, WidgetCtx, ErrorReport } from "./types";
