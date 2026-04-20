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
 * Log a form submission error
 * PUBLIC - no auth required (called from client when form fails)
 */
export const logFormError = mutation({
  args: {
    property: v.optional(propertyValidator),
    formType: v.string(),
    errorType: v.string(),
    errorMessage: v.string(),
    errorCode: v.optional(v.string()),
    attemptedEmail: v.optional(v.string()),
    attemptedEventType: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    online: v.optional(v.boolean()),
    connectionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate error type
    const validErrorTypes = ["network", "validation", "server", "timeout", "unknown"];
    const errorType = validErrorTypes.includes(args.errorType) ? args.errorType : "unknown";

    // Mask email for privacy (keep domain for debugging)
    let maskedEmail: string | undefined;
    if (args.attemptedEmail) {
      const parts = args.attemptedEmail.split("@");
      if (parts.length === 2) {
        maskedEmail = `***@${parts[1]}`;
      }
    }

    const errorId = await ctx.db.insert("formErrors", {
      property: args.property,
      formType: args.formType,
      errorType,
      errorMessage: args.errorMessage.slice(0, 500), // Limit message length
      errorCode: args.errorCode,
      attemptedEmail: maskedEmail,
      attemptedEventType: args.attemptedEventType,
      userAgent: args.userAgent?.slice(0, 500),
      timestamp: Date.now(),
      online: args.online,
      connectionType: args.connectionType,
    });

    return errorId;
  },
});

/**
 * List form errors for debugging
 * ADMIN ONLY
 */
export const listFormErrors = query({
  args: {
    property: v.optional(propertyValidator),
    limit: v.optional(v.number()),
    errorType: v.optional(v.string()),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 50;

    let errors;
    if (args.errorType !== undefined) {
      errors = await ctx.db
        .query("formErrors")
        .withIndex("by_errorType", (q) => q.eq("errorType", args.errorType as string))
        .order("desc")
        .take(limit);
    } else {
      errors = await ctx.db
        .query("formErrors")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }

    // Filter by property if provided
    if (args.property) {
      return errors.filter((e) => e.property === args.property);
    }

    return errors;
  },
});

/**
 * Get error statistics
 * ADMIN ONLY
 */
export const getFormErrorStats = query({
  args: {
    property: v.optional(propertyValidator),    since: v.optional(v.number()), // Timestamp to filter from
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let errors = await ctx.db.query("formErrors").collect();

    // Filter by property if specified
    if (args.property) {
      errors = errors.filter((e) => e.property === args.property);
    }

    // Filter by time if specified
    const sinceTimestamp = args.since;
    const filteredErrors = sinceTimestamp !== undefined
      ? errors.filter(e => e.timestamp >= sinceTimestamp)
      : errors;

    const stats = {
      total: filteredErrors.length,
      byType: {
        network: filteredErrors.filter(e => e.errorType === "network").length,
        validation: filteredErrors.filter(e => e.errorType === "validation").length,
        server: filteredErrors.filter(e => e.errorType === "server").length,
        timeout: filteredErrors.filter(e => e.errorType === "timeout").length,
        unknown: filteredErrors.filter(e => e.errorType === "unknown").length,
      },
      byForm: {
        contact: filteredErrors.filter(e => e.formType === "contact").length,
        wedding: filteredErrors.filter(e => e.formType === "wedding").length,
        newsletter: filteredErrors.filter(e => e.formType === "newsletter").length,
      },
      byProperty: {
        owp: filteredErrors.filter(e => e.property === "owp").length,
        salomons: filteredErrors.filter(e => e.property === "salomons").length,
        bewl: filteredErrors.filter(e => e.property === "bewl").length,
      },
      // Recent errors (last 24 hours)
      last24h: filteredErrors.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000).length,
      // Recent errors (last 7 days)
      last7d: filteredErrors.filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    };

    return stats;
  },
});

/**
 * Clear old form errors (older than 30 days)
 * ADMIN ONLY
 */
export const clearOldFormErrors = mutation({
  args: {    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const days = args.olderThanDays ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const oldErrors = await ctx.db
      .query("formErrors")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    let deleted = 0;
    for (const error of oldErrors) {
      await ctx.db.delete(error._id);
      deleted++;
    }

    return { deleted };
  },
});
