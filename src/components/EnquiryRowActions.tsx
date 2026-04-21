"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Tag, UserCircle2, Trash2, UserX } from "lucide-react";
import { EnquiryStatusBadge } from "@/components/EnquiryDrawer";
import { ASSIGNEE_META, AssigneeAvatar } from "@/components/Assignee";

const STATUSES = ["new", "contacted", "quoted", "booked", "declined"] as const;

export function EnquiryRowActions({
  enquiry,
}: {
  enquiry: Doc<"enquiries">;
}) {
  const updateStatus = useMutation(api.enquiries.updateStatus);
  const assign = useMutation(api.enquiries.assign);
  const deleteEnquiry = useMutation(api.enquiries.deleteEnquiry);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 data-[state=open]:bg-muted"
            onClick={(e) => e.stopPropagation()}
            aria-label="Row actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {enquiry.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Tag className="size-4" />
              Set status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() =>
                    updateStatus({ id: enquiry._id, status: s })
                  }
                >
                  <EnquiryStatusBadge status={s} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <UserCircle2 className="size-4" />
              Assign
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() =>
                  assign({ id: enquiry._id, assignee: "christie" })
                }
                className="gap-2"
              >
                <AssigneeAvatar assignee="christie" />
                {ASSIGNEE_META.christie.name}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  assign({ id: enquiry._id, assignee: "courtney" })
                }
                className="gap-2"
              >
                <AssigneeAvatar assignee="courtney" />
                {ASSIGNEE_META.courtney.name}
              </DropdownMenuItem>
              {enquiry.assignedTo && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      assign({ id: enquiry._id, assignee: null })
                    }
                    className="gap-2 text-muted-foreground"
                  >
                    <UserX className="size-4" />
                    Unassign
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
              onClick={() => deleteEnquiry({ enquiryId: enquiry._id })}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
