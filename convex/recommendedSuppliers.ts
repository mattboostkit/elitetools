import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminAuth";

/**
 * Ported from Salomons' convex backend so Salomons' public
 * /weddings/recommended-suppliers page keeps rendering after the
 * Convex URL is flipped to elitetools'.
 *
 * `list` is public (the supplier directory is public-facing).
 * Everything else requires a signed-in admin.
 */

export const list = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      const suppliers = await ctx.db
        .query("recommendedSuppliers")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      if (args.status) {
        return suppliers.filter((s) => s.status === args.status);
      }
      return suppliers;
    }
    if (args.status) {
      return await ctx.db
        .query("recommendedSuppliers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("recommendedSuppliers").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    website: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.string(),
    source: v.string(),
    linksToCompetitors: v.optional(v.number()),
    addedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("recommendedSuppliers", {
      name: args.name,
      website: args.website,
      description: args.description,
      location: args.location,
      category: args.category,
      source: args.source,
      linksToCompetitors: args.linksToCompetitors,
      status: "pending",
      addedBy: args.addedBy,
      addedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("recommendedSuppliers"),
    status: v.string(),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      reviewNote: args.reviewNote,
    });
  },
});

export const updateDetails = mutation({
  args: {
    id: v.id("recommendedSuppliers"),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("recommendedSuppliers"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
