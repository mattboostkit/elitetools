"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Mail,
  TrendingUp,
  FileText,
  AlertTriangle,
  Clock,
  Target,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AssigneeAvatar, ASSIGNEE_META } from "@/components/Assignee";

const PROPERTIES = {
  owp: { name: "One Warwick Park", dot: "bg-amber-500", accent: "amber" },
  salomons: {
    name: "Salomons Estate",
    dot: "bg-emerald-500",
    accent: "emerald",
  },
} as const;

const chartConfig = {
  count: {
    label: "Enquiries",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const stats = useQuery(api.enquiries.getEnquiriesStats, {});
  const formErrorStats = useQuery(api.formErrors.getFormErrorStats, {});
  const kpis = useQuery(api.kpis.overview, {});

  const chartData =
    kpis?.weekly.map((w) => ({
      week: format(new Date(w.weekStart), "d MMM"),
      count: w.count,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview across all properties
        </p>
      </div>

      {/* Top-line KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Total enquiries"
          value={kpis?.totals.total.toLocaleString() ?? "—"}
          hint={
            kpis
              ? `${kpis.totals.new.toLocaleString()} waiting a response`
              : "All time"
          }
          icon={<Mail className="size-4 text-muted-foreground" />}
        />
        <KpiCard
          label="Conversion rate"
          value={
            kpis ? `${(kpis.totals.conversionRate * 100).toFixed(1)}%` : "—"
          }
          hint={
            kpis
              ? `${kpis.totals.booked.toLocaleString()} of ${kpis.totals.total.toLocaleString()} booked`
              : "Booked ÷ total"
          }
          icon={<Target className="size-4 text-emerald-500" />}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Median response time"
          value={formatResponseTime(kpis?.medianResponseMs ?? null)}
          hint={
            kpis && kpis.responseSampleSize > 0
              ? `Across ${kpis.responseSampleSize.toLocaleString()} responded leads`
              : "No responded leads yet"
          }
          icon={<Clock className="size-4 text-blue-500" />}
          accent="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Weekly trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Enquiries per week · last 12 weeks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kpis === undefined ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-[220px] w-full"
            >
              <AreaChart
                data={chartData}
                margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  fontSize={11}
                  width={28}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="count"
                  type="monotone"
                  fill="url(#fillCount)"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Per-property breakdown with conversion */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          By property
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(PROPERTIES).map(([key, property]) => {
            const row = kpis?.byProperty[key as keyof typeof PROPERTIES];
            const conversion =
              row && row.total > 0 ? row.booked / row.total : 0;
            return (
              <Link key={key} href={`/enquiries?property=${key}`}>
                <Card className="relative overflow-hidden hover:border-foreground/20 hover:shadow-sm transition">
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
                    <p className="text-2xl font-semibold">
                      {row?.total.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total enquiries
                    </p>
                    {row && row.total > 0 && (
                      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-xs">
                        <PropStat label="New" value={row.new} />
                        <PropStat label="Quoted" value={row.quoted} />
                        <PropStat
                          label="Booked"
                          value={row.booked}
                          subtitle={`${(conversion * 100).toFixed(0)}%`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Assignee workload */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Sales team workload
        </h2>
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
      </div>

      {/* Operational stats */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Pipeline
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="New Enquiries"
            value={stats?.new}
            hint="Awaiting response"
            icon={<Mail className="size-4 text-muted-foreground" />}
            accent="text-foreground"
            href="/enquiries?status=new"
          />
          <StatCard
            label="Quoted"
            value={stats?.quoted}
            hint="Pending decisions"
            icon={<FileText className="size-4 text-blue-500" />}
            accent="text-blue-600 dark:text-blue-400"
            href="/enquiries?status=quoted"
          />
          <StatCard
            label="Booked"
            value={stats?.booked}
            hint="Confirmed bookings"
            icon={<TrendingUp className="size-4 text-emerald-500" />}
            accent="text-emerald-600 dark:text-emerald-400"
            href="/enquiries?status=booked"
          />
          <StatCard
            label="Form Errors (24h)"
            value={formErrorStats?.last24h}
            hint="Client-side failures"
            icon={<AlertTriangle className="size-4 text-red-500" />}
            accent="text-red-600 dark:text-red-400"
            href="/form-errors"
          />
        </div>
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

function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    return hours < 10 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`;
  }
  const days = hours / 24;
  return days < 10 ? `${days.toFixed(1)}d` : `${Math.round(days)}d`;
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className={cn("text-2xl font-semibold", accent)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function PropStat({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      )}
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
  href,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}) {
  const card = (
    <Card
      className={cn(
        href && "hover:border-foreground/20 hover:shadow-sm transition"
      )}
    >
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
  return href ? <Link href={href}>{card}</Link> : card;
}
