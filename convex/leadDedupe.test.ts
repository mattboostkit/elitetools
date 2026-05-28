import { describe, it, expect } from "vitest";
import {
  findRecentDuplicate,
  DEFAULT_DEDUPE_WINDOW_MS,
  type DedupeCandidate,
} from "./leadDedupe";

const NOW = 1_780_000_000_000;
const WINDOW = DEFAULT_DEDUPE_WINDOW_MS;

// Helper: build a candidate row.
function row(
  over: Partial<DedupeCandidate> & { createdAt: number }
): DedupeCandidate & { id: string } {
  return {
    id: over.createdAt.toString(),
    email: over.email ?? "visitor@example.com",
    source: "source" in over ? over.source : "ranger-bewl-water",
    createdAt: over.createdAt,
  };
}

const baseQuery = {
  email: "visitor@example.com",
  source: "ranger-bewl-water",
  now: NOW,
  windowMs: WINDOW,
};

describe("findRecentDuplicate", () => {
  it("matches the same email + source within the window", () => {
    const cand = row({ createdAt: NOW - 60_000 }); // 1 min ago
    expect(findRecentDuplicate([cand], baseQuery)).toBe(cand);
  });

  it("returns null when nothing matches", () => {
    expect(findRecentDuplicate([], baseQuery)).toBeNull();
  });

  it("ignores candidates older than the window", () => {
    const stale = row({ createdAt: NOW - WINDOW - 1 });
    expect(findRecentDuplicate([stale], baseQuery)).toBeNull();
  });

  it("includes a candidate exactly on the window boundary", () => {
    const edge = row({ createdAt: NOW - WINDOW });
    expect(findRecentDuplicate([edge], baseQuery)).toBe(edge);
  });

  it("matches email case-insensitively", () => {
    const cand = row({ createdAt: NOW - 1000, email: "Visitor@Example.com" });
    expect(findRecentDuplicate([cand], baseQuery)).toBe(cand);
  });

  it("does not match a different email", () => {
    const other = row({ createdAt: NOW - 1000, email: "someone@else.com" });
    expect(findRecentDuplicate([other], baseQuery)).toBeNull();
  });

  it("does not match a different source", () => {
    const other = row({ createdAt: NOW - 1000, source: "contact-form" });
    expect(findRecentDuplicate([other], baseQuery)).toBeNull();
  });

  it("treats missing source on both sides as a match", () => {
    const cand = row({ createdAt: NOW - 1000, source: undefined });
    const result = findRecentDuplicate([cand], {
      ...baseQuery,
      source: undefined,
    });
    expect(result).toBe(cand);
  });

  it("returns the most recent of several matches", () => {
    const older = row({ createdAt: NOW - 600_000 });
    const newer = row({ createdAt: NOW - 30_000 });
    expect(findRecentDuplicate([older, newer], baseQuery)).toBe(newer);
  });

  it("ignores rows created in the future (clock skew)", () => {
    const future = row({ createdAt: NOW + 60_000 });
    expect(findRecentDuplicate([future], baseQuery)).toBeNull();
  });
});
