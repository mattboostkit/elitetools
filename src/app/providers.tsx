"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { TooltipProvider } from "@/components/ui/tooltip";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Wraps Clerk's useAuth to explicitly request the "convex" JWT template
 * when Convex asks for a token. Without this, ConvexProviderWithClerk uses
 * Clerk's default JWT template, which doesn't match the audience claim
 * Convex's auth.config.ts expects, causing useConvexAuth to oscillate
 * between authenticated/unauthenticated (visible as a dashboard flicker).
 *
 * Clerk v7 changed how getToken() resolves templates; the explicit wrapper
 * is the recommended pattern.
 */
function useAuthForConvex() {
  const auth = useClerkAuth();
  return {
    ...auth,
    getToken: (options?: Parameters<typeof auth.getToken>[0]) =>
      auth.getToken({ ...options, template: "convex" }),
  };
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <ConvexProviderWithClerk client={convex} useAuth={useAuthForConvex}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
