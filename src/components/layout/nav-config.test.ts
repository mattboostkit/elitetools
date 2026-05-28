import { describe, it, expect } from "vitest";
import {
  canSeeSection,
  canSeeItem,
  navSections,
  type NavItem,
  type PermissionContext,
} from "./nav-config";

const baseCtx = (overrides: Partial<PermissionContext> = {}): PermissionContext => ({
  isAdmin: false,
  isCreator: false,
  isSeniorManagement: false,
  isTeamMember: () => false,
  configuredTeams: new Set(),
  ...overrides,
});

describe("canSeeSection", () => {
  it("returns false when permissions is null", () => {
    const section = navSections.find((s) => s.title === "Overview")!;
    expect(canSeeSection(section, null)).toBe(false);
  });

  it("returns true for Overview (no gate) for any signed-in user", () => {
    const section = navSections.find((s) => s.title === "Overview")!;
    expect(canSeeSection(section, baseCtx())).toBe(true);
  });

  it("returns true for Sales when team is not yet configured (scaffold default)", () => {
    const section = navSections.find((s) => s.title === "Sales")!;
    expect(canSeeSection(section, baseCtx())).toBe(true);
  });

  it("returns false for Sales when team IS configured but user is not a member", () => {
    const section = navSections.find((s) => s.title === "Sales")!;
    const ctx = baseCtx({
      configuredTeams: new Set(["sales"]),
      isTeamMember: () => false,
    });
    expect(canSeeSection(section, ctx)).toBe(false);
  });

  it("returns true for Sales when user is a member of the configured sales team", () => {
    const section = navSections.find((s) => s.title === "Sales")!;
    const ctx = baseCtx({
      configuredTeams: new Set(["sales"]),
      isTeamMember: (slug) => slug === "sales",
    });
    expect(canSeeSection(section, ctx)).toBe(true);
  });

  it("returns false for People & Access section when user is not admin", () => {
    const section = navSections.find((s) => s.title === "People & Access")!;
    expect(canSeeSection(section, baseCtx())).toBe(false);
  });

  it("returns true for People & Access section when user is admin", () => {
    const section = navSections.find((s) => s.title === "People & Access")!;
    expect(canSeeSection(section, baseCtx({ isAdmin: true }))).toBe(true);
  });

  it("returns false for Platform section when user is admin but not creator", () => {
    const section = navSections.find((s) => s.title === "Platform")!;
    expect(canSeeSection(section, baseCtx({ isAdmin: true }))).toBe(false);
  });

  it("returns true for Platform section when user is creator", () => {
    const section = navSections.find((s) => s.title === "Platform")!;
    expect(canSeeSection(section, baseCtx({ isCreator: true }))).toBe(true);
  });

  it("hides Marketing section when marketing module is disabled", () => {
    const section = navSections.find((s) => s.title === "Marketing")!;
    expect(canSeeSection(section, baseCtx(), { marketing: false })).toBe(false);
  });

  it("shows Marketing section when marketing module is undefined in enabledModules", () => {
    const section = navSections.find((s) => s.title === "Marketing")!;
    expect(canSeeSection(section, baseCtx(), {})).toBe(true);
  });
});

describe("canSeeItem", () => {
  it("returns false when permissions is null", () => {
    const item: NavItem = { label: "X", href: "/x", icon: (() => null) as any };
    expect(canSeeItem(item, null)).toBe(false);
  });

  it("returns true for an unrestricted item", () => {
    const item: NavItem = { label: "X", href: "/x", icon: (() => null) as any };
    expect(canSeeItem(item, baseCtx())).toBe(true);
  });

  it("returns false for an adminOnly item when user is not admin", () => {
    const item: NavItem = { label: "X", href: "/x", icon: (() => null) as any, adminOnly: true };
    expect(canSeeItem(item, baseCtx())).toBe(false);
  });

  it("returns true for an adminOnly item when user is admin", () => {
    const item: NavItem = { label: "X", href: "/x", icon: (() => null) as any, adminOnly: true };
    expect(canSeeItem(item, baseCtx({ isAdmin: true }))).toBe(true);
  });

  it("returns true for a seniorMgmtOnly item when user is senior management", () => {
    const item: NavItem = { label: "X", href: "/x", icon: (() => null) as any, seniorMgmtOnly: true };
    expect(canSeeItem(item, baseCtx({ isSeniorManagement: true }))).toBe(true);
  });
});
