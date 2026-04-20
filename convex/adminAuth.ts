import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Require a signed-in Clerk user for any admin query or mutation.
 *
 * All CRM-facing reads and updates flow through this. Public mutations
 * (creating enquiries from the marketing sites, logging form errors) must
 * NOT call this — they run for unauthenticated visitors.
 *
 * Returns the Clerk identity so handlers can attribute actions to a user.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ subject: string; email?: string; name?: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorised");
  }
  return {
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}
