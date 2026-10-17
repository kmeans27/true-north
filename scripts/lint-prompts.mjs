#!/usr/bin/env node
/* ------------------------------------------------------------------
   Prompt linter (spec section 7.1 / 15 / M8)

   Every prompt must be one sentence, <= 46 characters, contain no
   numerals, and end in a full stop. This scans the bank sources
   statically and validates every candidate prompt it finds.
   ------------------------------------------------------------------ */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const banks = ["length", "angle", "centre", "proportion", "spacing"];

const problems = [];
let checked = 0;

for (const name of banks) {
  const src = await readFile(join(here, "..", "src", "daily", "banks", `${name}.ts`), "utf8");
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[1];
    // prompts are sentences: start with a capital, contain a space, end in a stop
    if (!/^[A-Z][^"]* [^"]*\.$/.test(s)) continue;
    checked++;
    if (s.length > 46) problems.push(`${name}: ${s.length} chars: "${s}"`);
    if (/[0-9]/.test(s)) problems.push(`${name}: numeral in "${s}"`);
    if (!s.endsWith(".")) problems.push(`${name}: not a sentence: "${s}"`);
    const stops = (s.match(/[.!?]/g) ?? []).length;
    if (stops > 1) problems.push(`${name}: more than one sentence: "${s}"`);
  }
}

if (problems.length) {
  console.error(`prompt linter: ${problems.length} problem(s)`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

console.log(`prompt linter: ${checked} prompts clean (<= 46 chars, one sentence, no numerals)`);
