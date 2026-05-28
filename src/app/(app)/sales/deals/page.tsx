"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Property = "owp" | "salomons" | "bewl-water" | "bewl-adventures";
type Status = "provisional" | "contracted" | "completed" | "cancelled";

const PROPERTY_LABEL: Record<Property, string> = {
  owp: "One Warwick Park",
  salomons: "Salomons Estate",
  "bewl-water": "Bewl Water",
  "bewl-adventures": "Bewl Adventures",
};

const STATUS_LABEL: Record<Status, string> = {
  provisional: "Provisional",
  contracted: "Contracted",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<Status, string> = {
  provisional: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  contracted: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  cancelled: "bg-zinc-100 text-zinc-600 hover:bg-zinc-100",
};

function formatGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DealsPage() {
  const [propertyFilter, setPropertyFilter] = useState<"all" | Property>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const deals = useQuery(api.deals.list, {
    property: propertyFilter === "all" ? undefined : (propertyFilter as Property),
    status: statusFilter === "all" ? undefined : (statusFilter as Status),
    salespersonId:
      salespersonFilter === "all"
        ? undefined
        : (salespersonFilter as Id<"salespeople">),
    limit: 500,
  });

  const salespeople = useQuery(api.salespeople.list, { includeArchived: true });

  const filtered = useMemo(() => {
    if (!deals) return [];
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.customerName.toLowerCase().includes(q) ||
        d.customerEmail.toLowerCase().includes(q) ||
        d.eventType.toLowerCase().includes(q) ||
        (d.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [deals, search]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, d) => sum + d.contractValue, 0),
    [filtered]
  );

  const hasFilters =
    propertyFilter !== "all" ||
    statusFilter !== "all" ||
    salespersonFilter !== "all" ||
    search.length > 0;

  const resetFilters = () => {
    setPropertyFilter("all");
    setStatusFilter("all");
    setSalespersonFilter("all");
    setSearch("");
  };

  return (
    <>
      <PageHeader
        title="Deals"
        description={`Signed contracts across every property. ${filtered.length} deal${filtered.length === 1 ? "" : "s"} · ${formatGBP(totalValue)} total value.`}
        actions={
          <Button size="sm" disabled title="Create deal coming next">
            <Plus className="h-4 w-4" />
            New deal
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, event, notes..."
            className="h-9 w-[260px] pl-8"
          />
        </div>
        <Select
          value={propertyFilter}
          onValueChange={(v) => setPropertyFilter(v as "all" | Property)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {(Object.keys(PROPERTY_LABEL) as Property[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PROPERTY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | Status)}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={salespersonFilter}
          onValueChange={setSalespersonFilter}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All salespeople</SelectItem>
            {(salespeople ?? []).map((rep) => (
              <SelectItem key={rep._id} value={rep._id}>
                {rep.name}
                {!rep.active ? " (archived)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        {deals === undefined ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p>{hasFilters ? "No deals match the current filters." : "No deals yet."}</p>
            <p className="mt-1 text-sm">
              {hasFilters
                ? "Try clearing a filter."
                : "Deals appear here once they're created (manually or via the Salesforce migration)."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Signed</TableHead>
                <TableHead className="text-right font-mono">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>
                    <div className="font-medium">{d.customerName}</div>
                    <div className="text-xs text-muted-foreground">{d.customerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{d.eventType}</div>
                    {d.eventDate && (
                      <div className="text-xs text-muted-foreground">
                        {formatDate(d.eventDate)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {PROPERTY_LABEL[d.property as Property] ?? d.property}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{d.salesperson?.name ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(d.signedDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatGBP(d.contractValue)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        STATUS_TONE[d.status as Status] ??
                          "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
                      )}
                    >
                      {STATUS_LABEL[d.status as Status] ?? d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
