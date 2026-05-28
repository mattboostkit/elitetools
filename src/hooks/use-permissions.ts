"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import type { PermissionContext } from "@/components/layout/nav-config";

/**
 * Reads Clerk user + org membership and exposes the permission shape
 * canSeeSection / canSeeItem expect.
 *
 * Scaffold phase: ELC has no Clerk teams configured yet. The
 * configuredTeams set is empty, so all teamSlug-gated sections
 * default to visible. Admin gate uses the `publicMetadata.role`
 * field on the Clerk user.
 */
export function usePermissions(): PermissionContext & { isLoading: boolean } {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrganization();

  const isLoading = !userLoaded || !orgLoaded;

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
