// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import html from "../index.html?raw";

describe("boot (spec M9 release checks)", () => {
  it("boots onto #app, then routes from the daily card into a digit-free play screen", async () => {
    document.body.innerHTML = '<div id="app" class="app"></div>';
    try {
      window.localStorage.clear();
    } catch {
      /* jsdom's origin is opaque here; the store just starts empty */
    }
    await import("../src/main");
    const app = document.getElementById("app")!;
    expect(app.querySelector(".screen.daily")).not.toBeNull();
    expect(document.querySelector('[aria-live]')).not.toBeNull();

    const begin = Array.from(app.querySelectorAll("button")).find((b) =>
      /begin/i.test(b.textContent ?? ""),
    );
    expect(begin, "the daily card offers a Begin button").toBeTruthy();
    begin!.click();

    const play = app.querySelector(".screen.play");
    expect(play).not.toBeNull();
    expect(play!.querySelector("svg.chart")).not.toBeNull();
    // the hard rule: nothing numeric reaches the play phase
    expect((play!.textContent ?? "").match(/[0-9]/)).toBeNull();
  });

  it("ships every asset index.html points at", async () => {
    const shipped = Object.keys(import.meta.glob("../public/*")).map((p) =>
      p.replace(/^\.\.\/public\//, ""),
    );
    const refs = [...html.matchAll(/(?:href|content|src)="\.\/([A-Za-z0-9._/-]+)"/g)].map(
      (m) => m[1],
    );
    for (const ref of new Set(refs)) {
      expect(shipped, `missing public/${ref}`).toContain(ref);
    }
    const manifest = JSON.parse(
      (await import("../public/manifest.webmanifest?raw")).default,
    ) as { icons: unknown[] };
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });
});
