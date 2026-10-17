/* ------------------------------------------------------------------
   DAILY card (spec 10.1)
   ------------------------------------------------------------------ */

import { el, button, formatCountdown } from "../components";
import { go } from "../router";
import { getStore, applyAccent } from "../session";
import { generate } from "../../daily/generate";
import { isPlayed } from "../../state";
import { dateFromKey, monthName, msUntilNextUtcDay, utcDateKey, weekdayName } from "../../daily/seed";
import { tallies } from "../../chart/ink";
import { t } from "../strings";

export interface Controller {
  destroy(): void;
}

export function mountDaily(host: HTMLElement): Controller {
  const store = getStore();
  const today = utcDateKey();
  const chart = generate(today);
  applyAccent(chart.weekday);
  const played = isPlayed(store, today);
  const d = dateFromKey(today);

  const root = el("div", { class: "screen daily" });
  const panel = el("div", { class: "panel" });

  panel.append(el("p", { class: "wordmark smallcaps", text: "True North" }));
  panel.append(el("h1", { class: "chart-name", text: chart.name }));
  panel.append(
    el("p", {
      class: "muted",
      text: `${weekdayName(today)}, ${d.getUTCDate()} ${monthName(today)}`,
    }),
  );

  if (store.streak > 0) {
    const streak = el("div", { class: "streak" });
    streak.innerHTML = `<span class="smallcaps">${t("streak")}</span>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 130 26");
    svg.setAttribute("class", "tally");
    svg.innerHTML = tallies(store.streak, 2, 20, 16);
    streak.append(svg, el("span", { class: "num", text: String(store.streak) }));
    panel.append(streak);
  }

  const countdown = el("p", { class: "countdown" });
  const tick = () => {
    countdown.textContent = `${t("nextChart")} ${formatCountdown(msUntilNextUtcDay())}`;
  };
  tick();
  const timer = window.setInterval(tick, 1000);
  panel.append(countdown);

  const primary = played
    ? button(t("viewChart"), { variant: "primary", onClick: () => go("endcard", { date: today }) })
    : button(t("begin"), { variant: "primary", onClick: () => go("play", { mode: "daily" }) });
  panel.append(el("div", { class: "cta" }, [primary]));

  const secondary = el("div", { class: "link-row" }, [
    button(t("practice"), { variant: "quiet", onClick: () => go("play", { mode: "practice" }) }),
    button(t("myEye"), { variant: "quiet", onClick: () => go("myeye") }),
    button(t("archive"), { variant: "quiet", onClick: () => go("archive") }),
    button(t("about"), { variant: "quiet", onClick: () => go("about") }),
  ]);
  panel.append(secondary);

  if (store.prefs.onboarded) {
    panel.append(el("p", { class: "reminder smallcaps", text: t("noRulers") }));
  }

  root.append(panel, el("p", { class: "footnote", text: t("nothingLeaves") }));
  host.append(root);

  return {
    destroy() {
      window.clearInterval(timer);
      root.remove();
    },
  };
}
