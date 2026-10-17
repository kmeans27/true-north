/* ------------------------------------------------------------------
   Names, accents and voices (spec section 7, 9.2)

   Seven charts a week: one name and one accent ink per weekday, with
   its own doodle temper. The names are the day's identity in a group
   chat, so they are chosen to be sayable.
   ------------------------------------------------------------------ */

import { mondayIndex, roman } from "./seed";

export interface ChartName {
  name: string;
  /** accent ink for the rose petals, the cartouche rule and the marks */
  accent: string;
  /** the temper of the day, used to bias which doodles appear */
  sea: string;
}

/** Mon .. Sun */
export const WEEK_CHARTS: ChartName[] = [
  { name: "The Iron Coast", accent: "#2F5D62", sea: "a cold grey swell" },
  { name: "Coral Verge", accent: "#6B4E3D", sea: "warm shallows" },
  { name: "Sable Reef", accent: "#3A4A7A", sea: "black water over coral" },
  { name: "The Long Meridian", accent: "#5B6B2F", sea: "an endless straight fetch" },
  { name: "Gallows Point", accent: "#7A3A5B", sea: "a wicked tide race" },
  { name: "Glass Bay", accent: "#8A5A20", sea: "flat calm" },
  { name: "Wyrmwater", accent: "#4A4A6B", sea: "deep and rumoured" },
];

/** Days since epoch start, 1-based: the chart's number. */
export const EPOCH_START = "2026-01-01";

export function chartNumberOf(dateKey: string, daysBetween: (a: string, b: string) => number): number {
  return daysBetween(EPOCH_START, dateKey) + 1;
}

export function chartForDate(dateKey: string): ChartName & { number: number } {
  const day = mondayIndex(dateKey);
  const base = WEEK_CHARTS[day];
  return { ...base, number: 0 };
}

/** "Wed 17 Oct" — used in share text and the archive. */
export function shortDate(dateKey: string, weekday: string, month: string): string {
  const d = Number(dateKey.slice(8, 10));
  return `${weekday} ${d} ${month}`;
}

export function chartTitle(dateKey: string): string {
  const day = mondayIndex(dateKey);
  return WEEK_CHARTS[day].name;
}

export function chartRoman(n: number): string {
  return roman(n);
}
