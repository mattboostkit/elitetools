"use client";

import { useConvexAuth } from "convex/react";
import { ReactNode } from "react";

/**
 * Defers rendering of children until Convex has a validated auth token.
 *
 * Without this, useQuery calls can fire during the brief window between
 * Clerk finishing its handshake and the token reaching Convex — during
 * which ctx.auth.getUserIdentity() returns null and any query calling
 * requireAdmin() throws, crashing the page via the React error boundary.
 *
 * The Clerk proxy guarantees the user is signed in before this component
 * mounts, so isAuthenticated going false here means Clerk's token is
 * still loading, not that the user is signed out.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return <>{children}</>;
}
