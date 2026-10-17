/* ------------------------------------------------------------------
   Small DOM helpers. No framework, no virtual DOM: build nodes, append
   them, tear them down. Everything the app renders goes through here.
   ------------------------------------------------------------------ */

type Props = Record<string, string | number | boolean | EventListener | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === false) continue;
    if (k === "class") node.className = String(v);
    else if (k === "text") node.textContent = String(v);
    else if (k === "html") node.innerHTML = String(v);
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.append(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export interface ButtonOptions {
  variant?: "ink" | "quiet" | "primary" | "wax";
  className?: string;
  title?: string;
  ariaLabel?: string;
  onClick?: (ev: MouseEvent) => void;
}

export function button(label: string, opts: ButtonOptions = {}): HTMLButtonElement {
  const b = el("button", {
    class: ["btn", opts.variant ? `btn-${opts.variant}` : "", opts.className ?? ""].filter(Boolean).join(" "),
    type: "button",
  });
  b.textContent = label;
  if (opts.title) b.title = opts.title;
  if (opts.ariaLabel) b.setAttribute("aria-label", opts.ariaLabel);
  if (opts.onClick) b.addEventListener("click", opts.onClick);
  return b;
}

/** Five ink dots; the current one pulses, signed ones are ringed. */
export function pips(total: number, current: number, signed: number): HTMLDivElement {
  const wrap = el("div", { class: "pips", "aria-hidden": "true" });
  for (let i = 0; i < total; i++) {
    const cls = ["pip"];
    if (i < signed) cls.push("pip-done");
    if (i === current && signed < total) cls.push("pip-now");
    wrap.append(el("span", { class: cls.join(" ") }));
  }
  return wrap;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** A tiny inline SVG glyph, for grade marks in HTML surfaces. */
export function glyph(char: string, className = "glyph"): HTMLSpanElement {
  return el("span", { class: className, "aria-hidden": "true", text: char });
}
