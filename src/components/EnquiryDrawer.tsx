"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  X,
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
import { clsx } from "clsx";

const STATUS_FLOW = [
  { value: "new", label: "New", className: "bg-blue-600 text-white" },
  { value: "contacted", label: "Contacted", className: "bg-amber-600 text-white" },
  { value: "quoted", label: "Quoted", className: "bg-purple-600 text-white" },
  { value: "booked", label: "Booked", className: "bg-emerald-600 text-white" },
  { value: "declined", label: "Declined", className: "bg-zinc-600 text-white" },
] as const;

const PROPERTY_LABEL: Record<string, string> = {
  owp: "One Warwick Park",
  salomons: "Salomons Estate",
  bewl: "Bewl Water",
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

  useEffect(() => {
    if (!enquiry) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [enquiry, onClose]);

  if (!enquiry) return null;

  const property = (enquiry.property ?? "owp") as keyof typeof PROPERTY_LABEL;
  const propertyName = PROPERTY_LABEL[property] ?? "Unknown";

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStatusChange = async (status: string) => {
    await updateStatus({ id: enquiry._id, status });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete enquiry from ${enquiry.name}? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteEnquiry({ enquiryId: enquiry._id });
      onClose();
    } catch (err) {
      alert(
        `Couldn't delete: ${err instanceof Error ? err.message : String(err)}`
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-zinc-900/40 z-40 transition-opacity"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white z-50 shadow-2xl overflow-y-auto"
        role="dialog"
        aria-label="Enquiry details"
      >
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-start justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900 truncate">
              {enquiry.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {propertyName} · {format(new Date(enquiry.createdAt), "d MMM yyyy 'at' HH:mm")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <section>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
              Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={clsx(
                    "px-3 py-1.5 text-sm rounded-md border font-medium transition",
                    enquiry.status === s.value
                      ? s.className + " border-transparent"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
              Contact
            </h3>
            <div className="space-y-2">
              <ContactRow
                icon={<Mail className="w-4 h-4 text-zinc-400" />}
                label="Email"
                value={enquiry.email}
                href={`mailto:${enquiry.email}`}
                onCopy={() => copyToClipboard(enquiry.email, "email")}
                copied={copiedField === "email"}
              />
              {enquiry.phone && (
                <ContactRow
                  icon={<Phone className="w-4 h-4 text-zinc-400" />}
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
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
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
                  icon={<Calendar className="w-4 h-4 text-zinc-400" />}
                  label="Preferred date"
                  value={enquiry.preferredDate}
                />
              )}
              {enquiry.guestCount !== undefined && (
                <DetailRow
                  icon={<Users className="w-4 h-4 text-zinc-400" />}
                  label="Guests"
                  value={String(enquiry.guestCount)}
                />
              )}
            </dl>
            <div className="mt-3 p-4 rounded-md bg-zinc-50 border border-zinc-100 text-sm text-zinc-800 whitespace-pre-wrap">
              {enquiry.message}
            </div>
          </section>

          {(enquiry.utmSource ||
            enquiry.utmMedium ||
            enquiry.utmCampaign ||
            enquiry.gclid ||
            enquiry.landingPage) && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
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
                  <DetailRow label="Campaign" value={enquiry.utmCampaign} mono />
                )}
                {enquiry.utmTerm && (
                  <DetailRow label="Keyword" value={enquiry.utmTerm} mono />
                )}
                {enquiry.gclid && (
                  <DetailRow label="GCLID" value={enquiry.gclid} mono />
                )}
                {enquiry.landingPage && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-zinc-500 min-w-[80px] pt-0.5">
                      Landing
                    </span>
                    <a
                      href={enquiry.landingPage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                    >
                      {enquiry.landingPage}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className="pt-4 border-t border-zinc-100">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting…" : "Delete enquiry"}
            </button>
          </section>
        </div>
      </aside>
    </>
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
          <p className="text-xs text-zinc-500">{label}</p>
          <a
            href={href}
            className="text-sm text-blue-700 hover:underline truncate block"
          >
            {value}
          </a>
        </div>
      </div>
      <button
        onClick={onCopy}
        className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition flex-shrink-0"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
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
      <span className="text-xs text-zinc-500 min-w-[80px] pt-0.5">{label}</span>
      <span
        className={clsx(
          "text-sm text-zinc-900 break-words",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// Export types for re-use
export type Enquiry = Doc<"enquiries">;
export type EnquiryId = Id<"enquiries">;
