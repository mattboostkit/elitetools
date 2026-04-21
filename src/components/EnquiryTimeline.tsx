"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  MessageSquare,
  Tag,
  UserCheck,
  UserMinus,
  Trash2,
} from "lucide-react";
import { ASSIGNEE_META } from "@/components/Assignee";
import { EnquiryStatusBadge } from "@/components/EnquiryDrawer";

type Event = Doc<"enquiryEvents">;

export function EnquiryTimeline({ enquiryId }: { enquiryId: Id<"enquiries"> }) {
  const events = useQuery(api.enquiryEvents.list, { enquiryId });
  const addNote = useMutation(api.enquiryEvents.addNote);
  const deleteNote = useMutation(api.enquiryEvents.deleteNote);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      await addNote({ enquiryId, body });
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't save note");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note — what was said, what's next…"
          rows={2}
          maxLength={5000}
          className="resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>⌘/Ctrl + Enter to save</span>
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim() || saving}
          >
            {saving ? "Saving…" : "Add note"}
          </Button>
        </div>
      </form>

      {events === undefined ? (
        <p className="text-sm text-muted-foreground">Loading timeline…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No activity yet. Add the first note above.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <TimelineItem
              key={event._id}
              event={event}
              onDelete={
                event.type === "note"
                  ? async () => {
                      await deleteNote({ eventId: event._id });
                    }
                  : undefined
              }
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function TimelineItem({
  event,
  onDelete,
}: {
  event: Event;
  onDelete?: () => Promise<void> | void;
}) {
  const actor = event.actorName || event.actorEmail || "Team member";
  const relative = formatDistanceToNow(new Date(event.createdAt), {
    addSuffix: true,
  });
  const absolute = format(
    new Date(event.createdAt),
    "d MMM yyyy 'at' HH:mm"
  );

  if (event.type === "note") {
    return (
      <li className="group relative pl-7">
        <IconBadge tone="blue">
          <MessageSquare className="size-3" />
        </IconBadge>
        <div className="rounded-md bg-muted/50 border p-3 text-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium">{actor}</span>
            <div className="flex items-center gap-1">
              <span
                className="text-xs text-muted-foreground"
                title={absolute}
              >
                {relative}
              </span>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm">{event.body}</p>
        </div>
      </li>
    );
  }

  if (event.type === "status_change") {
    return (
      <li className="relative pl-7">
        <IconBadge tone="amber">
          <Tag className="size-3" />
        </IconBadge>
        <div className="py-1 text-sm flex items-center flex-wrap gap-2">
          <span className="font-medium">{actor}</span>
          <span className="text-muted-foreground">changed status</span>
          {event.fromValue && (
            <EnquiryStatusBadge status={event.fromValue} />
          )}
          <ArrowRight className="size-3 text-muted-foreground" />
          {event.toValue && <EnquiryStatusBadge status={event.toValue} />}
          <span
            className="text-xs text-muted-foreground ml-auto"
            title={absolute}
          >
            {relative}
          </span>
        </div>
      </li>
    );
  }

  if (event.type === "assigned" || event.type === "unassigned") {
    const fromMeta =
      event.fromValue === "christie" || event.fromValue === "courtney"
        ? ASSIGNEE_META[event.fromValue]
        : null;
    const toMeta =
      event.toValue === "christie" || event.toValue === "courtney"
        ? ASSIGNEE_META[event.toValue]
        : null;
    return (
      <li className="relative pl-7">
        <IconBadge tone={event.type === "assigned" ? "emerald" : "muted"}>
          {event.type === "assigned" ? (
            <UserCheck className="size-3" />
          ) : (
            <UserMinus className="size-3" />
          )}
        </IconBadge>
        <div className="py-1 text-sm flex items-center flex-wrap gap-1.5">
          <span className="font-medium">{actor}</span>
          <span className="text-muted-foreground">
            {event.type === "assigned"
              ? fromMeta
                ? "reassigned to"
                : "assigned to"
              : "unassigned"}
          </span>
          {toMeta && <span className="font-medium">{toMeta.name}</span>}
          {fromMeta && event.type === "assigned" && (
            <span className="text-xs text-muted-foreground">
              (was {fromMeta.name})
            </span>
          )}
          <span
            className="text-xs text-muted-foreground ml-auto"
            title={absolute}
          >
            {relative}
          </span>
        </div>
      </li>
    );
  }

  return null;
}

function IconBadge({
  tone,
  children,
}: {
  tone: "blue" | "amber" | "emerald" | "muted";
  children: React.ReactNode;
}) {
  const toneClass = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <span
      className={cn(
        "absolute left-0 top-1 inline-flex items-center justify-center size-5 rounded-full",
        toneClass
      )}
    >
      {children}
    </span>
  );
}
