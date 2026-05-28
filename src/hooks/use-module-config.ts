"use client";

/**
 * Module config — returns which feature modules are enabled per tenant.
 * Scaffold phase: hardcoded all-enabled. Future: Convex query against
 * a `moduleConfig` table.
 */
export function useModuleConfig() {
  return {
    modules: {
      sales: true,
      marketing: true,
      operations: true,
      insights: true,
    },
    isLoading: false,
  };
}
