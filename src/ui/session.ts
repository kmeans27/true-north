/* ------------------------------------------------------------------
   The one live copy of the store, plus theme application. Every screen
   reads through here so there is never a second source of truth.
   ------------------------------------------------------------------ */

import { loadStore, saveStore } from "../state";
import type { Store } from "../state";

let store: Store = loadStore();

export function getStore(): Store {
  return store;
}

export function mutateStore(fn: (s: Store) => void): Store {
  fn(store);
  saveStore(store);
  return store;
}

export function replaceStore(next: Store): Store {
  store = next;
  saveStore(store);
  applyPrefs(store);
  return store;
}

/** Reflect the player's preferences onto the document root. */
export function applyPrefs(s: Store = store): void {
  const root = document.documentElement;
  root.dataset.theme = s.prefs.theme;
  root.dataset.motion = s.prefs.reducedMotion ? "reduced" : "full";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", s.prefs.theme === "night" ? "#171A20" : "#EFE3C8");
}

/** Weekday accent ink rotation for HTML surfaces (Mon..Sun). */
export function applyAccent(weekday: number): void {
  document.documentElement.dataset.accent = String(((weekday % 7) + 7) % 7);
}
