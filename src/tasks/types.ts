/* ------------------------------------------------------------------
   Task model (spec section 4, "Task definition contract")

   Every task is blind, scale-invariant and driven by exactly one
   scalar value (or one point) from exactly one drag handle.
   ------------------------------------------------------------------ */

export type Sense = "length" | "angle" | "centre" | "proportion" | "spacing";

export const SENSES: readonly Sense[] = [
  "length",
  "angle",
  "centre",
  "proportion",
  "spacing",
] as const;

export const SENSE_LABEL: Record<Sense, string> = {
  length: "length",
  angle: "angle",
  centre: "centre",
  proportion: "proportion",
  spacing: "spacing",
};

export interface Pt {
  x: number;
  y: number;
}

/** A single scalar, a point, or an ordered set of positions along a path. */
export type Value = number | Pt | number[];
export type Truth = Value;

export interface Domain {
  min: number;
  max: number;
  step: number;
}

/** A rectangle in chart space, in which a task's annotation is laid out. */
export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A visible chart feature the player is asked to match (section 4). */
export interface LengthRef {
  /** e.g. "frameTop", "roseHeight", "rhumbGap" */
  kind: string;
  /** ink-soft caption, drawn on the chart: which span is meant */
  caption: string;
  a: Pt;
  b: Pt;
  len: number;
}

export interface AngleSource {
  vertex: Pt;
  /** arm directions, degrees, screen space; exactly two */
  arms: [number, number];
  armLength: number;
  caption: string;
}

export type AngleVariant = "bisect" | "perpendicular" | "copy";

export type Scene =
  | {
      kind: "length";
      variant: string;
      zone: Zone;
      origin: Pt;
      /** unit direction the bar grows along */
      dir: Pt;
      ref: LengthRef;
      /** scene-space length of the longest bar the player may drag */
      maxLen: number;
      /** scene-space length of the visible reference span */
      refLen: number;
    }
  | {
      kind: "angle";
      variant: AngleVariant;
      zone: Zone;
      vertex: Pt;
      /**
       * Fixed arms drawn as rays from the vertex, in degrees. Bisect:
       * the two arms of the channel. Copy: the single arm the angle is
       * opened from. Perpendicular: none.
       */
      arms: number[];
      /** a straight wall the needle must strike square (perpendicular only) */
      wall?: [Pt, Pt];
      /** the wedge to be copied (copy only) */
      source?: AngleSource;
      /** scene-space length of the rotating needle */
      armLength: number;
      /** where the needle points when the task opens (never equal to truth) */
      start: number;
    }
  | {
      kind: "centre";
      variant: string;
      zone: Zone;
      /** the region whose centre is the target; its outline is drawn on the chart */
      region: Pt[];
      /** drag bounds in normalised region space */
      start: Pt;
      caption: string;
    }
  | {
      kind: "proportion";
      variant: string;
      zone: Zone;
      path: Pt[];
      /** closed paths are measured all the way round */
      closed: boolean;
      /** ink-soft caption drawn at the mid-point of the measured path */
      caption: string;
      /** where the handle sits when the task opens */
      start: number;
    }
  | {
      kind: "spacing";
      variant: string;
      zone: Zone;
      path: Pt[];
      closed: boolean;
      /** total number of marks, including the two pre-placed endpoints */
      n: number;
      caption: string;
    };

export interface Task {
  /** "length-3" — stable within a chart */
  id: string;
  sense: Sense;
  variant?: string;
  /** one sentence, <= 46 chars, no numerals */
  prompt: string;
  /** par error P, in the sense's natural units */
  par: number;
  truth: Truth;
  domain: Domain;
  scene: Scene;
  /** bank entry that produced this task */
  bankId: string;
}

/** Everything a sense widget needs to mount itself into the chart. */
export interface WidgetCtx {
  svg: SVGSVGElement;
  /** the layer the widget draws itself into */
  layer: SVGGElement;
  task: Task;
  /** where the handle sits when the task opens (never the truth) */
  initial: Value;
  onChange?(v: Value): void;
}

/** What a widget hands back to the play loop. */
export interface Widget {
  /** the interactive SVG group, already appended to the chart */
  layer: SVGGElement;
  getValue(): Value;
  setValue(v: Value): void;
  /** freeze the piece after SIGN: no more input, visual dim */
  freeze(): void;
  /** point the widget at a fresh value and pulse the handle (next task) */
  destroy(): void;
  /** move keyboard focus to the handle */
  focus(): void;
}

export interface ErrorReport {
  /** error in the sense's natural unit */
  e: number;
  /** "%" | "deg" | "pp" | "" (relative) */
  unit: string;
  /** signed error in natural units, for the bias profile (NaN when meaningless) */
  signed: number;
  /** human wording, e.g. "two and a half degrees off true" */
  text: string;
}
