// Convex reads this at deploy time to know which Clerk application's
// JWTs to accept. Create a Clerk JWT template named "convex" in your
// Clerk dashboard, copy its issuer URL, and put it in the env var below.
//
// See: https://docs.convex.dev/auth/clerk

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
