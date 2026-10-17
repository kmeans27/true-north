/* ------------------------------------------------------------------
   Daily generation (spec section 7)

   seed = fnv1a("truenorth:" + YYYY-MM-DD)     (UTC)
   rng  = mulberry32(seed)

   Everything the chart contains — geometry, which senses appear, in
   which order, every parameter, every reference — is drawn from that
   seed. Same date, byte-identical chart, on every device, forever.
   ------------------------------------------------------------------ */

import { fnv1a, mulberry32, shuffle, pick, daysBetween, utcDateKey, mondayIndex, mod } from "./seed";
import type { Rng } from "./seed";
import { makeGeometry, ZONES } from "../chart/geometry";
import type { ChartGeometry, ChartZone } from "../chart/geometry";
import { BANKS } from "./banks";
import { makeCtx } from "./banks/helpers";
import { chartNumberOf, chartForDate } from "./names";
import { SENSES } from "../tasks/types";
import type { Sense, Task } from "../tasks/types";

export interface Chart {
  /** the calendar day this chart belongs to (UTC) */
  date: string;
  /** the key the chart was seeded with — a date, or a practice key */
  seedKey: string;
  /** chart number, days since epoch start, 1-based */
  number: number;
  name: string;
  accent: string;
  sea: string;
  /** 0 = Monday .. 6 = Sunday */
  weekday: number;
  practice: boolean;
  geometry: ChartGeometry;
  tasks: Task[];
}

const OPENERS: Sense[] = ["centre", "spacing"];
const CLOSERS: Sense[] = ["proportion", "angle"];

/** Decorrelate which bank entry each sense is on. */
const BANK_OFFSET: Record<Sense, number> = {
  length: fnv1a("truenorth:bank:length") % BANKS.length.length,
  angle: fnv1a("truenorth:bank:angle") % BANKS.angle.length,
  centre: fnv1a("truenorth:bank:centre") % BANKS.centre.length,
  proportion: fnv1a("truenorth:bank:proportion") % BANKS.proportion.length,
  spacing: fnv1a("truenorth:bank:spacing") % BANKS.spacing.length,
};

/**
 * The order of the five senses (spec section 7): pips are shuffled, but
 * the chart always opens with an easy one and closes with a hard one.
 */
export function senseOrder(rng: Rng): Sense[] {
  const opener = pick(rng, OPENERS);
  const closer = pick(rng, CLOSERS);
  const middle = shuffle(
    rng,
    SENSES.filter((s) => s !== opener && s !== closer),
  );
  return [opener, ...middle, closer];
}

/**
 * Zone allocation. A length bar is drawn at true scale along a
 * full-width band, so it claims its whole row; everything else stays
 * inside its own zone.
 */
export function allocateZones(rng: Rng, senses: Sense[]): Record<Sense, ChartZone> {
  const pool = shuffle(rng, ZONES);
  const out = {} as Record<Sense, ChartZone>;
  let available = pool.slice();

  const lengthZone =
    available.find((z) => z.col !== "right") ?? available[0];
  out.length = lengthZone;
  if (senses.includes("length")) {
    available = available.filter((z) => z.row !== lengthZone.row);
  } else {
    available = available.filter((z) => z !== lengthZone);
  }

  for (const sense of senses) {
    if (sense === "length") continue;
    const z = available.shift();
    if (!z) {
      // seven zones, five tasks: this can only happen if the definition
      // table is edited badly. Fall back to the first zone rather than throw.
      out[sense] = ZONES[0];
      continue;
    }
    out[sense] = z;
  }
  return out;
}

export function generate(dateKey: string, opts: { seedKey?: string; practice?: boolean } = {}): Chart {
  const seedKey = opts.seedKey ?? dateKey;
  const practice = opts.practice ?? false;
  const rng = mulberry32(fnv1a("truenorth:" + seedKey));

  const weekday = mondayIndex(dateKey);
  const named = chartForDate(dateKey);
  const number = Math.max(1, chartNumberOf(dateKey, daysBetween));

  const roseRot = rng() * 360;
  const geometry = makeGeometry(rng, roseRot);

  const senses = senseOrder(rng);
  const zones = allocateZones(rng, senses);

  const tasks: Task[] = [];
  senses.forEach((sense, i) => {
    const bank = BANKS[sense];
    const start = mod(number + BANK_OFFSET[sense], bank.length);
    let built: Task | null = null;
    for (let attempt = 0; attempt < bank.length && !built; attempt++) {
      const idx = (start + attempt) % bank.length;
      const entry = bank[idx];
      // Each attempt gets its own deterministic stream, so a rejected
      // entry cannot shift the parameters of the accepted one.
      const stream = mulberry32(fnv1a(`${seedKey}|${sense}|${attempt}`));
      const ctx = makeCtx(stream, geometry, zones[sense]);
      const result = entry.build(ctx);
      if (!result) continue;
      built = {
        id: `${sense}-${i + 1}`,
        sense,
        variant: entry.variant ?? result.scene.variant,
        prompt: entry.prompt,
        par: result.par,
        truth: result.truth,
        domain: result.domain,
        scene: result.scene,
        bankId: entry.id,
      };
    }
    if (!built) {
      throw new Error(`no bank entry fits for sense ${sense} on ${dateKey}`);
    }
    tasks.push(built);
  });

  return {
    date: dateKey,
    seedKey,
    number,
    name: named.name,
    accent: named.accent,
    sea: named.sea,
    weekday,
    practice,
    geometry,
    tasks,
  };
}

/** A practice chart: a random seed, unlimited, never counted. */
export function practiceChart(n: number, dateKey = utcDateKey()): Chart {
  return generate(dateKey, { seedKey: `practice:${n >>> 0}`, practice: true });
}

/** Deterministic sanity clamp used by the generator tests. */
export function truthWithinDomain(task: Task): boolean {
  const { truth, domain, sense } = task;
  if (sense === "centre" || sense === "spacing") return true;
  const v = truth as number;
  if (sense === "angle") return v >= 0 && v < 360;
  return v >= domain.min && v <= domain.max;
}
