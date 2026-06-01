"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { type Property, PROPERTY_ORDER, propertyLabel } from "@/lib/properties";

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "expired"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
};

type LineItem = { description: string; quantity: string; price: string };

const EMPTY_ITEM: LineItem = { description: "", quantity: "1", price: "" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

export function CreateQuoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createQuote = useMutation(api.quotes.createQuote);

  const [property, setProperty] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setProperty("");
    setClientName("");
    setClientEmail("");
    setEventDate("");
    setStatus("draft");
    setItems([{ ...EMPTY_ITEM }]);
    setError(null);
  }, [open]);

  const total = items.reduce((sum, it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.price) || 0;
    return sum + q * p;
  }, 0);

  const setItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const handleSave = async () => {
    setError(null);
    if (!property) return setError("Property is required.");
    if (!clientName.trim()) return setError("Client name is required.");
    if (!clientEmail.trim()) return setError("Client email is required.");
    if (!eventDate) return setError("Event date is required.");
    const cleanItems = items
      .map((it) => ({
        description: it.description.trim(),
        quantity: parseFloat(it.quantity) || 0,
        price: parseFloat(it.price) || 0,
      }))
      .filter((it) => it.description && it.quantity > 0);
    if (cleanItems.length === 0)
      return setError("Add at least one line item with a description and quantity.");

    setSaving(true);
    try {
      await createQuote({
        property: property as Property,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        eventDate,
        items: cleanItems,
        total: cleanItems.reduce((s, it) => s + it.quantity * it.price, 0),
        status,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New quote</DialogTitle>
          <DialogDescription>
            Build a quote with line items. The total is calculated for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Client
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="q-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="q-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input id="q-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-property">
                  Property <span className="text-destructive">*</span>
                </Label>
                <Select value={property} onValueChange={setProperty}>
                  <SelectTrigger id="q-property"><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>{propertyLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-date">
                  Event date <span className="text-destructive">*</span>
                </Label>
                <Input id="q-date" type="date" value={eventDate} min={todayISO()} onChange={(e) => setEventDate(e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Line items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    {i === 0 && <Label className="text-xs">Description</Label>}
                    <Input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Venue hire, catering per head..." />
                  </div>
                  <div className="w-20 space-y-1.5">
                    {i === 0 && <Label className="text-xs">Qty</Label>}
                    <Input type="number" min="0" step="1" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
                  </div>
                  <div className="w-28 space-y-1.5">
                    {i === 0 && <Label className="text-xs">Unit £</Label>}
                    <Input type="number" min="0" step="0.01" value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} placeholder="0.00" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1} aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-3 border-t pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatGBP(total)}</span>
            </div>
          </section>

          <section>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="q-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
                <SelectTrigger id="q-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
