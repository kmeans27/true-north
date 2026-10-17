/* ------------------------------------------------------------------
   Sharing (spec section 11)

   The share text is deliberately spoiler-free: no true values, no
   errors, no answers — only the shape of the run, one glyph per task.
   ------------------------------------------------------------------ */

import type { TaskScore } from "./score";
import { GRADE_EMOJI, SURVEY_BLIGHTED_EMOJI, SURVEY_PAID_EMOJI } from "./score";
import { monthName, weekdayName } from "../daily/seed";

export interface ShareInput {
  number: number;
  date: string;
  leagues: number;
  title: string;
  tasks: TaskScore[];
}

function shortDate(date: string): string {
  const day = Number(date.slice(8, 10));
  return `${weekdayName(date).slice(0, 3)} ${day} ${monthName(date).slice(0, 3)}`;
}

export function shareText(input: ShareInput): string {
  const grade = input.tasks
    .map((task) => {
      const base = GRADE_EMOJI[task.grade];
      if (!task.survey) return base;
      return base + (task.paid ? SURVEY_PAID_EMOJI : SURVEY_BLIGHTED_EMOJI);
    })
    .join(" ");
  const headline =
    input.leagues === 0
      ? "a true chart — not one league off"
      : `${input.leagues} ${input.leagues === 1 ? "league" : "leagues"} off course — ${input.title}`;
  return [
    `TRUE NORTH #${input.number} * ${shortDate(input.date)}`,
    headline,
    grade,
    "truenorth.day",
  ].join("\n");
}

export type ShareOutcome = "shared" | "copied" | "manual";

/**
 * navigator.share when available, else the clipboard, else hand the
 * player a textarea to copy from. Never throws.
 */
export async function presentShare(text: string): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
  if (typeof nav.share === "function") {
    try {
      await nav.share({ text });
      return "shared";
    } catch {
      // the player dismissed the sheet; fall through to a copy
    }
  }
  try {
    if (nav.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    /* clipboard blocked */
  }
  return "manual";
}
