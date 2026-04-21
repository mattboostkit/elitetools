"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { EnquiryDrawer, EnquiryStatusBadge } from "@/components/EnquiryDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

type Property = "owp" | "salomons" | "bewl";
type SortKey = "createdAt" | "name" | "property" | "status";
type SortDir = "asc" | "desc";

const PROPERTY_LABEL: Record<Property, { name: string; dot: string }> = {
  owp: { name: "One Warwick Park", dot: "bg-amber-500" },
  salomons: { name: "Salomons Estate", dot: "bg-emerald-500" },
  bewl: { name: "Bewl Water", dot: "bg-blue-500" },
};

const STATUSES = ["new", "contacted", "quoted", "booked", "declined"] as const;
const PAGE_SIZE = 25;

// v1 loads the full set (capped at 1000) and filters/sorts/paginates
// client-side. This is fine at ~700 records; migrate to server-side
// pagination + Convex search indexes when we cross ~5k.
const FETCH_LIMIT = 1000;

export default function EnquiriesPage() {
  const [propertyFilter, setPropertyFilter] = useState<Property | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enquiries = useQuery(api.enquiries.list, {
    property: propertyFilter === "all" ? undefined : propertyFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: FETCH_LIMIT,
  });

  const { paged, total, filteredTotal } = useMemo(() => {
    if (!enquiries) return { paged: [], total: 0, filteredTotal: 0 };

    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? enquiries.filter(
          (e) =>
            e.name.toLowerCase().includes(term) ||
            e.email.toLowerCase().includes(term) ||
            e.message.toLowerCase().includes(term) ||
            (e.subject ?? "").toLowerCase().includes(term) ||
            (e.eventType ?? "").toLowerCase().includes(term) ||
            (e.phone ?? "").toLowerCase().includes(term)
        )
      : enquiries;

    const sorted = [...filtered].sort((a, b) => {
      let cmp: number;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "property":
          cmp = (a.property ?? "").localeCompare(b.property ?? "");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "createdAt":
        default:
          cmp = a.createdAt - b.createdAt;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    const start = page * PAGE_SIZE;
    return {
      paged: sorted.slice(start, start + PAGE_SIZE),
      total: enquiries.length,
      filteredTotal: filtered.length,
    };
  }, [enquiries, searchTerm, sortKey, sortDir, page]);

  const selectedEnquiry =
    (enquiries?.find((e) => e._id === selectedId) as
      | Doc<"enquiries">
      | undefined) ?? null;

  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
    setPage(0);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPropertyFilter("all");
    setStatusFilter("all");
    setPage(0);
  };

  const hasFilters =
    searchTerm !== "" || propertyFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leads from all property websites
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, message…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPage(0);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={propertyFilter}
          onValueChange={(v) => {
            setPropertyFilter(v as Property | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            <SelectItem value="owp">One Warwick Park</SelectItem>
            <SelectItem value="salomons">Salomons Estate</SelectItem>
            <SelectItem value="bewl">Bewl Water</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[140px]">
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

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {enquiries === undefined
            ? "Loading…"
            : hasFilters
              ? `${filteredTotal.toLocaleString()} of ${total.toLocaleString()}`
              : `${total.toLocaleString()} total`}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {enquiries === undefined ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : paged.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {hasFilters
              ? "No enquiries match these filters."
              : "No enquiries yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Property"
                  active={sortKey === "property"}
                  dir={sortDir}
                  onClick={() => toggleSort("property")}
                />
                <SortableHead
                  label="Name"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => toggleSort("name")}
                />
                <TableHead>Subject / Event</TableHead>
                <SortableHead
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
                <TableHead>Source</TableHead>
                <SortableHead
                  label="Received"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onClick={() => toggleSort("createdAt")}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((e) => {
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

        {paged.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <div className="text-muted-foreground">
              Page {currentPage + 1} of {pageCount} ·{" "}
              {currentPage * PAGE_SIZE + 1}–
              {Math.min((currentPage + 1) * PAGE_SIZE, filteredTotal)} of{" "}
              {filteredTotal.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
                disabled={currentPage >= pageCount - 1}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <EnquiryDrawer
        enquiry={selectedEnquiry}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground -mx-1 px-1 rounded"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
