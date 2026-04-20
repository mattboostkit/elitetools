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
 * Subscribe to the newsletter
 * PUBLIC - no auth required (form submission)
 */
export const subscribe = mutation({
  args: {
    property: v.optional(propertyValidator),
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }

    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await ctx.db
      .query("newsletters")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      // If already subscribed and active, return existing subscription
      if (existing.status === "active") {
        return {
          subscriptionId: existing._id,
          success: true,
          alreadySubscribed: true
        };
      }

      // If previously unsubscribed, reactivate
      if (existing.status === "unsubscribed") {
        await ctx.db.patch(existing._id, {
          status: "active",
          subscribedAt: Date.now(),
          property: args.property || existing.property, // Update property if provided
        });
        return {
          subscriptionId: existing._id,
          success: true,
          reactivated: true
        };
      }
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("newsletters", {
      property: args.property,
      email: normalizedEmail,
      subscribedAt: Date.now(),
      source: args.source,
      status: "active",
    });

    return { subscriptionId, success: true, alreadySubscribed: false };
  },
});

/**
 * Unsubscribe from the newsletter
 * PUBLIC - no auth required (users unsubscribing themselves)
 */
export const unsubscribe = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    const subscription = await ctx.db
      .query("newsletters")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!subscription) {
      throw new Error("Email not found in newsletter list");
    }

    await ctx.db.patch(subscription._id, {
      status: "unsubscribed",
    });

    return { success: true };
  },
});

/**
 * List all newsletter subscribers with optional filters
 * ADMIN ONLY
 */
export const list = query({
  args: {
    property: v.optional(propertyValidator),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 1000;
    let subscribers;

    if (args.property) {
      subscribers = await ctx.db
        .query("newsletters")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .order("desc")
        .take(limit);
    } else {
      subscribers = await ctx.db
        .query("newsletters")
        .order("desc")
        .take(limit);
    }

    // Filter by status if provided
    if (args.status) {
      return subscribers.filter((s) => s.status === args.status);
    }

    return subscribers;
  },
});

/**
 * Alias for list - maintaining compatibility with Salomons admin
 */
export const listSubscribers = list;

/**
 * Get subscriber statistics with optional property filter
 * ADMIN ONLY
 */
export const getSubscriberStats = query({
  args: {
    property: v.optional(propertyValidator),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let subscribers;
    if (args.property) {
      subscribers = await ctx.db
        .query("newsletters")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .collect();
    } else {
      subscribers = await ctx.db.query("newsletters").collect();
    }

    const stats = {
      total: subscribers.length,
      active: subscribers.filter((s) => s.status === "active").length,
      unsubscribed: subscribers.filter((s) => s.status === "unsubscribed").length,
      byProperty: {
        owp: subscribers.filter((s) => s.property === "owp").length,
        salomons: subscribers.filter((s) => s.property === "salomons").length,
        bewl: subscribers.filter((s) => s.property === "bewl").length,
        unknown: subscribers.filter((s) => !s.property).length,
      },
    };

    return stats;
  },
});

/**
 * Check if an email is subscribed
 * PUBLIC - used for form pre-population
 */
export const isSubscribed = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    const subscription = await ctx.db
      .query("newsletters")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    return {
      subscribed: subscription?.status === "active",
      email: normalizedEmail,
    };
  },
});
