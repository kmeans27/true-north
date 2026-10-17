/* ------------------------------------------------------------------
   Boot, routing, day boundary, cross-tab safety (spec sections 3, 8)
   ------------------------------------------------------------------ */

import "./styles/tokens.css";
import "./styles/app.css";

import { onRoute, go } from "./ui/router";
import type { Route } from "./ui/router";
import { mountDaily } from "./ui/screens/daily";
import { mountEndcard } from "./ui/screens/endcard";
import { mountMyEye } from "./ui/screens/myeye";
import { mountArchive } from "./ui/screens/archive";
import { mountAbout } from "./ui/screens/about";
import { mountPlay } from "./game/play";
import type { PlayOutcome } from "./game/play";
import { mountReveal } from "./game/reveal";
import { evaluate, headline, signedErrors } from "./game/progress";
import type { RunResult } from "./game/progress";
import { reconstruct } from "./game/reconstruct";
import { getStore, mutateStore, replaceStore, applyPrefs } from "./ui/session";
import { generate, practiceChart } from "./daily/generate";
import { STORE_KEY, isPlayed, loadStore, nextStreak, recordDaily } from "./state";
import { utcDateKey } from "./daily/seed";
import { announce, initA11y } from "./a11y";

interface Mounted {
  destroy(): void;
}

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("no #app");
const app: HTMLElement = rootEl;

let mounted: Mounted | null = null;
let currentRoute: Route = { name: "daily" };
let bootDay = utcDateKey();

function swap(next: Mounted): void {
  mounted?.destroy();
  mounted = next;
}

/* ---------------------------------- screens ------------------------- */

function renderPlay(params: Record<string, unknown> | undefined): void {
  const mode = params?.mode === "practice" ? "practice" : "daily";
  const today = utcDateKey();
  const store = getStore();

  if (mode === "daily" && isPlayed(store, today)) {
    go("endcard", { date: today });
    return;
  }

  const chart = mode === "practice" ? practiceChart(Math.floor(Math.random() * 2 ** 31)) : generate(today);
  const firstRun = !store.prefs.onboarded;

  const controller = mountPlay(app, chart, {
    streak: chart.practice ? 0 : store.streak,
    firstRun,
    onComplete(outcome: PlayOutcome) {
      if (chart.practice) {
        const run = evaluate(chart, outcome.marks, outcome.errors, outcome.elapsedMs, 0);
        go("reveal", { date: chart.date, run });
        return;
      }
      const streak = nextStreak(getStore(), chart.date);
      const run = evaluate(chart, outcome.marks, outcome.errors, outcome.elapsedMs, streak);
      mutateStore((s) => {
        s.prefs.onboarded = true;
        recordDaily(s, chart.date, outcome.marks, {
          leagues: run.leagues,
          chartScore: run.chartScore,
          elapsedMs: outcome.elapsedMs,
          signed: signedErrors(outcome.errors),
          completedAt: Date.now(),
        });
      });
      go("reveal", { date: chart.date, run });
    },
    onMenu: () => go("daily"),
  });
  swap(controller);
}

function renderReveal(params: Record<string, unknown> | undefined): void {
  const store = getStore();
  const date = String(params?.date ?? utcDateKey());
  const run = (params?.run as RunResult | undefined) ?? reconstruct(store, date);
  if (!run) {
    go("daily");
    return;
  }
  const controller = mountReveal(app, run.chart, {
    streak: run.chart.practice ? 0 : store.streak,
    reducedMotion: store.prefs.reducedMotion,
    tasks: run.chart.tasks,
    marks: run.marks,
    errors: run.errors,
    summary: headline(run),
    onDone: () => go("endcard", { date, run }),
  });
  swap(controller);
}

function render(route: Route): void {
  currentRoute = route;
  switch (route.name) {
    case "myeye":
      swap(mountMyEye(app));
      break;
    case "archive":
      swap(mountArchive(app));
      break;
    case "about":
      swap(mountAbout(app));
      break;
    case "endcard":
      swap(mountEndcard(app, route.params ?? {}));
      break;
    case "play":
      renderPlay(route.params);
      break;
    case "reveal":
      renderReveal(route.params);
      break;
    case "daily":
    default:
      swap(mountDaily(app));
      break;
  }
}

/* ---------------------------------- lifecycle ----------------------- */

onRoute(render);

// A day boundary ticker: midnight UTC is the new chart, and the daily
// card (or end card) quietly becomes today's.
window.setInterval(() => {
  const now = utcDateKey();
  if (now !== bootDay) {
    bootDay = now;
    if (currentRoute.name === "daily" || currentRoute.name === "endcard") go("daily");
  }
}, 30_000);

// Another tab completing the day moves this one out of play.
window.addEventListener("storage", (ev) => {
  if (ev.key !== STORE_KEY) return;
  replaceStore(loadStore());
  const today = utcDateKey();
  if (currentRoute.name === "play" && isPlayed(getStore(), today)) {
    announce("Another tab has charted today.");
    go("endcard", { date: today });
  }
});

function boot(): void {
  initA11y();
  applyPrefs();
  announce("True North. A chart a day, fixed by eye.");
  go("daily");
}

boot();

// Offline play after the first visit (spec section 13).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline is a bonus, never a blocker */
    });
  });
}
