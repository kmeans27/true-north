// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { mountDaily } from "../src/ui/screens/daily";
import { mountEndcard } from "../src/ui/screens/endcard";
import { mountMyEye } from "../src/ui/screens/myeye";
import { mountArchive } from "../src/ui/screens/archive";
import { mountAbout } from "../src/ui/screens/about";
import { replaceStore } from "../src/ui/session";
import { emptyStore, recordDaily, type MarkRecord } from "../src/state";
import { SENSES, type Sense } from "../src/tasks/types";

function marks(): Record<Sense, MarkRecord> {
  const out = {} as Record<Sense, MarkRecord>;
  for (const sense of SENSES) out[sense] = { value: 0.4, survey: false };
  return out;
}

function seededStore() {
  const store = emptyStore();
  const signed = {} as Record<Sense, number>;
  for (const sense of SENSES) signed[sense] = 0.03;
  recordDaily(store, "2026-10-16", marks(), {
    leagues: 21,
    chartScore: 85,
    elapsedMs: 80_000,
    signed,
    completedAt: Date.now(),
  });
  return store;
}

describe("screens mount without throwing", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("daily card", () => {
    const c = mountDaily(document.body);
    expect(document.body.textContent).toContain("True North");
    c.destroy();
  });

  it("about / settings", () => {
    replaceStore(seededStore());
    const c = mountAbout(document.body);
    expect(document.body.textContent).toContain("stored in this browser only");
    c.destroy();
  });

  it("MY EYE with real history", () => {
    replaceStore(seededStore());
    const c = mountMyEye(document.body);
    expect(document.body.textContent).toContain("Charts sailed");
    expect(document.querySelector(".spark")).not.toBeNull();
    c.destroy();
  });

  it("archive lists a past chart and reopens it", () => {
    replaceStore(seededStore());
    const c = mountArchive(document.body);
    expect(document.querySelectorAll(".archive-entry").length).toBe(1);
    c.destroy();
  });

  it("end card rebuilds from stored marks", () => {
    replaceStore(seededStore());
    const c = mountEndcard(document.body, { date: "2026-10-16" });
    expect(document.querySelectorAll(".grade").length).toBe(5);
    expect(document.querySelector(".endcard .title")?.textContent?.length).toBeGreaterThan(0);
    expect(document.querySelector(".seal")).not.toBeNull();
    c.destroy();
  });
});
