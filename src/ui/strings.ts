/* ------------------------------------------------------------------
   All player-facing copy, in one place (spec section 13: i18n)

   en-GB is the default voice. en-US only overrides the handful of
   strings whose spelling differs; the chartkeeper's tone is shared.
   ------------------------------------------------------------------ */

export type Locale = "en-GB" | "en-US";

let locale: Locale = "en-GB";

export function setLocale(next: Locale): void {
  locale = next;
}

export function getLocale(): Locale {
  return locale;
}

const GB = {
  begin: "Begin the chart",
  viewChart: "View the chart",
  practice: "Practice",
  practiceBadge: "practice · not counted",
  myEye: "My eye",
  archive: "Archive",
  about: "About",
  back: "Back",
  close: "Close",
  share: "Share",
  copied: "Copied to the clipboard",
  shareFailed: "Copy the text below",
  sign: "Sign",
  sketch: "Sketch",
  survey: "Survey",
  blighted: "Blighted",
  paid: "paid",
  true: "True",
  close_grade: "Close",
  offset: "Offset",
  adrift: "Adrift",
  leagues: "leagues off course",
  league: "league off course",
  trueChart: "the chart is true",
  nextChart: "Next chart in",
  streak: "Streak",
  best: "Best",
  firstChart: "Your first chart",
  noRulers: "No rulers.",
  nothingLeaves: "Nothing leaves your browser.",
  nothingLeavesLong:
    "Everything — your streak, your charts, your bias profile — is stored in this browser only. There is no account, no analytics, and no server.",
  howTitle: "How to play",
  how1: "One chart a day. Five things are missing from it.",
  how2: "Fix each by eye — drag the handle, or use the arrow keys.",
  how3: "No rulers. No numbers. No going back once you sign.",
  how4: "Before you sign you may wager: Survey pays well, or blights.",
  settings: "Settings",
  reducedMotion: "Reduce motion",
  sound: "Sound",
  theme: "Theme",
  day: "Day",
  night: "Night",
  clearData: "Clear all data",
  cleared: "All data cleared",
  signed: "signed",
  of: "of",
  yourEyeSoFar: "Your eye, so far",
  notEnoughYet: "Sail a few more charts and your habits will show here.",
  practiceNote: "Practice charts are never counted.",
  onboardTitle: "Five things are missing from today's chart.",
  onboardLine2: "Fix them by eye.",
  onboardLine3: "No rulers. No numbers.",
  onboardLine4: "No going back.",
  onboardTap: "tap to begin",
  skip: "Tap to skip",
  revealTitle: "The reveal",
  chartResult: "The chart",
  empty_archive: "No charts sailed yet.",
  empty_eye: "No charts sailed yet.",
  choosePast: "Tap a date to see how it was charted.",
  bias: "You",
  spread: "spread",
  bestSense: "Your surest sense",
  worstSense: "Your shakiest sense",
  chartsSailed: "Charts sailed",
  practiceAgain: "Another practice chart",
  outOfFive: "tasks signed",
  waiting: "Reading the chart",
  wagerHint: "Wager before you sign",
  keyboardHint: "Arrow keys to move, then Enter to sign",
} as const;

export type StringKey = keyof typeof GB;

const US: Partial<Record<StringKey, string>> = {
  // Spelling variants only; the voice stays the same.
};

export function t(key: StringKey): string {
  return (locale === "en-US" && US[key]) || GB[key];
}
