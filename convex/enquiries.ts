import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminAuth";

// Property type for validation
const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl")
);

// Sales team assignee
const assigneeValidator = v.union(
  v.literal("christie"),
  v.literal("courtney")
);

/**
 * Create a new enquiry from the contact form
 * PUBLIC - no auth required (form submission)
 */
export const create = mutation({
  args: {
    property: propertyValidator,
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),      // OWP uses this
    eventType: v.optional(v.string()),    // Salomons uses this
    preferredDate: v.optional(v.string()),
    guestCount: v.optional(v.number()),
    message: v.string(),
    // UTM tracking fields
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    gclid: v.optional(v.string()),
    landingPage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }

    // Validate name is not empty
    if (!args.name.trim()) {
      throw new Error("Name is required");
    }

    // Validate message is not empty
    if (!args.message.trim()) {
      throw new Error("Message is required");
    }

    // Validate guest count if provided
    if (args.guestCount !== undefined && args.guestCount < 1) {
      throw new Error("Guest count must be at least 1");
    }

    const enquiryId = await ctx.db.insert("enquiries", {
      property: args.property,
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      phone: args.phone?.trim(),
      subject: args.subject,
      eventType: args.eventType,
      preferredDate: args.preferredDate,
      guestCount: args.guestCount,
      message: args.message.trim(),
      status: "new",
      createdAt: Date.now(),
      // UTM tracking fields
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmContent: args.utmContent,
      utmTerm: args.utmTerm,
      gclid: args.gclid,
      landingPage: args.landingPage,
    });

    return enquiryId;
  },
});

/**
 * Get a single enquiry by ID
 * ADMIN ONLY
 */
export const getEnquiry = query({
  args: {
    enquiryId: v.id("enquiries"),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const enquiry = await ctx.db.get(args.enquiryId);
    return enquiry;
  },
});

/**
 * List enquiries (for admin dashboard)
 * ADMIN ONLY - with optional property and status filters
 */
export const list = query({
  args: {
    property: v.optional(propertyValidator),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 100;
    let enquiries;

    if (args.property) {
      // Filter by property
      enquiries = await ctx.db
        .query("enquiries")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .order("desc")
        .take(limit);
    } else {
      // Get all enquiries
      enquiries = await ctx.db
        .query("enquiries")
        .order("desc")
        .take(limit);
    }

    // Filter by status if provided
    if (args.status) {
      return enquiries.filter((e) => e.status === args.status);
    }

    return enquiries;
  },
});

/**
 * Alias for list - maintaining compatibility with Salomons admin
 */
export const listEnquiries = list;

/**
 * Update enquiry status
 * ADMIN ONLY
 */
export const updateStatus = mutation({
  args: {
    id: v.id("enquiries"),
    status: v.string(),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Validate status - combined from both OWP and Salomons
    const validStatuses = ["new", "read", "responded", "archived", "contacted", "quoted", "booked", "declined"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Invalid status");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

/**
 * Alias for updateStatus - maintaining compatibility with Salomons admin
 */
export const updateEnquiryStatus = mutation({
  args: {
    enquiryId: v.id("enquiries"),
    status: v.string(),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Validate status
    const validStatuses = ["new", "read", "responded", "archived", "contacted", "quoted", "booked", "declined"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Invalid status");
    }

    await ctx.db.patch(args.enquiryId, { status: args.status });
  },
});

/**
 * Delete an enquiry
 * ADMIN ONLY
 */
export const deleteEnquiry = mutation({
  args: {
    enquiryId: v.id("enquiries"),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Verify the enquiry exists
    const enquiry = await ctx.db.get(args.enquiryId);
    if (!enquiry) {
      throw new Error("Enquiry not found");
    }

    await ctx.db.delete(args.enquiryId);
    return { success: true };
  },
});

/**
 * Assign (or un-assign) an enquiry to a sales team member.
 * Pass assignee: null to clear the assignment.
 * ADMIN ONLY
 */
export const assign = mutation({
  args: {
    id: v.id("enquiries"),
    assignee: v.union(assigneeValidator, v.null()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      assignedTo: args.assignee ?? undefined,
    });
  },
});

/**
 * Get enquiries count by status (with optional property filter)
 * ADMIN ONLY
 */
export const getEnquiriesStats = query({
  args: {
    property: v.optional(propertyValidator),  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let enquiries;
    if (args.property) {
      enquiries = await ctx.db
        .query("enquiries")
        .withIndex("by_property", (q) => q.eq("property", args.property!))
        .collect();
    } else {
      enquiries = await ctx.db.query("enquiries").collect();
    }

    const stats = {
      total: enquiries.length,
      new: enquiries.filter((e) => e.status === "new").length,
      contacted: enquiries.filter((e) => e.status === "contacted").length,
      quoted: enquiries.filter((e) => e.status === "quoted").length,
      booked: enquiries.filter((e) => e.status === "booked").length,
      declined: enquiries.filter((e) => e.status === "declined").length,
      read: enquiries.filter((e) => e.status === "read").length,
      responded: enquiries.filter((e) => e.status === "responded").length,
      archived: enquiries.filter((e) => e.status === "archived").length,
      // Stats by property
      byProperty: {
        owp: enquiries.filter((e) => e.property === "owp").length,
        salomons: enquiries.filter((e) => e.property === "salomons").length,
        bewl: enquiries.filter((e) => e.property === "bewl").length,
      },
      // Stats by assignee (open leads only — new/contacted/quoted count
      // against the team member's active workload; booked/declined don't)
      byAssignee: {
        christie: enquiries.filter(
          (e) =>
            e.assignedTo === "christie" &&
            ["new", "contacted", "quoted"].includes(e.status)
        ).length,
        courtney: enquiries.filter(
          (e) =>
            e.assignedTo === "courtney" &&
            ["new", "contacted", "quoted"].includes(e.status)
        ).length,
        unassigned: enquiries.filter(
          (e) =>
            !e.assignedTo &&
            ["new", "contacted", "quoted"].includes(e.status)
        ).length,
      },
    };

    return stats;
  },
});

/**
 * Alias for create - maintaining compatibility with Salomons contact form
 * Salomons uses api.enquiries.createEnquiry
 */
export const createEnquiry = create;
