"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { EnquiryDrawer, EnquiryStatusBadge } from "@/components/EnquiryDrawer";
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
import { Card } from "@/components/ui/card";

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
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leads from all property websites
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={propertyFilter}
          onValueChange={(v) => setPropertyFilter(v as Property | "all")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            <SelectItem value="owp">One Warwick Park</SelectItem>
            <SelectItem value="salomons">Salomons Estate</SelectItem>
            <SelectItem value="bewl">Bewl Water</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        {enquiries === undefined ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No enquiries match these filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject / Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((e) => {
                const prop = (e.property ?? "owp") as Property;
                const label = PROPERTY_LABEL[prop] ?? PROPERTY_LABEL.owp;
                return (
                  <TableRow
                    key={e._id}
                    onClick={() => setSelectedId(e._id)}
                    className={cn(
                      "cursor-pointer",
                      selectedId === e._id && "bg-muted/60"
                    )}
                  >
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn("size-2 rounded-full", label.dot)}
                        />
                        <span className="text-muted-foreground">
                          {label.name}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.subject || e.eventType || "—"}
                    </TableCell>
                    <TableCell>
                      <EnquiryStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.utmSource
                        ? `${e.utmSource}${e.utmMedium ? ` · ${e.utmMedium}` : ""}`
                        : "direct"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(e.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <EnquiryDrawer
        enquiry={selectedEnquiry}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
