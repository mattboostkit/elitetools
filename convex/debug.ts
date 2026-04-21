import { query } from "./_generated/server";

/**
 * Temporary diagnostic — returns whatever Convex sees for the caller's
 * identity. Unlike requireAdmin, it never throws. Call from the browser
 * console after signing in:
 *
 *   await window.__convex.query(api.debug.whoami, {})
 *
 * Expected when healthy: { hasIdentity: true, subject: "user_...",
 * issuer: "https://deep-alien-28.clerk.accounts.dev", ... }
 *
 * If hasIdentity is false, the JWT never validated — check auth.config.ts
 * against the Clerk JWT template's issuer + aud claim.
 *
 * DELETE THIS FILE once auth is confirmed working.
 */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasIdentity: false };
    }
    return {
      hasIdentity: true,
      subject: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? null,
      name: identity.name ?? null,
    };
  },
});
