import { describe, it, expect } from "vitest";
import {
  PROPERTY_ORDER,
  PROPERTY_META,
  isProperty,
  propertyLabel,
  propertyDot,
} from "./properties";

describe("property metadata", () => {
  it("has a meta entry for every ordered property and vice versa", () => {
    expect(Object.keys(PROPERTY_META).sort()).toEqual([...PROPERTY_ORDER].sort());
  });

  it("covers all five ELC venues", () => {
    expect(PROPERTY_ORDER).toEqual([
      "owp",
      "salomons",
      "bewl-water",
      "bewl-adventures",
      "christmas-at-bewl",
    ]);
  });
});

describe("propertyLabel", () => {
  it("labels each known property correctly", () => {
    expect(propertyLabel("owp")).toBe("One Warwick Park");
    expect(propertyLabel("salomons")).toBe("Salomons Estate");
    expect(propertyLabel("bewl-water")).toBe("Bewl Water");
    expect(propertyLabel("bewl-adventures")).toBe("Bewl Adventures");
    expect(propertyLabel("christmas-at-bewl")).toBe("Christmas at Bewl Water");
  });

  // Regression guard for the original bug: Bewl Water must never render as OWP.
  it("never falls back to a specific venue for unknown/missing values", () => {
    expect(propertyLabel(undefined)).toBe("Unknown");
    expect(propertyLabel(null)).toBe("Unknown");
    expect(propertyLabel("")).toBe("Unknown");
    expect(propertyLabel("not-a-real-venue")).toBe("Unknown");
    // Explicitly: an unrecognised value is not silently "One Warwick Park".
    expect(propertyLabel("something-new")).not.toBe("One Warwick Park");
  });
});

describe("isProperty", () => {
  it("accepts known properties", () => {
    expect(isProperty("bewl-water")).toBe(true);
    expect(isProperty("owp")).toBe(true);
  });
  it("rejects unknown / nullish values", () => {
    expect(isProperty(undefined)).toBe(false);
    expect(isProperty(null)).toBe(false);
    expect(isProperty("nope")).toBe(false);
  });
});

describe("propertyDot", () => {
  it("returns the property's dot class", () => {
    expect(propertyDot("bewl-water")).toBe("bg-sky-500");
  });
  it("returns a neutral class for unknowns rather than another venue's colour", () => {
    expect(propertyDot("mystery")).toBe("bg-zinc-400");
  });
});
