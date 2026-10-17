/* ------------------------------------------------------------------
   Bank entry contract (spec section 7.1 / section 15)

   A bank entry is one authored question: "what can a person see on
   this chart, and misjudge?" Entries are rotated deterministically by
   date, so a given sense cannot repeat a reference inside a month.

   `build` returns null when the entry cannot be drawn on this chart
   (no whale today, a reference too long for the space it has); the
   generator then walks on to the next entry in the rotation.
   ------------------------------------------------------------------ */

import type { Rng } from "../../daily/seed";
import type { ChartGeometry } from "../../chart/geometry";
import type { Domain, Pt, Scene, Truth, Zone } from "../../tasks/types";

export interface BankCtx {
  rng: Rng;
  geo: ChartGeometry;
  /** the reserved zone this task's annotation is laid out in */
  zone: Zone;
  /** zone-normalised (0..1) to chart space */
  at(nx: number, ny: number): Pt;
  /** a random point inside the zone, inset by `pad` */
  anywhere(pad?: number): Pt;
  /** a point at distance `len` from `from`, at `deg` (screen space, clockwise) */
  ray(from: Pt, deg: number, len: number): Pt;
}

export interface Built {
  scene: Scene;
  truth: Truth;
  par: number;
  domain: Domain;
}

export interface Entry {
  id: string;
  /** one sentence, <= 46 chars, no numerals */
  prompt: string;
  variant?: string;
  build(ctx: BankCtx): Built | null;
}
