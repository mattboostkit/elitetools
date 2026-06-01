"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Plus, Trash2 } from "lucide-react";
import { type Property, PROPERTY_ORDER, propertyLabel } from "@/lib/properties";
import {
  CreateQuoteDialog,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABEL,
  type QuoteStatus,
  formatGBP,
} from "@/components/CreateQuoteDialog";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  expired: "bg-amber-50 text-amber-700",
};

export default function QuotesPage() {
  const [propertyFilter, setPropertyFilter] = useState<"all" | Property>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const quotes = useQuery(api.quotes.listQuotes, {
    property: propertyFilter === "all" ? undefined : propertyFilter,
  });
  const updateStatus = useMutation(api.quotes.updateQuoteStatus);
  const deleteQuote = useMutation(api.quotes.deleteQuote);

  const rows = useMemo(() => quotes ?? [], [quotes]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
            <FileText className="size-6 text-amber-500" /> Quotes
          </h1>
          <p className="text-sm text-neutral-500">
            Quotes raised across the Collection.
            {quotes !== undefined ? ` ${rows.length} quote${rows.length === 1 ? "" : "s"}.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v as "all" | Property)}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All venues" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All venues</SelectItem>
              {PROPERTY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>{propertyLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New quote
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Event date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-400">Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-400">
                  No quotes{propertyFilter !== "all" ? ` for ${propertyLabel(propertyFilter)}` : ""} yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((q) => (
                <TableRow key={q._id}>
                  <TableCell>
                    <div className="font-medium text-neutral-900">{q.clientName}</div>
                    <div className="text-xs text-neutral-500">
                      <a href={`mailto:${q.clientEmail}`} className="hover:underline">{q.clientEmail}</a>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {q.property ? propertyLabel(q.property) : "–"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-700">{q.eventDate}</TableCell>
                  <TableCell className="text-sm text-neutral-500">{q.items.length}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatGBP(q.total)}</TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(value) => updateStatus({ quoteId: q._id, status: value })}>
                      <SelectTrigger className={`h-8 w-32 capitalize ${STATUS_TONE[q.status] ?? ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{QUOTE_STATUS_LABEL[s as QuoteStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Delete quote">
                          <Trash2 className="size-4 text-neutral-400" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this quote?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The quote for {q.clientName} ({formatGBP(q.total)}) will be permanently removed. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteQuote({ quoteId: q._id as Id<"quotes"> })}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CreateQuoteDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
