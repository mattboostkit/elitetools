"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tag, UserCircle2, Trash2, X, ChevronDown } from "lucide-react";
import { ASSIGNEE_META, AssigneeAvatar } from "@/components/Assignee";
import { EnquiryStatusBadge } from "@/components/EnquiryDrawer";

type StatusValue = "new" | "contacted" | "quoted" | "booked" | "declined";
const STATUSES: StatusValue[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "declined",
];

export function BulkActionBar({
  selectedIds,
  onCleared,
}: {
  selectedIds: Id<"enquiries">[];
  onCleared: () => void;
}) {
  const bulkUpdate = useMutation(api.enquiries.bulkUpdate);
  const bulkDelete = useMutation(api.enquiries.bulkDelete);
  const [working, setWorking] = useState(false);

  if (selectedIds.length === 0) return null;

  const run = async (fn: () => Promise<unknown>) => {
    setWorking(true);
    try {
      await fn();
      onCleared();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setWorking(false);
    }
  };

  const setStatus = (status: StatusValue) =>
    run(() => bulkUpdate({ ids: selectedIds, status }));

  const setAssignee = (assignee: "christie" | "courtney" | null) =>
    run(() => bulkUpdate({ ids: selectedIds, assignee }));

  const deleteAll = () => run(() => bulkDelete({ ids: selectedIds }));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(calc(100%-2rem),640px)]">
      <div className="flex items-center gap-2 rounded-full border bg-popover text-popover-foreground shadow-lg pl-4 pr-2 py-2">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={working}>
              <Tag className="size-4" />
              Set status
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48">
            {STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatus(s)}
                className="gap-2"
              >
                <EnquiryStatusBadge status={s} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={working}>
              <UserCircle2 className="size-4" />
              Assign
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48">
            <DropdownMenuItem onClick={() => setAssignee("christie")}>
              <AssigneeAvatar assignee="christie" />
              <span>{ASSIGNEE_META.christie.name}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssignee("courtney")}>
              <AssigneeAvatar assignee="courtney" />
              <span>{ASSIGNEE_META.courtney.name}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setAssignee(null)}
              className="text-muted-foreground"
            >
              <AssigneeAvatar assignee={null} />
              <span>Unassigned</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={working}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "enquiry" : "enquiries"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Permanently delete the selected records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAll}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onCleared}
          aria-label="Clear selection"
          className="rounded-full"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
