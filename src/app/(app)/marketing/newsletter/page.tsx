"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { type Property, PROPERTY_ORDER, propertyLabel } from "@/lib/properties";

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  unsubscribed: "bg-neutral-100 text-neutral-500",
};

// Build an RFC-4180-safe CSV cell (quote when it contains a comma, quote or
// newline; double up internal quotes).
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function NewsletterPage() {
  const [propertyFilter, setPropertyFilter] = useState<"all" | Property>("all");

  const subscribers = useQuery(api.newsletters.list, {
    property: propertyFilter === "all" ? undefined : propertyFilter,
  });

  const rows = useMemo(() => subscribers ?? [], [subscribers]);

  const activeCount = useMemo(
    () => rows.filter((r) => r.status === "active").length,
    [rows],
  );

  function exportCsv() {
    const header = [
      "Email",
      "First name",
      "Children's ages",
      "Property",
      "Source",
      "Status",
      "Subscribed at",
    ];
    const lines = rows.map((r) =>
      [
        r.email,
        r.firstName ?? "",
        (r.childAges ?? []).join("; "),
        r.property ? propertyLabel(r.property) : "",
        r.source ?? "",
        r.status ?? "",
        new Date(r.subscribedAt).toISOString(),
      ]
        .map((v) => csvCell(String(v)))
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const venue = propertyFilter === "all" ? "all-venues" : propertyFilter;
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `newsletter-${venue}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
            <Mail className="size-6 text-amber-500" /> Newsletter
          </h1>
          <p className="text-sm text-neutral-500">
            Subscribers and wait-list signups across the Collection.
            {subscribers !== undefined
              ? ` ${rows.length} subscriber${rows.length === 1 ? "" : "s"} · ${activeCount} active.`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={propertyFilter}
            onValueChange={(v) => setPropertyFilter(v as "all" | Property)}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All venues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All venues</SelectItem>
              {PROPERTY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {propertyLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Children&rsquo;s ages</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-400">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-400">
                  No subscribers
                  {propertyFilter !== "all"
                    ? ` for ${propertyLabel(propertyFilter)}`
                    : ""}{" "}
                  yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>
                    <a href={`mailto:${r.email}`} className="text-sm text-neutral-900 hover:underline">
                      {r.email}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {r.firstName || "–"}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {r.childAges && r.childAges.length > 0
                      ? r.childAges.join(", ")
                      : "–"}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {r.property ? propertyLabel(r.property) : "–"}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {r.source || "–"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_TONE[r.status ?? "active"] ?? ""
                      }`}
                    >
                      {r.status ?? "active"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(r.subscribedAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
