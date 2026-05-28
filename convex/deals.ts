import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";
import type { Doc, Id } from "./_generated/dataModel";

const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl-water"),
  v.literal("bewl-adventures")
);

const statusValidator = v.union(
  v.literal("provisional"),
  v.literal("contracted"),
  v.literal("completed"),
  v.literal("cancelled")
);

type DealWithSalesperson = Doc<"deals"> & {
  salesperson: Doc<"salespeople"> | null;
};

/**
 * List deals with optional filters. Returns each row joined with its
 * salesperson row for table display (avoid N+1 in the UI).
 *
 * Filters compose with AND. Sort is most-recently-signed first.
 */
export const list = query({
  args: {
    property: v.optional(propertyValidator),
    salespersonId: v.optional(v.id("salespeople")),
    status: v.optional(statusValidator),
    // ISO date strings (inclusive)
    signedFrom: v.optional(v.string()),
    signedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<DealWithSalesperson[]> => {
    await requireAdmin(ctx);

    // Use the most specific index available, then in-memory filter the rest.
    let rows: Doc<"deals">[];
    if (args.property && args.status) {
      rows = await ctx.db
        .query("deals")
        .withIndex("by_property_status", (q) =>
          q.eq("property", args.property!).eq("status", args.status!)
        )
        .collect();
    } else if (args.property) {
      rows = await ctx.db
        .query("deals")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .collect();
    } else if (args.status) {
      rows = await ctx.db
        .query("deals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.salespersonId) {
      rows = await ctx.db
        .query("deals")
        .withIndex("by_salespersonId", (q) =>
          q.eq("salespersonId", args.salespersonId!)
        )
        .collect();
    } else {
      rows = await ctx.db.query("deals").collect();
    }

    // Compose remaining filters in memory
    let filtered = rows;
    if (args.salespersonId && (args.property || args.status)) {
      filtered = filtered.filter((r) => r.salespersonId === args.salespersonId);
    }
    if (args.signedFrom) {
      filtered = filtered.filter((r) => r.signedDate >= args.signedFrom!);
    }
    if (args.signedTo) {
      filtered = filtered.filter((r) => r.signedDate <= args.signedTo!);
    }

    // Sort by signedDate desc (most recent first)
    filtered.sort((a, b) => b.signedDate.localeCompare(a.signedDate));

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Join salesperson per row (parallel fetch)
    const salespeopleIds = Array.from(
      new Set(filtered.map((d) => d.salespersonId))
    );
    const salespeople = await Promise.all(
      salespeopleIds.map((id) => ctx.db.get(id))
    );
    const salespersonById = new Map<
      Id<"salespeople">,
      Doc<"salespeople"> | null
    >();
    salespeopleIds.forEach((id, i) => {
      salespersonById.set(id, salespeople[i]);
    });

    return filtered.map((d) => ({
      ...d,
      salesperson: salespersonById.get(d.salespersonId) ?? null,
    }));
  },
});

/**
 * Get a single deal by id, joined with its salesperson + source enquiry.
 */
export const get = query({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const deal = await ctx.db.get(args.id);
    if (!deal) return null;
    const [salesperson, sourceEnquiry] = await Promise.all([
      ctx.db.get(deal.salespersonId),
      deal.sourceEnquiryId ? ctx.db.get(deal.sourceEnquiryId) : null,
    ]);
    return { ...deal, salesperson, sourceEnquiry };
  },
});

/**
 * Create a new deal. If sourceEnquiryId is provided, also update the
 * enquiry's dealId field to link back.
 */
export const create = mutation({
  args: {
    property: propertyValidator,
    sourceEnquiryId: v.optional(v.id("enquiries")),
    salespersonId: v.id("salespeople"),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    eventType: v.string(),
    eventDate: v.optional(v.string()),
    signedDate: v.string(),
    guestCount: v.optional(v.number()),
    contractValue: v.number(),
    depositPaid: v.optional(v.number()),
    balancePaid: v.optional(v.number()),
    status: v.optional(statusValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.contractValue < 0) throw new Error("contractValue must be >= 0");

    // Confirm salesperson exists + is active (or at least exists; archived
    // reps can still be back-filled with historic deals)
    const rep = await ctx.db.get(args.salespersonId);
    if (!rep) throw new Error("Salesperson not found");

    const now = Date.now();
    const dealId = await ctx.db.insert("deals", {
      property: args.property,
      sourceEnquiryId: args.sourceEnquiryId,
      salespersonId: args.salespersonId,
      customerName: args.customerName.trim(),
      customerEmail: args.customerEmail.trim(),
      customerPhone: args.customerPhone?.trim() || undefined,
      eventType: args.eventType,
      eventDate: args.eventDate,
      signedDate: args.signedDate,
      guestCount: args.guestCount,
      contractValue: args.contractValue,
      depositPaid: args.depositPaid ?? 0,
      balancePaid: args.balancePaid ?? 0,
      status: args.status ?? "provisional",
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Back-link the enquiry to this deal
    if (args.sourceEnquiryId) {
      await ctx.db.patch(args.sourceEnquiryId, { dealId });
    }

    return dealId;
  },
});

/**
 * Update an existing deal's mutable fields. Status changes go through
 * setStatus instead to keep workflow validation in one place.
 */
export const update = mutation({
  args: {
    id: v.id("deals"),
    salespersonId: v.optional(v.id("salespeople")),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    eventType: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    signedDate: v.optional(v.string()),
    guestCount: v.optional(v.number()),
    contractValue: v.optional(v.number()),
    depositPaid: v.optional(v.number()),
    balancePaid: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");

    if (args.contractValue !== undefined && args.contractValue < 0) {
      throw new Error("contractValue must be >= 0");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.salespersonId !== undefined) {
      const rep = await ctx.db.get(args.salespersonId);
      if (!rep) throw new Error("Salesperson not found");
      patch.salespersonId = args.salespersonId;
    }
    if (args.customerName !== undefined)
      patch.customerName = args.customerName.trim();
    if (args.customerEmail !== undefined)
      patch.customerEmail = args.customerEmail.trim();
    if (args.customerPhone !== undefined)
      patch.customerPhone = args.customerPhone.trim() || undefined;
    if (args.eventType !== undefined) patch.eventType = args.eventType;
    if (args.eventDate !== undefined) patch.eventDate = args.eventDate;
    if (args.signedDate !== undefined) patch.signedDate = args.signedDate;
    if (args.guestCount !== undefined) patch.guestCount = args.guestCount;
    if (args.contractValue !== undefined)
      patch.contractValue = args.contractValue;
    if (args.depositPaid !== undefined) patch.depositPaid = args.depositPaid;
    if (args.balancePaid !== undefined) patch.balancePaid = args.balancePaid;
    if (args.notes !== undefined)
      patch.notes = args.notes.trim() || undefined;

    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

/**
 * Status workflow transitions. Enforces the state machine:
 *   provisional -> contracted -> completed
 *                             \> cancelled (allowed from any state)
 *
 * Anything outside this graph throws.
 */
export const setStatus = mutation({
  args: {
    id: v.id("deals"),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");

    const valid: Record<string, string[]> = {
      provisional: ["contracted", "cancelled"],
      contracted: ["completed", "cancelled"],
      completed: [], // Terminal
      cancelled: [], // Terminal
    };

    if (existing.status === args.status) return; // No-op
    const allowed = valid[existing.status] ?? [];
    if (!allowed.includes(args.status)) {
      throw new Error(
        `Cannot transition deal from "${existing.status}" to "${args.status}"`
      );
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Aggregate counts + sums per status. Powers the dashboard KPI band.
 */
export const summary = query({
  args: {
    property: v.optional(propertyValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const rows = args.property
      ? await ctx.db
          .query("deals")
          .withIndex("by_property", (q) => q.eq("property", args.property!))
          .collect()
      : await ctx.db.query("deals").collect();

    const totals = {
      provisional: { count: 0, value: 0 },
      contracted: { count: 0, value: 0 },
      completed: { count: 0, value: 0 },
      cancelled: { count: 0, value: 0 },
    };

    for (const d of rows) {
      totals[d.status].count++;
      totals[d.status].value += d.contractValue;
    }

    return totals;
  },
});
