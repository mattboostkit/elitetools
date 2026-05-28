import {
  LayoutDashboard,
  Bell,
  CheckSquare,
  Users,
  Briefcase,
  Building2,
  IdCard,
  FileText,
  Heart,
  FileSignature,
  Target,
  BarChart3,
  Search,
  Magnet,
  Mail,
  Phone,
  Calendar,
  MapPin,
  TrendingUp,
  PoundSterling,
  UserPlus,
  Settings,
  LayoutGrid,
  Database,
  Clock,
  Upload,
  ScrollText,
  AlertTriangle,
  UserCheck,
  DatabaseBackup,
  Plug,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  seniorMgmtOnly?: boolean;
}

export interface NavSection {
  title: string;
  teamSlug?: string;
  adminOnly?: boolean;
  creatorOnly?: boolean;
  module?: "sales" | "marketing" | "operations" | "insights";
  accentText?: string;
  accentBorder?: string;
  accentBg?: string;
  items: NavItem[];
}

export const DEPARTMENT_COLOURS = {
  sales: {
    text: "text-blue-600",
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    bgHover: "hover:bg-blue-50",
    icon: "text-blue-500",
    dot: "bg-blue-500",
  },
  marketing: {
    text: "text-violet-600",
    border: "border-l-violet-500",
    bg: "bg-violet-50",
    bgHover: "hover:bg-violet-50",
    icon: "text-violet-500",
    dot: "bg-violet-500",
  },
  operations: {
    text: "text-amber-600",
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    bgHover: "hover:bg-amber-50",
    icon: "text-amber-500",
    dot: "bg-amber-500",
  },
  insights: {
    text: "text-emerald-600",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    bgHover: "hover:bg-emerald-50",
    icon: "text-emerald-500",
    dot: "bg-emerald-500",
  },
} as const;

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "My Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "Sales",
    teamSlug: "sales",
    module: "sales",
    accentText: DEPARTMENT_COLOURS.sales.text,
    accentBorder: DEPARTMENT_COLOURS.sales.border,
    accentBg: DEPARTMENT_COLOURS.sales.bg,
    items: [
      { label: "Leads", href: "/sales/leads", icon: Users },
      { label: "Deals", href: "/sales/deals", icon: Briefcase },
      { label: "Customers", href: "/sales/customers", icon: Building2 },
      { label: "Contacts", href: "/sales/contacts", icon: IdCard },
      { label: "Quotes", href: "/sales/quotes", icon: FileText },
      { label: "Wedding Proposals", href: "/sales/wedding-proposals", icon: Heart },
      { label: "Contracts", href: "/sales/contracts", icon: FileSignature },
    ],
  },
  {
    title: "Marketing",
    teamSlug: "marketing",
    module: "marketing",
    accentText: DEPARTMENT_COLOURS.marketing.text,
    accentBorder: DEPARTMENT_COLOURS.marketing.border,
    accentBg: DEPARTMENT_COLOURS.marketing.bg,
    items: [
      { label: "Google Ads", href: "/marketing/google-ads", icon: Target },
      { label: "GA4 Analytics", href: "/marketing/ga4", icon: BarChart3 },
      { label: "Search Console", href: "/marketing/search-console", icon: Search },
      { label: "Attribution", href: "/marketing/attribution", icon: Magnet },
      { label: "Newsletter", href: "/marketing/newsletter", icon: Mail },
    ],
  },
  {
    title: "Operations",
    teamSlug: "operations",
    module: "operations",
    accentText: DEPARTMENT_COLOURS.operations.text,
    accentBorder: DEPARTMENT_COLOURS.operations.border,
    accentBg: DEPARTMENT_COLOURS.operations.bg,
    items: [
      { label: "Activities", href: "/operations/activities", icon: Phone },
      { label: "Calendar", href: "/operations/calendar", icon: Calendar },
      { label: "Properties", href: "/operations/properties", icon: MapPin },
    ],
  },
  {
    title: "Insights",
    teamSlug: "insights",
    module: "insights",
    accentText: DEPARTMENT_COLOURS.insights.text,
    accentBorder: DEPARTMENT_COLOURS.insights.border,
    accentBg: DEPARTMENT_COLOURS.insights.bg,
    items: [
      { label: "Reports", href: "/insights/reports", icon: TrendingUp },
      { label: "Commissions", href: "/insights/commissions", icon: PoundSterling },
    ],
  },
  {
    title: "People & Access",
    adminOnly: true,
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Salespeople", href: "/admin/salespeople", icon: UserPlus },
      { label: "Lead Assignment", href: "/admin/lead-assignment", icon: Users },
    ],
  },
  {
    title: "Configuration",
    adminOnly: true,
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Modules", href: "/admin/modules", icon: LayoutGrid },
      { label: "Custom Fields", href: "/admin/custom-fields", icon: Database },
      { label: "Scheduled Jobs", href: "/admin/crons", icon: Clock },
    ],
  },
  {
    title: "Data",
    adminOnly: true,
    items: [
      { label: "Import Data", href: "/admin/import", icon: Upload },
      { label: "Salesforce Migration", href: "/admin/salesforce-migration", icon: Database },
    ],
  },
  {
    title: "Integrations",
    adminOnly: true,
    items: [
      { label: "Rendezvous", href: "/admin/integrations/rendezvous", icon: Plug },
      { label: "Guestline", href: "/admin/integrations/guestline", icon: Plug },
      { label: "DigiTickets", href: "/admin/integrations/digitickets", icon: Plug },
    ],
  },
  {
    title: "Feedback & Logs",
    adminOnly: true,
    items: [
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
      { label: "Email Log", href: "/admin/email-log", icon: Mail },
      { label: "Form Errors", href: "/admin/form-errors", icon: AlertTriangle },
    ],
  },
  {
    title: "Platform",
    creatorOnly: true,
    items: [
      { label: "Sign-in activity", href: "/admin/sign-in-activity", icon: UserCheck },
      { label: "Backups", href: "/admin/backups", icon: DatabaseBackup },
    ],
  },
];

export interface PermissionContext {
  isAdmin: boolean;
  isCreator: boolean;
  isSeniorManagement: boolean;
  isTeamMember: (slug: string) => boolean;
  configuredTeams: Set<string>;
}

export function canSeeSection(
  section: NavSection,
  permissions: PermissionContext | null,
  enabledModules?: Record<string, boolean>
): boolean {
  if (!permissions) return false;
  if (section.module && enabledModules && enabledModules[section.module] === false) {
    return false;
  }
  if (section.creatorOnly) return permissions.isCreator;
  if (section.adminOnly) return permissions.isAdmin;
  if (section.teamSlug) {
    if (!permissions.configuredTeams.has(section.teamSlug)) return true;
    return permissions.isTeamMember(section.teamSlug);
  }
  return true;
}

export function canSeeItem(
  item: NavItem,
  permissions: PermissionContext | null,
): boolean {
  if (!permissions) return false;
  if (item.adminOnly && !permissions.isAdmin) return false;
  if (item.seniorMgmtOnly && !permissions.isAdmin && !permissions.isSeniorManagement) return false;
  return true;
}
