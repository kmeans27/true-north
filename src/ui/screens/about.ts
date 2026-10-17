/* ------------------------------------------------------------------
   ABOUT / SETTINGS (spec 10.8)
   ------------------------------------------------------------------ */

import { el, button } from "../components";
import { go } from "../router";
import { getStore, mutateStore, applyPrefs, replaceStore } from "../session";
import { clearStore } from "../../state";
import { chimeSound } from "../../game/sound";
import { t } from "../strings";

export interface Controller {
  destroy(): void;
}

export function mountAbout(host: HTMLElement): Controller {
  const store = getStore();
  const root = el("div", { class: "screen about" });
  const panel = el("div", { class: "panel wide" });

  panel.append(el("p", { class: "wordmark smallcaps", text: "True North" }));
  panel.append(el("h1", { class: "screen-title", text: t("about") }));

  panel.append(
    el("div", { class: "how" }, [
      el("h2", { class: "smallcaps", text: t("howTitle") }),
      el("p", { text: t("how1") }),
      el("p", { text: t("how2") }),
      el("p", { text: t("how3") }),
      el("p", { text: t("how4") }),
    ]),
  );

  const settings = el("div", { class: "settings" });
  settings.append(el("h2", { class: "smallcaps", text: t("settings") }));

  settings.append(
    toggle(t("reducedMotion"), store.prefs.reducedMotion, (on) => {
      mutateStore((s) => {
        s.prefs.reducedMotion = on;
      });
      applyPrefs();
    }),
  );
  settings.append(
    toggle(t("sound"), store.prefs.sound, (on) => {
      mutateStore((s) => {
        s.prefs.sound = on;
      });
      if (on) chimeSound();
    }),
  );
  settings.append(
    segment(t("theme"), [
      { label: t("day"), on: store.prefs.theme === "day", act: () => setTheme("day") },
      { label: t("night"), on: store.prefs.theme === "night", act: () => setTheme("night") },
    ]),
  );
  panel.append(settings);

  function setTheme(theme: "day" | "night"): void {
    mutateStore((s) => {
      s.prefs.theme = theme;
    });
    applyPrefs();
    go("about");
  }

  const status = el("p", { class: "share-status", role: "status" });
  panel.append(
    el("div", { class: "danger-zone" }, [
      button(t("clearData"), {
        variant: "quiet",
        onClick: () => {
          if (!window.confirm(`${t("clearData")}?`)) return;
          replaceStore(clearStore());
          status.textContent = t("cleared");
          go("daily");
        },
      }),
      status,
    ]),
  );

  panel.append(el("p", { class: "muted privacy", text: t("nothingLeavesLong") }));
  panel.append(el("div", { class: "link-row" }, [button(t("back"), { variant: "ink", onClick: () => go("daily") })]));

  root.append(panel);
  host.append(root);
  return { destroy: () => root.remove() };
}

function toggle(label: string, on: boolean, onChange: (on: boolean) => void): HTMLElement {
  const row = el("div", { class: "setting-row" });
  row.append(el("span", { class: "setting-label", text: label }));
  const b = button(on ? "On" : "Off", { variant: "quiet", className: "toggle" });
  b.setAttribute("aria-pressed", String(on));
  b.addEventListener("click", () => {
    const next = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(next));
    b.textContent = next ? "On" : "Off";
    onChange(next);
  });
  row.append(b);
  return row;
}

function segment(label: string, options: { label: string; on: boolean; act: () => void }[]): HTMLElement {
  const row = el("div", { class: "setting-row" });
  row.append(el("span", { class: "setting-label", text: label }));
  const group = el("div", { class: "segment", role: "radiogroup" });
  for (const opt of options) {
    const b = button(opt.label, { variant: "quiet", className: "segment-tab" });
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(opt.on));
    b.classList.toggle("is-on", opt.on);
    b.addEventListener("click", opt.act);
    group.append(b);
  }
  row.append(group);
  return row;
}
