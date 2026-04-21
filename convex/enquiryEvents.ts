import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./adminAuth";

const eventTypeValidator = v.union(
  v.literal("note"),
  v.literal("status_change"),
  v.literal("assigned"),
  v.literal("unassigned")
);

/**
 * Shared helper so other mutations (status change, assign, etc.) can
 * stamp the audit trail. Caller is responsible for having already
 * validated admin via requireAdmin — we just grab the identity here
 * so we don't double-throw.
 */
export async function logEvent(
  ctx: MutationCtx,
  args: {
    enquiryId: Id<"enquiries">;
    type: "note" | "status_change" | "assigned" | "unassigned";
    body?: string;
    fromValue?: string;
    toValue?: string;
  }
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  await ctx.db.insert("enquiryEvents", {
    enquiryId: args.enquiryId,
    type: args.type,
    body: args.body,
    fromValue: args.fromValue,
    toValue: args.toValue,
    actorName: identity?.name,
    actorEmail: identity?.email,
    createdAt: Date.now(),
  });
}

/**
 * List all events for an enquiry, most recent first.
 * ADMIN ONLY
 */
export const list = query({
  args: { enquiryId: v.id("enquiries") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("enquiryEvents")
      .withIndex("by_enquiry", (q) => q.eq("enquiryId", args.enquiryId))
      .order("desc")
      .collect();
  },
});

/**
 * Add a note to an enquiry's timeline.
 * ADMIN ONLY
 */
export const addNote = mutation({
  args: {
    enquiryId: v.id("enquiries"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trimmed = args.body.trim();
    if (trimmed.length === 0) {
      throw new Error("Note cannot be empty");
    }
    if (trimmed.length > 5000) {
      throw new Error("Note too long (max 5000 characters)");
    }
    await logEvent(ctx, {
      enquiryId: args.enquiryId,
      type: "note",
      body: trimmed,
    });
  },
});

/**
 * Delete a single event (notes only — users can't erase their own
 * audit trail of status changes). ADMIN ONLY.
 */
export const deleteNote = mutation({
  args: { eventId: v.id("enquiryEvents") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) return;
    if (event.type !== "note") {
      throw new Error("Only notes can be deleted");
    }
    await ctx.db.delete(args.eventId);
  },
});

// Keep the validator exported for callers that want to narrow.
export { eventTypeValidator };
