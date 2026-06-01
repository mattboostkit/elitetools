import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminAuth";

// Mirrors the property union in schema.ts. Marketing sites send their property.
const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl-water"),
  v.literal("bewl-adventures")
);

/**
 * PUBLIC — a careers form requests a short-lived URL to upload a CV directly
 * to Convex file storage. Unauthenticated (visitors are not signed in).
 */
export const generateCvUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * PUBLIC — submit a job application from a marketing site's careers section.
 * Called unauthenticated, so it must NOT call requireAdmin. The CV (if any) is
 * already stored; we only keep its storage id + original filename.
 */
export const submit = mutation({
  args: {
    property: propertyValidator,
    role: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    cvStorageId: v.optional(v.id("_storage")),
    cvFilename: v.optional(v.string()),
    source: v.optional(v.string()),
    // Honeypot — bots fill this hidden field. Present => silently discard.
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.website && args.website.trim()) {
      return null; // honeypot tripped — pretend success, store nothing
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }
    if (!args.name.trim()) {
      throw new Error("Name is required");
    }
    if (!args.role.trim()) {
      throw new Error("Role is required");
    }

    return await ctx.db.insert("jobApplications", {
      property: args.property,
      role: args.role.trim(),
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      phone: args.phone?.trim(),
      message: args.message?.trim(),
      cvStorageId: args.cvStorageId,
      cvFilename: args.cvFilename,
      status: "new",
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

/**
 * ADMIN — list applications (newest first) with resolved CV download URLs.
 */
export const list = query({
  args: {
    property: v.optional(propertyValidator),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("jobApplications")
      .withIndex("by_created")
      .order("desc")
      .collect();
    const filtered = rows.filter(
      (r) =>
        (!args.property || r.property === args.property) &&
        (!args.status || r.status === args.status)
    );
    return await Promise.all(
      filtered.map(async (r) => ({
        ...r,
        cvUrl: r.cvStorageId ? await ctx.storage.getUrl(r.cvStorageId) : null,
      }))
    );
  },
});

/**
 * ADMIN — update a candidate's status.
 */
export const updateStatus = mutation({
  args: { id: v.id("jobApplications"), status: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});
