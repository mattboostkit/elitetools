"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle2, UserX } from "lucide-react";

export type Assignee = "christie" | "courtney" | null | undefined;

export const ASSIGNEE_META: Record<
  "christie" | "courtney",
  { name: string; initials: string; avatarClass: string }
> = {
  christie: {
    name: "Christie",
    initials: "Ch",
    avatarClass: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  courtney: {
    name: "Courtney",
    initials: "Co",
    avatarClass:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
};

// Compact avatar for use in tables and lists. Shows initials when assigned,
// a muted placeholder when unassigned.
export function AssigneeAvatar({
  assignee,
  size = "sm",
}: {
  assignee: Assignee;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? "size-7" : "size-6";
  if (!assignee) {
    return (
      <Avatar
        className={cn(
          px,
          "border border-dashed border-muted-foreground/40 bg-transparent"
        )}
      >
        <AvatarFallback className="bg-transparent text-muted-foreground">
          <UserCircle2 className="size-3.5" />
        </AvatarFallback>
      </Avatar>
    );
  }
  const meta = ASSIGNEE_META[assignee];
  return (
    <Avatar className={px}>
      <AvatarFallback
        className={cn("text-[10px] font-semibold", meta.avatarClass)}
      >
        {meta.initials}
      </AvatarFallback>
    </Avatar>
  );
}

// Dropdown picker for the drawer. Includes an "Unassign" option.
export function AssigneePicker({
  enquiryId,
  assignee,
}: {
  enquiryId: Id<"enquiries">;
  assignee: Assignee;
}) {
  const assign = useMutation(api.enquiries.assign);

  const setTo = async (next: "christie" | "courtney" | null) => {
    await assign({ id: enquiryId, assignee: next });
  };

  const meta = assignee ? ASSIGNEE_META[assignee] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-1.5 gap-2 justify-start"
        >
          <AssigneeAvatar assignee={assignee} />
          <span className="text-sm">
            {meta ? meta.name : "Unassigned"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => setTo("christie")} className="gap-2">
          <AssigneeAvatar assignee="christie" />
          <span>Christie</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTo("courtney")} className="gap-2">
          <AssigneeAvatar assignee="courtney" />
          <span>Courtney</span>
        </DropdownMenuItem>
        {assignee && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTo(null)}
              className="gap-2 text-muted-foreground"
            >
              <UserX className="size-4" />
              Unassign
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
