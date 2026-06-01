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
import { Heart, Plus, Trash2, Eye } from "lucide-react";
import { type Property, PROPERTY_ORDER, propertyLabel } from "@/lib/properties";
import {
  CreateWeddingProposalDialog,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABEL,
  type ProposalStatus,
} from "@/components/CreateWeddingProposalDialog";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-50 text-blue-700",
  viewed: "bg-violet-50 text-violet-700",
  enquired: "bg-amber-50 text-amber-700",
  booked: "bg-emerald-50 text-emerald-700",
};

export default function WeddingProposalsPage() {
  const [propertyFilter, setPropertyFilter] = useState<"all" | Property>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const proposals = useQuery(api.weddingProposals.list, {
    property: propertyFilter === "all" ? undefined : propertyFilter,
  });
  const updateStatus = useMutation(api.weddingProposals.updateStatus);
  const remove = useMutation(api.weddingProposals.remove);

  const rows = useMemo(() => proposals ?? [], [proposals]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
            <Heart className="size-6 text-amber-500" /> Wedding proposals
          </h1>
          <p className="text-sm text-neutral-500">
            Personalised proposal pages for couples after a viewing.
            {proposals !== undefined ? ` ${rows.length} proposal${rows.length === 1 ? "" : "s"}.` : ""}
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
            <Plus className="size-4" /> New proposal
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Couple</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Wedding date</TableHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-400">Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-400">
                  No proposals{propertyFilter !== "all" ? ` for ${propertyLabel(propertyFilter)}` : ""} yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="font-medium text-neutral-900">{p.coupleName}</div>
                    <div className="text-xs text-neutral-500">
                      <a href={`mailto:${p.email}`} className="hover:underline">{p.email}</a>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {p.property ? propertyLabel(p.property) : "–"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-700">{p.weddingDate || "–"}</TableCell>
                  <TableCell>
                    <Select value={p.status} onValueChange={(value) => updateStatus({ id: p._id, status: value })}>
                      <SelectTrigger className={`h-8 w-36 capitalize ${STATUS_TONE[p.status] ?? ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPOSAL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{PROPOSAL_STATUS_LABEL[s as ProposalStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {p.viewCount}</span>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">{p.slug}</code>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Delete proposal">
                          <Trash2 className="size-4 text-neutral-400" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this proposal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The proposal for {p.coupleName} will be permanently removed. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove({ id: p._id as Id<"weddingProposals"> })}>
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

      <CreateWeddingProposalDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
