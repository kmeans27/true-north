/* ------------------------------------------------------------------
   MY EYE (spec 6.4 / 10.5)

   The player's own bias and precision, per sense, from real dailies
   only. The most screenshottable screen in the game.
   ------------------------------------------------------------------ */

import { el, button } from "../components";
import { go } from "../router";
import { getStore } from "../session";
import { recentDailies, senseStat, totalCharts } from "../../state";
import { SENSES, SENSE_LABEL } from "../../tasks/types";
import { biasPhrase, shortErrorLabel } from "../../tasks/geometry";
import { surestAndShakiest } from "../../game/progress";
import { t } from "../strings";

export interface Controller {
  destroy(): void;
}

const SVGNS = "http://www.w3.org/2000/svg";

export function mountMyEye(host: HTMLElement): Controller {
  const store = getStore();
  const root = el("div", { class: "screen myeye" });
  const panel = el("div", { class: "panel wide" });

  panel.append(el("p", { class: "wordmark smallcaps", text: "True North" }));
  panel.append(el("h1", { class: "screen-title", text: t("myEye") }));
  panel.append(el("p", { class: "muted", text: t("practiceNote") }));

  const sailed = totalCharts(store);
  panel.append(
    el("div", { class: "stat-big" }, [
      el("span", { class: "num stat-num", text: String(sailed) }),
      el("span", { class: "smallcaps", text: t("chartsSailed") }),
    ]),
  );

  if (sailed === 0) {
    panel.append(el("p", { class: "muted", text: t("empty_eye") }));
  } else {
    const list = el("ul", { class: "sense-stats" });
    for (const sense of SENSES) {
      const stat = senseStat(store, sense);
      if (stat.n === 0) continue;
      const li = el("li", { class: "sense-stat" });
      li.append(el("span", { class: "sense-name", text: SENSE_LABEL[sense] }));
      const phrase = biasPhrase(sense, stat.bias);
      li.append(el("span", { class: "sense-bias", text: phrase ? capitalise(phrase) : "No clear bias yet." }));
      li.append(
        el("span", {
          class: "sense-precision muted",
          text: `spread ±${shortErrorLabel(sense, stat.spread)} over ${stat.n} ${stat.n === 1 ? "chart" : "charts"}`,
        }),
      );
      list.append(li);
    }
    panel.append(list);

    const { surest, shakiest } = surestAndShakiest(store);
    if (surest && shakiest && surest !== shakiest) {
      panel.append(
        el("div", { class: "sense-extremes" }, [
          el("p", {}, [el("span", { class: "smallcaps", text: t("bestSense") }), el("span", { text: ` ${SENSE_LABEL[surest]}` })]),
          el("p", {}, [el("span", { class: "smallcaps", text: t("worstSense") }), el("span", { text: ` ${SENSE_LABEL[shakiest]}` })]),
        ]),
      );
    }

    panel.append(sparkline(recentDailies(store, 30)));
  }

  panel.append(el("div", { class: "link-row" }, [button(t("back"), { variant: "ink", onClick: () => go("daily") })]));
  root.append(panel);
  host.append(root);
  return { destroy: () => root.remove() };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A small ink line of the last thirty league totals, right way up. */
function sparkline(runs: { date: string; leagues: number }[]): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 320 72");
  svg.setAttribute("class", "spark");
  if (runs.length < 2) {
    svg.innerHTML = `<text x="6" y="42" font-size="15" style="fill:var(--ink-soft)">${t("notEnoughYet")}</text>`;
    return svg;
  }
  const max = Math.max(20, ...runs.map((r) => r.leagues));
  const step = 308 / (runs.length - 1);
  const pts = runs.map((r, i) => {
    const x = 6 + i * step;
    const y = 62 - (r.leagues / max) * 52;
    return { x, y };
  });
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  svg.innerHTML = `
    <path d="M 6 62 h 308" style="stroke:var(--ink-faint)" stroke-width="1"/>
    <path d="${d}" fill="none" style="stroke:var(--you)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts
      .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" style="fill:var(--you)"/>`)
      .join("")}`;
  return svg;
}
