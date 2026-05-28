"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

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

// The enquiry `assignedTo` field uses the legacy "christie" / "courtney" enum.
// When a salesperson's name contains that first name (case-insensitive), we
// use them as the pre-selected rep. This is best-effort: if no match is found
// the picker is left blank and the user must choose manually.
const ASSIGNEE_TO_FIRST_NAME: Record<"christie" | "courtney", string> = {
  christie: "christie",
  courtney: "courtney",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Try to parse any free-text date string into YYYY-MM-DD.
 * Returns undefined if the string is falsy or unparseable.
 */
function tryParseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

// ─── form state ───────────────────────────────────────────────────────────────

interface FormState {
  property: string;
  salespersonId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  signedDate: string;
  guestCount: string;
  contractValue: string;
  depositPaid: string;
  balancePaid: string;
  status: Status;
  notes: string;
}

const EMPTY_FORM: FormState = {
  property: "",
  salespersonId: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  eventType: "",
  eventDate: "",
  signedDate: todayISO(),
  guestCount: "",
  contractValue: "",
  depositPaid: "0",
  balancePaid: "0",
  status: "provisional",
  notes: "",
};

function formFromEnquiry(
  enquiry: Doc<"enquiries">,
  salespeople: Doc<"salespeople">[]
): Partial<FormState> {
  // Best-effort assignee lookup: match by first name
  let salespersonId = "";
  if (enquiry.assignedTo) {
    const firstName =
      ASSIGNEE_TO_FIRST_NAME[
        enquiry.assignedTo as "christie" | "courtney"
      ]?.toLowerCase();
    if (firstName) {
      const match = salespeople.find((r) =>
        r.name.toLowerCase().includes(firstName)
      );
      if (match) salespersonId = match._id;
    }
  }

  // eventType comes from either the dedicated field or the subject line
  const eventType = enquiry.eventType ?? enquiry.subject ?? "";

  // Truncate message to first 500 chars and add separator
  const notesFromMessage = enquiry.message
    ? `${enquiry.message.slice(0, 500)}\n\n---\nFrom original enquiry above.`
    : "";

  return {
    property: (enquiry.property as string) ?? "",
    salespersonId,
    customerName: enquiry.name ?? "",
    customerEmail: enquiry.email ?? "",
    customerPhone: enquiry.phone ?? "",
    eventType,
    eventDate: tryParseDate(enquiry.preferredDate) ?? "",
    guestCount:
      enquiry.guestCount !== undefined ? String(enquiry.guestCount) : "",
    notes: notesFromMessage,
  };
}

// ─── props ────────────────────────────────────────────────────────────────────

export interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, prefill the form from this enquiry and set sourceEnquiryId */
  fromEnquiry?: Doc<"enquiries">;
  /** Fired after a successful create with the new deal id */
  onCreated?: (dealId: Id<"deals">) => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function CreateDealDialog({
  open,
  onOpenChange,
  fromEnquiry,
  onCreated,
}: CreateDealDialogProps) {
  const salespeople = useQuery(api.salespeople.list, {
    includeArchived: false,
  });
  const createDeal = useMutation(api.deals.create);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the dialog opens (or fromEnquiry changes), reset + prefill the form
  useEffect(() => {
    if (!open) return;
    if (fromEnquiry && salespeople !== undefined) {
      setForm({
        ...EMPTY_FORM,
        signedDate: todayISO(),
        ...formFromEnquiry(fromEnquiry, salespeople),
      });
    } else {
      setForm({ ...EMPTY_FORM, signedDate: todayISO() });
    }
    setError(null);
  }, [open, fromEnquiry, salespeople]);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setError(null);

    // Required-field validation
    if (!form.property) {
      setError("Property is required.");
      return;
    }
    if (!form.salespersonId) {
      setError("Salesperson is required.");
      return;
    }
    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!form.customerEmail.trim()) {
      setError("Customer email is required.");
      return;
    }
    if (!form.eventType.trim()) {
      setError("Event type is required.");
      return;
    }
    if (!form.signedDate) {
      setError("Signed date is required.");
      return;
    }
    const contractValue = parseFloat(form.contractValue);
    if (isNaN(contractValue) || contractValue < 0) {
      setError("Contract value must be a number >= 0.");
      return;
    }

    setSaving(true);
    try {
      const dealId = await createDeal({
        property: form.property as Property,
        sourceEnquiryId: fromEnquiry?._id,
        salespersonId: form.salespersonId as Id<"salespeople">,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        eventType: form.eventType.trim(),
        eventDate: form.eventDate || undefined,
        signedDate: form.signedDate,
        guestCount:
          form.guestCount !== "" ? parseInt(form.guestCount, 10) : undefined,
        contractValue,
        depositPaid: form.depositPaid !== "" ? parseFloat(form.depositPaid) : 0,
        balancePaid: form.balancePaid !== "" ? parseFloat(form.balancePaid) : 0,
        status: form.status,
        notes: form.notes.trim() || undefined,
      });
      onOpenChange(false);
      onCreated?.(dealId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal.");
    } finally {
      setSaving(false);
    }
  };

  const title = fromEnquiry
    ? `Promote to deal — ${fromEnquiry.name}`
    : "New deal";
  const description = fromEnquiry
    ? "Review the pre-filled details from the original enquiry and fill in any missing fields before saving."
    : "Enter the deal details. All required fields are marked with *.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ── Customer ─────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cd-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cd-name"
                  value={form.customerName}
                  onChange={(e) => set({ customerName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cd-email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => set({ customerEmail: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor="cd-phone">Phone</Label>
                <Input
                  id="cd-phone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => set({ customerPhone: e.target.value })}
                  placeholder="+44 7700 900000"
                />
              </div>
            </div>
          </section>

          {/* ── Event ────────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Event
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cd-property">
                  Property <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.property}
                  onValueChange={(v) => set({ property: v })}
                >
                  <SelectTrigger id="cd-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROPERTY_LABEL) as Property[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PROPERTY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-event-type">
                  Event type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cd-event-type"
                  value={form.eventType}
                  onChange={(e) => set({ eventType: e.target.value })}
                  placeholder="Wedding, Corporate, Venue hire..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-event-date">Event date</Label>
                <Input
                  id="cd-event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set({ eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-guest-count">Guest count</Label>
                <Input
                  id="cd-guest-count"
                  type="number"
                  min="0"
                  step="1"
                  value={form.guestCount}
                  onChange={(e) => set({ guestCount: e.target.value })}
                  placeholder="e.g. 120"
                />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor="cd-salesperson">
                  Salesperson <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.salespersonId}
                  onValueChange={(v) => set({ salespersonId: v })}
                >
                  <SelectTrigger id="cd-salesperson">
                    <SelectValue
                      placeholder={
                        salespeople === undefined ? "Loading..." : "Select rep"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(salespeople ?? []).map((rep) => (
                      <SelectItem key={rep._id} value={rep._id}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ── Money ────────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Money
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cd-signed-date">
                  Signed date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cd-signed-date"
                  type="date"
                  value={form.signedDate}
                  onChange={(e) => set({ signedDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set({ status: v as Status })}
                >
                  <SelectTrigger id="cd-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-contract-value">
                  Contract value (£) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cd-contract-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.contractValue}
                  onChange={(e) => set({ contractValue: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-deposit">Deposit paid (£)</Label>
                <Input
                  id="cd-deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.depositPaid}
                  onChange={(e) => set({ depositPaid: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-balance">Balance paid (£)</Label>
                <Input
                  id="cd-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balancePaid}
                  onChange={(e) => set({ balancePaid: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>

          {/* ── Notes ────────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </h3>
            <Textarea
              id="cd-notes"
              rows={4}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Any additional context..."
            />
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {fromEnquiry ? "Promote to deal" : "Create deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
