"use client";

import { useConvexAuth } from "convex/react";
import { ReactNode, useRef } from "react";

/**
 * Defers rendering until Convex has seen the user authenticated at least once.
 *
 * Earlier version flipped between spinner and children every time
 * useConvexAuth oscillated, which on a dev Clerk instance caused visible
 * flicker on the dashboard. This version latches: once we've seen
 * isAuthenticated === true once, we stay mounted forever. If Convex
 * briefly drops auth (network blip, token refresh) the inner tree
 * continues rendering against the last-known good auth — queries that
 * fail will surface their own errors instead of taking the whole UI down.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const everAuthenticated = useRef(false);

  if (isAuthenticated) {
    everAuthenticated.current = true;
  }

  if (everAuthenticated.current) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
    </div>
  );
}
