import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only /sign-in is public. Sign-up is invite-only — new users arrive via
// Clerk-issued invitation links, not a public /sign-up route. The route
// file has been removed and this matcher no longer allowlists it, so any
// visit to /sign-up is bounced to /sign-in by auth.protect().
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
