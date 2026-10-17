/* ------------------------------------------------------------------
   ARCHIVE (spec 10.6). Every past date reconstructs instantly, because
   a chart is only ever a function of its date.
   ------------------------------------------------------------------ */

import { el, button, glyph } from "../components";
import { go } from "../router";
import { getStore } from "../session";
import { reconstruct } from "../../game/reconstruct";
import { GRADE_GLYPH } from "../../game/score";
import { monthName, weekdayName } from "../../daily/seed";
import { t } from "../strings";

export interface Controller {
  destroy(): void;
}

function shortDate(date: string): string {
  return `${weekdayName(date).slice(0, 3)} ${Number(date.slice(8, 10))} ${monthName(date).slice(0, 3)}`;
}

export function mountArchive(host: HTMLElement): Controller {
  const store = getStore();
  const root = el("div", { class: "screen archive" });
  const panel = el("div", { class: "panel wide" });
  panel.append(el("p", { class: "wordmark smallcaps", text: "True North" }));
  panel.append(el("h1", { class: "screen-title", text: t("archive") }));
  panel.append(el("p", { class: "muted", text: t("choosePast") }));

  const dates = Object.keys(store.dailies).sort().reverse();
  if (dates.length === 0) {
    panel.append(el("p", { class: "muted", text: t("empty_archive") }));
  } else {
    const list = el("ul", { class: "archive-list" });
    for (const date of dates) {
      const run = reconstruct(store, date);
      if (!run) continue;
      const row = el("li", { class: "archive-row" });
      const entry = el("button", { class: "archive-entry", type: "button" });
      entry.append(el("span", { class: "archive-date", text: shortDate(date) }));
      entry.append(el("span", { class: "archive-name", text: run.chart.name }));
      entry.append(
        el("span", {
          class: "archive-leagues num",
          text: run.leagues === 0 ? t("trueChart") : `${run.leagues}`,
        }),
      );
      const gl = el("span", { class: "archive-glyphs", "aria-hidden": "true" });
      for (const s of run.tasks) gl.append(glyph(GRADE_GLYPH[s.grade], "grade-glyph"));
      entry.append(gl);
      entry.addEventListener("click", () => go("endcard", { date }));
      row.append(entry);
      list.append(row);
    }
    panel.append(list);
  }

  panel.append(el("div", { class: "link-row" }, [button(t("back"), { variant: "ink", onClick: () => go("daily") })]));
  root.append(panel);
  host.append(root);
  return { destroy: () => root.remove() };
}
