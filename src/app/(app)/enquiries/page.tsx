"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";
import { EnquiryDrawer } from "@/components/EnquiryDrawer";

type Property = "owp" | "salomons" | "bewl";

const PROPERTY_LABEL: Record<Property, { name: string; dot: string }> = {
  owp: { name: "One Warwick Park", dot: "bg-amber-500" },
  salomons: { name: "Salomons Estate", dot: "bg-emerald-500" },
  bewl: { name: "Bewl Water", dot: "bg-blue-500" },
};

const STATUSES = ["new", "contacted", "quoted", "booked", "declined"] as const;

export default function EnquiriesPage() {
  const [propertyFilter, setPropertyFilter] = useState<Property | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enquiries = useQuery(api.enquiries.list, {
    property: propertyFilter === "all" ? undefined : propertyFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  });

  const selectedEnquiry =
    (enquiries?.find((e) => e._id === selectedId) as
      | Doc<"enquiries">
      | undefined) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Enquiries</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Leads from all property websites
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value as Property | "all")}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-md bg-white"
        >
          <option value="all">All properties</option>
          <option value="owp">One Warwick Park</option>
          <option value="salomons">Salomons Estate</option>
          <option value="bewl">Bewl Water</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-md bg-white"
        >
          <option value="all">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        {enquiries === undefined ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Loading…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No enquiries match these filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Subject / Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => {
                const prop = (e.property ?? "owp") as Property;
                const label = PROPERTY_LABEL[prop] ?? PROPERTY_LABEL.owp;
                return (
                  <tr
                    key={e._id}
                    onClick={() => setSelectedId(e._id)}
                    className={clsx(
                      "border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer",
                      selectedId === e._id && "bg-zinc-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={clsx("w-2 h-2 rounded-full", label.dot)} />
                        <span className="text-zinc-600">{label.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{e.name}</p>
                      <p className="text-xs text-zinc-500">{e.email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {e.subject || e.eventType || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {e.utmSource
                        ? `${e.utmSource}${e.utmMedium ? ` · ${e.utmMedium}` : ""}`
                        : "direct"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(e.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <EnquiryDrawer
        enquiry={selectedEnquiry}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-amber-100 text-amber-700",
    quoted: "bg-purple-100 text-purple-700",
    booked: "bg-emerald-100 text-emerald-700",
    declined: "bg-zinc-100 text-zinc-600",
    read: "bg-zinc-100 text-zinc-600",
    responded: "bg-zinc-100 text-zinc-600",
    archived: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span
      className={clsx(
        "inline-block px-2 py-0.5 text-xs rounded-full font-medium capitalize",
        cls[status] ?? "bg-zinc-100 text-zinc-600"
      )}
    >
      {status}
    </span>
  );
}
