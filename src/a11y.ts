/* ------------------------------------------------------------------
   Accessibility plumbing (spec section 13)

   One polite live region carries every announcement, so a screen reader
   hears the same thing the chart shows. Progress is announced in words
   ("signed, three of five") to honour the no-digits-during-play rule.
   ------------------------------------------------------------------ */

let live: HTMLElement | null = null;

export function initA11y(root: HTMLElement = document.body): void {
  if (live && live.isConnected) return;
  live = document.createElement("div");
  live.className = "visually-hidden";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  root.appendChild(live);
}

export function announce(message: string): void {
  initA11y();
  if (!live) return;
  // clearing first re-announces an identical string
  live.textContent = "";
  const schedule: (fn: () => void) => void =
    typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => window.setTimeout(fn, 0);
  schedule(() => {
    if (live) live.textContent = message;
  });
}

/** Move focus to `node` without the browser scrolling the fixed layout. */
export function focusSoft(node: HTMLElement | SVGElement | null): void {
  if (!node) return;
  try {
    node.focus({ preventScroll: true });
  } catch {
    node.focus();
  }
}
