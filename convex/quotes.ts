import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminAuth";

// Property type for validation
const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl")
);

/**
 * Create a new quote
 * ADMIN ONLY
 */
export const createQuote = mutation({
  args: {
    property: v.optional(propertyValidator),
    clientName: v.string(),
    clientEmail: v.string(),
    eventDate: v.string(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    total: v.number(),
    status: v.string(),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { adminToken: _, ...quoteData } = args;
    const quoteId = await ctx.db.insert("quotes", {
      ...quoteData,
      property: args.property || "salomons", // Default to Salomons for backward compatibility
      createdAt: Date.now(),
    });
    return quoteId;
  },
});

/**
 * Get a single quote by ID
 * ADMIN ONLY
 */
export const getQuote = query({
  args: {
    quoteId: v.id("quotes"),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const quote = await ctx.db.get(args.quoteId);
    return quote;
  },
});

/**
 * List all quotes with optional property filter
 * ADMIN ONLY
 */
export const listQuotes = query({
  args: {
    property: v.optional(propertyValidator),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let quotes;
    if (args.property) {
      quotes = await ctx.db
        .query("quotes")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .order("desc")
        .take(100);
    } else {
      quotes = await ctx.db.query("quotes").order("desc").take(100);
    }
    return quotes;
  },
});

/**
 * Update quote status
 * ADMIN ONLY
 */
export const updateQuoteStatus = mutation({
  args: {
    quoteId: v.id("quotes"),
    status: v.string(),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.quoteId, { status: args.status });
  },
});

/**
 * Delete a quote
 * ADMIN ONLY
 */
export const deleteQuote = mutation({
  args: {
    quoteId: v.id("quotes"),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.delete(args.quoteId);
  },
});
