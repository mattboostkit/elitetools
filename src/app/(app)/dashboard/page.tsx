"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Mail, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AssigneeAvatar, ASSIGNEE_META } from "@/components/Assignee";

const PROPERTIES = {
  owp: { name: "One Warwick Park", dot: "bg-amber-500" },
  salomons: { name: "Salomons Estate", dot: "bg-emerald-500" },
  bewl: { name: "Bewl Water", dot: "bg-blue-500" },
} as const;

export default function DashboardPage() {
  const stats = useQuery(api.enquiries.getEnquiriesStats, {});
  const formErrorStats = useQuery(api.formErrors.getFormErrorStats, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview across all properties
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PROPERTIES).map(([key, property]) => {
          const count =
            stats?.byProperty?.[key as keyof typeof PROPERTIES] ?? 0;
          return (
            <Card key={key} className="relative overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  property.dot
                )}
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {property.name}
                  </p>
                  <span
                    className={cn("size-2.5 rounded-full", property.dot)}
                  />
                </div>
                <p className="text-2xl font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total enquiries
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AssigneeCard
          assignee="christie"
          count={stats?.byAssignee?.christie ?? 0}
          href="/enquiries?assignee=christie"
        />
        <AssigneeCard
          assignee="courtney"
          count={stats?.byAssignee?.courtney ?? 0}
          href="/enquiries?assignee=courtney"
        />
        <AssigneeCard
          assignee={null}
          count={stats?.byAssignee?.unassigned ?? 0}
          href="/enquiries?assignee=unassigned"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="New Enquiries"
          value={stats?.new}
          hint="Awaiting response"
          icon={<Mail className="size-4 text-muted-foreground" />}
          accent="text-foreground"
        />
        <StatCard
          label="Quoted"
          value={stats?.quoted}
          hint="Pending decisions"
          icon={<FileText className="size-4 text-blue-500" />}
          accent="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Booked"
          value={stats?.booked}
          hint="Confirmed bookings"
          icon={<TrendingUp className="size-4 text-emerald-500" />}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Form Errors (24h)"
          value={formErrorStats?.last24h}
          hint="Client-side failures"
          icon={<AlertTriangle className="size-4 text-red-500" />}
          accent="text-red-600 dark:text-red-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/enquiries"
          className="flex items-center gap-4 p-6 rounded-lg border bg-card hover:border-foreground/20 hover:shadow-sm transition"
        >
          <div className="p-3 bg-muted rounded-lg">
            <Mail className="size-5" />
          </div>
          <div>
            <p className="font-medium">View enquiries</p>
            <p className="text-sm text-muted-foreground">
              {stats?.total ?? 0} total across all properties
            </p>
          </div>
        </Link>

        <Link
          href="/proposals"
          className="flex items-center gap-4 p-6 rounded-lg border bg-card hover:border-foreground/20 hover:shadow-sm transition"
        >
          <div className="p-3 bg-pink-50 dark:bg-pink-950 rounded-lg">
            <FileText className="size-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <p className="font-medium">Wedding proposals</p>
            <p className="text-sm text-muted-foreground">
              Personalised pages for couples
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function AssigneeCard({
  assignee,
  count,
  href,
}: {
  assignee: "christie" | "courtney" | null;
  count: number;
  href: string;
}) {
  const name = assignee ? ASSIGNEE_META[assignee].name : "Unassigned";
  const hint = assignee
    ? "Open leads (new · contacted · quoted)"
    : "Leads needing an owner";
  return (
    <Link href={href} className="block">
      <Card className="hover:border-foreground/20 hover:shadow-sm transition">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <AssigneeAvatar assignee={assignee} size="md" />
            <p className="text-sm font-medium">{name}</p>
          </div>
          <p className="text-2xl font-semibold">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className={cn("text-2xl font-semibold", accent)}>{value ?? 0}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
