/* The five parameter banks, one per sense (spec section 7.1).
   Each holds >= 20 references/variants, so a sense cannot visibly
   repeat inside a month: the rotation walks the bank one step per day. */

import type { Sense } from "../../tasks/types";
import type { Entry } from "./types";
import { LENGTH_BANK } from "./length";
import { ANGLE_BANK } from "./angle";
import { CENTRE_BANK } from "./centre";
import { PROPORTION_BANK } from "./proportion";
import { SPACING_BANK } from "./spacing";

export const BANKS: Record<Sense, Entry[]> = {
  length: LENGTH_BANK,
  angle: ANGLE_BANK,
  centre: CENTRE_BANK,
  proportion: PROPORTION_BANK,
  spacing: SPACING_BANK,
};

export type { Entry, BankCtx, Built } from "./types";
