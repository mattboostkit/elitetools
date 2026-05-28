"use client";

import { useUser } from "@clerk/nextjs";
import type { PermissionContext } from "@/components/layout/nav-config";

/**
 * Reads Clerk user identity + publicMetadata to expose the permission shape
 * canSeeSection / canSeeItem expect.
 *
 * Scaffold phase: ELC has no Clerk teams (Organizations) configured. The
 * configuredTeams set is empty, so all teamSlug-gated sections default to
 * visible. Admin gate uses `publicMetadata.role` on the Clerk user.
 *
 * If/when ELC adopts Clerk Organizations for team-based gating, re-introduce
 * useOrganization() here and populate configuredTeams + isTeamMember from
 * the active org's slug. Not needed today.
 */
export function usePermissions(): PermissionContext & { isLoading: boolean } {
  const { user, isLoaded: userLoaded } = useUser();

  const isLoading = !userLoaded;

  const role = (user?.publicMetadata?.role as string | undefined) ?? "member";
  const isAdmin = role === "admin" || role === "creator";
  const isCreator = role === "creator";
  const isSeniorManagement =
    (user?.publicMetadata?.seniorManagement as boolean | undefined) === true;

  return {
    isAdmin,
    isCreator,
    isSeniorManagement,
    isTeamMember: () => false,
    configuredTeams: new Set<string>(),
    isLoading,
  };
}
