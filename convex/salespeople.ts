import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

/**
 * List salespeople. By default returns active reps first (alphabetical),
 * then archived (also alphabetical). Pass includeArchived=false to hide
 * archived rows entirely (useful for assignee pickers).
 */
export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const includeArchived = args.includeArchived ?? true;

    const allRows = await ctx.db.query("salespeople").collect();
    const filtered = includeArchived
      ? allRows
      : allRows.filter((r) => r.active);
    return filtered.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/** Get a single salesperson by id. Returns null if not found. */
export const get = query({
  args: { id: v.id("salespeople") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

/** Create a new salesperson. Admin only. */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    defaultCommissionRatePct: v.number(),
    startDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.defaultCommissionRatePct < 0 || args.defaultCommissionRatePct > 100) {
      throw new Error("defaultCommissionRatePct must be between 0 and 100");
    }
    const now = Date.now();
    return await ctx.db.insert("salespeople", {
      name: args.name.trim(),
      email: args.email?.trim() || undefined,
      clerkUserId: args.clerkUserId?.trim() || undefined,
      defaultCommissionRatePct: args.defaultCommissionRatePct,
      active: true,
      startDate: args.startDate,
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update a salesperson's editable fields. Admin only. */
export const update = mutation({
  args: {
    id: v.id("salespeople"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    defaultCommissionRatePct: v.optional(v.number()),
    startDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Salesperson not found");

    if (
      args.defaultCommissionRatePct !== undefined &&
      (args.defaultCommissionRatePct < 0 || args.defaultCommissionRatePct > 100)
    ) {
      throw new Error("defaultCommissionRatePct must be between 0 and 100");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.email !== undefined) patch.email = args.email.trim() || undefined;
    if (args.clerkUserId !== undefined)
      patch.clerkUserId = args.clerkUserId.trim() || undefined;
    if (args.defaultCommissionRatePct !== undefined)
      patch.defaultCommissionRatePct = args.defaultCommissionRatePct;
    if (args.startDate !== undefined) patch.startDate = args.startDate;
    if (args.notes !== undefined) patch.notes = args.notes.trim() || undefined;

    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

/** Archive (soft-delete) a salesperson. Preserves history. Admin only. */
export const archive = mutation({
  args: { id: v.id("salespeople") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { active: false, updatedAt: Date.now() });
  },
});

/** Reactivate an archived salesperson. Admin only. */
export const unarchive = mutation({
  args: { id: v.id("salespeople") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { active: true, updatedAt: Date.now() });
  },
});
