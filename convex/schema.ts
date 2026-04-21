import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Property validator for multi-property support
const propertyValidator = v.union(
  v.literal("owp"),
  v.literal("salomons"),
  v.literal("bewl")
);

// Sales team members who can own a lead. Lowercase literal values;
// display name is derived in the UI.
const assigneeValidator = v.union(
  v.literal("christie"),
  v.literal("courtney")
);

export default defineSchema({
  // Contact form enquiries - unified across all properties
  enquiries: defineTable({
    property: v.optional(propertyValidator), // Optional for backward compatibility
    assignedTo: v.optional(assigneeValidator), // Which sales team member owns this lead
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),       // OWP uses this
    eventType: v.optional(v.string()),     // Salomons uses this
    preferredDate: v.optional(v.string()), // From Salomons
    guestCount: v.optional(v.number()),    // From Salomons
    message: v.string(),
    status: v.string(), // 'new', 'read', 'responded', 'archived', 'contacted', 'quoted', 'booked', 'declined'
    createdAt: v.number(),
    // UTM tracking fields for marketing attribution
    utmSource: v.optional(v.string()),     // Traffic source (google, facebook, etc.)
    utmMedium: v.optional(v.string()),     // Marketing medium (cpc, organic, social)
    utmCampaign: v.optional(v.string()),   // Campaign name
    utmContent: v.optional(v.string()),    // Ad variant (optional)
    utmTerm: v.optional(v.string()),       // Search keyword (optional)
    gclid: v.optional(v.string()),         // Google Click ID (auto-added by Google Ads)
    landingPage: v.optional(v.string()),   // The page URL where the visitor first landed
  })
    .index("by_property", ["property"])
    .index("by_property_status", ["property", "status"])
    .index("by_status", ["status"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_created", ["createdAt"]),

  // Newsletter subscriptions - unified across all properties
  newsletters: defineTable({
    property: v.optional(propertyValidator), // Optional for backward compatibility
    email: v.string(),
    subscribedAt: v.number(),
    source: v.optional(v.string()), // 'footer', 'popup', etc.
    status: v.optional(v.string()), // "active", "unsubscribed"
  })
    .index("by_email", ["email"])
    .index("by_property", ["property"]),

  // Quotes - from Salomons
  quotes: defineTable({
    property: v.optional(propertyValidator), // Identifies source property
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
    status: v.string(), // "draft", "sent", "accepted", "expired"
    createdAt: v.number(),
  })
    .index("by_property", ["property"])
    .index("by_status", ["status"]),

  // Wedding Proposals - from Salomons (personalized pages for couples after viewing)
  weddingProposals: defineTable({
    property: v.optional(propertyValidator), // Identifies source property
    // Couple details
    coupleName: v.string(), // e.g., "Sarah & James"
    partnerOneName: v.string(),
    partnerTwoName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),

    // Event details
    weddingDate: v.optional(v.string()),
    guestCount: v.optional(v.number()),

    // Venue selections
    ceremonyVenue: v.optional(v.string()), // "the-drawing-room", "the-theatre", etc.
    receptionVenue: v.optional(v.string()),

    // Accommodation
    accommodationOptions: v.optional(v.array(v.string())), // ["bridal-cottage", "guest-bedrooms"]
    estimatedRooms: v.optional(v.number()),

    // Personalization
    personalNote: v.optional(v.string()), // Note from the sales team
    highlightFeatures: v.optional(v.array(v.string())), // ["gardens", "theatre-stage", "accommodation"]

    // Unique access
    slug: v.string(), // Unique URL slug e.g., "sarah-james-dec-2025"
    accessCode: v.optional(v.string()), // Optional password for the page

    // Tracking
    status: v.string(), // "draft", "sent", "viewed", "enquired", "booked"
    viewCount: v.number(),
    lastViewedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()), // Staff member name
  })
    .index("by_slug", ["slug"])
    .index("by_email", ["email"])
    .index("by_property", ["property"]),

  // Form submission error logs - for debugging user-side issues
  formErrors: defineTable({
    property: v.optional(propertyValidator), // Identifies source property
    formType: v.string(), // "contact", "wedding", "newsletter"
    errorType: v.string(), // "network", "validation", "server", "unknown"
    errorMessage: v.string(),
    errorCode: v.optional(v.string()), // e.g., "TypeError", "Failed to fetch"
    // User's attempted form data (excluding sensitive info)
    attemptedEmail: v.optional(v.string()),
    attemptedEventType: v.optional(v.string()),
    // Client diagnostics
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    // Network diagnostics
    online: v.optional(v.boolean()), // navigator.onLine
    connectionType: v.optional(v.string()), // e.g., "4g", "wifi"
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_errorType", ["errorType"])
    .index("by_property", ["property"]),

  // Project checklist items for launch tracking (Salomons)
  projectChecklist: defineTable({
    itemId: v.string(), // Unique identifier for each checklist item
    checked: v.boolean(),
    notes: v.optional(v.string()),
    checkedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_itemId", ["itemId"]),

  // Signed contracts (Salomons)
  signedContracts: defineTable({
    contractType: v.string(), // "website-development-2025"
    signedBy: v.string(), // Full name of signer
    role: v.string(), // Job title/role
    company: v.string(), // Company name
    signatureDataUrl: v.string(), // Base64 signature image
    agreedToTerms: v.boolean(),
    signedAt: v.number(), // Timestamp
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    emailSent: v.boolean(), // Whether notification was sent
  }).index("by_contract_type", ["contractType"]),

  // Recommended suppliers
  recommendedSuppliers: defineTable({
    name: v.string(),
    website: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.string(),
    source: v.string(), // "venue-recommended" or "team-added"
    linksToCompetitors: v.optional(v.number()),
    status: v.string(), // "pending", "approved", "rejected"
    addedBy: v.optional(v.string()),
    addedAt: v.number(),
    reviewNote: v.optional(v.string()),
    // Enhanced listing fields (suppliers provide in exchange for backlink)
    imageUrl: v.optional(v.string()), // URL to supplier photo/logo
    bio: v.optional(v.string()), // Supplier-provided description (2-3 sentences)
    email: v.optional(v.string()), // Contact email
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_category_status", ["category", "status"]),

  // ===== ANALYTICS & CAMPAIGN PERFORMANCE =====

  // Google Ads metrics cache
  googleAdsMetrics: defineTable({
    date: v.string(), // "2026-02-04"
    campaignId: v.string(),
    campaignName: v.string(),
    spend: v.number(),
    clicks: v.number(),
    impressions: v.number(),
    conversions: v.number(),
    conversionValue: v.number(),
    ctr: v.number(),
    avgCpc: v.number(),
    property: propertyValidator,
    timestamp: v.number(), // Unix timestamp
  })
    .index("by_date_property", ["date", "property"])
    .index("by_property", ["property"])
    .index("by_timestamp", ["timestamp"]),

  // GA4 traffic cache
  ga4Metrics: defineTable({
    date: v.string(),
    source: v.string(), // "google", "direct", "facebook"
    medium: v.string(), // "organic", "cpc", "referral"
    sessions: v.number(),
    users: v.number(),
    pageviews: v.number(),
    bounceRate: v.number(),
    avgSessionDuration: v.number(),
    property: propertyValidator,
    timestamp: v.number(),
  })
    .index("by_date_property", ["date", "property"])
    .index("by_property", ["property"])
    .index("by_timestamp", ["timestamp"]),

  // Search Console cache
  searchConsoleMetrics: defineTable({
    date: v.string(),
    query: v.string(),
    page: v.string(),
    clicks: v.number(),
    impressions: v.number(),
    ctr: v.number(),
    position: v.number(),
    property: propertyValidator,
    timestamp: v.number(),
  })
    .index("by_date_property", ["date", "property"])
    .index("by_property", ["property"])
    .index("by_timestamp", ["timestamp"]),

  // Analytics snapshot (summary metrics)
  analyticsSnapshot: defineTable({
    date: v.string(),
    metricType: v.string(), // "total_spend", "total_conversions"
    value: v.number(),
    source: v.string(), // "google_ads", "ga4", "gsc"
    property: propertyValidator,
    timestamp: v.number(),
  })
    .index("by_date_property_type", ["date", "property", "metricType"])
    .index("by_property", ["property"])
    .index("by_timestamp", ["timestamp"]),
});
