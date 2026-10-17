/* ------------------------------------------------------------------
   END CARD (spec 10.4)

   The headline number, the seal, the per-task grades, the badges, one
   honest line about the player's eye, and the four ways onward.
   ------------------------------------------------------------------ */

import { el, button, glyph } from "../components";
import { go } from "../router";
import { getStore, applyAccent } from "../session";
import { reconstruct } from "../../game/reconstruct";
import { biasLine } from "../../game/progress";
import type { RunResult } from "../../game/progress";
import { GRADE_GLYPH } from "../../game/score";
import { SENSE_LABEL } from "../../tasks/types";
import { shortErrorLabel } from "../../tasks/geometry";
import { seal as inkSeal } from "../../chart/ink";
import { shareText, presentShare } from "../../game/share";
import { t } from "../strings";

export interface Controller {
  destroy(): void;
}

const SVGNS = "http://www.w3.org/2000/svg";

export function mountEndcard(host: HTMLElement, params: Record<string, unknown>): Controller {
  const store = getStore();
  const date = String(params.date ?? "");
  const run = (params.run as RunResult | undefined) ?? reconstruct(store, date);
  const root = el("div", { class: "screen endcard" });
  if (!run) {
    root.append(el("p", { class: "muted", text: t("empty_archive") }));
    host.append(root);
    return { destroy: () => root.remove() };
  }
  applyAccent(run.chart.weekday);

  const panel = el("div", { class: "panel endcard-panel" });
  const head = el("div", { class: "endcard-head" });

  const sealSvg = document.createElementNS(SVGNS, "svg");
  sealSvg.setAttribute("viewBox", "0 0 140 140");
  sealSvg.setAttribute("class", "seal");
  sealSvg.innerHTML = `<g transform="translate(70 70)">${inkSeal(run.title.seal, 0, 0, 48)}</g>`;
  head.append(sealSvg);

  const headline = el("div", { class: "endcard-headline" });
  if (run.leagues === 0) {
    headline.append(el("p", { class: "true-chart smallcaps", text: t("trueChart") }));
  } else {
    headline.append(
      el("p", { class: "leagues" }, [
        el("span", { class: "num leagues-num", text: String(run.leagues) }),
        el("span", {
          class: "leagues-label smallcaps",
          text: run.leagues === 1 ? t("league") : t("leagues"),
        }),
      ]),
    );
  }
  headline.append(el("h1", { class: "title", text: run.title.title }));
  headline.append(el("p", { class: "muted title-line", text: run.title.line }));
  head.append(headline);
  panel.append(head);

  panel.append(el("p", { class: "muted chart-line", text: run.chart.name }));

  // per-task grade row
  const grades = el("ul", { class: "grades" });
  run.chart.tasks.forEach((task, i) => {
    const score = run.tasks[i];
    const li = el("li", { class: `grade grade-${score.grade.toLowerCase()}` });
    li.append(glyph(GRADE_GLYPH[score.grade], "grade-glyph"));
    li.append(el("span", { class: "grade-sense", text: SENSE_LABEL[task.sense] }));
    li.append(el("span", { class: "grade-err num", text: shortErrorLabel(task.sense, score.e) }));
    if (score.survey) {
      li.append(
        el("span", {
          class: `grade-wager ${score.paid ? "paid" : "blighted"}`,
          text: score.paid ? t("survey") : t("blighted"),
        }),
      );
    }
    grades.append(li);
  });
  panel.append(grades);

  if (run.badges.length) {
    const badgeList = el("ul", { class: "badges" });
    for (const b of run.badges) {
      badgeList.append(
        el("li", { class: "badge" }, [
          el("span", { class: "badge-label smallcaps", text: b.label }),
          el("span", { class: "badge-note", text: b.note }),
        ]),
      );
    }
    panel.append(badgeList);
  }

  const line = biasLine(store);
  if (line) panel.append(el("p", { class: "bias-line", text: line }));

  // share
  const status = el("p", { class: "share-status", role: "status" });
  const manual = el("textarea", { class: "share-manual", readOnly: true, rows: 4 });
  manual.style.display = "none";
  const doShare = async () => {
    const text = shareText({
      number: run.chart.number,
      date: run.chart.date,
      leagues: run.leagues,
      title: run.title.title,
      tasks: run.tasks,
    });
    const outcome = await presentShare(text);
    if (outcome === "manual") {
      manual.value = text;
      manual.style.display = "";
      manual.focus();
      manual.select();
      status.textContent = t("shareFailed");
    } else {
      status.textContent = t("copied");
    }
  };

  const actions = el("div", { class: "cta-row" }, [
    button(t("share"), { variant: "primary", onClick: () => void doShare() }),
    button(t("viewChart"), { variant: "ink", onClick: () => go("reveal", { date: run.chart.date, run }) }),
    button(t("practice"), { variant: "quiet", onClick: () => go("play", { mode: "practice" }) }),
    button(t("myEye"), { variant: "quiet", onClick: () => go("myeye") }),
  ]);
  panel.append(actions, status, manual);

  root.append(panel);
  host.append(root);

  return { destroy: () => root.remove() };
}
