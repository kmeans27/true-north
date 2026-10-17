/* ------------------------------------------------------------------
   A three-line router. Screens call `go`; main.ts owns the single
   listener and swaps the mounted screen.
   ------------------------------------------------------------------ */

export interface Route {
  name: string;
  params?: Record<string, unknown>;
}

type Listener = (route: Route) => void;

const listeners = new Set<Listener>();

export function onRoute(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function go(name: string, params?: Record<string, unknown>): void {
  const route: Route = { name, params };
  for (const fn of listeners) fn(route);
}
