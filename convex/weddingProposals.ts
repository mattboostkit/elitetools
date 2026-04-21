import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

// Property type for validation
const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons")
);

/**
 * Generate a random suffix for slugs (e.g., "x7k9")
 */
function generateRandomSuffix(length: number = 4): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // Excluded confusing chars: i, l, o, 0, 1
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Get all wedding proposals with optional property filter
 * ADMIN ONLY
 */
export const list = query({
  args: {
    property: v.optional(propertyValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let proposals;
    if (args.property) {
      proposals = await ctx.db
        .query("weddingProposals")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .collect();
    } else {
      proposals = await ctx.db.query("weddingProposals").collect();
    }
    return proposals.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single proposal by ID
 * ADMIN ONLY
 */
export const getById = query({
  args: {
    id: v.id("weddingProposals"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return await ctx.db.get(args.id);
  },
});

/**
 * Get a proposal by slug (for public page)
 * PUBLIC - this is how couples access their proposals
 * The slug is now randomized so it can't be guessed
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weddingProposals")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Create a new proposal
 * ADMIN ONLY
 */
export const create = mutation({
  args: {
    property: v.optional(propertyValidator),
    coupleName: v.string(),
    partnerOneName: v.string(),
    partnerTwoName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    weddingDate: v.optional(v.string()),
    guestCount: v.optional(v.number()),
    ceremonyVenue: v.optional(v.string()),
    receptionVenue: v.optional(v.string()),
    accommodationOptions: v.optional(v.array(v.string())),
    estimatedRooms: v.optional(v.number()),
    personalNote: v.optional(v.string()),
    highlightFeatures: v.optional(v.array(v.string())),
    accessCode: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { ...proposalData } = args;

    // Generate a secure but readable slug: "emma-james-x7k9"
    const baseSlug = args.coupleName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Keep trying until we get a unique slug
    let slug = `${baseSlug}-${generateRandomSuffix()}`;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("weddingProposals")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${generateRandomSuffix()}`;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Could not generate unique slug");
    }

    return await ctx.db.insert("weddingProposals", {
      ...proposalData,
      property: args.property || "salomons", // Default to Salomons for backward compatibility
      slug,
      status: "draft",
      viewCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a proposal
 * ADMIN ONLY
 */
export const update = mutation({
  args: {
    id: v.id("weddingProposals"),
    coupleName: v.optional(v.string()),
    partnerOneName: v.optional(v.string()),
    partnerTwoName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    weddingDate: v.optional(v.string()),
    guestCount: v.optional(v.number()),
    ceremonyVenue: v.optional(v.string()),
    receptionVenue: v.optional(v.string()),
    accommodationOptions: v.optional(v.array(v.string())),
    estimatedRooms: v.optional(v.number()),
    personalNote: v.optional(v.string()),
    highlightFeatures: v.optional(v.array(v.string())),
    accessCode: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

/**
 * Update status
 * ADMIN ONLY
 */
export const updateStatus = mutation({
  args: {
    id: v.id("weddingProposals"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const updates: { status: string; sentAt?: number } = { status: args.status };

    // If marking as sent, record the sent time
    if (args.status === "sent") {
      updates.sentAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

/**
 * Record a view (for tracking when couple views their proposal)
 * PUBLIC - called when a couple views their proposal page
 */
export const recordView = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("weddingProposals")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    await ctx.db.patch(proposal._id, {
      viewCount: proposal.viewCount + 1,
      lastViewedAt: Date.now(),
      // Update status to "viewed" if it was "sent"
      ...(proposal.status === "sent" ? { status: "viewed" } : {}),
    });

    return proposal;
  },
});

/**
 * Delete a proposal
 * ADMIN ONLY
 */
export const remove = mutation({
  args: {
    id: v.id("weddingProposals"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.delete(args.id);
  },
});

/**
 * Mark proposal as sent and prepare email data
 * ADMIN ONLY
 */
export const sendProposal = mutation({
  args: {
    id: v.id("weddingProposals"),
    baseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Update status to sent
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
    });

    // Return email data that can be used by an email service
    const proposalUrl = `${args.baseUrl}/your-wedding/${proposal.slug}`;

    return {
      to: proposal.email,
      subject: `Your Wedding at ${proposal.property === "owp" ? "One Warwick Park" : "Salomons Estate"} - ${proposal.coupleName}`,
      proposalUrl,
      coupleName: proposal.coupleName,
      partnerOneName: proposal.partnerOneName,
      partnerTwoName: proposal.partnerTwoName,
      weddingDate: proposal.weddingDate,
      personalNote: proposal.personalNote,
      accessCode: proposal.accessCode,
    };
  },
});

/**
 * Generate a unique slug from couple name (for preview purposes)
 * ADMIN ONLY
 */
export const generateSlug = query({
  args: {
    coupleName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Create base slug from couple name with random suffix
    const baseSlug = args.coupleName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Generate a preview slug (actual slug generated on create)
    return `${baseSlug}-${generateRandomSuffix()}`;
  },
});
