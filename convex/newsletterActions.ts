import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Property labels for the notification email. Kept local (a plain map) so this
// action stays dependency-free; mirrors src/lib/properties.ts.
const PROPERTY_LABEL: Record<string, string> = {
  owp: "One Warwick Park",
  salomons: "Salomons Estate",
  "bewl-water": "Bewl Water",
  "bewl-adventures": "Bewl Adventures",
  "christmas-at-bewl": "Christmas at Bewl Water",
};

/**
 * Internal-only: email a notification to the team whenever someone joins a
 * newsletter. Scheduled by `newsletters.subscribe` on every genuinely new or
 * reactivated sign-up, so every venue (and any future one) notifies without
 * per-site wiring. Sends via the Resend API; needs RESEND_API_KEY on the
 * Convex deployment. Never throws so a mail failure can't affect the sign-up.
 */
export const notifySignup = internalAction({
  args: {
    email: v.string(),
    property: v.optional(v.string()),
    firstName: v.optional(v.string()),
    childAges: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
    kind: v.string(), // "new" | "reactivated"
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[notifySignup] RESEND_API_KEY not set on the Convex deployment");
      return;
    }
    const to = process.env.SIGNUP_NOTIFY_EMAIL || "matt@boostkit.io";
    const from = process.env.SIGNUP_NOTIFY_FROM || "ELC Sign-ups <signups@boostform.app>";
    const venue = args.property
      ? PROPERTY_LABEL[args.property] ?? args.property
      : "Unknown venue";

    const lines = [
      `New newsletter sign-up${args.kind === "reactivated" ? " (re-subscribed)" : ""}.`,
      "",
      `Venue:       ${venue}`,
      `Email:       ${args.email}`,
      args.firstName ? `Name:        ${args.firstName}` : null,
      args.childAges && args.childAges.length
        ? `Child ages:  ${args.childAges.join(", ")}`
        : null,
      `Source:      ${args.source || "-"}`,
      "",
      "Stored in Elite Tools (Marketing -> Newsletter).",
    ]
      .filter((l) => l !== null)
      .join("\n");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          reply_to: args.email,
          subject: `New ${venue} sign-up: ${args.email}`,
          text: lines,
        }),
      });
      if (!res.ok) {
        console.error("[notifySignup] Resend failed", res.status, await res.text());
      } else {
        console.log("[notifySignup] sent for", args.email, venue);
      }
    } catch (e) {
      console.error("[notifySignup] error", e);
    }
  },
});
