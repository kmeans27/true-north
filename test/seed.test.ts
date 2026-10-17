import { describe, expect, it } from "vitest";
import {
  addDays,
  dateFromKey,
  dailySeed,
  daysBetween,
  fnv1a,
  msUntilNextUtcDay,
  mondayIndex,
  mulberry32,
  ordinalWord,
  roman,
  utcDateKey,
} from "../src/daily/seed";

describe("fnv1a / mulberry32", () => {
  it("hashes stably and spreads", () => {
    expect(fnv1a("truenorth:2026-10-17")).toBe(fnv1a("truenorth:2026-10-17"));
    expect(fnv1a("truenorth:2026-10-17")).not.toBe(fnv1a("truenorth:2026-10-18"));
    expect(dailySeed("2026-10-17")).toBeGreaterThanOrEqual(0);
    expect(dailySeed("2026-10-17")).toBeLessThan(2 ** 32);
  });

  it("produces the same stream twice, and different streams for different seeds", () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const c = mulberry32(1235);
    expect([c(), c(), c(), c()]).not.toEqual(seqA);
  });
});

describe("UTC date keys", () => {
  it("formats and parses", () => {
    expect(utcDateKey(new Date(Date.UTC(2026, 9, 17, 23, 59)))).toBe("2026-10-17");
    expect(utcDateKey(new Date(Date.UTC(2026, 9, 17, 0, 0)))).toBe("2026-10-17");
    expect(utcDateKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
    expect(dateFromKey("2026-10-17").getTime()).toBe(Date.UTC(2026, 9, 17));
  });

  it("crosses month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysBetween("2026-10-17", "2026-10-18")).toBe(1);
    expect(daysBetween("2026-10-17", "2026-10-17")).toBe(0);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("is correct in UTC+13 and UTC-11 (spec section 6 M6)", () => {
    // A wall clock at 2026-10-17T12:00Z is 2026-10-18 01:00 in UTC+13 and
    // 2026-10-17 01:00 in UTC-11. The key must ignore the local zone.
    const t = Date.UTC(2026, 9, 17, 12, 0);
    const asUtc = new Date(t);
    expect(utcDateKey(asUtc)).toBe("2026-10-17");
    // msUntilNextUtcDay does not depend on the local zone either.
    expect(msUntilNextUtcDay(new Date(t))).toBe(12 * 3600 * 1000);
    const justBefore = new Date(Date.UTC(2026, 9, 17, 23, 59, 59, 999));
    expect(msUntilNextUtcDay(justBefore)).toBe(1);
    const exactlyMidnight = new Date(Date.UTC(2026, 9, 18, 0, 0, 0, 0));
    expect(msUntilNextUtcDay(exactlyMidnight)).toBe(86_400_000);
  });

  it("knows the weekday, Monday-first", () => {
    expect(mondayIndex("2026-10-19")).toBe(0); // Monday
    expect(mondayIndex("2026-10-17")).toBe(5); // Saturday
    expect(mondayIndex("2026-10-18")).toBe(6); // Sunday
  });

  it("rejects malformed keys", () => {
    expect(() => dateFromKey("17-10-2026")).toThrow();
    expect(() => dateFromKey("nonsense")).toThrow();
  });
});

describe("digit-free words", () => {
  it("writes ordinals", () => {
    expect(ordinalWord(1)).toBe("first");
    expect(ordinalWord(17)).toBe("seventeenth");
    expect(ordinalWord(20)).toBe("twentieth");
    expect(ordinalWord(21)).toBe("twenty-first");
    expect(ordinalWord(30)).toBe("thirtieth");
  });

  it("writes roman numerals for the cartouche", () => {
    expect(roman(1)).toBe("I");
    expect(roman(4)).toBe("IV");
    expect(roman(9)).toBe("IX");
    expect(roman(142)).toBe("CXLII");
    expect(roman(290)).toBe("CCXC");
    expect(roman(2026)).toBe("MMXXVI");
  });
});
