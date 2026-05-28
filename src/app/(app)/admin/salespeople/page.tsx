"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";

type Salesperson = Doc<"salespeople">;

interface FormState {
  name: string;
  email: string;
  clerkUserId: string;
  defaultCommissionRatePct: string;
  startDate: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  clerkUserId: "",
  defaultCommissionRatePct: "",
  startDate: "",
  notes: "",
};

export default function SalespeoplePage() {
  const salespeople = useQuery(api.salespeople.list, { includeArchived: true });
  const create = useMutation(api.salespeople.create);
  const update = useMutation(api.salespeople.update);
  const archive = useMutation(api.salespeople.archive);
  const unarchive = useMutation(api.salespeople.unarchive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Salesperson | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (rep: Salesperson) => {
    setEditing(rep);
    setForm({
      name: rep.name,
      email: rep.email ?? "",
      clerkUserId: rep.clerkUserId ?? "",
      defaultCommissionRatePct: String(rep.defaultCommissionRatePct),
      startDate: rep.startDate ?? "",
      notes: rep.notes ?? "",
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    const rate = parseFloat(form.defaultCommissionRatePct);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      setError("Default commission rate must be a number between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await update({
          id: editing._id,
          name: form.name,
          email: form.email,
          clerkUserId: form.clerkUserId,
          defaultCommissionRatePct: rate,
          startDate: form.startDate || undefined,
          notes: form.notes,
        });
      } else {
        await create({
          name: form.name,
          email: form.email || undefined,
          clerkUserId: form.clerkUserId || undefined,
          defaultCommissionRatePct: rate,
          startDate: form.startDate || undefined,
          notes: form.notes || undefined,
        });
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (rep: Salesperson) => {
    if (rep.active) {
      await archive({ id: rep._id });
    } else {
      await unarchive({ id: rep._id });
    }
  };

  return (
    <>
      <PageHeader
        title="Salespeople"
        description="Sales team roster with commission rates. Archive removes a rep from new-deal pickers but keeps their historic commission attached."
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" />
            Add salesperson
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        {salespeople === undefined ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : salespeople.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p>No salespeople yet.</p>
            <p className="mt-1 text-sm">Add the first rep to start tracking deals + commission.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right font-mono">Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {salespeople.map((rep) => (
                <TableRow key={rep._id} className={rep.active ? "" : "opacity-60"}>
                  <TableCell className="font-medium">{rep.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {rep.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {rep.defaultCommissionRatePct}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={rep.active ? "default" : "secondary"}>
                      {rep.active ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rep.startDate ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(rep)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(rep)}>
                          {rep.active ? "Archive" : "Unarchive"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit salesperson" : "Add salesperson"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Update ${editing.name}'s details.`
                : "Add a new sales team member who can be assigned to deals and earn commission."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Christie Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="christie@elitecollection.co.uk"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">Default commission rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.defaultCommissionRatePct}
                onChange={(e) =>
                  setForm({ ...form, defaultCommissionRatePct: e.target.value })
                }
                placeholder="5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clerkUserId">Clerk user ID (optional)</Label>
              <Input
                id="clerkUserId"
                value={form.clerkUserId}
                onChange={(e) => setForm({ ...form, clerkUserId: e.target.value })}
                placeholder="user_..."
              />
              <p className="text-xs text-muted-foreground">
                Link to a Clerk user if this rep also signs in to Elite Tools.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add salesperson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
