"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
import { type Property, PROPERTY_ORDER, propertyLabel } from "@/lib/properties";

export const PROPOSAL_STATUSES = ["draft", "sent", "viewed", "enquired", "booked"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  enquired: "Enquired",
  booked: "Booked",
};

interface FormState {
  property: string;
  partnerOneName: string;
  partnerTwoName: string;
  email: string;
  phone: string;
  weddingDate: string;
  guestCount: string;
  ceremonyVenue: string;
  receptionVenue: string;
  personalNote: string;
  accessCode: string;
}

const EMPTY: FormState = {
  property: "salomons",
  partnerOneName: "",
  partnerTwoName: "",
  email: "",
  phone: "",
  weddingDate: "",
  guestCount: "",
  ceremonyVenue: "",
  receptionVenue: "",
  personalNote: "",
  accessCode: "",
};

export function CreateWeddingProposalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useMutation(api.weddingProposals.create);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const set = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async () => {
    setError(null);
    if (!form.partnerOneName.trim() || !form.partnerTwoName.trim())
      return setError("Both partner names are required.");
    if (!form.email.trim()) return setError("An email is required.");

    const coupleName = `${form.partnerOneName.trim()} & ${form.partnerTwoName.trim()}`;
    setSaving(true);
    try {
      await create({
        property: form.property as Property,
        coupleName,
        partnerOneName: form.partnerOneName.trim(),
        partnerTwoName: form.partnerTwoName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        weddingDate: form.weddingDate || undefined,
        guestCount: form.guestCount !== "" ? parseInt(form.guestCount, 10) : undefined,
        ceremonyVenue: form.ceremonyVenue.trim() || undefined,
        receptionVenue: form.receptionVenue.trim() || undefined,
        personalNote: form.personalNote.trim() || undefined,
        accessCode: form.accessCode.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New wedding proposal</DialogTitle>
          <DialogDescription>
            Creates a private, shareable proposal page for the couple. It starts as a draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Couple</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wp-p1">Partner one <span className="text-destructive">*</span></Label>
                <Input id="wp-p1" value={form.partnerOneName} onChange={(e) => set({ partnerOneName: e.target.value })} placeholder="Emma" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-p2">Partner two <span className="text-destructive">*</span></Label>
                <Input id="wp-p2" value={form.partnerTwoName} onChange={(e) => set({ partnerTwoName: e.target.value })} placeholder="James" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-email">Email <span className="text-destructive">*</span></Label>
                <Input id="wp-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="emma@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-phone">Phone</Label>
                <Input id="wp-phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+44 7700 900000" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Wedding</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wp-property">Property</Label>
                <Select value={form.property} onValueChange={(v) => set({ property: v })}>
                  <SelectTrigger id="wp-property"><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>{propertyLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-date">Wedding date</Label>
                <Input id="wp-date" type="date" value={form.weddingDate} onChange={(e) => set({ weddingDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-guests">Guest count</Label>
                <Input id="wp-guests" type="number" min="0" step="1" value={form.guestCount} onChange={(e) => set({ guestCount: e.target.value })} placeholder="e.g. 120" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-access">Access code</Label>
                <Input id="wp-access" value={form.accessCode} onChange={(e) => set({ accessCode: e.target.value })} placeholder="Optional page password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-ceremony">Ceremony venue</Label>
                <Input id="wp-ceremony" value={form.ceremonyVenue} onChange={(e) => set({ ceremonyVenue: e.target.value })} placeholder="The Drawing Room" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp-reception">Reception venue</Label>
                <Input id="wp-reception" value={form.receptionVenue} onChange={(e) => set({ receptionVenue: e.target.value })} placeholder="The Theatre" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personal note</h3>
            <Textarea rows={3} value={form.personalNote} onChange={(e) => set({ personalNote: e.target.value })} placeholder="A warm note from the team to the couple..." />
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
