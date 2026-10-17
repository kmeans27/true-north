/* ------------------------------------------------------------------
   Deterministic daily engine — seed primitives (spec section 7)

   The chart for a UTC date is a pure function of that date. Every
   number in the game traces back to `fnv1a` + `mulberry32`, so the
   whole back catalogue is reconstructable offline, forever.
   ------------------------------------------------------------------ */

/** FNV-1a, 32 bit. Stable across engines, processes and platforms. */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** mulberry32. Uniform in [0,1). Deterministic, tiny, seedable. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_PREFIX = "truenorth:";

/** The one true seed for a date. */
export function dailySeed(dateKey: string): number {
  return fnv1a(SEED_PREFIX + dateKey);
}

/** Random seed for practice charts, from an arbitrary integer. */
export function practiceSeed(n: number): number {
  return fnv1a(SEED_PREFIX + "practice:" + String(n >>> 0));
}

/* ---------------------------------- dates --------------------------- */

const MS_DAY = 86_400_000;

/** "YYYY-MM-DD" in UTC. Any Date is accepted; local times are converted. */
export function utcDateKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${pad4(y)}-${pad2(m)}-${pad2(day)}`;
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}
function pad4(n: number): string {
  return n < 1000 ? String(n).padStart(4, "0") : String(n);
}

/** UTC midnight for a date key. Throws on malformed keys. */
export function dateFromKey(key: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`bad date key: ${key}`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) throw new Error(`bad date key: ${key}`);
  return d;
}

export function addDays(key: string, n: number): string {
  return utcDateKey(new Date(dateFromKey(key).getTime() + n * MS_DAY));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((dateFromKey(b).getTime() - dateFromKey(a).getTime()) / MS_DAY);
}

/** Milliseconds until the next UTC midnight — the next chart. */
export function msUntilNextUtcDay(now: Date = new Date()): number {
  const t = now.getTime();
  return MS_DAY - (((t % MS_DAY) + MS_DAY) % MS_DAY);
}

/** Weekday of a date key, 0 = Monday .. 6 = Sunday (spec's weekday accents). */
export function mondayIndex(key: string): number {
  const g = dateFromKey(key).getUTCDay(); // 0 = Sunday
  return (g + 6) % 7;
}

/* ---------------------------------- helpers ------------------------- */

/** Uniform in [min,max). */
export function rf(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Integer in [min,max]. */
export function ri(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("pick from empty array");
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function coin(rng: Rng): boolean {
  return rng() < 0.5;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Positive modulo: JS's % keeps the sign of the dividend. */
export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * A value that is never a culturally "round" number (spec section 7.1 /
 * section 15): round targets invite geometry tricks and flatter players
 * for free. `step` is the grid we are avoiding, `guard` the fraction of
 * a step to keep clear of it.
 */
export function nonRound(rng: Rng, min: number, max: number, step: number, guard = 0.18): number {
  const want = guard * step;
  let last = min;
  for (let attempt = 0; attempt < 12; attempt++) {
    const v = rf(rng, min, max);
    last = v;
    if (Math.abs(v - Math.round(v / step) * step) >= want) return v;
  }
  // Deterministic fallback: step off the nearest grid point, inside bounds.
  const nearest = Math.round(last / step) * step;
  for (const signed of [1, -1]) {
    const candidate = last >= nearest ? nearest + want * 1.05 * signed : nearest - want * 1.05 * signed;
    if (candidate >= min && candidate <= max) return candidate;
  }
  return clamp(last, min, max);
}

/** Roman numerals, used for the chart number so play stays digit-free. */
export function roman(n: number): string {
  if (n <= 0) return "—";
  if (n >= 4000) return String(n); // never happens; safety valve
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [value, glyph] of table) {
    while (v >= value) {
      out += glyph;
      v -= value;
    }
  }
  return out;
}

const ORDINALS = [
  "zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
  "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth",
  "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth",
];
const TENS = [
  "", "", "twentieth", "thirtieth", "fortieth", "fiftieth", "sixtieth",
  "seventieth", "eightieth", "ninetieth",
];
const TENS_ADJ = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
];

/** "seventeenth" — used so the cartouche never prints a digit. */
export function ordinalWord(n: number): string {
  if (n < 20) return ORDINALS[n] ?? String(n);
  if (n % 10 === 0) return TENS[Math.floor(n / 10)] ?? String(n);
  return `${TENS_ADJ[Math.floor(n / 10)]}-${ORDINALS[n % 10]}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function monthName(key: string): string {
  return MONTHS[dateFromKey(key).getUTCMonth()];
}
export function weekdayName(key: string): string {
  return WEEKDAYS[mondayIndex(key)];
}

/** "the seventeenth of October" — the play-phase date, no digits. */
export function dateInWords(key: string): string {
  const d = dateFromKey(key);
  return `the ${ordinalWord(d.getUTCDate())} of ${MONTHS[d.getUTCMonth()]}`;
}

const ONES = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * A number in words, so the play phase never prints a digit — not even
 * a tally label in the cartouche. Falls back to digits only at absurd
 * magnitudes a streak will never reach.
 */
export function numberWord(n: number): string {
  const v = Math.floor(n);
  if (!Number.isFinite(v) || v < 0) return String(n);
  if (v < 20) return ONES[v];
  if (v < 100) {
    const t = Math.floor(v / 10);
    const r = v % 10;
    return r === 0 ? TENS_WORDS[t] : `${TENS_WORDS[t]}-${ONES[r]}`;
  }
  if (v < 1000) {
    const h = Math.floor(v / 100);
    const r = v % 100;
    return r === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred and ${numberWord(r)}`;
  }
  return String(v);
}
