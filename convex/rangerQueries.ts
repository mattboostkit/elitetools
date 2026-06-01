import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminAuth";
import { propertyValidator } from "./properties";

const MAX_QUESTION_LEN = 2000;
const MAX_REASON_LEN = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Record a Bewl Ranger chatbot query.
 *
 * PUBLIC — no auth (anonymous chatbot traffic), the same trust model as
 * enquiries.captureLead. `answered=false` marks a question the Ranger flagged
 * it couldn't answer from its knowledge snapshot; those rows drive the daily
 * digest. Stores the question text only — no contact details.
 */
export const logQuery = mutation({
  args: {
    property: v.optional(propertyValidator),
    question: v.string(),
    answered: v.boolean(),
    reason: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const question = args.question.trim().slice(0, MAX_QUESTION_LEN);
    if (!question) throw new Error("Question is required");

    const id = await ctx.db.insert("rangerQueries", {
      property: args.property,
      question,
      answered: args.answered,
      reason: args.reason?.trim().slice(0, MAX_REASON_LEN) || undefined,
      sessionId: args.sessionId,
      source: args.source,
      createdAt: Date.now(),
    });
    return { id };
  },
});

/**
 * Unanswered queries from the last `sinceMs` window that haven't yet been
 * included in a digest email. Returns question text + timestamps only (no
 * PII), so it's safe for the digest cron to call without admin auth — the
 * cron itself is gated by CRON_SECRET at the HTTP layer in the Bewl Water app.
 */
export const recentUnanswered = query({
  args: {
    sinceMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = Date.now() - (args.sinceMs ?? DAY_MS);
    const limit = args.limit ?? 200;

    const rows = await ctx.db
      .query("rangerQueries")
      .withIndex("by_answered_created", (q) =>
        q.eq("answered", false).gte("createdAt", since)
      )
      .order("desc")
      .take(limit);

    // Only those not already sent in a previous digest.
    return rows
      .filter((r) => r.emailedAt === undefined)
      .map((r) => ({
        _id: r._id,
        question: r.question,
        reason: r.reason ?? null,
        property: r.property ?? null,
        source: r.source ?? null,
        createdAt: r.createdAt,
      }));
  },
});

/**
 * Stamp a batch of queries as emailed so the next digest doesn't repeat them.
 * Called by the digest cron immediately after a successful send. Idempotent —
 * rows already stamped are skipped.
 */
export const markEmailed = mutation({
  args: { ids: v.array(v.id("rangerQueries")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    let marked = 0;
    for (const id of args.ids) {
      const row = await ctx.db.get(id);
      if (!row || row.emailedAt !== undefined) continue;
      await ctx.db.patch(id, { emailedAt: now });
      marked++;
    }
    return { marked };
  },
});

/**
 * Admin dashboard view: recent Ranger queries (answered + unanswered).
 * ADMIN ONLY.
 */
export const listRecent = query({
  args: {
    property: v.optional(propertyValidator),
    onlyUnanswered: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 100;
    let rows;
    if (args.property) {
      rows = await ctx.db
        .query("rangerQueries")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .order("desc")
        .take(limit);
    } else {
      rows = await ctx.db
        .query("rangerQueries")
        .withIndex("by_created")
        .order("desc")
        .take(limit);
    }
    return args.onlyUnanswered ? rows.filter((r) => !r.answered) : rows;
  },
});
