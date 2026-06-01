import { v } from "convex/values";

// Single source of truth for the venues (properties) the CRM tracks, for the
// Convex backend. Mirrors src/lib/properties.ts on the frontend. When a new
// venue is onboarded, add it here and there together.
//
// Why this file exists: the `propertyValidator` union used to be copy-pasted
// into schema.ts, enquiries.ts, deals.ts, quotes.ts, formErrors.ts,
// weddingProposals.ts and newsletters.ts. The copies drifted — christmas-at-bewl
// was added to some and not others, so the newest venue was silently rejected
// by the mutations that hadn't been updated. Importing from here makes that
// class of bug impossible.

export const PROPERTY_IDS = [
  "owp",
  "salomons",
  "bewl-water",
  "bewl-adventures",
  "christmas-at-bewl",
] as const;

export type PropertyId = (typeof PROPERTY_IDS)[number];

// Defined as an explicit union (not spread) so Convex infers the precise
// literal types for arg validation and document typing.
export const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl-water"),
  v.literal("bewl-adventures"),
  v.literal("christmas-at-bewl"),
);
