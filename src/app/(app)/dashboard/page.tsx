"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Mail, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

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
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview across all properties
        </p>
      </div>

      {/* Per-property enquiry totals */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PROPERTIES).map(([key, property]) => {
          const count = stats?.byProperty?.[key as keyof typeof PROPERTIES] ?? 0;
          return (
            <div
              key={key}
              className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6"
            >
              <div
                className={clsx(
                  "absolute top-0 left-0 w-1 h-full",
                  property.dot
                )}
              />
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-600">
                  {property.name}
                </p>
                <span
                  className={clsx("w-2.5 h-2.5 rounded-full", property.dot)}
                />
              </div>
              <p className="text-2xl font-semibold text-zinc-900">
                {count}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total enquiries</p>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="New Enquiries"
          value={stats?.new}
          hint="Awaiting response"
          icon={<Mail className="w-4 h-4 text-zinc-400" />}
          accent="text-zinc-900"
        />
        <StatCard
          label="Quoted"
          value={stats?.quoted}
          hint="Pending decisions"
          icon={<FileText className="w-4 h-4 text-blue-500" />}
          accent="text-blue-600"
        />
        <StatCard
          label="Booked"
          value={stats?.booked}
          hint="Confirmed bookings"
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          accent="text-emerald-600"
        />
        <StatCard
          label="Form Errors (24h)"
          value={formErrorStats?.last24h}
          hint="Client-side failures"
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          accent="text-red-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/enquiries"
          className="flex items-center gap-4 p-6 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition"
        >
          <div className="p-3 bg-zinc-100 rounded-lg">
            <Mail className="w-5 h-5 text-zinc-700" />
          </div>
          <div>
            <p className="font-medium">View enquiries</p>
            <p className="text-sm text-zinc-500">
              {stats?.total ?? 0} total across all properties
            </p>
          </div>
        </Link>

        <Link
          href="/proposals"
          className="flex items-center gap-4 p-6 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition"
        >
          <div className="p-3 bg-pink-50 rounded-lg">
            <FileText className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <p className="font-medium">Wedding proposals</p>
            <p className="text-sm text-zinc-500">
              Personalised pages for couples
            </p>
          </div>
        </Link>
      </div>
    </div>
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
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        {icon}
      </div>
      <p className={clsx("text-2xl font-semibold", accent)}>{value ?? 0}</p>
      <p className="text-xs text-zinc-500 mt-1">{hint}</p>
    </div>
  );
}
