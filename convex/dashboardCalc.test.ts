import { describe, it, expect } from "vitest";
import {
  monthKeyFromTimestamp,
  addMonths,
  dayOfMonth,
  isoInMonthUpToDay,
  conversionRate,
  pctDelta,
  topByCount,
  topByValue,
} from "./dashboardCalc";

// 2026-05-15T12:00:00Z
const MAY_15 = Date.UTC(2026, 4, 15, 12, 0, 0);

describe("monthKeyFromTimestamp", () => {
  it("formats a timestamp as YYYY-MM in UTC", () => {
    expect(monthKeyFromTimestamp(MAY_15)).toBe("2026-05");
  });
  it("uses UTC, not local time, at month boundaries", () => {
    expect(monthKeyFromTimestamp(Date.UTC(2026, 0, 1, 0, 0, 0))).toBe("2026-01");
  });
});

describe("addMonths", () => {
  it("subtracts within a year", () => {
    expect(addMonths("2026-05", -1)).toBe("2026-04");
    expect(addMonths("2026-05", -2)).toBe("2026-03");
  });
  it("wraps across the year boundary", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-01", -2)).toBe("2025-11");
  });
});

describe("dayOfMonth", () => {
  it("returns the UTC day of month", () => {
    expect(dayOfMonth(MAY_15)).toBe(15);
  });
});

describe("isoInMonthUpToDay", () => {
  it("includes dates in the month up to and including the day", () => {
    expect(isoInMonthUpToDay("2026-05-10", "2026-05", 15)).toBe(true);
    expect(isoInMonthUpToDay("2026-05-15", "2026-05", 15)).toBe(true);
  });
  it("excludes later days in the same month", () => {
    expect(isoInMonthUpToDay("2026-05-20", "2026-05", 15)).toBe(false);
  });
  it("excludes other months", () => {
    expect(isoInMonthUpToDay("2026-04-10", "2026-05", 15)).toBe(false);
  });
  it("handles datetime ISO strings (slices first 10 chars)", () => {
    expect(isoInMonthUpToDay("2026-05-09T08:30:00Z", "2026-05", 15)).toBe(true);
  });
});

describe("conversionRate", () => {
  it("returns booked / total", () => {
    expect(conversionRate(3, 12)).toBe(0.25);
  });
  it("returns 0 when total is 0 (no divide-by-zero)", () => {
    expect(conversionRate(0, 0)).toBe(0);
  });
});

describe("pctDelta", () => {
  it("returns the fractional change", () => {
    expect(pctDelta(120, 100)).toBeCloseTo(0.2);
    expect(pctDelta(80, 100)).toBeCloseTo(-0.2);
  });
  it("returns null when previous is 0", () => {
    expect(pctDelta(50, 0)).toBeNull();
  });
});

describe("topByCount", () => {
  it("returns the most frequent key", () => {
    const rows = [{ s: "google" }, { s: "google" }, { s: "facebook" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "google", count: 2 });
  });
  it("skips undefined keys", () => {
    const rows = [{ s: undefined }, { s: "google" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "google", count: 1 });
  });
  it("returns null for an empty set", () => {
    expect(topByCount([] as { s?: string }[], (r) => r.s)).toBeNull();
  });
  it("breaks ties by first-seen", () => {
    const rows = [{ s: "a" }, { s: "b" }, { s: "a" }, { s: "b" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "a", count: 2 });
  });
});

describe("topByValue", () => {
  it("returns the key with the highest summed value", () => {
    const rows = [
      { p: "owp", v: 100 },
      { p: "salomons", v: 250 },
      { p: "owp", v: 200 },
    ];
    expect(topByValue(rows, (r) => r.p, (r) => r.v)).toEqual({
      key: "owp",
      value: 300,
    });
  });
  it("returns null for an empty set", () => {
    expect(topByValue([] as { p?: string; v: number }[], (r) => r.p, (r) => r.v)).toBeNull();
  });
});
