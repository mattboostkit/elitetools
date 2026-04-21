"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Mail,
  Phone,
  Calendar,
  Users,
  ExternalLink,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const STATUS_FLOW = [
  { value: "new", label: "New", tone: "default" },
  { value: "contacted", label: "Contacted", tone: "amber" },
  { value: "quoted", label: "Quoted", tone: "purple" },
  { value: "booked", label: "Booked", tone: "emerald" },
  { value: "declined", label: "Declined", tone: "muted" },
] as const;

const PROPERTY_LABEL: Record<string, string> = {
  owp: "One Warwick Park",
  salomons: "Salomons Estate",
  bewl: "Bewl Water",
};

const TONE_CLASSES: Record<string, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  amber: "bg-amber-600 text-white hover:bg-amber-600/90",
  purple: "bg-purple-600 text-white hover:bg-purple-600/90",
  emerald: "bg-emerald-600 text-white hover:bg-emerald-600/90",
  muted: "bg-muted text-muted-foreground hover:bg-muted/80",
};

export function EnquiryDrawer({
  enquiry,
  onClose,
}: {
  enquiry: Doc<"enquiries"> | null;
  onClose: () => void;
}) {
  const updateStatus = useMutation(api.enquiries.updateStatus);
  const deleteEnquiry = useMutation(api.enquiries.deleteEnquiry);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStatusChange = async (status: string) => {
    if (!enquiry) return;
    await updateStatus({ id: enquiry._id, status });
  };

  const handleDelete = async () => {
    if (!enquiry) return;
    setIsDeleting(true);
    try {
      await deleteEnquiry({ enquiryId: enquiry._id });
      onClose();
    } catch (err) {
      alert(
        `Couldn't delete: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const property = enquiry
    ? ((enquiry.property ?? "owp") as keyof typeof PROPERTY_LABEL)
    : "owp";
  const propertyName = PROPERTY_LABEL[property] ?? "Unknown";

  return (
    <Sheet
      open={!!enquiry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 gap-0 overflow-y-auto"
      >
        {enquiry && (
          <>
            <SheetHeader className="border-b px-6 py-4 space-y-1">
              <SheetTitle className="text-lg">{enquiry.name}</SheetTitle>
              <SheetDescription>
                {propertyName} ·{" "}
                {format(new Date(enquiry.createdAt), "d MMM yyyy 'at' HH:mm")}
              </SheetDescription>
            </SheetHeader>

            <div className="px-6 py-5 space-y-6">
              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => {
                    const active = enquiry.status === s.value;
                    return (
                      <Button
                        key={s.value}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={cn(active && TONE_CLASSES[s.tone])}
                        onClick={() => handleStatusChange(s.value)}
                      >
                        {s.label}
                      </Button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Contact
                </h3>
                <div className="space-y-2">
                  <ContactRow
                    icon={
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    }
                    label="Email"
                    value={enquiry.email}
                    href={`mailto:${enquiry.email}`}
                    onCopy={() => copyToClipboard(enquiry.email, "email")}
                    copied={copiedField === "email"}
                  />
                  {enquiry.phone && (
                    <ContactRow
                      icon={
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      }
                      label="Phone"
                      value={enquiry.phone}
                      href={`tel:${enquiry.phone.replace(/\s/g, "")}`}
                      onCopy={() => copyToClipboard(enquiry.phone!, "phone")}
                      copied={copiedField === "phone"}
                    />
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Enquiry
                </h3>
                <dl className="space-y-3 text-sm">
                  {(enquiry.subject || enquiry.eventType) && (
                    <DetailRow
                      label={enquiry.subject ? "Subject" : "Event type"}
                      value={enquiry.subject || enquiry.eventType || "—"}
                    />
                  )}
                  {enquiry.preferredDate && (
                    <DetailRow
                      icon={
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      }
                      label="Preferred date"
                      value={enquiry.preferredDate}
                    />
                  )}
                  {enquiry.guestCount !== undefined && (
                    <DetailRow
                      icon={
                        <Users className="w-4 h-4 text-muted-foreground" />
                      }
                      label="Guests"
                      value={String(enquiry.guestCount)}
                    />
                  )}
                </dl>
                <div className="mt-3 p-4 rounded-md bg-muted/50 border text-sm whitespace-pre-wrap">
                  {enquiry.message}
                </div>
              </section>

              {(enquiry.utmSource ||
                enquiry.utmMedium ||
                enquiry.utmCampaign ||
                enquiry.gclid ||
                enquiry.landingPage) && (
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                    Attribution
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {enquiry.utmSource && (
                      <DetailRow label="Source" value={enquiry.utmSource} mono />
                    )}
                    {enquiry.utmMedium && (
                      <DetailRow label="Medium" value={enquiry.utmMedium} mono />
                    )}
                    {enquiry.utmCampaign && (
                      <DetailRow
                        label="Campaign"
                        value={enquiry.utmCampaign}
                        mono
                      />
                    )}
                    {enquiry.utmTerm && (
                      <DetailRow label="Keyword" value={enquiry.utmTerm} mono />
                    )}
                    {enquiry.gclid && (
                      <DetailRow label="GCLID" value={enquiry.gclid} mono />
                    )}
                    {enquiry.landingPage && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground min-w-[80px] pt-0.5">
                          Landing
                        </span>
                        <a
                          href={enquiry.landingPage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline break-all inline-flex items-center gap-1"
                        >
                          {enquiry.landingPage}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              <Separator />

              <section>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete enquiry
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently delete the enquiry from {enquiry.name} (
                        {enquiry.email}). This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <a
            href={href}
            className="text-sm text-primary hover:underline truncate block"
          >
            {value}
          </a>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="flex-shrink-0 size-8"
      >
        {copied ? (
          <Check className="size-4 text-emerald-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <span className="text-xs text-muted-foreground min-w-[80px] pt-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-sm break-words",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export type Enquiry = Doc<"enquiries">;
export type EnquiryId = Id<"enquiries">;

// Status badge helper exported for use in the enquiries table too.
export function EnquiryStatusBadge({ status }: { status: string }) {
  const tone = TONE_BADGE_CLASSES[status] ?? TONE_BADGE_CLASSES.default;
  return (
    <Badge variant="secondary" className={cn("capitalize", tone)}>
      {status}
    </Badge>
  );
}

const TONE_BADGE_CLASSES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  contacted: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  quoted: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900",
  booked: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  declined: "bg-muted text-muted-foreground border-border",
  read: "bg-muted text-muted-foreground border-border",
  responded: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  default: "bg-muted text-muted-foreground border-border",
};
